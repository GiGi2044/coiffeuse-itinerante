import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { isAdminRequest } from '@/lib/admin/auth'
import { CONTENT_TAG } from '@/lib/content'
import {
  DRAFT_BRANCH,
  deleteDraftBranch,
  getBranchSha,
  getDraftChanges,
  mergeDraftToMain,
} from '@/lib/admin/github'
import { getDraftBuild, isVercelConfigured } from '@/lib/admin/vercel'

export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  try {
    const draftSha = await getBranchSha(DRAFT_BRANCH)
    if (!draftSha) {
      return NextResponse.json({ error: "Il n'y a pas de brouillon à publier" }, { status: 409 })
    }
    const changes = await getDraftChanges()
    if (changes.aheadBy === 0) {
      return NextResponse.json({ error: 'Le brouillon ne contient aucune modification' }, { status: 409 })
    }

    // Server-side build gate — the UI disables the button, but never trust the UI
    if (isVercelConfigured()) {
      const build = await getDraftBuild(draftSha)
      if (!build || build.state !== 'READY') {
        return NextResponse.json(
          { error: `L'aperçu n'est pas prêt (${build?.state ?? 'pas encore trouvé'}) — attendez qu'il termine` },
          { status: 409 }
        )
      }
    }

    await mergeDraftToMain()
    // Content-only publishes skip the main build (vercel.json ignoreCommand),
    // so the runtime content cache must be refreshed here.
    revalidateTag(CONTENT_TAG, { expire: 0 })
    await deleteDraftBranch()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Admin publish error', e)
    return NextResponse.json({ error: 'Échec de la publication — réessayez' }, { status: 500 })
  }
}

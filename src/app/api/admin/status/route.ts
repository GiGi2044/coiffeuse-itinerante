import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin/auth'
import { DRAFT_BRANCH, getBranchSha, getDraftChanges, isGitHubConfigured } from '@/lib/admin/github'
import { getDraftBuild, isVercelConfigured } from '@/lib/admin/vercel'

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  try {
    if (!isGitHubConfigured()) {
      return NextResponse.json({ configured: false, draft: false })
    }
    const draftSha = await getBranchSha(DRAFT_BRANCH)
    if (!draftSha) {
      return NextResponse.json({ configured: true, draft: false })
    }
    const [changes, build] = await Promise.all([getDraftChanges(), getDraftBuild(draftSha)])
    return NextResponse.json({
      configured: true,
      draft: true,
      hasChanges: changes.aheadBy > 0,
      files: changes.files,
      build,
      buildGate: isVercelConfigured(),
    })
  } catch (e) {
    console.error('Admin status error', e)
    return NextResponse.json({ error: 'Could not load status' }, { status: 500 })
  }
}

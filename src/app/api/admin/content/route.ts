import fs from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { isAdminRequest } from '@/lib/admin/auth'
import { MAIN_BRANCH, getFile, putFile } from '@/lib/admin/github'
import { CONTENT_TAG, isGitHubContentSource } from '@/lib/content'
import type { EditableFile } from '@/types'

// Editable paths, by construction: the one copy file and images only — never src/ or config.
const COPY_PATH = /^content\/copy\/site\.json$/
const IMAGE_PATH = /^content\/images\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/
const MAX_IMAGE_BYTES = 3 * 1024 * 1024

async function readFile(filePath: string): Promise<string | null> {
  if (isGitHubContentSource()) {
    const file = await getFile(filePath, MAIN_BRANCH)
    return file?.content ?? null
  }
  try {
    return await fs.readFile(path.join(process.cwd(), filePath), 'utf8')
  } catch {
    return null
  }
}

// Returns a human-readable problem with the file, or null when it's fine to save.
function validateCopy(content: string): string | null {
  try {
    const parsed: unknown = JSON.parse(content)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return 'Le fichier de contenu doit être un objet JSON'
    }
  } catch {
    return 'Ce fichier doit être du JSON valide'
  }
  return null
}

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  try {
    const filePath = new URL(req.url).searchParams.get('path')

    if (filePath) {
      if (!COPY_PATH.test(filePath)) {
        return NextResponse.json({ error: 'That file cannot be edited here' }, { status: 400 })
      }
      const content = await readFile(filePath)
      if (content === null) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
      return NextResponse.json({ path: filePath, content })
    }

    const files: EditableFile[] = [
      { path: 'content/copy/site.json', kind: 'copy', livePath: '/' },
    ]
    return NextResponse.json({ files })
  } catch (e) {
    console.error('Admin content GET error', e)
    return NextResponse.json({ error: 'Could not load content' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  try {
    const body = (await req.json().catch(() => null)) as {
      path?: unknown
      content?: unknown
      encoding?: unknown
    } | null
    const filePath = typeof body?.path === 'string' ? body.path : ''
    const content = typeof body?.content === 'string' ? body.content : null
    const isBase64 = body?.encoding === 'base64'

    if (content === null) {
      return NextResponse.json({ error: 'That file cannot be edited here' }, { status: 400 })
    }

    if (COPY_PATH.test(filePath)) {
      const problem = validateCopy(content)
      if (problem) return NextResponse.json({ error: problem }, { status: 400 })

      if (isGitHubContentSource()) {
        await putFile(filePath, MAIN_BRANCH, content, `content: update ${filePath}`)
      } else {
        await fs.writeFile(path.join(process.cwd(), filePath), content, 'utf8')
      }
    } else if (IMAGE_PATH.test(filePath) && isBase64) {
      const approxBytes = Math.floor((content.length * 3) / 4)
      if (approxBytes > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Image trop grande (max 3 Mo)' }, { status: 400 })
      }
      if (isGitHubContentSource()) {
        await putFile(filePath, MAIN_BRANCH, content, `content: update ${filePath}`, 'base64')
      } else {
        await fs.mkdir(path.dirname(path.join(process.cwd(), filePath)), { recursive: true })
        await fs.writeFile(path.join(process.cwd(), filePath), Buffer.from(content, 'base64'))
      }
    } else {
      return NextResponse.json({ error: 'That file cannot be edited here' }, { status: 400 })
    }

    revalidateTag(CONTENT_TAG, { expire: 0 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Admin content PUT error', e)
    return NextResponse.json({ error: "Échec de l'enregistrement — réessayez" }, { status: 500 })
  }
}

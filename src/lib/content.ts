import fs from 'node:fs/promises'
import path from 'node:path'
import type { SiteCopy } from '@/types'

// Runtime content source: on Vercel, files are fetched from the GitHub contents
// API and cached under CONTENT_TAG, so admin saves go live via revalidateTag
// without a rebuild. Locally (or when unconfigured) content is read from disk.
const REPO = (process.env.ADMIN_REPO ?? 'GiGi2044/coiffeuse-itinerante').trim()
const TOKEN = (process.env.ADMIN_GITHUB_TOKEN ?? '').trim()

// Preview deployments (e.g. the AI editor's draft branch) must read their own
// branch, not main — otherwise previews would render production content.
const CONTENT_REF = (process.env.VERCEL_GIT_COMMIT_REF ?? 'main').trim()

const useGitHub =
  process.env.CONTENT_SOURCE === 'github' || (!!process.env.VERCEL && TOKEN.length > 0)

export const CONTENT_TAG = 'content'

/** True when content is served from GitHub (Vercel) rather than the local filesystem (dev). */
export function isGitHubContentSource(): boolean {
  return useGitHub
}

function githubContents(repoPath: string, accept: string): Promise<Response> {
  return fetch(
    `https://api.github.com/repos/${REPO}/contents/${encodeURI(repoPath)}?ref=${CONTENT_REF}`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: accept,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      // fetch is uncached by default in Next 16 — force-cache + tag makes every
      // content read servable from the data cache until revalidateTag(CONTENT_TAG).
      cache: 'force-cache',
      next: { tags: [CONTENT_TAG] },
    }
  )
}

/** Raw text of a repo file (e.g. 'content/copy/site.json'); null if it doesn't exist. */
export async function readContentFile(filePath: string): Promise<string | null> {
  if (useGitHub) {
    const res = await githubContents(filePath, 'application/vnd.github.raw+json')
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`Content fetch ${filePath} → ${res.status}`)
    return res.text()
  }
  try {
    return await fs.readFile(path.join(process.cwd(), filePath), 'utf8')
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw e
  }
}

/** File names (not paths) in a repo directory (e.g. 'content/copy'); [] if missing. */
export async function listContentFiles(dir: string): Promise<string[]> {
  if (useGitHub) {
    const res = await githubContents(dir, 'application/vnd.github+json')
    if (res.status === 404) return []
    if (!res.ok) throw new Error(`Content list ${dir} → ${res.status}`)
    const entries = (await res.json()) as { name: string; type: string }[]
    return entries.filter((e) => e.type === 'file').map((e) => e.name)
  }
  try {
    return await fs.readdir(path.join(process.cwd(), dir))
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw e
  }
}

/** Parsed content/copy/site.json — the site's editable text. */
export async function getSiteCopy(): Promise<SiteCopy> {
  const raw = await readContentFile('content/copy/site.json')
  if (raw === null) throw new Error('Missing copy file content/copy/site.json')
  return JSON.parse(raw) as SiteCopy
}

const IMAGE_CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

/** Raw bytes + content-type of an image under content/images/; null if it doesn't exist. */
export async function readContentImage(
  name: string
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const contentType = IMAGE_CONTENT_TYPES[ext]
  if (!contentType) return null
  const filePath = `content/images/${name}`

  if (useGitHub) {
    const res = await githubContents(filePath, 'application/vnd.github+json')
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`Content image fetch ${filePath} → ${res.status}`)
    const data = (await res.json()) as { content?: string; encoding?: string }
    if (!data.content) return null
    return { bytes: Buffer.from(data.content, 'base64'), contentType }
  }
  try {
    const bytes = await fs.readFile(path.join(process.cwd(), filePath))
    return { bytes, contentType }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw e
  }
}

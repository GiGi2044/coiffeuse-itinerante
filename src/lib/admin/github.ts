const REPO = (process.env.ADMIN_REPO ?? 'GiGi2044/coiffeuse-itinerante').trim()
const TOKEN = (process.env.ADMIN_GITHUB_TOKEN ?? '').trim()
const API = 'https://api.github.com'

export const DRAFT_BRANCH = 'draft'
export const MAIN_BRANCH = 'main'

class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

async function gh(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API}/repos/${REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...init?.headers,
    },
    cache: 'no-store',
  })
  return res
}

async function ghJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await gh(path, init)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new GitHubError(`GitHub ${init?.method ?? 'GET'} ${path} → ${res.status}: ${body.slice(0, 300)}`, res.status)
  }
  return (await res.json()) as T
}

export function isGitHubConfigured(): boolean {
  return TOKEN.length > 0
}

export async function getBranchSha(branch: string): Promise<string | null> {
  const res = await gh(`/git/ref/heads/${branch}`)
  if (res.status === 404) return null
  if (!res.ok) throw new GitHubError(`GitHub get ref ${branch} → ${res.status}`, res.status)
  const data = (await res.json()) as { object: { sha: string } }
  return data.object.sha
}

export async function ensureDraftBranch(): Promise<string> {
  const existing = await getBranchSha(DRAFT_BRANCH)
  if (existing) return existing
  const mainSha = await getBranchSha(MAIN_BRANCH)
  if (!mainSha) throw new Error(`Base branch ${MAIN_BRANCH} not found`)
  await ghJson('/git/refs', {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${DRAFT_BRANCH}`, sha: mainSha }),
  })
  return mainSha
}

interface ContentsEntry {
  name: string
  path: string
  type: 'file' | 'dir' | 'symlink' | 'submodule'
  size: number
}

export async function listDir(path: string, ref: string): Promise<ContentsEntry[]> {
  const data = await ghJson<ContentsEntry[] | ContentsEntry>(
    `/contents/${encodeURI(path)}?ref=${ref}`
  )
  return Array.isArray(data) ? data : [data]
}

export async function getFile(
  path: string,
  ref: string
): Promise<{ content: string; sha: string } | null> {
  const res = await gh(`/contents/${encodeURI(path)}?ref=${ref}`)
  if (res.status === 404) return null
  if (!res.ok) throw new GitHubError(`GitHub get ${path} → ${res.status}`, res.status)
  const data = (await res.json()) as { content?: string; sha: string; type: string }
  if (data.type !== 'file' || data.content === undefined) return null
  return { content: Buffer.from(data.content, 'base64').toString('utf8'), sha: data.sha }
}

export async function putFile(
  path: string,
  branch: string,
  content: string,
  message: string,
  encoding: 'utf8' | 'base64' = 'utf8'
): Promise<void> {
  const existing = await getFile(path, branch)
  await ghJson(`/contents/${encodeURI(path)}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      branch,
      content: encoding === 'base64' ? content : Buffer.from(content, 'utf8').toString('base64'),
      ...(existing ? { sha: existing.sha } : {}),
    }),
  })
}

export interface ChangedFile {
  filename: string
  status: string
}

export async function getDraftChanges(): Promise<{ files: ChangedFile[]; aheadBy: number }> {
  const data = await ghJson<{
    ahead_by: number
    files?: { filename: string; status: string }[]
  }>(`/compare/${MAIN_BRANCH}...${DRAFT_BRANCH}`)
  return {
    aheadBy: data.ahead_by,
    files: (data.files ?? []).map(({ filename, status }) => ({ filename, status })),
  }
}

export async function mergeDraftToMain(): Promise<void> {
  await ghJson('/merges', {
    method: 'POST',
    body: JSON.stringify({
      base: MAIN_BRANCH,
      head: DRAFT_BRANCH,
      commit_message: 'publish changes from admin editor',
    }),
  })
}

export async function deleteDraftBranch(): Promise<void> {
  const res = await gh(`/git/refs/heads/${DRAFT_BRANCH}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 404 && res.status !== 422) {
    throw new GitHubError(`GitHub delete draft → ${res.status}`, res.status)
  }
}

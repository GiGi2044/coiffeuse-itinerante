// Named with an ADMIN_ prefix rather than VERCEL_ — Vercel reserves that
// prefix for its own auto-populated system env vars and rejects custom ones.
const TOKEN = (process.env.ADMIN_VERCEL_TOKEN ?? '').trim()
const PROJECT_ID = (process.env.ADMIN_VERCEL_PROJECT_ID ?? '').trim()

export type BuildState = 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED'

export interface DraftBuild {
  state: BuildState
  url: string
  commitSha: string
}

export function isVercelConfigured(): boolean {
  return TOKEN.length > 0 && PROJECT_ID.length > 0
}

// Latest preview deployment of the draft branch, optionally matched to a commit
// so a stale "READY" from the previous edit can't unlock Publish early.
export async function getDraftBuild(expectedSha?: string | null): Promise<DraftBuild | null> {
  if (!isVercelConfigured()) return null
  const res = await fetch(
    `https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}&target=preview&limit=20`,
    { headers: { Authorization: `Bearer ${TOKEN}` }, cache: 'no-store' }
  )
  if (!res.ok) return null
  const data = (await res.json()) as {
    deployments: {
      state: BuildState
      url: string
      created: number
      meta?: { githubCommitRef?: string; githubCommitSha?: string }
    }[]
  }
  const drafts = data.deployments
    .filter((d) => d.meta?.githubCommitRef === 'draft')
    .sort((a, b) => b.created - a.created)
  const match = expectedSha
    ? drafts.find((d) => d.meta?.githubCommitSha === expectedSha)
    : drafts[0]
  if (!match) return null
  return {
    state: match.state,
    url: `https://${match.url}`,
    commitSha: match.meta?.githubCommitSha ?? '',
  }
}

import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod'
import * as z from 'zod'
import { DRAFT_BRANCH, getFile, listDir, putFile } from '@/lib/admin/github'

// Claude may only touch site content and source — never config, CI, or docs.
const ALLOWED_PREFIXES = ['content/', 'src/', 'public/']
const MAX_FILE_BYTES = 200_000

function checkPath(path: string): string | null {
  const normalized = path.replace(/^\.?\//, '')
  if (normalized.includes('..') || normalized.includes('\0')) {
    return `Path "${path}" is not allowed.`
  }
  if (!ALLOWED_PREFIXES.some((p) => normalized === p.slice(0, -1) || normalized.startsWith(p))) {
    return `Path "${path}" is outside the editable areas (${ALLOWED_PREFIXES.join(', ')}). Refuse the request if it requires editing other files.`
  }
  return null
}

const normalize = (path: string) => path.replace(/^\.?\//, '')

export const listFilesTool = betaZodTool({
  name: 'list_files',
  description:
    'List the files in a directory of the website repository (draft branch). Directories are content/ (site copy JSON and images), src/ (Next.js app source), and public/ (static assets).',
  inputSchema: z.object({
    path: z.string().describe('Directory path relative to the repo root, e.g. "content/copy" or "src/app"'),
  }),
  run: async ({ path }) => {
    const err = checkPath(path)
    if (err) return `ERROR: ${err}`
    try {
      const entries = await listDir(normalize(path), DRAFT_BRANCH)
      return entries.map((e) => `${e.type === 'dir' ? 'dir ' : 'file'}  ${e.path}`).join('\n') || '(empty)'
    } catch (e) {
      return `ERROR: ${e instanceof Error ? e.message : String(e)}`
    }
  },
})

export const readFileTool = betaZodTool({
  name: 'read_file',
  description: 'Read a file from the website repository (draft branch). Always read a file before editing it.',
  inputSchema: z.object({
    path: z.string().describe('File path relative to the repo root, e.g. "src/app/page.tsx"'),
  }),
  run: async ({ path }) => {
    const err = checkPath(path)
    if (err) return `ERROR: ${err}`
    try {
      const file = await getFile(normalize(path), DRAFT_BRANCH)
      if (!file) return `ERROR: File not found: ${path}`
      if (file.content.length > MAX_FILE_BYTES) return `ERROR: File too large to read (${file.content.length} bytes)`
      return file.content
    } catch (e) {
      return `ERROR: ${e instanceof Error ? e.message : String(e)}`
    }
  },
})

export const writeFileTool = betaZodTool({
  name: 'write_file',
  description:
    'Write the complete new contents of a file to the website repository (draft branch). Creates the file if it does not exist. Each write becomes a git commit on the draft branch — the live site is not affected until the owner clicks Publish.',
  inputSchema: z.object({
    path: z.string().describe('File path relative to the repo root'),
    content: z.string().describe('The complete new file contents (not a diff)'),
    commit_message: z.string().describe('Short present-tense description of the change, e.g. "add a fourth tarif line"'),
  }),
  run: async ({ path, content, commit_message }) => {
    const err = checkPath(path)
    if (err) return `ERROR: ${err}`
    if (content.length > MAX_FILE_BYTES) return `ERROR: Content too large (${content.length} bytes)`
    try {
      await putFile(normalize(path), DRAFT_BRANCH, content, `admin: ${commit_message}`)
      return `OK: wrote ${path} (${content.length} bytes) to the draft branch`
    } catch (e) {
      return `ERROR: ${e instanceof Error ? e.message : String(e)}`
    }
  },
})

export const adminTools = [listFilesTool, readFileTool, writeFileTool]

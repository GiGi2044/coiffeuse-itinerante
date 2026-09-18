import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin/auth'
import { ensureDraftBranch, getDraftChanges, isGitHubConfigured } from '@/lib/admin/github'
import { ADMIN_SYSTEM_PROMPT } from '@/lib/admin/system-prompt'
import { adminTools } from '@/lib/admin/tools'

// The tool runner makes several model + GitHub round trips per edit
export const maxDuration = 300

interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

const MAX_TURNS = 40
const MAX_MESSAGE_CHARS = 8_000

export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  const apiKey = (process.env.ANTHROPIC_API_KEY ?? '').trim()
  if (!apiKey || !isGitHubConfigured()) {
    return NextResponse.json(
      { error: "L'éditeur n'est pas entièrement configuré (clé API ou jeton GitHub manquant)" },
      { status: 503 }
    )
  }

  const body = (await req.json().catch(() => null)) as { messages?: unknown } | null
  const messages = Array.isArray(body?.messages) ? (body.messages as ChatTurn[]) : null
  if (
    !messages ||
    messages.length === 0 ||
    messages.length > MAX_TURNS ||
    !messages.every(
      (m) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.length <= MAX_MESSAGE_CHARS
    )
  ) {
    return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
  }

  try {
    await ensureDraftBranch()

    const client = new Anthropic({ apiKey })
    const runner = client.beta.messages.toolRunner({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: ADMIN_SYSTEM_PROMPT,
      tools: adminTools,
      messages,
      max_iterations: 20,
    })
    const final = await runner

    const reply = final.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()

    const changes = await getDraftChanges()

    return NextResponse.json({
      reply: reply || 'Fait.',
      files: changes.files,
      stopReason: final.stop_reason,
    })
  } catch (e) {
    console.error('Admin chat error', e)
    return NextResponse.json(
      { error: 'Un problème est survenu pendant la modification — réessayez' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { createSessionToken, isAuthConfigured, sessionCookieHeader, verifyPassword } from '@/lib/admin/auth'

export async function POST(req: Request) {
  try {
    if (!isAuthConfigured()) {
      return NextResponse.json({ error: 'Admin access is not configured' }, { status: 503 })
    }
    const body = (await req.json().catch(() => null)) as { password?: unknown } | null
    const password = typeof body?.password === 'string' ? body.password : ''
    if (!verifyPassword(password)) {
      return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
    }
    return NextResponse.json(
      { ok: true },
      { headers: { 'Set-Cookie': sessionCookieHeader(createSessionToken()) } }
    )
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

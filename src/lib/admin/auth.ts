import { createHmac, timingSafeEqual } from 'node:crypto'

const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD ?? '').trim()
const SESSION_SECRET = (process.env.ADMIN_SESSION_SECRET ?? '').trim()

export const SESSION_COOKIE = 'admin_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

const hmac = (value: string) =>
  createHmac('sha256', SESSION_SECRET).update(value).digest('hex')

export function isAuthConfigured(): boolean {
  return ADMIN_PASSWORD.length > 0 && SESSION_SECRET.length >= 16
}

export function verifyPassword(attempt: string): boolean {
  // Fail closed when the admin password isn't configured
  if (!isAuthConfigured()) return false
  const a = createHmac('sha256', 'pw').update(attempt).digest()
  const b = createHmac('sha256', 'pw').update(ADMIN_PASSWORD).digest()
  return timingSafeEqual(a, b)
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_TTL_MS
  return `${expires}.${hmac(String(expires))}`
}

export function verifySessionToken(token: string): boolean {
  if (!isAuthConfigured()) return false
  const [expires, sig] = token.split('.')
  if (!expires || !sig) return false
  if (Number(expires) < Date.now()) return false
  const expected = hmac(expires)
  if (sig.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
}

export function isAdminRequest(req: Request): boolean {
  const cookieHeader = req.headers.get('cookie') ?? ''
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
  if (!match) return false
  return verifySessionToken(match.slice(SESSION_COOKIE.length + 1))
}

export function sessionCookieHeader(token: string): string {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000)
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`
}

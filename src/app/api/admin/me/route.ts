import { isAdminRequest } from '@/lib/admin/auth'

// Lightweight session check for client components (e.g. click-to-edit affordances).
export function GET(req: Request) {
  return new Response(null, { status: isAdminRequest(req) ? 204 : 401 })
}

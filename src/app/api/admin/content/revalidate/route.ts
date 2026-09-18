import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { isAdminRequest } from '@/lib/admin/auth'
import { CONTENT_TAG } from '@/lib/content'

// Escape hatch: refresh live content after edits that bypassed the admin API
// (e.g. a manual content-only git push, whose build is skipped by vercel.json).
export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  revalidateTag(CONTENT_TAG, { expire: 0 })
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin/auth'
import { deleteDraftBranch } from '@/lib/admin/github'

export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  try {
    await deleteDraftBranch()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Admin discard error', e)
    return NextResponse.json({ error: 'Impossible de supprimer le brouillon' }, { status: 500 })
  }
}

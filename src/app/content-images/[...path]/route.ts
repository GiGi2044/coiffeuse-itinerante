import { readContentImage } from '@/lib/content'

// Serves photos from content/images/ at request time (GitHub Contents API on
// Vercel, tagged with CONTENT_TAG so admin saves go live without a rebuild;
// local disk in dev) — the same "instant edit" pattern as the copy JSON.
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  const name = segments.join('/')
  if (!/^[a-z0-9-]+\.(jpg|jpeg|png|webp)$/.test(name)) {
    return new Response('Not found', { status: 404 })
  }
  const image = await readContentImage(name)
  if (!image) return new Response('Not found', { status: 404 })
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      'Content-Type': image.contentType,
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=3600',
    },
  })
}

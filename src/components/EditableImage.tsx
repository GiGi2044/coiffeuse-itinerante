'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useIsAdmin } from '@/lib/use-is-admin'
import { cn } from '@/lib/utils'

interface EditableImageProps {
  /** File name under content/images/, e.g. "hero-banner.jpg" */
  name: string
  alt: string
  className?: string
}

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.85

// Downscales large photos client-side before upload so the repo stays small and
// saves stay fast — a phone photo can be several MB, the site never needs more
// than MAX_DIMENSION px on the long edge.
function downscaleToJpegBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('canvas unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      resolve(dataUrl.split(',')[1] ?? '')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image load failed'))
    }
    img.src = url
  })
}

// For non-admins (and the first client render) this renders exactly what the
// server rendered. For a signed-in admin, clicking the photo opens a file
// picker; the chosen file is downscaled and uploaded to content/images/<name>.
export function EditableImage({ name, alt, className }: EditableImageProps) {
  const isAdmin = useIsAdmin()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [src, setSrc] = useState(`/content-images/${name}`)

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  )

  if (!isAdmin) return img

  async function handleFile(file: File) {
    setSaving(true)
    try {
      const base64 = await downscaleToJpegBase64(file)
      const jpegName = name.replace(/\.(jpe?g|png|webp)$/i, '.jpg')
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `content/images/${jpegName}`, content: base64, encoding: 'base64' }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? "Échec de l'envoi")
      }
      setSrc(`/content-images/${jpegName}?t=${Date.now()}`)
      toast.success('Photo enregistrée — en ligne dans quelques secondes')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'envoi — réessayez")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn('group relative cursor-pointer', className)} onClick={() => inputRef.current?.click()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn('h-full w-full object-cover transition-opacity', saving && 'opacity-60')}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-medium text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
        {saving ? 'Envoi…' : 'Cliquer pour changer la photo'}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void handleFile(file)
        }}
      />
    </div>
  )
}

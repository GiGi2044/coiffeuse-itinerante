'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useEditMode } from '@/lib/edit-mode'
import { cn } from '@/lib/utils'

interface EditableImageProps {
  /** File name under content/images/, e.g. "hero-wave.jpg" */
  name: string
  alt: string
  className?: string
}

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.85

// Downscales large photos client-side before upload so the repo stays small and
// applies stay fast — a phone photo can be several MB, the site never needs more
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

// Editability comes from context (see src/lib/edit-mode.tsx). Outside an
// EditModeProvider (the public page) this always renders exactly what the
// server rendered. Inside the admin editor, clicking the photo opens a file
// picker; the chosen file is downscaled and previewed instantly (a data URL,
// entirely client-side) and staged in the editor's in-memory draft — it is
// NOT uploaded here, that only happens when the editor's "Apply" button is
// used (see src/app/admin/AdminEditor.tsx).
export function EditableImage({ name, alt, className }: EditableImageProps) {
  const { editable, setImage } = useEditMode()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preparing, setPreparing] = useState(false)
  const [src, setSrc] = useState(`/content-images/${name}`)

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  )

  if (!editable) return img

  async function handleFile(file: File) {
    setPreparing(true)
    try {
      const base64 = await downscaleToJpegBase64(file)
      const jpegName = name.replace(/\.(jpe?g|png|webp)$/i, '.jpg')
      setSrc(`data:image/jpeg;base64,${base64}`)
      setImage(jpegName, base64)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Impossible de préparer cette photo')
    } finally {
      setPreparing(false)
    }
  }

  return (
    <div className={cn('group relative cursor-pointer', className)} onClick={() => inputRef.current?.click()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn('h-full w-full object-cover transition-opacity', preparing && 'opacity-60')}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-medium text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
        {preparing ? 'Préparation…' : 'Cliquer pour changer la photo'}
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

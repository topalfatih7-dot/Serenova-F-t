import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, X, Loader2, ImageUp, Check, Move } from 'lucide-react'

const OUTPUT_MAX = 720
const JPEG_QUALITY = 0.85

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Görsel yüklenemedi'))
    img.src = src
  })
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Cover ölçeği: görsel kutuyu doldursun */
function coverScale(imgW, imgH, boxW, boxH) {
  return Math.max(boxW / imgW, boxH / imgH)
}

function clampOffset(x, y, imgW, imgH, boxW, boxH, zoom) {
  const scale = coverScale(imgW, imgH, boxW, boxH) * zoom
  const dispW = imgW * scale
  const dispH = imgH * scale
  const minX = Math.min(0, boxW - dispW)
  const minY = Math.min(0, boxH - dispH)
  return {
    x: Math.min(0, Math.max(minX, x)),
    y: Math.min(0, Math.max(minY, y)),
  }
}

function centerOffset(imgW, imgH, boxW, boxH, zoom) {
  const scale = coverScale(imgW, imgH, boxW, boxH) * zoom
  const dispW = imgW * scale
  const dispH = imgH * scale
  return {
    x: (boxW - dispW) / 2,
    y: (boxH - dispH) / 2,
  }
}

/**
 * Viewport’taki görünür alanı orijinal görselden kırpıp JPEG data URL üretir.
 */
async function exportCroppedDataUrl(src, { x, y, zoom, boxW, boxH, outW, outH }) {
  const img = await loadImage(src)
  const scale = coverScale(img.width, img.height, boxW, boxH) * zoom
  const sx = -x / scale
  const sy = -y / scale
  const sw = boxW / scale
  const sh = boxH / scale

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, outW, outH)
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH)
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

export function dataUrlToFile(dataUrl, filename = 'photo.jpg') {
  const [header, data] = String(dataUrl || '').split(',')
  if (!data) throw new Error('Geçersiz görsel')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(data)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) arr[i] = binary.charCodeAt(i)
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'
  const name = filename.includes('.') ? filename : `${filename}.${ext}`
  return new File([arr], name, { type: mime })
}

/**
 * @param {object} props
 * @param {string|null} props.value
 * @param {(v: string|null) => void} props.onChange
 * @param {string} [props.label]
 * @param {string} [props.hint]
 * @param {'body'|'portrait'} [props.variant]
 * @param {boolean} [props.optional]
 * @param {(file: File) => Promise<string>} [props.persistUpload] — set edilirse boyutlandırılmış dosya storage'a yüklenir; onChange public URL alır
 */
export default function PhotoUpload({
  value,
  onChange,
  label = 'Boy Fotoğrafı',
  hint,
  variant = 'body',
  optional = false,
  persistUpload,
}) {
  const inputRef = useRef(null)
  const frameRef = useRef(null)
  const dragRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [localPreview, setLocalPreview] = useState(null)

  const [cropSrc, setCropSrc] = useState(null)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [frameSize, setFrameSize] = useState({ w: 280, h: 280 })
  const centerPendingRef = useRef(false)

  const displaySrc = localPreview || value
  const isPortrait = variant === 'portrait'
  const aspect = isPortrait ? 1 : 32 / 44

  const measureFrame = useCallback(() => {
    const el = frameRef.current
    if (!el) return
    const w = el.clientWidth
    const h = el.clientHeight
    if (w > 0 && h > 0) setFrameSize({ w, h })
  }, [])

  useEffect(() => {
    if (!cropSrc) return undefined
    measureFrame()
    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(measureFrame)
      : null
    if (frameRef.current) ro?.observe(frameRef.current)
    window.addEventListener('resize', measureFrame)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', measureFrame)
    }
  }, [cropSrc, measureFrame])

  useEffect(() => {
    if (!cropSrc || !imgSize.w || !frameSize.w) return
    if (centerPendingRef.current) {
      centerPendingRef.current = false
      setOffset(centerOffset(imgSize.w, imgSize.h, frameSize.w, frameSize.h, zoom))
      return
    }
    setOffset((prev) => {
      const next = clampOffset(prev.x, prev.y, imgSize.w, imgSize.h, frameSize.w, frameSize.h, zoom)
      return next.x === prev.x && next.y === prev.y ? prev : next
    })
  }, [zoom, frameSize, imgSize, cropSrc])

  const openCrop = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Lütfen bir görsel dosyası seçin')
      return
    }
    setError('')
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const img = await loadImage(dataUrl)
      setImgSize({ w: img.width, h: img.height })
      setZoom(1)
      centerPendingRef.current = true
      setCropSrc(dataUrl)
    } catch {
      setError('Görsel açılamadı, tekrar deneyin')
    }
  }

  const cancelCrop = () => {
    setCropSrc(null)
    setZoom(1)
    if (inputRef.current) inputRef.current.value = ''
  }

  const applyCrop = async () => {
    if (!cropSrc) return
    setLoading(true)
    setError('')
    try {
      const boxW = frameRef.current?.clientWidth || frameSize.w
      const boxH = frameRef.current?.clientHeight || frameSize.h
      const outW = isPortrait ? OUTPUT_MAX : Math.round(OUTPUT_MAX * aspect)
      const outH = isPortrait ? OUTPUT_MAX : OUTPUT_MAX
      const dataUrl = await exportCroppedDataUrl(cropSrc, {
        x: offset.x,
        y: offset.y,
        zoom,
        boxW,
        boxH,
        outW,
        outH,
      })
      setCropSrc(null)
      if (persistUpload) {
        setLocalPreview(dataUrl)
        const resized = dataUrlToFile(dataUrl, 'profile.jpg')
        const url = await persistUpload(resized)
        if (!url || typeof url !== 'string') throw new Error('Yükleme URL döndürmedi')
        setLocalPreview(null)
        onChange(url)
      } else {
        onChange(dataUrl)
      }
    } catch (e) {
      setLocalPreview(null)
      setError(e?.message || 'Görsel kaydedilemedi, tekrar deneyin')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onPointerDown = (e) => {
    if (loading) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: offset.x,
      origY: offset.y,
    }
  }

  const onPointerMove = (e) => {
    if (!dragRef.current || !imgSize.w) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    const next = clampOffset(
      dragRef.current.origX + dx,
      dragRef.current.origY + dy,
      imgSize.w,
      imgSize.h,
      frameSize.w,
      frameSize.h,
      zoom,
    )
    setOffset(next)
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  const clear = () => {
    setLocalPreview(null)
    setError('')
    setCropSrc(null)
    onChange(null)
  }

  const previewClass = isPortrait ? 'h-36 w-36 rounded-2xl object-cover' : 'h-44 w-32 object-cover'
  const placeholderTitle = isPortrait
    ? (optional ? 'Profil fotoğrafı ekle (isteğe bağlı)' : 'Profil fotoğrafı ekle *')
    : 'Fotoğraf ekle (isteğe bağlı)'
  const placeholderHint = isPortrait ? 'Net portre, yüzünüz görünür olmalı' : ''
  const loadingLabel = persistUpload ? 'Kaydediliyor...' : 'Kaydediliyor...'

  const scale = imgSize.w
    ? coverScale(imgSize.w, imgSize.h, frameSize.w, frameSize.h) * zoom
    : 1

  return (
    <div className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">
          {label}
        </span>
      )}

      {cropSrc ? (
        <div className="space-y-3 rounded-2xl border border-cream-200 bg-cream-50/80 p-3 sm:p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-cream-800/70">
            <Move className="h-3.5 w-3.5 shrink-0" />
            Fotoğrafı sürükleyerek konumlandırın, ardından onaylayın
          </p>
          <div
            ref={frameRef}
            className={`relative mx-auto w-full max-w-[min(100%,20rem)] touch-none overflow-hidden rounded-2xl border-2 border-brand-300 bg-cream-200 shadow-inner ${
              isPortrait ? 'aspect-square' : 'aspect-[32/44]'
            }`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role="presentation"
          >
            <img
              src={cropSrc}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-0 top-0 max-w-none select-none"
              style={{
                width: imgSize.w * scale,
                height: imgSize.h * scale,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10" />
          </div>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-cream-800/50">
              Yakınlaştır
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={loading}
              className="w-full accent-brand-500"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelCrop}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-cream-200 bg-white py-2.5 text-sm font-semibold text-cream-800 disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={applyCrop}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-sage-500 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {loading ? loadingLabel : 'Onayla'}
            </button>
          </div>
        </div>
      ) : displaySrc ? (
        <div className="relative inline-flex overflow-hidden rounded-2xl border border-cream-200 bg-cream-50">
          <img src={displaySrc} alt="Fotoğraf önizleme" className={previewClass} />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
            </div>
          )}
          <div className="absolute right-1.5 top-1.5 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-cream-800 shadow-sm hover:bg-white disabled:opacity-50"
              aria-label="Değiştir"
            >
              <Camera className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={loading}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-red-500 shadow-sm hover:bg-white disabled:opacity-50"
              aria-label="Kaldır"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cream-300 bg-cream-50/60 px-4 py-7 text-center transition hover:border-brand-300 hover:bg-brand-50/40 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
              <ImageUp className="h-6 w-6" />
            </span>
          )}
          <span className="text-sm font-medium text-cream-900">
            {loading ? loadingLabel : placeholderTitle}
          </span>
          {placeholderHint ? (
            <span className="text-xs text-cream-800/55">{placeholderHint}</span>
          ) : null}
        </button>
      )}

      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-red-500">{error}</span>
      ) : hint && !cropSrc ? (
        <span className="mt-1.5 block text-xs text-cream-800/50">{hint}</span>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => openCrop(e.target.files?.[0])}
      />
    </div>
  )
}

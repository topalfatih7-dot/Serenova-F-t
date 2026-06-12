import { useRef, useState } from 'react'
import { Camera, X, Loader2, ImageUp } from 'lucide-react'

function resizeImage(file, maxDim = 720, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width >= height && width > maxDim) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function PhotoUpload({ value, onChange, label = 'Boy Fotoğrafı', hint }) {
  const inputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Lütfen bir görsel dosyası seçin')
      return
    }
    setError('')
    setLoading(true)
    try {
      const dataUrl = await resizeImage(file)
      onChange(dataUrl)
    } catch {
      setError('Görsel yüklenemedi, tekrar deneyin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">
          {label}
        </span>
      )}

      {value ? (
        <div className="relative inline-flex overflow-hidden rounded-2xl border border-cream-200 bg-cream-50">
          <img src={value} alt="Boy fotoğrafı önizleme" className="h-44 w-32 object-cover" />
          <div className="absolute right-1.5 top-1.5 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-cream-800 shadow-sm hover:bg-white"
              aria-label="Değiştir"
            >
              <Camera className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-red-500 shadow-sm hover:bg-white"
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
            {loading ? 'Yükleniyor...' : 'Fotoğraf ekle (isteğe bağlı)'}
          </span>
          <span className="text-xs text-cream-800/55">Tüm vücut görünecek şekilde, dik dururken</span>
        </button>
      )}

      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-red-500">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-cream-800/50">{hint}</span>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}

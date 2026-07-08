import { useEffect, useState } from 'react'
import { Loader2, PlayCircle } from 'lucide-react'
import { getExerciseVideoUrl } from '../../services/supabaseDb'
import { readExerciseVideoUrlCache } from '../../services/exerciseVideoUrlCache'
import { exerciseStoragePathFromUrl } from '../../utils/exerciseVideoPrefetch'

function youTubeId(url) {
  const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}

function youTubeThumb(url) {
  const id = youTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
}

function isDirectVideoUrl(url) {
  return /^https?:\/\//.test(String(url || '')) && !youTubeId(url) && !exerciseStoragePathFromUrl(url)
}

const SIZE_CLASS = {
  xs: 'inline-flex h-9 w-9 max-h-9 max-w-9 shrink-0 rounded-lg',
  sm: 'inline-flex h-10 w-10 max-h-10 max-w-10 shrink-0 rounded-lg',
  list: 'inline-flex h-11 w-11 max-h-11 max-w-11 shrink-0 rounded-lg sm:h-12 sm:w-12 sm:max-h-12 sm:max-w-12',
  md: 'inline-flex h-14 w-14 max-h-14 max-w-14 shrink-0 rounded-xl sm:h-16 sm:w-16 sm:max-h-16 sm:max-w-16',
  card: 'inline-flex h-28 w-36 max-h-28 max-w-36 shrink-0 rounded-2xl sm:h-32 sm:w-44 sm:max-h-32 sm:max-w-44',
}

const ACCENT_CLASS = {
  brand: 'bg-gradient-to-br from-brand-400 to-blue-500 text-white',
  sage: 'bg-gradient-to-br from-sage-400 to-emerald-500 text-white',
}

/**
 * Hareket videosunun ilk karesi — program listesi / kart önizlemesi.
 * YouTube: statik thumb; Supabase: metadata ile ilk frame; yoksa ikon.
 */
export default function ExerciseVideoThumbnail({
  url,
  videoPending = false,
  size = 'md',
  accent = 'brand',
  fallbackIcon: FallbackIcon = PlayCircle,
  className = '',
}) {
  const [playSrc, setPlaySrc] = useState(null)
  const [loading, setLoading] = useState(Boolean(url && !videoPending))

  const ytThumb = url && !videoPending ? youTubeThumb(url) : null
  const storagePath = url && !videoPending ? exerciseStoragePathFromUrl(url) : null
  const directUrl = url && !videoPending && isDirectVideoUrl(url) ? url : null
  const boxClass = `${SIZE_CLASS[size] || SIZE_CLASS.md} ${className}`.trim()

  useEffect(() => {
    if (!url || videoPending) {
      setPlaySrc(null)
      setLoading(false)
      return undefined
    }

    if (ytThumb || directUrl) {
      setPlaySrc(directUrl)
      setLoading(false)
      return undefined
    }

    if (!storagePath) {
      setPlaySrc(null)
      setLoading(false)
      return undefined
    }

    const cached = readExerciseVideoUrlCache(storagePath)
    if (cached) {
      setPlaySrc(cached)
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)
    getExerciseVideoUrl(storagePath).then((signed) => {
      if (cancelled) return
      setPlaySrc(signed)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [url, videoPending, ytThumb, directUrl, storagePath])

  if (videoPending) {
    return (
      <span className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-cream-100 ${boxClass}`}>
        <Loader2 className="h-5 w-5 animate-spin text-cream-400" />
      </span>
    )
  }

  if (loading) {
    return (
      <span className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-cream-100 ${boxClass}`}>
        <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
      </span>
    )
  }

  if (ytThumb) {
    return (
      <span className={`relative shrink-0 overflow-hidden bg-cream-100 shadow-sm ${boxClass}`}>
        <img src={ytThumb} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <PlayCircle className={`text-white drop-shadow-md ${size === 'xs' ? 'h-3.5 w-3.5' : size === 'sm' || size === 'list' ? 'h-4 w-4' : size === 'card' ? 'h-7 w-7 sm:h-8 sm:w-8' : 'h-5 w-5 sm:h-6 sm:w-6'}`} />
        </span>
      </span>
    )
  }

  if (playSrc) {
    return (
      <span className={`relative shrink-0 overflow-hidden bg-cream-900/5 shadow-sm ${boxClass}`}>
        <video
          src={playSrc}
          muted
          playsInline
          preload="metadata"
          aria-hidden
          className="h-full w-full object-cover"
          onLoadedData={(event) => {
            try {
              const video = event.currentTarget
              if (video.currentTime < 0.05) video.currentTime = 0.1
            } catch { /* ignore */ }
          }}
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
          <PlayCircle className={`text-white drop-shadow-md ${size === 'xs' ? 'h-3.5 w-3.5' : size === 'sm' || size === 'list' ? 'h-4 w-4' : size === 'card' ? 'h-7 w-7 sm:h-8 sm:w-8' : 'h-5 w-5 sm:h-6 sm:w-6'}`} />
        </span>
      </span>
    )
  }

  return (
    <span className={`flex shrink-0 items-center justify-center shadow-sm ${ACCENT_CLASS[accent] || ACCENT_CLASS.brand} ${boxClass}`}>
      <FallbackIcon className={size === 'xs' ? 'h-3.5 w-3.5' : size === 'sm' || size === 'list' ? 'h-4 w-4' : size === 'card' ? 'h-7 w-7 sm:h-8 sm:w-8' : 'h-5 w-5 sm:h-6 sm:w-6'} />
    </span>
  )
}

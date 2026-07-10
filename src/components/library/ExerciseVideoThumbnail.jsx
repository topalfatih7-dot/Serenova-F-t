import { useState } from 'react'
import { Loader2, PlayCircle } from 'lucide-react'
import { getExerciseThumbUrl } from '../../services/supabaseDb'

function youTubeId(url) {
  const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}

function youTubeThumb(url) {
  const id = youTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
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

const PLAY_ICON = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  list: 'h-4 w-4',
  md: 'h-5 w-5 sm:h-6 sm:w-6',
  card: 'h-7 w-7 sm:h-8 sm:w-8',
}

function PlaceholderThumb({ FallbackIcon, size, showPlay = true }) {
  const iconClass = PLAY_ICON[size] || PLAY_ICON.md
  return (
    <>
      <FallbackIcon className={iconClass} />
      {showPlay && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
          <PlayCircle className={`text-white drop-shadow-md ${iconClass}`} />
        </span>
      )}
    </>
  )
}

/**
 * Hareket videosu kapak görseli — exercise-thumbs public .webp (veya YouTube thumb).
 * Video mount / signed URL yok; lazy <img> yeterli.
 */
export default function ExerciseVideoThumbnail({
  url,
  videoPending = false,
  size = 'md',
  accent = 'brand',
  fallbackIcon: FallbackIcon = PlayCircle,
  className = '',
}) {
  const [imgFailed, setImgFailed] = useState(false)

  const ytThumb = url && !videoPending ? youTubeThumb(url) : null
  const storageThumb = url && !videoPending && !ytThumb ? getExerciseThumbUrl(url) : null
  const thumbUrl = ytThumb || storageThumb
  const showImg = Boolean(thumbUrl) && !imgFailed

  const boxClass = `${SIZE_CLASS[size] || SIZE_CLASS.md} ${className}`.trim()
  const playIconClass = PLAY_ICON[size] || PLAY_ICON.md
  const shellClass = `relative flex shrink-0 items-center justify-center overflow-hidden shadow-sm ${ACCENT_CLASS[accent] || ACCENT_CLASS.brand} ${boxClass}`

  if (videoPending) {
    return (
      <span className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-cream-100 ${boxClass}`}>
        <Loader2 className="h-5 w-5 animate-spin text-cream-400" />
      </span>
    )
  }

  if (showImg) {
    return (
      <span className={`relative shrink-0 overflow-hidden bg-cream-100 shadow-sm select-none ${boxClass}`}>
        <img
          src={thumbUrl}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onError={() => setImgFailed(true)}
          className="h-full w-full select-none object-cover"
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <PlayCircle className={`text-white drop-shadow-md ${playIconClass}`} />
        </span>
      </span>
    )
  }

  return (
    <span className={shellClass}>
      <PlaceholderThumb FallbackIcon={FallbackIcon} size={size} />
    </span>
  )
}

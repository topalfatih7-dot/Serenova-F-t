import { useEffect, useState } from 'react'
import { Loader2, VideoOff } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { normalizeExerciseVideoRef, isExerciseVideoStoragePath } from '../../services/supabaseDb'
import { BRAND } from '../../config/brand'

function youTubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}

function resolveStoragePath(url) {
  if (!url || youTubeId(url)) return null
  if (isExerciseVideoStoragePath(url)) return normalizeExerciseVideoRef(url)
  if (/^https?:\/\//.test(url) && url.includes('/exercise-videos/')) {
    return normalizeExerciseVideoRef(url)
  }
  return null
}

/** Oynatıcı üzerinde sabit marka logosu — ekran kayıtlarında görünür kalır. */
function VideoWatermarkFrame({ children, className = '' }) {
  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-xl bg-black ${className}`}>
      <div className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full [&>video]:h-full [&>video]:w-full [&>video]:object-contain">
        {children}
      </div>
      <img
        src={BRAND.assets.logo}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute right-3 bottom-11 z-10 h-7 w-auto max-w-[42%] select-none object-contain opacity-80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] sm:h-8"
      />
    </div>
  )
}

export default function VideoPlayer({ url, className = '' }) {
  const { getExerciseVideoUrl } = useApp()
  const [playUrl, setPlayUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const yt = url ? youTubeId(url) : null
  const storagePath = url && !yt ? resolveStoragePath(url) : null

  useEffect(() => {
    if (!storagePath) {
      setPlayUrl(null)
      setLoadError(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    setLoadError(false)
    getExerciseVideoUrl(storagePath).then((signedUrl) => {
      if (cancelled) return
      setPlayUrl(signedUrl)
      setLoading(false)
      setLoadError(!signedUrl)
    })
    return () => { cancelled = true }
  }, [storagePath, getExerciseVideoUrl])

  if (!url) {
    return (
      <div className={`flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-cream-100 text-cream-800/40 ${className}`}>
        <VideoOff className="h-8 w-8" />
        <span className="text-xs">Bu harekete henüz video eklenmemiş</span>
      </div>
    )
  }

  if (yt) {
    return (
      <VideoWatermarkFrame className={className}>
        <iframe
          title="Egzersiz videosu"
          src={`https://www.youtube.com/embed/${yt}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="border-0"
        />
      </VideoWatermarkFrame>
    )
  }

  if (storagePath) {
    if (loading) {
      return (
        <div className={`flex aspect-video w-full items-center justify-center rounded-xl bg-black ${className}`}>
          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
        </div>
      )
    }
    if (loadError || !playUrl) {
      return (
        <div className={`flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-cream-100 text-cream-800/50 ${className}`}>
          <VideoOff className="h-8 w-8" />
          <span className="text-xs">Video oynatılamadı — oturumunuzun açık olduğundan emin olun ve sayfayı yenileyin</span>
        </div>
      )
    }
    return (
      <VideoWatermarkFrame className={className}>
        <video src={playUrl} controls playsInline controlsList="nodownload" />
      </VideoWatermarkFrame>
    )
  }

  if (/^https?:\/\//.test(url) && (url.includes('/exercise-videos/') || url.includes('supabase.co/storage/'))) {
    return (
      <div className={`flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-cream-100 text-cream-800/50 ${className}`}>
        <VideoOff className="h-8 w-8" />
        <span className="text-xs">Video bağlantısı güncelleniyor — sayfayı yenileyip tekrar deneyin</span>
      </div>
    )
  }

  return (
    <VideoWatermarkFrame className={className}>
      <video src={url} controls playsInline controlsList="nodownload" />
    </VideoWatermarkFrame>
  )
}

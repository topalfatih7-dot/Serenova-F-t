import { useEffect, useState } from 'react'
import { Loader2, VideoOff } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { normalizeExerciseVideoRef } from '../../services/supabaseDb'

function youTubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}

function resolveStoragePath(url) {
  if (!url || youTubeId(url)) return null
  if (!/^https?:\/\//.test(url)) return url
  if (url.includes('/exercise-videos/')) return normalizeExerciseVideoRef(url)
  return null
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
      <iframe
        title="Egzersiz videosu"
        src={`https://www.youtube.com/embed/${yt}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className={`aspect-video w-full rounded-xl border-0 bg-black ${className}`}
      />
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
          <span className="text-xs">Video oynatılamadı — oturum açık mı kontrol edin</span>
        </div>
      )
    }
    return (
      <video src={playUrl} controls playsInline controlsList="nodownload" className={`aspect-video w-full rounded-xl bg-black ${className}`} />
    )
  }

  return (
    <video src={url} controls playsInline className={`aspect-video w-full rounded-xl bg-black ${className}`} />
  )
}

import { useEffect, useState } from 'react'
import { Loader2, VideoOff } from 'lucide-react'
import { useApp } from '../../context/AppContext'

function youTubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}

/**
 * exercise-videos bucket'i private oldugundan gercek dosya adresi kalici
 * degil. DB'de ya cıplak storage path'i (yeni yuklemeler) ya da eski
 * kayitlardan kalma tam public URL bulunabilir; ikisinden de path'i
 * cikarip anlik imzali URL istiyoruz.
 */
function extractStoragePath(url) {
  if (!url || /^https?:\/\//.test(url) === false) return url || null
  const marker = '/object/public/exercise-videos/'
  const idx = url.indexOf(marker)
  return idx === -1 ? null : url.slice(idx + marker.length)
}

export default function VideoPlayer({ url, className = '' }) {
  const { getExerciseVideoUrl } = useApp()
  const [playUrl, setPlayUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  const yt = url ? youTubeId(url) : null
  const storagePath = url && !yt ? extractStoragePath(url) : null

  useEffect(() => {
    if (!storagePath) { setPlayUrl(null); return }
    let cancelled = false
    setLoading(true)
    getExerciseVideoUrl(storagePath).then((signedUrl) => {
      if (!cancelled) { setPlayUrl(signedUrl); setLoading(false) }
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
    if (loading || !playUrl) {
      return (
        <div className={`flex aspect-video w-full items-center justify-center rounded-xl bg-black ${className}`}>
          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
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

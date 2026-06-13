import { VideoOff } from 'lucide-react'

function youTubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}

export default function VideoPlayer({ url, className = '' }) {
  if (!url) {
    return (
      <div className={`flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-cream-100 text-cream-800/40 ${className}`}>
        <VideoOff className="h-8 w-8" />
        <span className="text-xs">Bu harekete henüz video eklenmemiş</span>
      </div>
    )
  }

  const yt = youTubeId(url)
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

  return (
    <video src={url} controls playsInline className={`aspect-video w-full rounded-xl bg-black ${className}`} />
  )
}

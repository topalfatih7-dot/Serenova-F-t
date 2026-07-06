import { useCallback, useEffect, useRef, useState, cloneElement, isValidElement } from 'react'
import { Loader2, Maximize2, Minimize2, VideoOff } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { normalizeExerciseVideoRef, isExerciseVideoStoragePath } from '../../services/supabaseDb'
import { BRAND } from '../../config/brand'

function youTubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}

function youTubeEmbedSrc(id, { autoPlay = true, loop = true } = {}) {
  const params = new URLSearchParams({
    autoplay: autoPlay ? '1' : '0',
    fs: '0',
    modestbranding: '1',
    rel: '0',
    playsinline: '1',
    enablejsapi: '0',
  })
  if (loop) {
    params.set('loop', '1')
    params.set('playlist', id)
  }
  return `https://www.youtube.com/embed/${id}?${params}`
}

function resolveStoragePath(url) {
  if (!url || youTubeId(url)) return null
  if (isExerciseVideoStoragePath(url)) return normalizeExerciseVideoRef(url)
  if (/^https?:\/\//.test(url) && url.includes('/exercise-videos/')) {
    return normalizeExerciseVideoRef(url)
  }
  return null
}

/** Oynatıcı üzerinde sabit marka logosu — yalnızca özel tam ekranda görünür kalır. */
function VideoWatermarkFrame({
  children,
  className = '',
  allowFullscreen = true,
  autoPlay = true,
  loop = true,
}) {
  const frameRef = useRef(null)
  const videoRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const syncFullscreen = useCallback(() => {
    const el = frameRef.current
    const active = document.fullscreenElement === el
      || document.webkitFullscreenElement === el
    setIsFullscreen(active)
  }, [])

  useEffect(() => {
    document.addEventListener('fullscreenchange', syncFullscreen)
    document.addEventListener('webkitfullscreenchange', syncFullscreen)
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen)
      document.removeEventListener('webkitfullscreenchange', syncFullscreen)
    }
  }, [syncFullscreen])

  const enterFrameFullscreen = useCallback(async () => {
    const el = frameRef.current
    if (!el) return
    try {
      if (el.requestFullscreen) await el.requestFullscreen()
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
    } catch {
      /* kullanıcı iptal etmiş olabilir */
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen()
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
    } catch {
      /* kullanıcı iptal etmiş olabilir */
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const el = frameRef.current
    if (!el) return
    const active = document.fullscreenElement === el
      || document.webkitFullscreenElement === el
    if (active) await exitFullscreen()
    else await enterFrameFullscreen()
  }, [enterFrameFullscreen, exitFullscreen])

  /** Native video tam ekranı engelle — logo kaybolmasın, tek kontrol kalsın. */
  useEffect(() => {
    const frame = frameRef.current
    const video = videoRef.current
    if (!frame || !video) return undefined

    const redirectNativeFullscreen = () => {
      const videoIsFs = document.fullscreenElement === video
        || document.webkitFullscreenElement === video
      if (!videoIsFs) return
      exitFullscreen().finally(() => enterFrameFullscreen())
    }

    const onWebkitBeginFullscreen = (event) => {
      event.preventDefault?.()
      event.stopPropagation?.()
      enterFrameFullscreen()
    }

    const onDblClick = (event) => {
      event.preventDefault()
      event.stopPropagation()
      toggleFullscreen()
    }

    document.addEventListener('fullscreenchange', redirectNativeFullscreen)
    document.addEventListener('webkitfullscreenchange', redirectNativeFullscreen)
    video.addEventListener('webkitbeginfullscreen', onWebkitBeginFullscreen)
    video.addEventListener('dblclick', onDblClick)

    return () => {
      document.removeEventListener('fullscreenchange', redirectNativeFullscreen)
      document.removeEventListener('webkitfullscreenchange', redirectNativeFullscreen)
      video.removeEventListener('webkitbeginfullscreen', onWebkitBeginFullscreen)
      video.removeEventListener('dblclick', onDblClick)
    }
  }, [enterFrameFullscreen, exitFullscreen, toggleFullscreen])

  /** İzleme alanına girildiğinde otomatik başlat ve döngüye al. */
  useEffect(() => {
    const video = videoRef.current
    if (!video || !autoPlay) return undefined

    const tryPlay = () => {
      video.play().catch(() => {})
    }

    tryPlay()
    video.addEventListener('canplay', tryPlay)

    const onEnded = () => {
      if (!loop) return
      video.currentTime = 0
      video.play().catch(() => {})
    }
    video.addEventListener('ended', onEnded)

    return () => {
      video.removeEventListener('canplay', tryPlay)
      video.removeEventListener('ended', onEnded)
    }
  }, [autoPlay, loop])

  const mediaChild = isValidElement(children) && children.type === 'video'
    ? cloneElement(children, {
      ref: videoRef,
      autoPlay,
      loop,
      playsInline: true,
      controlsList: 'nodownload nofullscreen noremoteplayback',
      disablePictureInPicture: true,
      disableRemotePlayback: true,
      className: [children.props.className, 'border-0'].filter(Boolean).join(' '),
    })
    : isValidElement(children) && children.type === 'iframe'
      ? cloneElement(children, {
        allowFullScreen: false,
        className: [children.props.className, 'border-0'].filter(Boolean).join(' '),
      })
      : children

  return (
    <div
      ref={frameRef}
      className={[
        'video-player-frame group relative aspect-video w-full overflow-hidden rounded-xl bg-black',
        '[&:fullscreen]:flex [&:fullscreen]:aspect-auto [&:fullscreen]:h-screen [&:fullscreen]:w-screen',
        '[&:fullscreen]:max-h-none [&:fullscreen]:max-w-none [&:fullscreen]:items-center [&:fullscreen]:justify-center',
        '[&:fullscreen]:rounded-none',
        '[-webkit-full-screen]:flex [-webkit-full-screen]:aspect-auto [-webkit-full-screen]:h-screen [-webkit-full-screen]:w-screen',
        '[-webkit-full-screen]:max-h-none [-webkit-full-screen]:max-w-none [-webkit-full-screen]:items-center [-webkit-full-screen]:justify-center',
        '[-webkit-full-screen]:rounded-none',
        className,
      ].join(' ')}
    >
      <div className="absolute inset-0 z-0 [&>iframe]:h-full [&>iframe]:w-full [&>video]:h-full [&>video]:w-full [&>video]:object-contain">
        {mediaChild}
      </div>
      <img
        src={BRAND.assets.logo}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={[
          'pointer-events-none absolute z-30 w-auto select-none object-contain opacity-80',
          'drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]',
          isFullscreen
            ? 'right-6 bottom-16 h-10 max-w-[36%] sm:h-12'
            : 'right-3 bottom-11 h-7 max-w-[42%] sm:h-8',
        ].join(' ')}
      />
      {allowFullscreen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          className={[
            'absolute top-3 right-3 z-40 flex h-9 w-9 items-center justify-center rounded-lg',
            'bg-black/55 text-white/90 opacity-80 backdrop-blur-sm transition hover:bg-black/75 hover:opacity-100',
            'sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100',
            isFullscreen && 'opacity-100',
          ].join(' ')}
          aria-label={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      )}
    </div>
  )
}

export default function VideoPlayer({
  url,
  videoPending = false,
  className = '',
  autoPlay = true,
  loop = true,
}) {
  const { getExerciseVideoUrl } = useApp()
  const [playUrl, setPlayUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const yt = url ? youTubeId(url) : null
  const storagePath = url && !yt ? resolveStoragePath(url) : null

  useEffect(() => {
    if (!storagePath || videoPending) {
      setPlayUrl(null)
      setLoadError(false)
      setLoading(false)
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
  }, [storagePath, getExerciseVideoUrl, videoPending])

  const frameProps = { className, autoPlay, loop }

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
      <VideoWatermarkFrame {...frameProps}>
        <iframe
          title="Egzersiz videosu"
          src={youTubeEmbedSrc(yt, { autoPlay, loop })}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </VideoWatermarkFrame>
    )
  }

  if (storagePath) {
    if (videoPending) {
      return (
        <div className={`flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-cream-100 text-cream-800/50 ${className}`}>
          <VideoOff className="h-8 w-8" />
          <span className="text-xs">Video henüz yüklenmedi — metadata hazır, dosya bekleniyor</span>
        </div>
      )
    }
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
      <VideoWatermarkFrame {...frameProps}>
        <video src={playUrl} controls />
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
    <VideoWatermarkFrame {...frameProps}>
      <video src={url} controls />
    </VideoWatermarkFrame>
  )
}

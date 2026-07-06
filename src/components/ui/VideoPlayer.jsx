import { useCallback, useEffect, useRef, useState, cloneElement, isValidElement } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Maximize2, Minimize2, Pause, Play, VideoOff } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { normalizeExerciseVideoRef, isExerciseVideoStoragePath } from '../../services/supabaseDb'
import { BRAND } from '../../config/brand'
import { needsPseudoFullscreen } from '../../utils/videoPlayerPlatform'

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

function formatVideoTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function VideoCustomControls({
  videoRef,
  expanded,
  onToggleExpand,
  expandLabel,
  collapseLabel,
}) {
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined

    const sync = () => {
      setPlaying(!video.paused && !video.ended)
      setCurrent(video.currentTime || 0)
      setDuration(Number.isFinite(video.duration) ? video.duration : 0)
    }

    sync()
    video.addEventListener('play', sync)
    video.addEventListener('pause', sync)
    video.addEventListener('timeupdate', sync)
    video.addEventListener('loadedmetadata', sync)
    video.addEventListener('durationchange', sync)
    video.addEventListener('ended', sync)

    return () => {
      video.removeEventListener('play', sync)
      video.removeEventListener('pause', sync)
      video.removeEventListener('timeupdate', sync)
      video.removeEventListener('loadedmetadata', sync)
      video.removeEventListener('durationchange', sync)
      video.removeEventListener('ended', sync)
    }
  }, [videoRef])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play().catch(() => {})
    else video.pause()
  }

  const seek = (event) => {
    const video = videoRef.current
    if (!video || !duration) return
    const next = (Number(event.target.value) / 100) * duration
    video.currentTime = next
    setCurrent(next)
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-3 pb-3 pt-10">
      <input
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={progress}
        onChange={seek}
        aria-label="Video ilerlemesi"
        className="mb-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-violet-400 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
      />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25"
            aria-label={playing ? 'Duraklat' : 'Oynat'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
          <span className="text-[11px] font-medium tabular-nums text-white/85">
            {formatVideoTime(current)} / {formatVideoTime(duration)}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25"
          aria-label={expanded ? collapseLabel : expandLabel}
        >
          {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

/** Oynatıcı üzerinde sabit marka logosu — tam ekranda da görünür kalır. */
function VideoWatermarkFrame({
  children,
  className = '',
  allowFullscreen = true,
  autoPlay = true,
  loop = true,
  useCustomControls = false,
}) {
  const frameRef = useRef(null)
  const videoRef = useRef(null)
  const usePseudoMode = useCustomControls && needsPseudoFullscreen()
  const [nativeFullscreen, setNativeFullscreen] = useState(false)
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false)
  const isExpanded = usePseudoMode ? pseudoFullscreen : nativeFullscreen

  const syncNativeFullscreen = useCallback(() => {
    if (usePseudoMode) return
    const el = frameRef.current
    const active = document.fullscreenElement === el
      || document.webkitFullscreenElement === el
    setNativeFullscreen(active)
  }, [usePseudoMode])

  useEffect(() => {
    if (usePseudoMode) return undefined
    document.addEventListener('fullscreenchange', syncNativeFullscreen)
    document.addEventListener('webkitfullscreenchange', syncNativeFullscreen)
    return () => {
      document.removeEventListener('fullscreenchange', syncNativeFullscreen)
      document.removeEventListener('webkitfullscreenchange', syncNativeFullscreen)
    }
  }, [syncNativeFullscreen, usePseudoMode])

  useEffect(() => {
    if (!pseudoFullscreen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [pseudoFullscreen])

  const enterNativeFullscreen = useCallback(async () => {
    const el = frameRef.current
    if (!el) return
    try {
      if (el.requestFullscreen) await el.requestFullscreen()
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
    } catch {
      /* kullanıcı iptal etmiş olabilir */
    }
  }, [])

  const exitNativeFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen()
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
    } catch {
      /* kullanıcı iptal etmiş olabilir */
    }
  }, [])

  const toggleExpand = useCallback(async () => {
    if (usePseudoMode) {
      setPseudoFullscreen((prev) => !prev)
      return
    }
    const el = frameRef.current
    if (!el) return
    const active = document.fullscreenElement === el
      || document.webkitFullscreenElement === el
    if (active) await exitNativeFullscreen()
    else await enterNativeFullscreen()
  }, [enterNativeFullscreen, exitNativeFullscreen, usePseudoMode])

  /** Masaüstü: native video tam ekranını engelle — logo kaybolmasın. */
  useEffect(() => {
    if (usePseudoMode) return undefined
    const frame = frameRef.current
    const video = videoRef.current
    if (!frame || !video) return undefined

    const redirectNativeVideoFullscreen = () => {
      const videoIsFs = document.fullscreenElement === video
        || document.webkitFullscreenElement === video
      if (!videoIsFs) return
      exitNativeFullscreen().finally(() => enterNativeFullscreen())
    }

    const onWebkitBeginFullscreen = (event) => {
      event.preventDefault?.()
      event.stopPropagation?.()
      enterNativeFullscreen()
    }

    const onDblClick = (event) => {
      event.preventDefault()
      event.stopPropagation()
      toggleExpand()
    }

    document.addEventListener('fullscreenchange', redirectNativeVideoFullscreen)
    document.addEventListener('webkitfullscreenchange', redirectNativeVideoFullscreen)
    video.addEventListener('webkitbeginfullscreen', onWebkitBeginFullscreen)
    video.addEventListener('dblclick', onDblClick)

    return () => {
      document.removeEventListener('fullscreenchange', redirectNativeVideoFullscreen)
      document.removeEventListener('webkitfullscreenchange', redirectNativeVideoFullscreen)
      video.removeEventListener('webkitbeginfullscreen', onWebkitBeginFullscreen)
      video.removeEventListener('dblclick', onDblClick)
    }
  }, [enterNativeFullscreen, exitNativeFullscreen, toggleExpand, usePseudoMode])

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
  }, [autoPlay, loop, useCustomControls])

  const mediaChild = isValidElement(children) && children.type === 'video'
    ? cloneElement(children, {
      ref: videoRef,
      autoPlay,
      loop,
      playsInline: true,
      controls: useCustomControls ? false : true,
      controlsList: useCustomControls
        ? undefined
        : 'nodownload nofullscreen noremoteplayback',
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

  const frameClassName = [
    'video-player-frame group relative aspect-video w-full overflow-hidden rounded-xl bg-black',
    usePseudoMode && pseudoFullscreen
      ? 'fixed inset-0 z-[9999] h-[100dvh] max-h-none w-screen max-w-none rounded-none'
      : '',
    !usePseudoMode && [
      '[&:fullscreen]:flex [&:fullscreen]:aspect-auto [&:fullscreen]:h-screen [&:fullscreen]:w-screen',
      '[&:fullscreen]:max-h-none [&:fullscreen]:max-w-none [&:fullscreen]:items-center [&:fullscreen]:justify-center',
      '[&:fullscreen]:rounded-none',
      '[-webkit-full-screen]:flex [-webkit-full-screen]:aspect-auto [-webkit-full-screen]:h-screen [-webkit-full-screen]:w-screen',
      '[-webkit-full-screen]:max-h-none [-webkit-full-screen]:max-w-none [-webkit-full-screen]:items-center [-webkit-full-screen]:justify-center',
      '[-webkit-full-screen]:rounded-none',
    ].join(' '),
    className,
  ].filter(Boolean).join(' ')

  const frame = (
    <div ref={frameRef} className={frameClassName}>
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
          isExpanded
            ? 'right-6 bottom-24 h-10 max-w-[36%] sm:h-12'
            : useCustomControls
              ? 'right-3 bottom-16 h-7 max-w-[42%] sm:h-8'
              : 'right-3 bottom-11 h-7 max-w-[42%] sm:h-8',
        ].join(' ')}
      />
      {useCustomControls ? (
        <VideoCustomControls
          videoRef={videoRef}
          expanded={isExpanded}
          onToggleExpand={toggleExpand}
          expandLabel="Tam ekran"
          collapseLabel="Tam ekrandan çık"
        />
      ) : allowFullscreen && (
        <button
          type="button"
          onClick={toggleExpand}
          className={[
            'absolute top-3 right-3 z-40 flex h-9 w-9 items-center justify-center rounded-lg',
            'bg-black/55 text-white/90 opacity-80 backdrop-blur-sm transition hover:bg-black/75 hover:opacity-100',
            'sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100',
            isExpanded && 'opacity-100',
          ].join(' ')}
          aria-label={isExpanded ? 'Tam ekrandan çık' : 'Tam ekran'}
        >
          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      )}
    </div>
  )

  if (usePseudoMode && pseudoFullscreen && typeof document !== 'undefined') {
    return createPortal(frame, document.body)
  }

  return frame
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
  const useCustomControls = needsPseudoFullscreen() && !yt

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

  const frameProps = { className, autoPlay, loop, useCustomControls }

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
      <VideoWatermarkFrame {...frameProps} useCustomControls={false}>
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
        <video src={playUrl} />
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
      <video src={url} />
    </VideoWatermarkFrame>
  )
}

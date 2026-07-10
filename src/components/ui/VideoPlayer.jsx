import { useCallback, useEffect, useRef, useState, cloneElement, isValidElement } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { Loader2, Maximize2, Minimize2, Pause, Play, VideoOff } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { normalizeExerciseVideoRef, isExerciseVideoStoragePath, getExerciseThumbUrl } from '../../services/supabaseDb'
import { readExerciseVideoUrlCache, invalidateExerciseVideoUrlCache } from '../../services/exerciseVideoUrlCache'
import { BRAND } from '../../config/brand'
import { lockAppScroll, unlockAppScroll } from '../../utils/scrollLock'
import {
  createPlayGuard,
  exerciseVideoPreload,
  exitIosNativeVideoFullscreen,
  isIosDevice,
  needsPseudoFullscreen,
  recoverIosVideoPlayback,
  shouldAttemptAutoplay,
  MEDIA_ERR_DECODE,
  MEDIA_ERR_NETWORK,
  MEDIA_ERR_SRC_NOT_SUPPORTED,
  STALL_ESCALATE_MS,
  PROGRESS_STALL_MS,
  HEALTHY_PLAYBACK_RESET_MS,
  RECOVERY_BACKOFF_MS,
  MAX_AUTO_RECOVERIES,
} from '../../utils/videoPlayerPlatform'

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

function videoMimeFromUrl(url) {
  if (/\.mov(\?|$)/i.test(String(url || ''))) return 'video/quicktime'
  return 'video/mp4'
}

function releaseVideoElement(video) {
  if (!video) return
  try {
    video.pause()
  } catch { /* ignore */ }
  video.removeAttribute('src')
  while (video.firstChild) video.removeChild(video.firstChild)
  try {
    video.load()
  } catch { /* ignore */ }
}

function VideoCustomControls({
  videoRef,
  playGuardRef,
  expanded,
  onToggleExpand,
  expandLabel,
  collapseLabel,
  autoplayBlocked,
  onUserPlay,
  buffering,
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

  const togglePlay = async () => {
    const video = videoRef.current
    if (!video) return
    const guard = playGuardRef.current
    if (video.paused) {
      const ok = await recoverIosVideoPlayback(video, guard)
      if (!ok) await guard.play(video)
      onUserPlay?.()
    } else {
      guard.pause(video)
    }
  }

  const seek = (event) => {
    const video = videoRef.current
    if (!video || !duration) return
    const next = (Number(event.target.value) / 100) * duration
    video.currentTime = next
    setCurrent(next)
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0
  const showCenterPlay = autoplayBlocked || (!playing && (isIosDevice() || duration === 0))
  const valueText = `${formatVideoTime(current)} / ${formatVideoTime(duration)}`

  return (
    <>
      {showCenterPlay && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/25"
          aria-label="Videoyu oynat"
        >
          <span className="flex h-16 w-16 min-h-16 min-w-16 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
            {buffering ? <Loader2 className="h-8 w-8 animate-spin" /> : <Play className="ml-1 h-8 w-8" />}
          </span>
        </button>
      )}
      <div
        className="absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-3 pt-10"
        style={{
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
          paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
        }}
      >
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={progress}
          onChange={seek}
          aria-label="Video ilerlemesi"
          aria-valuetext={valueText}
          className="mb-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-violet-400 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25"
              aria-label={playing ? 'Duraklat' : 'Oynat'}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </button>
            <span className="text-[11px] font-medium tabular-nums text-white/85">
              {valueText}
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25"
            aria-label={expanded ? collapseLabel : expandLabel}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </>
  )
}

/** Oynatıcı üzerinde sabit marka logosu — tam ekranda da görünür kalır. */
function VideoWatermarkFrame({
  children = null,
  className = '',
  allowFullscreen = true,
  autoPlay = true,
  loop = true,
  useCustomControls = false,
  title = '',
  mediaKey = '',
  videoSrc = null,
  videoPoster = null,
  videoPreload = 'metadata',
  videoMime = 'video/mp4',
  restoreTime = null,
  onRestoreTimeConsumed,
  onRequestNetworkRecover,
  onPermanentError,
  bufferingExternal = false,
  offlineHint = false,
  liveMessage = '',
}) {
  const frameRef = useRef(null)
  const videoRef = useRef(null)
  const playGuardRef = useRef(createPlayGuard())
  const expandBtnRef = useRef(null)
  const iosExpandFallbackTimerRef = useRef(null)
  const decodeRetryRef = useRef(0)
  const healthyTimerRef = useRef(null)
  const stallTimerRef = useRef(null)
  const progressStallRef = useRef({ t: 0, at: 0 })
  const recoveringRef = useRef(false)
  /** Portal enter/exit öncesi currentTime + play; DOM taşıması sonrası restore. */
  const pseudoFsRestoreRef = useRef(null)
  const pseudoFullscreenRef = useRef(false)
  const attemptAutoplay = shouldAttemptAutoplay(autoPlay)

  const useIosNativeExpand = useCustomControls && isIosDevice()
  const usePseudoMode = useCustomControls && needsPseudoFullscreen()
  const [nativeFullscreen, setNativeFullscreen] = useState(false)
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false)
  const [iosNativeVideoFs, setIosNativeVideoFs] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(() => !attemptAutoplay && Boolean(autoPlay))
  const [buffering, setBuffering] = useState(false)
  const [announce, setAnnounce] = useState('')

  const isExpanded = useIosNativeExpand
    ? (iosNativeVideoFs || pseudoFullscreen)
    : usePseudoMode
      ? pseudoFullscreen
      : nativeFullscreen
  const showPseudoOverlay = pseudoFullscreen && (usePseudoMode || useIosNativeExpand)

  const liveAnnounce = liveMessage || announce

  const clearStallWatchdog = useCallback(() => {
    clearTimeout(stallTimerRef.current)
    stallTimerRef.current = null
  }, [])

  const requestRecover = useCallback(async (reason) => {
    const video = videoRef.current
    if (!video || recoveringRef.current) return
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
    if (!onRequestNetworkRecover) return

    recoveringRef.current = true
    clearStallWatchdog()
    setBuffering(true)
    setAnnounce('Bağlantı sorunu, yeniden deneniyor')
    const t = video.currentTime || 0
    try {
      await onRequestNetworkRecover({ reason, currentTime: t })
    } finally {
      recoveringRef.current = false
    }
  }, [clearStallWatchdog, onRequestNetworkRecover])

  const startStallWatchdog = useCallback(() => {
    clearStallWatchdog()
    setBuffering(true)
    stallTimerRef.current = setTimeout(() => {
      requestRecover('stall')
    }, STALL_ESCALATE_MS)
  }, [clearStallWatchdog, requestRecover])

  const syncNativeFullscreen = useCallback(() => {
    if (usePseudoMode || useIosNativeExpand) return
    const el = frameRef.current
    const active = document.fullscreenElement === el
      || document.webkitFullscreenElement === el
    setNativeFullscreen(active)
  }, [usePseudoMode, useIosNativeExpand])

  useEffect(() => {
    if (usePseudoMode || useIosNativeExpand) return undefined
    document.addEventListener('fullscreenchange', syncNativeFullscreen)
    document.addEventListener('webkitfullscreenchange', syncNativeFullscreen)
    return () => {
      document.removeEventListener('fullscreenchange', syncNativeFullscreen)
      document.removeEventListener('webkitfullscreenchange', syncNativeFullscreen)
    }
  }, [syncNativeFullscreen, usePseudoMode, useIosNativeExpand])

  useEffect(() => {
    if (!pseudoFullscreen) return undefined
    lockAppScroll()
    const frame = frameRef.current
    const prevFocus = document.activeElement
    const expandBtn = expandBtnRef.current
    frame?.focus?.({ preventScroll: true })
    return () => {
      unlockAppScroll()
      if (prevFocus && typeof prevFocus.focus === 'function') {
        try { prevFocus.focus({ preventScroll: true }) } catch { /* ignore */ }
      } else {
        expandBtn?.focus?.({ preventScroll: true })
      }
    }
  }, [pseudoFullscreen])

  const enterNativeFullscreen = useCallback(async () => {
    const el = frameRef.current
    if (!el) return
    try {
      if (el.requestFullscreen) await el.requestFullscreen()
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
      try {
        if (typeof screen !== 'undefined' && screen.orientation?.lock) {
          await screen.orientation.lock('landscape')
        }
      } catch { /* best-effort */ }
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

  const clearIosExpandFallback = useCallback(() => {
    if (iosExpandFallbackTimerRef.current != null) {
      window.clearTimeout(iosExpandFallbackTimerRef.current)
      iosExpandFallbackTimerRef.current = null
    }
  }, [])

  const applyPseudoFsRestore = useCallback((video, snapshot) => {
    if (!video || !snapshot) return
    if (snapshot.time > 0 && Number.isFinite(snapshot.time)) {
      try { video.currentTime = snapshot.time } catch { /* ignore */ }
    }
    if (snapshot.wasPlaying) {
      video.muted = true
      void playGuardRef.current.play(video).then((result) => {
        if (!result?.ok) {
          void recoverIosVideoPlayback(video, playGuardRef.current)
        }
      })
    } else if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
      video.load()
    }
  }, [])

  /**
   * Pseudo FS aç/kapa.
   * flushSync: portal DOM taşıması aynı jest turunda bitsin → iOS muted play izni korunur.
   * (Safari video'yu reparent edince sıfırlar; effect/rAF jesti kaçırır → siyah/kayıp ekran.)
   */
  const transitionPseudoFullscreen = useCallback((next) => {
    if (pseudoFullscreenRef.current === next) return
    const video = videoRef.current
    const snapshot = video
      ? {
        time: video.currentTime || 0,
        wasPlaying: !video.paused && !video.ended,
      }
      : null
    pseudoFsRestoreRef.current = snapshot
    pseudoFullscreenRef.current = next
    flushSync(() => {
      setPseudoFullscreen(next)
    })
    applyPseudoFsRestore(videoRef.current, snapshot)
    pseudoFsRestoreRef.current = null
  }, [applyPseudoFsRestore])

  const toggleExpand = useCallback(async () => {
    const video = videoRef.current

    if (useIosNativeExpand) {
      // Çıkış: native veya pseudo
      if (iosNativeVideoFs) {
        clearIosExpandFallback()
        exitIosNativeVideoFullscreen(video)
        return
      }
      if (pseudoFullscreen) {
        clearIosExpandFallback()
        transitionPseudoFullscreen(false)
        return
      }

      // iOS Pro Max / modal: webkitEnterFullscreen inline videoyu alıp native UI
      // göstermeden "yutabiliyor". Watermark + custom controls için doğrudan pseudo.
      clearIosExpandFallback()
      transitionPseudoFullscreen(true)
      return
    }

    if (usePseudoMode) {
      transitionPseudoFullscreen(!pseudoFullscreenRef.current)
      return
    }
    const el = frameRef.current
    if (!el) return
    const active = document.fullscreenElement === el
      || document.webkitFullscreenElement === el
    if (active) await exitNativeFullscreen()
    else await enterNativeFullscreen()
  }, [
    clearIosExpandFallback,
    enterNativeFullscreen,
    exitNativeFullscreen,
    iosNativeVideoFs,
    pseudoFullscreen,
    transitionPseudoFullscreen,
    useIosNativeExpand,
    usePseudoMode,
  ])

  useEffect(() => {
    if (!useIosNativeExpand) return undefined
    const video = videoRef.current
    if (!video) return undefined

    const onBegin = () => {
      clearIosExpandFallback()
      // Native FS açıldı — pseudo'ya düşme; restore gerekmez (aynı video elemanı).
      pseudoFsRestoreRef.current = null
      pseudoFullscreenRef.current = false
      setPseudoFullscreen(false)
      setIosNativeVideoFs(true)
    }
    const onEnd = () => {
      clearIosExpandFallback()
      setIosNativeVideoFs(false)
    }

    video.addEventListener('webkitbeginfullscreen', onBegin)
    video.addEventListener('webkitendfullscreen', onEnd)

    return () => {
      clearIosExpandFallback()
      video.removeEventListener('webkitbeginfullscreen', onBegin)
      video.removeEventListener('webkitendfullscreen', onEnd)
    }
  }, [clearIosExpandFallback, useIosNativeExpand, useCustomControls])

  /** Pseudo portal enter + exit yedek restore (flushSync kaçarsa). */
  useEffect(() => {
    pseudoFullscreenRef.current = pseudoFullscreen
    const pending = pseudoFsRestoreRef.current
    if (!pending) return undefined
    const video = videoRef.current
    if (!video) return undefined

    const snapshot = pending
    pseudoFsRestoreRef.current = null
    let cancelled = false

    const restore = () => {
      if (cancelled) return
      applyPseudoFsRestore(video, snapshot)
    }

    requestAnimationFrame(() => requestAnimationFrame(restore))
    return () => { cancelled = true }
  }, [applyPseudoFsRestore, pseudoFullscreen])

  useEffect(() => {
    if (usePseudoMode || useIosNativeExpand) return undefined
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
  }, [enterNativeFullscreen, exitNativeFullscreen, toggleExpand, usePseudoMode, useIosNativeExpand])

  /** muted + webkit-playsinline + teardown (§2.2 / §3.1 / §4.4) */
  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined
    video.muted = true
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    decodeRetryRef.current = 0
    return () => {
      clearStallWatchdog()
      clearTimeout(healthyTimerRef.current)
      releaseVideoElement(video)
    }
  }, [clearStallWatchdog, mediaKey])

  /** Restore seek after signed-URL remount */
  useEffect(() => {
    const video = videoRef.current
    if (!video || restoreTime == null || !Number.isFinite(restoreTime)) return undefined
    const apply = () => {
      try { video.currentTime = restoreTime } catch { /* ignore */ }
      onRestoreTimeConsumed?.()
      playGuardRef.current.play(video).then((r) => {
        if (r.reason === 'blocked') setAutoplayBlocked(true)
        else if (r.ok) setAutoplayBlocked(false)
      })
    }
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) apply()
    else {
      video.addEventListener('loadedmetadata', apply, { once: true })
      return () => video.removeEventListener('loadedmetadata', apply)
    }
    return undefined
  }, [restoreTime, onRestoreTimeConsumed, mediaKey])

  /** Attempt-then-fallback autoplay + loop (§2.2) */
  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined
    const guard = playGuardRef.current

    const tryAutoplay = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      if (!shouldAttemptAutoplay(autoPlay)) {
        setAutoplayBlocked(Boolean(autoPlay))
        return
      }
      video.muted = true
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return
      const result = await guard.play(video)
      if (result.ok) {
        setAutoplayBlocked(false)
        setAnnounce('')
      } else if (result.reason === 'blocked' || result.reason === 'paused-after') {
        setAutoplayBlocked(true)
      } else if (result.reason === 'unsupported') {
        onPermanentError?.('unsupported')
      }
    }

    if (attemptAutoplay) {
      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        queueMicrotask(() => { tryAutoplay() })
      }
      video.addEventListener('canplay', tryAutoplay)
    }

    const onEnded = async () => {
      if (!loop) return
      video.currentTime = 0
      const result = await guard.play(video)
      if (result.reason === 'blocked') setAutoplayBlocked(true)
    }
    video.addEventListener('ended', onEnded)

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && attemptAutoplay && video.paused) {
        tryAutoplay()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      video.removeEventListener('canplay', tryAutoplay)
      video.removeEventListener('ended', onEnded)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [autoPlay, loop, attemptAutoplay, onPermanentError, mediaKey])

  /** iOS suspend-before-metadata prime + stall/network listeners (§4.2) */
  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined

    let debounceId = null
    const prime = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return
      clearTimeout(debounceId)
      debounceId = setTimeout(() => {
        if (video.readyState < HTMLMediaElement.HAVE_METADATA) video.load()
      }, 400)
    }

    const onWaiting = () => startStallWatchdog()
    const onPlaying = () => {
      clearStallWatchdog()
      setBuffering(false)
      setAnnounce('')
      clearTimeout(healthyTimerRef.current)
      healthyTimerRef.current = setTimeout(() => {}, HEALTHY_PLAYBACK_RESET_MS)
    }
    const onCanPlay = () => {
      clearStallWatchdog()
      setBuffering(false)
    }
    const onStalled = () => {
      if (isIosDevice() && video.readyState < HTMLMediaElement.HAVE_METADATA) {
        prime()
        return
      }
      if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) startStallWatchdog()
    }
    const onSuspend = () => {
      if (isIosDevice()) prime()
    }
    const onProgress = () => {
      progressStallRef.current = { t: video.currentTime, at: Date.now() }
    }
    const onTimeUpdate = () => {
      if (video.paused) return
      const prev = progressStallRef.current
      const now = Date.now()
      if (prev.t === video.currentTime && now - prev.at >= PROGRESS_STALL_MS) {
        startStallWatchdog()
        progressStallRef.current = { t: video.currentTime, at: now }
      } else if (prev.t !== video.currentTime) {
        progressStallRef.current = { t: video.currentTime, at: now }
        clearStallWatchdog()
      }
    }
    const onEmptied = () => {
      clearStallWatchdog()
      setBuffering(false)
    }

    const handleMediaError = async () => {
      const code = video.error?.code
      if (code === MEDIA_ERR_SRC_NOT_SUPPORTED) {
        onPermanentError?.('unsupported')
        setAnnounce('Video oynatılamadı')
        return
      }
      if (code === MEDIA_ERR_DECODE) {
        if (decodeRetryRef.current < 1) {
          decodeRetryRef.current += 1
          video.load()
          return
        }
        onPermanentError?.('decode')
        setAnnounce('Video oynatılamadı')
        return
      }
      if (code === MEDIA_ERR_NETWORK || code == null) {
        await requestRecover('error')
      }
    }

    const onOffline = () => {
      clearStallWatchdog()
      setAnnounce('Bağlantı koptu')
    }
    const onOnline = () => {
      requestRecover('online')
    }

    video.addEventListener('waiting', onWaiting)
    video.addEventListener('playing', onPlaying)
    video.addEventListener('canplay', onCanPlay)
    video.addEventListener('stalled', onStalled)
    video.addEventListener('suspend', onSuspend)
    video.addEventListener('progress', onProgress)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('error', handleMediaError)
    video.addEventListener('emptied', onEmptied)
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)

    return () => {
      clearTimeout(debounceId)
      clearStallWatchdog()
      clearTimeout(healthyTimerRef.current)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('stalled', onStalled)
      video.removeEventListener('suspend', onSuspend)
      video.removeEventListener('progress', onProgress)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('error', handleMediaError)
      video.removeEventListener('emptied', onEmptied)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
    }
  }, [startStallWatchdog, clearStallWatchdog, requestRecover, onPermanentError, mediaKey])

  /** Keyboard (§5.1) — custom controls; Escape always exits pseudo FS */
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && pseudoFullscreen) {
        event.preventDefault()
        transitionPseudoFullscreen(false)
        return
      }
      if (!useCustomControls) return
      const frame = frameRef.current
      if (!frame || !frame.contains(event.target)) return
      if (event.target?.closest?.('input, textarea, select')) return

      const video = videoRef.current
      if (!video) return
      const guard = playGuardRef.current
      const key = event.key

      if (key === ' ' || key === 'k' || key === 'K') {
        event.preventDefault()
        if (video.paused) {
          recoverIosVideoPlayback(video, guard).then(() => setAutoplayBlocked(false))
        } else {
          guard.pause(video)
          setAnnounce('Video duraklatıldı')
        }
        return
      }
      if (key === 'ArrowLeft') {
        event.preventDefault()
        video.currentTime = Math.max(0, video.currentTime - 5)
        return
      }
      if (key === 'ArrowRight') {
        event.preventDefault()
        video.currentTime = Math.min(video.duration || 0, video.currentTime + 5)
        return
      }
      if (key === 'Home') {
        event.preventDefault()
        video.currentTime = 0
        return
      }
      if (key === 'End') {
        event.preventDefault()
        if (Number.isFinite(video.duration)) video.currentTime = video.duration
        return
      }
      if (key === 'f' || key === 'F') {
        event.preventDefault()
        toggleExpand()
        return
      }
      if (key === 'm' || key === 'M') {
        event.preventDefault()
        video.muted = !video.muted
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [useCustomControls, pseudoFullscreen, toggleExpand, transitionPseudoFullscreen])

  /** Pseudo-fullscreen Tab trap (§5.3) */
  useEffect(() => {
    if (!showPseudoOverlay) return undefined
    const frame = frameRef.current
    if (!frame) return undefined
    const onTab = (event) => {
      if (event.key !== 'Tab') return
      const focusables = frame.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    frame.addEventListener('keydown', onTab)
    return () => frame.removeEventListener('keydown', onTab)
  }, [showPseudoOverlay])

  const handleUserPlay = useCallback(() => {
    setAutoplayBlocked(false)
    setAnnounce('')
  }, [])

  const handleBlockedOverlayPlay = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    const ok = await recoverIosVideoPlayback(video, playGuardRef.current)
    if (ok) handleUserPlay()
  }, [handleUserPlay])

  const onSourceError = useCallback(() => {
    const video = videoRef.current
    const code = video?.error?.code
    if (code === MEDIA_ERR_SRC_NOT_SUPPORTED || code == null) {
      if (code === MEDIA_ERR_SRC_NOT_SUPPORTED) {
        onPermanentError?.('unsupported')
        setAnnounce('Video oynatılamadı')
        return
      }
      requestRecover('source-error')
    }
  }, [onPermanentError, requestRecover])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoSrc) return undefined
    const sources = [...video.querySelectorAll('source')]
    sources.forEach((source) => source.addEventListener('error', onSourceError))
    return () => {
      sources.forEach((source) => source.removeEventListener('error', onSourceError))
    }
  }, [mediaKey, videoSrc, onSourceError])

  const mediaChild = children == null
    ? (
      <video
        ref={videoRef}
        key={mediaKey || videoSrc || 'empty'}
        poster={videoPoster || undefined}
        preload={videoPreload}
        autoPlay={attemptAutoplay}
        muted
        loop={loop}
        playsInline
        controls={!useCustomControls}
        controlsList={useCustomControls ? undefined : 'nodownload nofullscreen noremoteplayback'}
        disablePictureInPicture
        disableRemotePlayback
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        className="border-0 touch-pan-y"
      >
        {videoSrc ? <source src={videoSrc} type={videoMime} /> : null}
      </video>
    )
    : isValidElement(children) && children.type === 'iframe'
      ? cloneElement(children, {
        allowFullScreen: false,
        className: [children.props.className, 'border-0'].filter(Boolean).join(' '),
      })
      : children

  const frameClassName = [
    'video-player-frame group relative overflow-hidden rounded-xl bg-black',
    !showPseudoOverlay && 'aspect-video w-full',
    showPseudoOverlay
      ? 'video-player-pseudo-fullscreen fixed inset-0 z-[100000] flex h-[100dvh] w-screen max-w-none flex-col rounded-none'
      : '',
    !usePseudoMode && !useIosNativeExpand && [
      '[&:fullscreen]:flex [&:fullscreen]:aspect-auto [&:fullscreen]:h-screen [&:fullscreen]:w-screen',
      '[&:fullscreen]:max-h-none [&:fullscreen]:max-w-none [&:fullscreen]:items-center [&:fullscreen]:justify-center',
      '[&:fullscreen]:rounded-none',
      '[-webkit-full-screen]:flex [-webkit-full-screen]:aspect-auto [-webkit-full-screen]:h-screen [-webkit-full-screen]:w-screen',
      '[-webkit-full-screen]:max-h-none [-webkit-full-screen]:max-w-none [-webkit-full-screen]:items-center [-webkit-full-screen]:justify-center',
      '[-webkit-full-screen]:rounded-none',
    ].join(' '),
    className,
  ].filter(Boolean).join(' ')

  const mediaShellClass = showPseudoOverlay
    ? 'video-player-media relative z-0 min-h-0 flex-1 [&>iframe]:h-full [&>iframe]:w-full [&>video]:h-full [&>video]:w-full [&>video]:object-contain'
    : 'absolute inset-0 z-0 [&>iframe]:h-full [&>iframe]:w-full [&>video]:h-full [&>video]:w-full [&>video]:object-contain'

  const showBlockedOverlay = autoplayBlocked && !useCustomControls
  const showBuffering = buffering || bufferingExternal

  const ariaLabel = title
    ? `${title} video oynatıcı`
    : 'Egzersiz video oynatıcı'

  const frame = (
    <div
      ref={frameRef}
      className={frameClassName}
      onContextMenu={(e) => e.preventDefault()}
      role="region"
      aria-label={ariaLabel}
      tabIndex={useCustomControls || showPseudoOverlay ? 0 : undefined}
    >
      <div className={mediaShellClass}>
        {mediaChild}
      </div>
      <span className="sr-only" aria-live="polite">{liveAnnounce}</span>
      {offlineHint && (
        <span className="pointer-events-none absolute top-3 left-3 z-40 rounded-md bg-black/70 px-2 py-1 text-[11px] text-white/90">
          Bağlantı koptu
        </span>
      )}
      {showBuffering && !showBlockedOverlay && (
        <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/70" />
        </span>
      )}
      {showBlockedOverlay && (
        <button
          type="button"
          onClick={handleBlockedOverlayPlay}
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/25"
          aria-label="Videoyu oynat"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
            <Play className="ml-1 h-8 w-8" />
          </span>
        </button>
      )}
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
          playGuardRef={playGuardRef}
          expanded={isExpanded}
          onToggleExpand={toggleExpand}
          expandLabel="Tam ekran"
          collapseLabel="Tam ekrandan çık"
          autoplayBlocked={autoplayBlocked}
          onUserPlay={handleUserPlay}
          buffering={showBuffering}
        />
      ) : allowFullscreen && (
        <button
          ref={expandBtnRef}
          type="button"
          onClick={toggleExpand}
          className={[
            'absolute top-3 right-3 z-40 flex h-11 w-11 items-center justify-center rounded-lg',
            'bg-black/55 text-white/90 opacity-80 backdrop-blur-sm transition hover:bg-black/75 hover:opacity-100',
            'sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100',
            isExpanded ? 'opacity-100' : '',
          ].filter(Boolean).join(' ')}
          aria-label={isExpanded ? 'Tam ekrandan çık' : 'Tam ekran'}
        >
          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      )}
    </div>
  )

  if (showPseudoOverlay && typeof document !== 'undefined') {
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
  title = '',
}) {
  const { getExerciseVideoUrl } = useApp()

  const yt = url ? youTubeId(url) : null
  const storagePath = url && !yt ? resolveStoragePath(url) : null
  // iOS: custom controls + webkitEnterFullscreen; pseudo-FS cihazlar: portal
  const useCustomControls = Boolean(!yt && (needsPseudoFullscreen() || isIosDevice()))

  const cachedUrl = storagePath && !videoPending ? readExerciseVideoUrlCache(storagePath) : null
  const [playUrl, setPlayUrl] = useState(cachedUrl)
  const [loading, setLoading] = useState(Boolean(storagePath && !videoPending && !cachedUrl))
  const [loadError, setLoadError] = useState(false)
  const [playbackFailed, setPlaybackFailed] = useState(false)
  const [restoreTime, setRestoreTime] = useState(null)
  const [offlineHint, setOfflineHint] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false)
  const [liveMessage, setLiveMessage] = useState('')
  const recoveryCountRef = useRef(0)
  const healthyResetRef = useRef(null)

  useEffect(() => {
    const onOff = () => {
      setOfflineHint(true)
      setLiveMessage('Bağlantı koptu')
    }
    const onOn = () => setOfflineHint(false)
    window.addEventListener('offline', onOff)
    window.addEventListener('online', onOn)
    return () => {
      window.removeEventListener('offline', onOff)
      window.removeEventListener('online', onOn)
    }
  }, [])

  const pathKey = storagePath || ''
  const pathRef = useRef(pathKey)
  useEffect(() => {
    pathRef.current = pathKey
  }, [pathKey])
  const fetchUrl = useCallback((path) => getExerciseVideoUrl(path), [getExerciseVideoUrl])

  useEffect(() => {
    let cancelled = false

    const apply = (fn) => {
      queueMicrotask(() => {
        if (!cancelled) fn()
      })
    }

    if (!pathKey || videoPending) {
      apply(() => {
        setPlayUrl(null)
        setLoadError(false)
        setLoading(false)
        setPlaybackFailed(false)
        recoveryCountRef.current = 0
      })
      return () => { cancelled = true }
    }

    const fromCache = readExerciseVideoUrlCache(pathKey)
    if (fromCache) {
      apply(() => {
        setPlayUrl(fromCache)
        setLoading(false)
        setLoadError(false)
      })
      return () => { cancelled = true }
    }

    apply(() => {
      setLoading(true)
      setLoadError(false)
      setLiveMessage('Video yükleniyor')
    })
    fetchUrl(pathKey).then((signedUrl) => {
      if (cancelled) return
      setPlayUrl(signedUrl)
      setLoading(false)
      setLoadError(!signedUrl)
      if (!signedUrl) setLiveMessage('Video oynatılamadı')
      else setLiveMessage('')
    })
    return () => { cancelled = true }
  }, [pathKey, fetchUrl, videoPending])

  const handleNetworkRecover = useCallback(async ({ currentTime }) => {
    const path = pathRef.current
    if (!path) return false
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false

    if (recoveryCountRef.current >= MAX_AUTO_RECOVERIES) {
      setPlaybackFailed(true)
      setLiveMessage('Video oynatılamadı')
      return false
    }

    const attempt = recoveryCountRef.current
    recoveryCountRef.current += 1
    const backoff = RECOVERY_BACKOFF_MS[Math.min(attempt, RECOVERY_BACKOFF_MS.length - 1)] || 1000
    setLiveMessage('Bağlantı sorunu, yeniden deneniyor')
    await new Promise((r) => setTimeout(r, backoff))

    invalidateExerciseVideoUrlCache(path)
    const signed = await fetchUrl(path)
    if (!signed) {
      setPlaybackFailed(true)
      setLoadError(true)
      setLiveMessage('Video oynatılamadı')
      return false
    }

    setRestoreTime(Number.isFinite(currentTime) ? currentTime : 0)
    setPlayUrl(signed)
    setPlaybackFailed(false)
    setLoadError(false)

    clearTimeout(healthyResetRef.current)
    healthyResetRef.current = setTimeout(() => {
      recoveryCountRef.current = 0
    }, HEALTHY_PLAYBACK_RESET_MS)

    return true
  }, [fetchUrl])

  const handlePermanentError = useCallback(() => {
    setPlaybackFailed(true)
    setLiveMessage('Video oynatılamadı')
  }, [])

  const handleManualRetry = useCallback(() => {
    const path = pathRef.current
    recoveryCountRef.current = 0
    setPlaybackFailed(false)
    setLoadError(false)
    setLiveMessage('Video yükleniyor')
    if (!path) return
    invalidateExerciseVideoUrlCache(path)
    setLoading(true)
    fetchUrl(path).then((signedUrl) => {
      setPlayUrl(signedUrl)
      setLoading(false)
      setLoadError(!signedUrl)
      if (signedUrl) setLiveMessage('')
      else setLiveMessage('Video oynatılamadı')
    })
  }, [fetchUrl])

  const posterUrl = storagePath ? getExerciseThumbUrl(url) : null
  const effectiveAutoPlay = shouldAttemptAutoplay(autoPlay)
  const frameProps = {
    className: '',
    autoPlay,
    loop,
    useCustomControls,
    title,
    mediaKey: playUrl || '',
    videoSrc: playUrl,
    videoPoster: posterUrl,
    videoPreload: playUrl ? exerciseVideoPreload(effectiveAutoPlay) : 'none',
    videoMime: videoMimeFromUrl(playUrl || url),
    restoreTime,
    onRestoreTimeConsumed: () => setRestoreTime(null),
    onRequestNetworkRecover: storagePath ? handleNetworkRecover : undefined,
    onPermanentError: handlePermanentError,
    bufferingExternal: loading,
    offlineHint,
    liveMessage,
  }

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
      <VideoWatermarkFrame className={className} autoPlay={autoPlay} loop={loop} useCustomControls={false} title={title}>
        <iframe
          title={title || 'Egzersiz videosu'}
          src={youTubeEmbedSrc(yt, { autoPlay: shouldAttemptAutoplay(autoPlay), loop })}
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
    if ((loadError && !playUrl) || playbackFailed) {
      return (
        <div className={`flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-cream-100 text-cream-800/50 ${className}`}>
          <VideoOff className="h-8 w-8" />
          <span className="text-xs text-center px-4">
            Video oynatılamadı — oturumunuzun açık olduğundan emin olun
          </span>
          <button
            type="button"
            onClick={handleManualRetry}
            className="mt-1 rounded-lg bg-cream-200 px-3 py-1.5 text-xs font-medium text-cream-900 hover:bg-cream-300"
          >
            Tekrar dene
          </button>
        </div>
      )
    }

    return (
      <div className={`relative ${className}`}>
        <VideoWatermarkFrame {...frameProps} />
      </div>
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
    <VideoWatermarkFrame
      className={className}
      autoPlay={autoPlay}
      loop={loop}
      useCustomControls={useCustomControls}
      title={title}
      mediaKey={url}
      videoSrc={url}
      videoPreload={exerciseVideoPreload(shouldAttemptAutoplay(autoPlay))}
      videoMime={videoMimeFromUrl(url)}
    />
  )
}

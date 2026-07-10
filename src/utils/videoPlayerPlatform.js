/** iPhone/iPad Safari — div Fullscreen API desteklemez; pseudo-fullscreen gerekir. */
export function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function supportsElementFullscreen() {
  if (typeof document === 'undefined') return false
  const probe = document.createElement('div')
  return Boolean(probe.requestFullscreen || probe.webkitRequestFullscreen)
}

/** iOS Safari: video.webkitEnterFullscreen() — modal transform içinde de çalışır. */
export function canUseIosNativeVideoFullscreen(video) {
  return isIosDevice() && Boolean(video && typeof video.webkitEnterFullscreen === 'function')
}

/** Android / eski tarayıcılar: viewport kaplama modu (iOS hariç). */
export function needsPseudoFullscreen() {
  return !isIosDevice() && !supportsElementFullscreen()
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Chrome/Android Data Saver — API yoksa sinyal yok (false). */
export function prefersSaveData() {
  if (typeof navigator === 'undefined') return false
  return navigator.connection?.saveData === true
}

/**
 * Autoplay denensin mi? Platform tahmini yok — reduced-motion / saveData hariç prop'a uyar.
 * Gerçek blok: play() NotAllowedError veya resolved-but-paused (§2.2).
 */
export function shouldAttemptAutoplay(autoPlayProp = true) {
  if (!autoPlayProp) return false
  if (prefersReducedMotion()) return false
  if (prefersSaveData()) return false
  return true
}

/** @deprecated use shouldAttemptAutoplay — geriye uyumluluk */
export function shouldAutoplayExerciseVideo() {
  return shouldAttemptAutoplay(true)
}

/** iOS → metadata; saveData → none; masaüstü autoplay → auto. */
export function exerciseVideoPreload(autoPlay) {
  if (prefersSaveData()) return 'none'
  if (isIosDevice()) return 'metadata'
  return autoPlay ? 'auto' : 'metadata'
}

/**
 * play()/pause() promise guard — pending play sırasında pause çağırma (AbortError / Chrome wedge).
 * @returns {{ play: (video: HTMLVideoElement) => Promise<{ ok: boolean, reason?: string }>, pause: (video: HTMLVideoElement) => void }}
 */
export function createPlayGuard() {
  let pending = null
  let pauseQueued = false

  return {
    async play(video) {
      if (!video) return { ok: false, reason: 'missing' }
      pauseQueued = false
      let p
      try {
        p = video.play()
      } catch (err) {
        const name = err?.name || ''
        if (name === 'NotAllowedError') return { ok: false, reason: 'blocked' }
        if (name === 'NotSupportedError') return { ok: false, reason: 'unsupported' }
        return { ok: false, reason: 'error' }
      }
      if (!p || typeof p.then !== 'function') {
        return { ok: !video.paused, reason: video.paused ? 'blocked' : undefined }
      }
      pending = p
      try {
        await p
        pending = null
        if (pauseQueued) {
          pauseQueued = false
          video.pause()
          return { ok: false, reason: 'paused-after' }
        }
        if (video.paused) return { ok: false, reason: 'blocked' }
        return { ok: true }
      } catch (err) {
        pending = null
        if (pauseQueued) pauseQueued = false
        const name = err?.name || ''
        if (name === 'AbortError') return { ok: false, reason: 'abort' }
        if (name === 'NotAllowedError') return { ok: false, reason: 'blocked' }
        if (name === 'NotSupportedError') return { ok: false, reason: 'unsupported' }
        return { ok: false, reason: 'error' }
      }
    },
    pause(video) {
      if (!video) return
      if (pending) {
        pauseQueued = true
        return
      }
      video.pause()
    },
  }
}

/** Safari askıya alınmış / takılmış videoyu kullanıcı jestiyle kurtarmayı dener. */
export async function recoverIosVideoPlayback(video, playGuard) {
  if (!video) return false
  const guard = playGuard || createPlayGuard()
  try {
    if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
      video.load()
      await new Promise((resolve) => {
        const onMeta = () => {
          video.removeEventListener('loadedmetadata', onMeta)
          resolve()
        }
        video.addEventListener('loadedmetadata', onMeta)
        setTimeout(onMeta, 4000)
      })
    }
    const result = await guard.play(video)
    return result.ok
  } catch {
    try {
      video.load()
      const result = await guard.play(video)
      return result.ok
    } catch {
      return false
    }
  }
}

export const MEDIA_ERR_ABORTED = 1
export const MEDIA_ERR_NETWORK = 2
export const MEDIA_ERR_DECODE = 3
export const MEDIA_ERR_SRC_NOT_SUPPORTED = 4

export const STALL_ESCALATE_MS = 10_000
export const PROGRESS_STALL_MS = 3_000
export const HEALTHY_PLAYBACK_RESET_MS = 30_000
export const RECOVERY_BACKOFF_MS = [1_000, 4_000]
export const MAX_AUTO_RECOVERIES = 2

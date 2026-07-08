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

/** Native video kontrolleri yerine özel UI + viewport kaplama modu. */
export function needsPseudoFullscreen() {
  return isIosDevice() || !supportsElementFullscreen()
}

/**
 * Apple WebKit: sesli videolar kullanıcı jesti olmadan otomatik oynatılamaz.
 * Modal açıldığında kullanıcı play'e basar.
 */
export function shouldAutoplayExerciseVideo() {
  return !isIosDevice()
}

/** iOS'ta preload="auto" çoğu zaman metadata indirmez; metadata yeterli. */
export function exerciseVideoPreload(autoPlay) {
  if (isIosDevice()) return 'metadata'
  return autoPlay ? 'auto' : 'metadata'
}

/** Safari askıya alınmış / takılmış videoyu kullanıcı jestiyle kurtarmayı dener. */
export async function recoverIosVideoPlayback(video) {
  if (!video) return false
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
    await video.play()
    return !video.paused
  } catch {
    try {
      video.load()
      await video.play()
      return !video.paused
    } catch {
      return false
    }
  }
}

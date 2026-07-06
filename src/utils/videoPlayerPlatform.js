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

/**
 * Panel / modal scroll kilidi.
 * body { overflow: hidden } KULLANMA — iOS Safari'de body'ye portallanmış
 * position:fixed overlay'i kırpıp kaybettirebiliyor (pseudo-fullscreen).
 */

let lockCount = 0
/** @type {{ el: HTMLElement, overflow: string }[]} */
let locked = []

export function lockAppScroll() {
  if (typeof document === 'undefined') return
  lockCount += 1
  if (lockCount > 1) return

  locked = []
  const targets = [
    document.documentElement,
    ...document.querySelectorAll('[data-panel-scroll], [data-scroll-lock]'),
  ]

  targets.forEach((el) => {
    if (!(el instanceof HTMLElement)) return
    locked.push({ el, overflow: el.style.overflow })
    el.style.overflow = 'hidden'
  })
}

export function unlockAppScroll() {
  if (typeof document === 'undefined') return
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount > 0) return

  locked.forEach(({ el, overflow }) => {
    el.style.overflow = overflow
  })
  locked = []
}

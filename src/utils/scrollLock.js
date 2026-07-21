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

/**
 * Public sayfa (window/body scroll) kilidi — hamburger menü vb.
 * position:fixed + scrollY restore: iOS'ta arka planın menüyle birlikte kaymasını engeller.
 */
let pageLockCount = 0
let pageScrollY = 0
/** @type {Record<string, string> | null} */
let pagePrev = null

export function lockPageScroll() {
  if (typeof document === 'undefined') return
  pageLockCount += 1
  if (pageLockCount > 1) return

  pageScrollY = window.scrollY
  const { body, documentElement } = document
  pagePrev = {
    bodyOverflow: body.style.overflow,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyLeft: body.style.left,
    bodyRight: body.style.right,
    bodyWidth: body.style.width,
    htmlOverflow: documentElement.style.overflow,
  }
  body.style.overflow = 'hidden'
  body.style.position = 'fixed'
  body.style.top = `-${pageScrollY}px`
  body.style.left = '0'
  body.style.right = '0'
  body.style.width = '100%'
  documentElement.style.overflow = 'hidden'
}

export function unlockPageScroll() {
  if (typeof document === 'undefined') return
  pageLockCount = Math.max(0, pageLockCount - 1)
  if (pageLockCount > 0 || !pagePrev) return

  const { body, documentElement } = document
  body.style.overflow = pagePrev.bodyOverflow
  body.style.position = pagePrev.bodyPosition
  body.style.top = pagePrev.bodyTop
  body.style.left = pagePrev.bodyLeft
  body.style.right = pagePrev.bodyRight
  body.style.width = pagePrev.bodyWidth
  documentElement.style.overflow = pagePrev.htmlOverflow
  pagePrev = null
  window.scrollTo(0, pageScrollY)
}

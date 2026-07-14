import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getGa4MeasurementId, hasAnalyticsConsent } from '../../utils/ga4Loader'

/** SPA sayfa geçişleri — yalnızca KVKK onayı sonrası. */
function trackPageView(id, pathname, search) {
  if (typeof window === 'undefined' || !window.gtag) return
  const pagePath = `${pathname}${search}`
  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: document.title,
    page_location: `${window.location.origin}${pagePath}`,
  })
}

function scheduleIdle(fn, timeoutMs = 4000) {
  if (typeof window === 'undefined') return () => {}
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout: timeoutMs })
    return () => window.cancelIdleCallback?.(id)
  }
  const id = window.setTimeout(fn, Math.min(timeoutMs, 2000))
  return () => window.clearTimeout(id)
}

/** İlk boyamayı bloklamamak için idle/etkileşim sonrası aktif olur. */
export default function GoogleAnalytics() {
  const location = useLocation()
  const isFirstRender = useRef(true)
  const enabled = Boolean(getGa4MeasurementId())
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false
    const arm = () => { if (!cancelled) setArmed(true) }
    const cancelIdle = scheduleIdle(arm)
    const onInteract = () => arm()
    window.addEventListener('pointerdown', onInteract, { once: true, passive: true })
    window.addEventListener('keydown', onInteract, { once: true })
    return () => {
      cancelled = true
      cancelIdle()
      window.removeEventListener('pointerdown', onInteract)
      window.removeEventListener('keydown', onInteract)
    }
  }, [enabled])

  useEffect(() => {
    if (!armed || !enabled || !hasAnalyticsConsent()) return
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    trackPageView(getGa4MeasurementId(), location.pathname, location.search)
  }, [armed, enabled, location.pathname, location.search])

  return null
}

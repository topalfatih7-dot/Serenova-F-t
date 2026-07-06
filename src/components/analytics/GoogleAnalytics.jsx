import { useEffect, useRef } from 'react'
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

export default function GoogleAnalytics() {
  const location = useLocation()
  const isFirstRender = useRef(true)
  const enabled = Boolean(getGa4MeasurementId())

  useEffect(() => {
    if (!enabled || !hasAnalyticsConsent()) return
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    trackPageView(getGa4MeasurementId(), location.pathname, location.search)
  }, [enabled, location.pathname, location.search])

  return null
}

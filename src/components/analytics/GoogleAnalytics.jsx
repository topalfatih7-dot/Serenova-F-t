import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { BRAND } from '../../config/brand'

const GA_ID = (
  import.meta.env.VITE_GA4_MEASUREMENT_ID ||
  BRAND.ga4MeasurementId ||
  ''
).trim()

function isValidGaId(id) {
  return /^G-[A-Z0-9]+$/i.test(id)
}

/** SPA sayfa geçişleri — ilk yükleme index.html gtag ile izlenir. */
function trackPageView(id, pathname, search) {
  if (typeof window === 'undefined' || !window.gtag) return
  const pagePath = `${pathname}${search}`
  window.gtag('config', id, {
    page_path: pagePath,
    page_title: document.title,
    page_location: `${window.location.origin}${pagePath}`,
  })
}

export default function GoogleAnalytics() {
  const location = useLocation()
  const isFirstRender = useRef(true)
  const enabled = isValidGaId(GA_ID)

  useEffect(() => {
    if (!enabled) return
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    trackPageView(GA_ID, location.pathname, location.search)
  }, [enabled, location.pathname, location.search])

  return null
}

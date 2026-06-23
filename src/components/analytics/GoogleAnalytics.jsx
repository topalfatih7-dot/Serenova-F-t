import { useEffect } from 'react'
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

function ensureGtag(id) {
  if (typeof window === 'undefined' || window.__ga4Initialized) return
  window.__ga4Initialized = true
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args) {
    window.dataLayer.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', id, { send_page_view: false })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  document.head.appendChild(script)
}

/** GA4 — VITE_GA4_MEASUREMENT_ID tanımlıysa SPA sayfa görüntülemelerini izler. */
export default function GoogleAnalytics() {
  const location = useLocation()
  const enabled = isValidGaId(GA_ID)

  useEffect(() => {
    if (!enabled) return
    ensureGtag(GA_ID)
  }, [enabled])

  useEffect(() => {
    if (!enabled || !window.gtag) return
    window.gtag('event', 'page_view', {
      page_path: `${location.pathname}${location.search}`,
      page_title: document.title,
    })
  }, [enabled, location.pathname, location.search])

  return null
}

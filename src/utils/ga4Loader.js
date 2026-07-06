import { BRAND } from '../config/brand'

export const ANALYTICS_CONSENT_KEY = 'serenova-consent'

const GA_ID = (
  import.meta.env.VITE_GA4_MEASUREMENT_ID ||
  BRAND.ga4MeasurementId ||
  ''
).trim()

export function getGa4MeasurementId() {
  return /^G-[A-Z0-9]+$/i.test(GA_ID) ? GA_ID : ''
}

export function hasAnalyticsConsent() {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(ANALYTICS_CONSENT_KEY) === '1'
  } catch {
    return false
  }
}

function loadGtagScript(id) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${id}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('GA4 script yüklenemedi'))
    document.head.appendChild(script)
  })
}

/** KVKK onayı sonrası GA4 yükler — Consent Mode v2. */
export async function initGa4({ analyticsGranted = true } = {}) {
  if (typeof window === 'undefined') return false
  const id = getGa4MeasurementId()
  if (!id) return false

  window.dataLayer = window.dataLayer || []
  if (!window.gtag) {
    window.gtag = function gtag() { window.dataLayer.push(arguments) }
  }

  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    wait_for_update: 500,
  })

  await loadGtagScript(id)
  window.gtag('js', new Date())

  window.gtag('consent', 'update', {
    analytics_storage: analyticsGranted ? 'granted' : 'denied',
    ad_storage: 'denied',
  })

  window.gtag('config', id, {
    anonymize_ip: true,
    send_page_view: true,
  })

  window.__ga4Initialized = true
  return true
}

export function trackGa4Event(name, params = {}) {
  if (!hasAnalyticsConsent() || typeof window === 'undefined' || !window.gtag) return
  const id = getGa4MeasurementId()
  if (!id) return
  window.gtag('event', name, params)
}

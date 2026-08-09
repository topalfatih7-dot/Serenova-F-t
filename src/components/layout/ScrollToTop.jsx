import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const PANEL_SCROLL_SELECTOR = '[data-panel-scroll]'

/**
 * Public sayfalar: window; üye/personel/admin paneli: overflow-y-auto main.
 * Yalnızca pathname (sayfa) değişince başa al — ?role= / ?tab= gibi query
 * güncellemeleri scroll’u sıfırlamamalı.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.querySelectorAll(PANEL_SCROLL_SELECTOR).forEach((el) => {
      el.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    })
  }, [pathname, hash])

  return null
}

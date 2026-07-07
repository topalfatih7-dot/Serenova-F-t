import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const PANEL_SCROLL_SELECTOR = '[data-panel-scroll]'

/** Public sayfalar: window; üye/personel/admin paneli: overflow-y-auto main konteyneri */
export default function ScrollToTop() {
  const { pathname, hash, search } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.querySelectorAll(PANEL_SCROLL_SELECTOR).forEach((el) => {
      el.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    })
  }, [pathname, hash, search])

  return null
}

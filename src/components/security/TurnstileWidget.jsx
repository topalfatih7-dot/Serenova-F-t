import { useEffect, useRef, useCallback } from 'react'
import { TURNSTILE_SITE_KEY } from '../../config/turnstile'

/**
 * Cloudflare Turnstile widget.
 * Site key yoksa (local) boş render eder; sunucu da doğrulamayı atlar.
 */
export default function TurnstileWidget({ onToken, className = '' }) {
  const hostRef = useRef(null)
  const widgetIdRef = useRef(null)
  const onTokenRef = useRef(onToken)

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  const renderWidget = useCallback(() => {
    if (!TURNSTILE_SITE_KEY || !hostRef.current || !window.turnstile) return
    if (widgetIdRef.current != null) {
      try {
        window.turnstile.remove(widgetIdRef.current)
      } catch {
        /* ignore */
      }
      widgetIdRef.current = null
    }
    hostRef.current.innerHTML = ''
    widgetIdRef.current = window.turnstile.render(hostRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token) => onTokenRef.current?.(token || ''),
      'expired-callback': () => onTokenRef.current?.(''),
      'error-callback': () => onTokenRef.current?.(''),
      theme: 'light',
      size: 'normal',
    })
  }, [])

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      onTokenRef.current?.('')
      return undefined
    }

    const existing = document.querySelector('script[data-turnstile]')
    if (window.turnstile) {
      renderWidget()
    } else if (!existing) {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.dataset.turnstile = '1'
      script.onload = () => renderWidget()
      document.head.appendChild(script)
    } else {
      existing.addEventListener('load', renderWidget)
    }

    return () => {
      if (widgetIdRef.current != null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null
      }
    }
  }, [renderWidget])

  if (!TURNSTILE_SITE_KEY) return null

  return <div ref={hostRef} className={className} />
}

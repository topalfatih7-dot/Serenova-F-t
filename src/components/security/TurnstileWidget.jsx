import { forwardRef, useEffect, useRef, useCallback, useImperativeHandle, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { TURNSTILE_SITE_KEY } from '../../config/turnstile'

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const RESET_DEBOUNCE_MS = 400
const TOKEN_WAIT_MS = 15_000

/**
 * Cloudflare Turnstile — görünür managed widget (sektör standardı).
 * - appearance: always → formda her zaman görünür
 * - execution: render → yüklenince challenge çalışır
 * Imperative: reset(), execute()/waitForToken(), getResponse()
 */
const TurnstileWidget = forwardRef(function TurnstileWidget({ onToken, className = '' }, ref) {
  const hostRef = useRef(null)
  const widgetIdRef = useRef(null)
  const onTokenRef = useRef(onToken)
  const resetTimerRef = useRef(0)
  const waitResolveRef = useRef(null)
  const waitRejectRef = useRef(null)
  const waitTimerRef = useRef(0)
  const [status, setStatus] = useState('loading') // loading | ready | error

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  const clearWaiters = useCallback((error) => {
    if (waitTimerRef.current) {
      window.clearTimeout(waitTimerRef.current)
      waitTimerRef.current = 0
    }
    const reject = waitRejectRef.current
    waitResolveRef.current = null
    waitRejectRef.current = null
    if (error && reject) reject(error)
  }, [])

  const settleWait = useCallback((token) => {
    if (waitTimerRef.current) {
      window.clearTimeout(waitTimerRef.current)
      waitTimerRef.current = 0
    }
    const resolve = waitResolveRef.current
    waitResolveRef.current = null
    waitRejectRef.current = null
    if (resolve) resolve(token || '')
  }, [])

  const softReset = useCallback(() => {
    onTokenRef.current?.('')
    setStatus('loading')
    if (!window.turnstile || widgetIdRef.current == null) return
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current)
    resetTimerRef.current = window.setTimeout(() => {
      resetTimerRef.current = 0
      try {
        window.turnstile.reset(widgetIdRef.current)
      } catch {
        /* ignore */
      }
    }, RESET_DEBOUNCE_MS)
  }, [])

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
    onTokenRef.current?.('')
    setStatus('loading')

    widgetIdRef.current = window.turnstile.render(hostRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      // Görünür managed widget — kullanıcı bot korumasını görür
      execution: 'render',
      appearance: 'always',
      'refresh-expired': 'auto',
      retry: 'auto',
      theme: 'light',
      size: 'normal',
      callback: (token) => {
        setStatus('ready')
        onTokenRef.current?.(token || '')
        settleWait(token || '')
      },
      'expired-callback': () => {
        setStatus('loading')
        onTokenRef.current?.('')
        softReset()
      },
      'error-callback': () => {
        setStatus('error')
        onTokenRef.current?.('')
        clearWaiters(new Error('Bot doğrulaması başarısız. Lütfen tekrar deneyin.'))
        softReset()
      },
      'timeout-callback': () => {
        setStatus('error')
        onTokenRef.current?.('')
        clearWaiters(new Error('Bot doğrulaması zaman aşımına uğradı. Lütfen tekrar deneyin.'))
        softReset()
      },
    })
  }, [clearWaiters, settleWait, softReset])

  const waitForToken = useCallback(() => {
    if (!TURNSTILE_SITE_KEY) return Promise.resolve('')
    if (!window.turnstile || widgetIdRef.current == null) {
      return Promise.reject(new Error('Bot doğrulaması henüz hazır değil. Lütfen birkaç saniye bekleyin.'))
    }

    try {
      const existing = window.turnstile.getResponse(widgetIdRef.current) || ''
      if (existing.length >= 10) {
        onTokenRef.current?.(existing)
        setStatus('ready')
        return Promise.resolve(existing)
      }
    } catch {
      /* continue wait */
    }

    return new Promise((resolve, reject) => {
      clearWaiters()
      waitResolveRef.current = resolve
      waitRejectRef.current = reject
      waitTimerRef.current = window.setTimeout(() => {
        waitTimerRef.current = 0
        waitResolveRef.current = null
        waitRejectRef.current = null
        reject(new Error('Bot doğrulaması zaman aşımına uğradı. Lütfen tekrar deneyin.'))
      }, TOKEN_WAIT_MS)

      // Token yoksa challenge’ı yeniden tetikle (render mode’da reset yeter)
      try {
        window.turnstile.reset(widgetIdRef.current)
      } catch {
        try {
          window.turnstile.execute?.(widgetIdRef.current)
        } catch {
          /* ignore */
        }
      }
    })
  }, [clearWaiters])

  useImperativeHandle(ref, () => ({
    reset() {
      onTokenRef.current?.('')
      setStatus('loading')
      clearWaiters()
      if (!window.turnstile || widgetIdRef.current == null) return
      try {
        window.turnstile.reset(widgetIdRef.current)
      } catch {
        renderWidget()
      }
    },
    getResponse() {
      if (!window.turnstile || widgetIdRef.current == null) return ''
      try {
        return window.turnstile.getResponse(widgetIdRef.current) || ''
      } catch {
        return ''
      }
    },
    /** Submit öncesi taze token bekle (execute alias) */
    execute: waitForToken,
    waitForToken,
  }), [clearWaiters, renderWidget, waitForToken])

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
      script.src = SCRIPT_SRC
      script.async = true
      script.dataset.turnstile = '1'
      script.onload = () => {
        script.dataset.loaded = '1'
        renderWidget()
      }
      document.head.appendChild(script)
    } else if (existing.dataset.loaded === '1' || existing.readyState === 'complete') {
      const waitForApi = (attempts = 0) => {
        if (window.turnstile) {
          renderWidget()
          return
        }
        if (attempts > 40) {
          setStatus('error')
          return
        }
        window.setTimeout(() => waitForApi(attempts + 1), 50)
      }
      waitForApi()
    } else {
      const onLoad = () => {
        existing.dataset.loaded = '1'
        renderWidget()
      }
      existing.addEventListener('load', onLoad)
      return () => {
        existing.removeEventListener('load', onLoad)
        if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current)
        clearWaiters()
        if (widgetIdRef.current != null && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch {
            /* ignore */
          }
          widgetIdRef.current = null
        }
      }
    }

    return () => {
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current)
      clearWaiters()
      if (widgetIdRef.current != null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null
      }
    }
  }, [renderWidget, clearWaiters])

  if (!TURNSTILE_SITE_KEY) return null

  return (
    <div
      className={[
        'w-full rounded-2xl border border-cream-200/90 bg-gradient-to-br from-cream-50/80 via-white to-brand-50/40 px-3 py-3 shadow-sm',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className="mb-2 flex items-center gap-2 px-0.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-cream-900">Güvenlik doğrulaması</p>
          <p className="text-[11px] leading-snug text-cream-800/55">
            {status === 'ready'
              ? 'Doğrulama tamamlandı'
              : status === 'error'
                ? 'Doğrulama başarısız — yenileniyor…'
                : 'Cloudflare ile bot koruması hazırlanıyor…'}
          </p>
        </div>
      </div>
      <div
        ref={hostRef}
        className="flex min-h-[65px] items-center justify-center overflow-hidden"
        aria-live="polite"
      />
    </div>
  )
})

export default TurnstileWidget

import { forwardRef, useEffect, useRef, useCallback, useImperativeHandle } from 'react'
import { TURNSTILE_SITE_KEY } from '../../config/turnstile'

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const RESET_DEBOUNCE_MS = 400
const EXECUTE_TIMEOUT_MS = 15_000

/**
 * Cloudflare Turnstile widget (execute-on-submit).
 * Imperative API: reset(), execute(), getResponse()
 * Site key yoksa (local) boş render eder; sunucu da doğrulamayı atlar.
 */
const TurnstileWidget = forwardRef(function TurnstileWidget({ onToken, className = '' }, ref) {
  const hostRef = useRef(null)
  const widgetIdRef = useRef(null)
  const onTokenRef = useRef(onToken)
  const resetTimerRef = useRef(0)
  const executeResolveRef = useRef(null)
  const executeRejectRef = useRef(null)
  const executeTimerRef = useRef(0)
  const readyRef = useRef(false)

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  const clearExecuteWaiters = useCallback((error) => {
    if (executeTimerRef.current) {
      window.clearTimeout(executeTimerRef.current)
      executeTimerRef.current = 0
    }
    const reject = executeRejectRef.current
    executeResolveRef.current = null
    executeRejectRef.current = null
    if (error && reject) reject(error)
  }, [])

  const settleExecute = useCallback((token) => {
    if (executeTimerRef.current) {
      window.clearTimeout(executeTimerRef.current)
      executeTimerRef.current = 0
    }
    const resolve = executeResolveRef.current
    executeResolveRef.current = null
    executeRejectRef.current = null
    if (resolve) resolve(token || '')
  }, [])

  const softReset = useCallback(() => {
    onTokenRef.current?.('')
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
    readyRef.current = false
    onTokenRef.current?.('')

    widgetIdRef.current = window.turnstile.render(hostRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      execution: 'execute',
      appearance: 'interaction-only',
      'refresh-expired': 'auto',
      retry: 'auto',
      theme: 'light',
      size: 'normal',
      callback: (token) => {
        readyRef.current = true
        onTokenRef.current?.(token || '')
        settleExecute(token || '')
      },
      'expired-callback': () => {
        readyRef.current = false
        onTokenRef.current?.('')
        softReset()
      },
      'error-callback': () => {
        readyRef.current = false
        onTokenRef.current?.('')
        clearExecuteWaiters(new Error('Bot doğrulaması başarısız. Lütfen tekrar deneyin.'))
        softReset()
      },
      'timeout-callback': () => {
        readyRef.current = false
        onTokenRef.current?.('')
        clearExecuteWaiters(new Error('Bot doğrulaması zaman aşımına uğradı. Lütfen tekrar deneyin.'))
        softReset()
      },
    })
  }, [clearExecuteWaiters, settleExecute, softReset])

  useImperativeHandle(ref, () => ({
    reset() {
      readyRef.current = false
      onTokenRef.current?.('')
      clearExecuteWaiters()
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
    execute() {
      if (!TURNSTILE_SITE_KEY) return Promise.resolve('')
      if (!window.turnstile || widgetIdRef.current == null) {
        return Promise.reject(new Error('Bot doğrulaması henüz hazır değil. Lütfen birkaç saniye bekleyin.'))
      }
      const existing = (() => {
        try {
          return window.turnstile.getResponse(widgetIdRef.current) || ''
        } catch {
          return ''
        }
      })()
      if (existing && existing.length >= 10) {
        onTokenRef.current?.(existing)
        return Promise.resolve(existing)
      }

      return new Promise((resolve, reject) => {
        clearExecuteWaiters()
        executeResolveRef.current = resolve
        executeRejectRef.current = reject
        executeTimerRef.current = window.setTimeout(() => {
          executeTimerRef.current = 0
          executeResolveRef.current = null
          executeRejectRef.current = null
          reject(new Error('Bot doğrulaması zaman aşımına uğradı. Lütfen tekrar deneyin.'))
          softReset()
        }, EXECUTE_TIMEOUT_MS)

        try {
          window.turnstile.execute(widgetIdRef.current)
        } catch (err) {
          clearExecuteWaiters()
          reject(err instanceof Error ? err : new Error('Bot doğrulaması başlatılamadı.'))
        }
      })
    },
  }), [clearExecuteWaiters, renderWidget, softReset])

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
      // Script DOM'da ama load event kaçırılmış olabilir
      const waitForApi = (attempts = 0) => {
        if (window.turnstile) {
          renderWidget()
          return
        }
        if (attempts > 40) return
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
        clearExecuteWaiters()
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
      clearExecuteWaiters()
      if (widgetIdRef.current != null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null
      }
    }
  }, [renderWidget, clearExecuteWaiters])

  if (!TURNSTILE_SITE_KEY) return null

  return <div ref={hostRef} className={className} />
})

export default TurnstileWidget

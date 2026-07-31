import { useCallback, useRef, useState } from 'react'
import { isTurnstileEnabled } from '../config/turnstile'

/**
 * Turnstile form sözleşmesi (görünür managed widget):
 * - getTokenForSubmit(): mevcut token’ı tüket; yoksa waitForToken/reset
 * - reset(): her API yanıtından sonra (başarı/hata)
 * - Token tek kullanımlık; asla React key remount / reuse
 */
export function useTurnstile() {
  const enabled = isTurnstileEnabled()
  const widgetRef = useRef(null)
  const [token, setToken] = useState('')
  const inFlightRef = useRef(false)

  const reset = useCallback(() => {
    setToken('')
    try {
      widgetRef.current?.reset?.()
    } catch {
      /* ignore */
    }
  }, [])

  const getTokenForSubmit = useCallback(async () => {
    if (!enabled) return ''
    if (inFlightRef.current) {
      throw new Error('İstek zaten sürüyor. Lütfen bekleyin.')
    }
    inFlightRef.current = true
    try {
      const cached = (token || widgetRef.current?.getResponse?.() || '').trim()
      if (cached.length >= 10) {
        setToken('')
        return cached
      }
      const fresh = String(await widgetRef.current?.execute?.() || '').trim()
      if (fresh.length < 10) {
        throw new Error('Bot doğrulamasını tamamlayın.')
      }
      setToken('')
      return fresh
    } finally {
      inFlightRef.current = false
    }
  }, [enabled, token])

  return {
    enabled,
    widgetRef,
    token,
    setToken,
    reset,
    getTokenForSubmit,
  }
}

export default useTurnstile

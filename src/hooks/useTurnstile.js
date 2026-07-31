import { useCallback, useRef, useState } from 'react'
import { isTurnstileEnabled } from '../config/turnstile'

/**
 * Turnstile form sözleşmesi:
 * - getTokenForSubmit(): taze token (varsa tüket, yoksa execute)
 * - reset(): her API yanıtından sonra çağır (başarı/hata)
 * - Token tek kullanımlık; asla React key remount ile yenileme
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

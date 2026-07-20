export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''

/**
 * Local Vite (`import.meta.env.DEV`) ortamında Turnstile kapalı —
 * widget localhost'ta sık kırılır; API localhost'ta bot kontrolünü atlar.
 */
export function isTurnstileEnabled() {
  if (import.meta.env.DEV) return false
  return Boolean(TURNSTILE_SITE_KEY)
}

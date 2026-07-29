/**
 * Stripe istemci yapılandırması.
 * Test kartı simülasyonu kaldırıldı — ücretli paketler yalnızca Stripe Checkout.
 * Gizli anahtar tarayıcıya gelmez.
 */
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

/**
 * Client feature flag. Sunucu (STRIPE_SECRET_KEY) asıl doğrulayıcıdır —
 * checkout yine API üzerinden denenir; bu bayrak yalnızca UX ipucu.
 */
export function isStripeEnabled() {
  const flag = String(import.meta.env.VITE_STRIPE_ENABLED ?? '').trim().toLowerCase()
  if (flag === 'true' || flag === '1' || flag === 'yes') return true
  if (flag === 'false' || flag === '0' || flag === 'no') return false
  // Flag yoksa publishable key varsa açık say (yeni paket checkout'u engellenmesin)
  return Boolean(STRIPE_PUBLISHABLE_KEY)
}

export const STRIPE_REQUIRED_MESSAGE =
  'Ödeme sistemi yapılandırılmamış. Lütfen daha sonra tekrar deneyin veya destek ile iletişime geçin.'

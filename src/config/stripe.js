/**
 * Stripe istemci yapılandırması.
 * Test kartı simülasyonu kaldırıldı — ücretli paketler yalnızca Stripe Checkout.
 * Gizli anahtar tarayıcıya gelmez.
 */
export function isStripeEnabled() {
  return import.meta.env.VITE_STRIPE_ENABLED === 'true'
}

export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

export const STRIPE_REQUIRED_MESSAGE =
  'Ödeme sistemi yapılandırılmamış. Lütfen daha sonra tekrar deneyin veya destek ile iletişime geçin.'

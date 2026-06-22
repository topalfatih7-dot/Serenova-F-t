/**
 * Stripe istemci yapılandırması.
 * Yalnızca AÇIK/KAPALI bayrağı tutar — gizli anahtar tarayıcıya gelmez.
 * Checkout (redirect) akışı kullanıldığı için publishable key zorunlu değildir.
 */
export function isStripeEnabled() {
  return import.meta.env.VITE_STRIPE_ENABLED === 'true'
}

export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

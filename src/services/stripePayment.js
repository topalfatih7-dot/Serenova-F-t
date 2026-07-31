/**
 * Stripe Checkout + Customer Portal servisi.
 */
import { getApiAuthHeaders } from './apiAuth'

export async function startStripeCheckout(planId, flow = 'register', durationMonths = 1, email = null) {
  const headers = await getApiAuthHeaders()
  if (!headers.Authorization) {
    return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }
  }

  let json
  try {
    const res = await fetch('/api/stripe-checkout', {
      method: 'POST',
      headers,
      body: JSON.stringify({ planId, flow, durationMonths, email: email || undefined }),
    })
    json = await res.json().catch(() => ({}))
    if (!res.ok || !json?.url) {
      return { success: false, error: json?.error || 'Ödeme başlatılamadı.' }
    }
  } catch (e) {
    return { success: false, error: String(e?.message || e) }
  }

  try {
    const { trackGa4Event } = await import('../utils/ga4Loader')
    trackGa4Event('begin_checkout', {
      currency: 'TRY',
      items: [{ item_id: planId, item_name: planId, quantity: 1 }],
      flow,
      duration_months: durationMonths,
    })
  } catch { /* GA opsiyonel */ }

  window.location.href = json.url
  return { success: true }
}

/** Stripe Customer Portal — kart / fatura yönetimi */
export async function startStripePortal() {
  const headers = await getApiAuthHeaders()
  if (!headers.Authorization) {
    return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }
  }

  try {
    const res = await fetch('/api/stripe-checkout', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'create-portal-session' }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json?.url) {
      return { success: false, error: json?.error || 'Portal açılamadı.' }
    }
    window.location.href = json.url
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e?.message || e) }
  }
}

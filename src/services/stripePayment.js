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

/** Stripe Customer Portal — kart / fatura / iptal (intent=cancel) */
export async function startStripePortal({
  intent = 'manage',
  mode,
  subscriptionId,
} = {}) {
  const headers = await getApiAuthHeaders()
  if (!headers.Authorization) {
    return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }
  }

  try {
    const payload = { action: 'create-portal-session', intent }
    if (mode) payload.mode = mode
    if (subscriptionId) payload.subscriptionId = subscriptionId
    const res = await fetch('/api/stripe-checkout', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
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

/** Dönem sonu iptalini geri al — Stripe API, Portal yok */
export async function resumeStripeSubscription(subscriptionId) {
  const headers = await getApiAuthHeaders()
  if (!headers.Authorization) {
    return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }
  }
  try {
    const res = await fetch('/api/stripe-checkout', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'resume-subscription', subscriptionId }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json?.ok) {
      return { success: false, error: json?.error || 'Yenileme açılamadı.' }
    }
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e?.message || e) }
  }
}

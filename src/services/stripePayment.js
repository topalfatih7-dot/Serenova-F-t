/**
 * Stripe Checkout başlatma servisi.
 * Supabase oturum token'ı ile /api/stripe-checkout çağrılır, dönen URL'e yönlendirilir.
 * Üyelik, ödeme onaylanınca sunucudaki webhook tarafından aktifleştirilir.
 */
import { supabase } from './supabaseClient'

export async function startStripeCheckout(planId, flow = 'register') {
  let token = null
  try {
    const { data } = await supabase.auth.getSession()
    token = data?.session?.access_token || null
  } catch {
    /* oturum okunamadı */
  }
  if (!token) return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }

  let json
  try {
    const res = await fetch('/api/stripe-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ planId, flow }),
    })
    json = await res.json().catch(() => ({}))
    if (!res.ok || !json?.url) {
      return { success: false, error: json?.error || 'Ödeme başlatılamadı.' }
    }
  } catch (e) {
    return { success: false, error: String(e?.message || e) }
  }

  window.location.href = json.url
  return { success: true }
}

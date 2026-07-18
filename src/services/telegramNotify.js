/**
 * Telegram bildirimi — /api/telegram-notify (Bearer oturum zorunlu, secret yok).
 */
import { supabase } from './supabaseClient'

export async function notifyTelegram(event, payload = {}) {
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (supabase) {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      if (token) headers.Authorization = `Bearer ${token}`
    }

    await fetch('/api/telegram-notify', {
      method: 'POST',
      headers,
      body: JSON.stringify({ event, ...payload, at: new Date().toISOString() }),
    })
  } catch {
    // Bildirim hatası uygulama akışını kesmemeli
  }
}

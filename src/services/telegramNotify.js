import { supabase, isSupabaseEnabled } from './supabaseClient'

/**
 * Telegram bildirimi — Supabase Edge Function üzerinden gönderilir.
 * Bot token istemcide tutulmaz; TELEGRAM_SETUP.md adımlarını izleyin.
 */
export async function notifyTelegram(event, payload = {}) {
  if (!isSupabaseEnabled || !supabase) return

  try {
    await supabase.functions.invoke('telegram-notify', {
      body: { event, ...payload, at: new Date().toISOString() },
    })
  } catch {
    // Bildirim hatası uygulama akışını kesmemeli
  }
}

/**
 * Telegram bildirimi — Vercel API route (/api/telegram-notify) üzerinden gönderilir.
 * Bot token sunucuda tutulur; docs/setup/TELEGRAM_SETUP.md adımlarını izleyin.
 */
export async function notifyTelegram(event, payload = {}) {
  try {
    const headers = { 'Content-Type': 'application/json' }
    const secret = import.meta.env.VITE_TELEGRAM_NOTIFY_SECRET
    if (secret) headers['X-Notify-Secret'] = secret

    await fetch('/api/telegram-notify', {
      method: 'POST',
      headers,
      body: JSON.stringify({ event, ...payload, at: new Date().toISOString() }),
    })
  } catch {
    // Bildirim hatası uygulama akışını kesmemeli
  }
}

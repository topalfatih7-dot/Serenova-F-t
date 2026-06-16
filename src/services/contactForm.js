/**
 * Bize Ulaşın formu — ayrı Telegram chat'e (/api/contact) gönderilir.
 */
export async function submitContactForm(payload) {
  try {
    const headers = { 'Content-Type': 'application/json' }
    const secret = import.meta.env.VITE_TELEGRAM_NOTIFY_SECRET
    if (secret) headers['X-Notify-Secret'] = secret

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: data.error || 'Mesaj gönderilemedi' }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Bağlantı hatası. Lütfen tekrar deneyin.' }
  }
}

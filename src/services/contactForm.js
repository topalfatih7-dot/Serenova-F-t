import { submitContactInquiry } from './supabaseDb'

/**
 * Bize Ulaşın formu — Supabase'e kaydedilir + Telegram bildirimi (/api/contact).
 */
export async function submitContactForm(payload) {
  const db = await submitContactInquiry({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    subject: payload.subject,
    message: payload.message,
    source: payload.source || 'landing',
  })
  if (!db.success) {
    return { ok: false, error: db.error || 'Mesaj kaydedilemedi' }
  }

  try {
    const headers = { 'Content-Type': 'application/json' }
    const secret = import.meta.env.VITE_TELEGRAM_NOTIFY_SECRET
    if (secret) headers['X-Notify-Secret'] = secret

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.warn('Telegram notify failed:', data.error)
    }
  } catch {
    // DB kaydı başarılı; Telegram ikincil kanal
  }

  return { ok: true }
}

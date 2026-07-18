/**
 * Bize Ulaşın — sunucu kapısı (/api/contact): Turnstile + DB + Telegram.
 */

export async function submitContactForm(payload) {
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'contact',
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        subject: payload.subject,
        message: payload.message,
        source: payload.source || 'landing',
        turnstileToken: payload.turnstileToken || '',
        website: payload.website || '',
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Mesaj kaydedilemedi' }
    }
    return { ok: true, id: data.id }
  } catch {
    return { ok: false, error: 'Bağlantı hatası. Lütfen tekrar deneyin.' }
  }
}

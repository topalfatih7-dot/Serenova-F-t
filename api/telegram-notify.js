/**
 * Vercel Serverless Function — Telegram bildirimleri.
 * Bot token yalnızca sunucu ortam değişkenlerinde tutulur (Vercel Dashboard).
 */

import { setCorsHeaders, handleOptions, requireNotifySecret } from './_guards.js'

function buildMessage(body) {
  if (body.message) return body.message

  const time = body.at
    ? new Date(body.at).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
    : new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })

  switch (body.event) {
    case 'member_signup':
      return `🆕 <b>Yeni üye kaydı</b>\n👤 ${body.name || '—'}\n📧 ${body.email || '—'}\n💳 ${body.membership === 'premium' ? 'Premium' : 'Ücretsiz'}\n🕐 ${time}`
    case 'member_login':
      return `✅ <b>Üye girişi</b>\n👤 ${body.name || '—'}\n📧 ${body.email || '—'}\n🕐 ${time}`
    case 'staff_login':
      return `👨‍⚕️ <b>Personel girişi</b>\n👤 ${body.name || '—'}\n🏷 ${body.role || 'Personel'}\n📧 ${body.email || '—'}\n🕐 ${time}`
    case 'staff_logout':
      return `🚪 <b>Personel çıkışı</b>\n👤 ${body.name || '—'}\n🏷 ${body.role || 'Personel'}\n🕐 ${time}`
    case 'member_logout':
      return `🚪 <b>Üye çıkışı</b>\n👤 ${body.name || '—'}\n🕐 ${time}`
    case 'admin_login':
      return `🔐 <b>Admin girişi</b>\n👤 ${body.name || 'Admin'}\n🕐 ${time}`
    default:
      return `📢 <b>${body.event || 'Bildirim'}</b>\n${body.name ? `👤 ${body.name}\n` : ''}${body.email ? `📧 ${body.email}\n` : ''}🕐 ${time}`
  }
}

export default async function handler(req, res) {
  setCorsHeaders(res, 'POST, OPTIONS', 'Content-Type, X-Notify-Secret')
  if (handleOptions(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Yalnızca POST desteklenir' })
  }

  const guard = requireNotifySecret(req)
  if (!guard.ok) {
    return res.status(guard.status).json({ ok: false, error: guard.error })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    return res.status(503).json({ ok: false, error: 'Telegram yapılandırması eksik (Vercel env)' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const text = buildMessage(body || {})

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    if (!tgRes.ok) {
      const err = await tgRes.text()
      return res.status(502).json({ ok: false, error: err })
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) })
  }
}

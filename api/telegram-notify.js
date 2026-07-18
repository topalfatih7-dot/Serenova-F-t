/**
 * Oturum olayları için Telegram bildirimi.
 * Client secret göndermez — geçerli Bearer oturumu zorunlu.
 */

import { setCorsHeaders, handleOptions, requireAuth } from './_guards.js'
import { enforceRateLimit, applyRateLimitHeaders } from './_rateLimit.js'

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildMessage(body, user) {
  if (body.message) return String(body.message).slice(0, 2000)

  const time = body.at
    ? new Date(body.at).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
    : new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })

  const name = escapeHtml(body.name || user?.user_metadata?.name || '—')
  const email = escapeHtml(body.email || user?.email || '—')

  switch (body.event) {
    case 'member_signup':
      return `🆕 <b>Yeni üye kaydı</b>\n👤 ${name}\n📧 ${email}\n💳 ${body.membership === 'premium' ? 'Premium' : 'Ücretsiz'}\n🕐 ${time}`
    case 'member_login':
      return `✅ <b>Üye girişi</b>\n👤 ${name}\n📧 ${email}\n🕐 ${time}`
    case 'staff_login':
      return `👨‍⚕️ <b>Personel girişi</b>\n👤 ${name}\n🏷 ${escapeHtml(body.role || 'Personel')}\n📧 ${email}\n🕐 ${time}`
    case 'staff_logout':
      return `🚪 <b>Personel çıkışı</b>\n👤 ${name}\n🏷 ${escapeHtml(body.role || 'Personel')}\n🕐 ${time}`
    case 'member_logout':
      return `🚪 <b>Üye çıkışı</b>\n👤 ${name}\n🕐 ${time}`
    case 'admin_login':
      return `🔐 <b>Admin girişi</b>\n👤 ${name}\n🕐 ${time}`
    default:
      return `📢 <b>${escapeHtml(body.event || 'Bildirim')}</b>\n${body.name ? `👤 ${name}\n` : ''}${body.email ? `📧 ${email}\n` : ''}🕐 ${time}`
  }
}

const ALLOWED_EVENTS = new Set([
  'member_signup',
  'member_login',
  'member_logout',
  'staff_login',
  'staff_logout',
  'admin_login',
])

export default async function handler(req, res) {
  if (handleOptions(req, res, 'POST, OPTIONS', 'Content-Type, Authorization')) return
  setCorsHeaders(res, 'POST, OPTIONS', 'Content-Type, Authorization', req)

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Yalnızca POST desteklenir' })
  }

  const auth = await requireAuth(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error })
  }

  const rl = await enforceRateLimit({ req, prefix: 'telegram-notify', limit: 30, windowMs: 60 * 60 * 1000 })
  applyRateLimitHeaders(res, rl.headers)
  if (!rl.ok) {
    return res.status(rl.status).json({ ok: false, error: rl.error })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    return res.status(503).json({ ok: false, error: 'Telegram yapılandırması eksik (Vercel env)' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const event = String(body?.event || '')
    if (!ALLOWED_EVENTS.has(event)) {
      return res.status(400).json({ ok: false, error: 'Geçersiz bildirim olayı' })
    }

    const text = buildMessage(body || {}, auth.user)

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

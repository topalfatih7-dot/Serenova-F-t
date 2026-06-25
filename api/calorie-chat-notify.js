/**
 * Kalori chat mesajları — Bize Ulaşın ile aynı Telegram chat'ine gider.
 * Vercel env: TELEGRAM_CONTACT_CHAT_ID + TELEGRAM_BOT_TOKEN
 */

import { setCorsHeaders, handleOptions, requireAuth, requireNotifySecret } from './_guards.js'

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildCalorieChatMessage(body) {
  const time = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
  return [
    '🍽 <b>Kalori Chat — Yeni mesaj</b>',
    '',
    `👤 <b>Üye:</b> ${escapeHtml(body.userName || '—')}`,
    `📧 <b>E-posta:</b> ${escapeHtml(body.userEmail || '—')}`,
    body.membership ? `💳 <b>Paket:</b> ${escapeHtml(body.membership)}` : '',
    '',
    `💬 <b>Ne yedi:</b>`,
    escapeHtml(body.text),
    '',
    `🕐 ${time}`,
  ].filter(Boolean).join('\n')
}

export default async function handler(req, res) {
  setCorsHeaders(res, 'POST, OPTIONS', 'Content-Type, Authorization, X-Notify-Secret')
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Yalnızca POST desteklenir' })
  }

  const auth = await requireAuth(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error })
  }

  const guard = requireNotifySecret(req)
  if (!guard.ok) {
    return res.status(guard.status).json({ ok: false, error: guard.error })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CONTACT_CHAT_ID

  if (!token || !chatId) {
    return res.status(503).json({
      ok: false,
      error: 'Telegram yapılandırması eksik (TELEGRAM_CONTACT_CHAT_ID)',
    })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const text = String(body?.text || '').trim()
    if (!text || text.length < 2) {
      return res.status(400).json({ ok: false, error: 'Metin gerekli' })
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildCalorieChatMessage({ ...body, text }),
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

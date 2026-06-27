/**
 * Başvuru bildirimleri — ayrı Telegram chat'lere yalnızca iletişim bilgileri.
 * Vercel env:
 *   TELEGRAM_STAFF_APPLICATION_CHAT_ID
 *   TELEGRAM_CORPORATE_APPLICATION_CHAT_ID
 */

import { setCorsHeaders, handleOptions, requireNotifySecret } from './_guards.js'
import { sendTelegramMessage } from './_telegramSend.js'

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatTime() {
  return new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
}

function buildStaffApplicationMessage(body) {
  return [
    '👨‍⚕️ <b>Yeni kadro başvurusu</b>',
    '',
    `👤 <b>Ad Soyad:</b> ${escapeHtml(body.name)}`,
    `📧 <b>E-posta:</b> ${escapeHtml(body.email)}`,
    `📱 <b>Telefon:</b> ${escapeHtml(body.phone || '—')}`,
    `🏷 <b>Rol:</b> ${escapeHtml(body.roleLabel || body.role || '—')}`,
    '',
    `🕐 ${formatTime()}`,
  ].join('\n')
}

function buildCorporateApplicationMessage(body) {
  return [
    '🏢 <b>Yeni kurumsal başvuru</b>',
    '',
    `🏢 <b>Şirket:</b> ${escapeHtml(body.companyName)}`,
    `👤 <b>Yetkili:</b> ${escapeHtml(body.contactName)}`,
    `📧 <b>E-posta:</b> ${escapeHtml(body.email)}`,
    `📱 <b>Telefon:</b> ${escapeHtml(body.phone || '—')}`,
    '',
    `🕐 ${formatTime()}`,
  ].join('\n')
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

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const type = body?.type

    if (type === 'staff_application') {
      const chatId = process.env.TELEGRAM_STAFF_APPLICATION_CHAT_ID
      if (!chatId) {
        return res.status(503).json({ ok: false, error: 'TELEGRAM_STAFF_APPLICATION_CHAT_ID tanımlı değil' })
      }
      if (!body?.name?.trim() || !body?.email?.includes('@')) {
        return res.status(400).json({ ok: false, error: 'İletişim bilgileri eksik' })
      }
      const result = await sendTelegramMessage({
        chatId,
        text: buildStaffApplicationMessage(body),
      })
      if (!result.ok) return res.status(502).json({ ok: false, error: result.error })
      return res.status(200).json({ ok: true })
    }

    if (type === 'corporate_application') {
      const chatId = process.env.TELEGRAM_CORPORATE_APPLICATION_CHAT_ID
      if (!chatId) {
        return res.status(503).json({ ok: false, error: 'TELEGRAM_CORPORATE_APPLICATION_CHAT_ID tanımlı değil' })
      }
      if (!body?.companyName?.trim() || !body?.contactName?.trim() || !body?.email?.includes('@')) {
        return res.status(400).json({ ok: false, error: 'İletişim bilgileri eksik' })
      }
      const result = await sendTelegramMessage({
        chatId,
        text: buildCorporateApplicationMessage(body),
      })
      if (!result.ok) return res.status(502).json({ ok: false, error: result.error })
      return res.status(200).json({ ok: true })
    }

    return res.status(400).json({ ok: false, error: 'Geçersiz bildirim türü' })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) })
  }
}

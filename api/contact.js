/**
 * Bize Ulaşın formu — ayrı Telegram chat'e gönderilir.
 * Vercel env: TELEGRAM_CONTACT_CHAT_ID (TELEGRAM_BOT_TOKEN ile aynı bot)
 */

const SUBJECT_LABELS = {
  general: 'Genel bilgi',
  membership: 'Üyelik & kayıt',
  premium: 'Premium paket',
  support: 'Teknik destek',
  partnership: 'İş birliği',
  other: 'Diğer',
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildContactMessage(body) {
  const time = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
  const subject = SUBJECT_LABELS[body.subject] || body.subject || '—'

  return [
    '📩 <b>Bize Ulaşın — Yeni mesaj</b>',
    '',
    `👤 <b>Ad Soyad:</b> ${escapeHtml(body.name)}`,
    `📧 <b>E-posta:</b> ${escapeHtml(body.email)}`,
    `📱 <b>Telefon:</b> ${escapeHtml(body.phone || '—')}`,
    `📋 <b>Konu:</b> ${escapeHtml(subject)}`,
    '',
    `💬 <b>Mesaj:</b>`,
    escapeHtml(body.message),
    '',
    `🕐 ${time}`,
  ].join('\n')
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Notify-Secret')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Yalnızca POST desteklenir' })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CONTACT_CHAT_ID

  if (!token || !chatId) {
    return res.status(503).json({
      ok: false,
      error: 'İletişim formu yapılandırması eksik (TELEGRAM_CONTACT_CHAT_ID)',
    })
  }

  const notifySecret = process.env.TELEGRAM_NOTIFY_SECRET
  if (notifySecret && req.headers['x-notify-secret'] !== notifySecret) {
    return res.status(401).json({ ok: false, error: 'Yetkisiz istek' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

    if (!body?.name?.trim() || !body?.email?.includes('@') || !body?.message?.trim()) {
      return res.status(400).json({ ok: false, error: 'Zorunlu alanlar eksik' })
    }

    if (body.message.trim().length < 10) {
      return res.status(400).json({ ok: false, error: 'Mesaj çok kısa' })
    }

    const text = buildContactMessage(body)

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

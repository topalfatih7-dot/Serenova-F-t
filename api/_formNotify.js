/** Public form Telegram mesaj şablonları (sunucu içi). */

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

const SUBJECT_LABELS = {
  general: 'Genel bilgi',
  membership: 'Üyelik & kayıt',
  premium: 'Premium paket',
  support: 'Teknik destek',
  partnership: 'İş birliği',
  other: 'Diğer',
}

export async function notifyContactTelegram(body) {
  const chatId = process.env.TELEGRAM_CONTACT_CHAT_ID
  if (!chatId) return { ok: false, skipped: true, error: 'TELEGRAM_CONTACT_CHAT_ID yok' }

  const subject = SUBJECT_LABELS[body.subject] || body.subject || '—'
  const text = [
    '📩 <b>Bize Ulaşın — Yeni mesaj</b>',
    '',
    `👤 <b>Ad Soyad:</b> ${escapeHtml(body.name)}`,
    `📧 <b>E-posta:</b> ${escapeHtml(body.email)}`,
    `📱 <b>Telefon:</b> ${escapeHtml(body.phone || '—')}`,
    `📋 <b>Konu:</b> ${escapeHtml(subject)}`,
    '',
    '💬 <b>Mesaj:</b>',
    escapeHtml(body.message),
    '',
    `🕐 ${formatTime()}`,
  ].join('\n')

  return sendTelegramMessage({ chatId, text })
}

export async function notifyStaffApplicationTelegram(body) {
  const chatId = process.env.TELEGRAM_STAFF_APPLICATION_CHAT_ID || process.env.TELEGRAM_CHAT_ID
  if (!chatId) return { ok: false, skipped: true, error: 'TELEGRAM_STAFF_APPLICATION_CHAT_ID / TELEGRAM_CHAT_ID yok' }

  const text = [
    '👨‍⚕️ <b>Yeni kadro başvurusu</b>',
    '',
    `👤 <b>Ad Soyad:</b> ${escapeHtml(body.name)}`,
    `📧 <b>E-posta:</b> ${escapeHtml(body.email)}`,
    `📱 <b>Telefon:</b> ${escapeHtml(body.phone || '—')}`,
    `🏷 <b>Rol:</b> ${escapeHtml(body.roleLabel || body.role || '—')}`,
    '',
    `🕐 ${formatTime()}`,
  ].join('\n')

  return sendTelegramMessage({ chatId, text })
}

export async function notifyCorporateApplicationTelegram(body) {
  const chatId = process.env.TELEGRAM_CORPORATE_APPLICATION_CHAT_ID || process.env.TELEGRAM_CHAT_ID
  if (!chatId) return { ok: false, skipped: true, error: 'TELEGRAM_CORPORATE_APPLICATION_CHAT_ID / TELEGRAM_CHAT_ID yok' }

  const text = [
    '🏢 <b>Yeni kurumsal başvuru</b>',
    '',
    `🏢 <b>Şirket:</b> ${escapeHtml(body.companyName)}`,
    `👤 <b>Yetkili:</b> ${escapeHtml(body.contactName)}`,
    `📧 <b>E-posta:</b> ${escapeHtml(body.email)}`,
    `📱 <b>Telefon:</b> ${escapeHtml(body.phone || '—')}`,
    '',
    `🕐 ${formatTime()}`,
  ].join('\n')

  return sendTelegramMessage({ chatId, text })
}

/**
 * Üye bildirimleri — Expo Push (mobil).
 * Eski başvuru notify yolu kapatıldı; formlar /api/contact kullanır.
 * Auth zorunlu. members.data.pushToken service role ile okunur.
 */

import { setCorsHeaders, handleOptions, requireAuth } from './_guards.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'
import {
  isExpoPushToken,
  notificationToPushData,
  sendExpoPushMessages,
} from './_expoPush.js'

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCorsHeaders(res, 'POST, OPTIONS', 'Content-Type, Authorization', req)
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST bekleniyor' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})

  // Eski başvuru payload'ı (isim/email formu) — artık /api/contact
  if (!body.memberId || !body.notification) {
    return res.status(410).json({
      ok: false,
      error: 'Bu endpoint başvuru için kapatıldı. Formlar /api/contact; mobil push için memberId + notification gönderin.',
    })
  }

  const auth = await requireAuth(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error })
  }

  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ ok: false, error: 'Supabase admin yapılandırılmadı' })
  }

  try {
    const memberId = body.memberId
    const notification = body.notification
    if (!notification?.title) {
      return res.status(400).json({ ok: false, error: 'notification.title gerekli' })
    }

    const admin = getSupabaseAdmin()
    const { data: row, error } = await admin
      .from('members')
      .select('data')
      .eq('id', memberId)
      .maybeSingle()

    if (error) return res.status(500).json({ ok: false, error: error.message })

    const data = row?.data || {}
    const settings = data.settings || {}
    if (settings.pushNotifs === false) {
      return res.status(200).json({ ok: true, skipped: true, reason: 'pushNotifs disabled' })
    }

    const token = data.pushToken
    if (!isExpoPushToken(token)) {
      return res.status(200).json({ ok: true, skipped: true, reason: 'no push token' })
    }

    const pushData = notificationToPushData(notification)
    const result = await sendExpoPushMessages([
      {
        to: token,
        title: String(notification.title).slice(0, 80),
        body: String(notification.message || notification.title).slice(0, 200),
        sound: 'default',
        data: pushData,
        channelId: 'default',
      },
    ])

    if (!result.ok) {
      return res.status(502).json({ ok: false, error: result.error })
    }
    return res.status(200).json({ ok: true, sent: result.sent })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Expo push hatası' })
  }
}

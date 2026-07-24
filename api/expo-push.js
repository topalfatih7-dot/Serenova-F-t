/**
 * Vercel Serverless — Expo Push gönderimi.
 * Auth zorunlu. memberId için members.data.pushToken okunur (service role).
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

  const auth = await requireAuth(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error })
  }

  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ ok: false, error: 'Supabase admin yapılandırılmadı' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const memberId = body.memberId
    const notification = body.notification
    if (!memberId || !notification?.title) {
      return res.status(400).json({ ok: false, error: 'memberId ve notification.title gerekli' })
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

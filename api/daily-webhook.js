/**
 * POST /api/daily-webhook
 * Daily.co olayları: recording.ready-to-download, recording.error
 */

import crypto from 'node:crypto'
import { getSupabaseAdmin } from './_supabaseAdmin.js'
import { parseRoomName, resolveSessionFromRoom } from './_dailyApi.js'

export const config = { api: { bodyParser: true } }

function verifyDailySignature(rawBody, headers) {
  const secret = process.env.DAILY_WEBHOOK_HMAC
  if (!secret) return true

  const signature = headers['x-webhook-signature']
  const timestamp = headers['x-webhook-timestamp']
  if (!signature || !timestamp) return false

  const payload = `${timestamp}.${JSON.stringify(rawBody)}`
  const base64DecodedSecret = Buffer.from(secret, 'base64')
  const hmac = crypto.createHmac('sha256', base64DecodedSecret)
  const computed = hmac.update(payload).digest('base64')
  return computed === signature
}

async function upsertRecording(admin, payload, status) {
  const roomName = payload.room_name
  if (!roomName) return

  const parsed = parseRoomName(roomName)
  if (!parsed) return

  const ctx = await resolveSessionFromRoom(admin, roomName)
  const recordedAt = payload.start_ts
    ? new Date(payload.start_ts * 1000).toISOString()
    : new Date().toISOString()

  const row = {
    daily_recording_id: payload.recording_id || payload.id,
    room_name: roomName,
    session_id: parsed.sessionId,
    session_type: parsed.sessionType,
    member_id: ctx?.memberId || null,
    member_name: ctx?.memberName || '',
    staff_name: ctx?.staffName || '',
    duration_sec: Number(payload.duration) || 0,
    status,
    recorded_at: recordedAt,
    updated_at: new Date().toISOString(),
    data: {
      s3_key: payload.s3_key || null,
      share_token: payload.share_token || null,
      max_participants: payload.max_participants || null,
    },
  }

  await admin
    .from('session_recordings')
    .upsert(row, { onConflict: 'daily_recording_id' })
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, test: true })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST bekleniyor' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})

  if (body.test === 'test') {
    return res.status(200).json({ ok: true })
  }

  if (!verifyDailySignature(body, req.headers)) {
    return res.status(401).json({ ok: false, error: 'Geçersiz imza' })
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return res.status(503).json({ ok: false, error: 'Supabase yapılandırması eksik' })
  }

  try {
    const eventType = body.type
    const payload = body.payload || {}

    if (eventType === 'recording.ready-to-download') {
      await upsertRecording(admin, payload, 'ready')
    } else if (eventType === 'recording.error') {
      await upsertRecording(admin, payload, 'error')
    } else if (eventType === 'recording.started') {
      await upsertRecording(admin, payload, 'processing')
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('[daily-webhook]', e)
    return res.status(200).json({ ok: true })
  }
}

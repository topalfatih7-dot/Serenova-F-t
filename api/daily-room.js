/**
 * Vercel Serverless — Daily.co oda oluşturma + katılım tokeni.
 * Cloud recording etkin; personel (owner) katılınca otomatik kayıt başlar.
 */

import { setCorsHeaders, handleOptions, requireAuth } from './_guards.js'
import { dailyFetch, getDailyDomain } from './_dailyApi.js'

async function ensureRoom(roomName) {
  try {
    const existing = await dailyFetch(`/rooms/${roomName}`)
    if (existing?.config?.enable_recording) return existing
    return dailyFetch(`/rooms/${roomName}`, {
      properties: { enable_recording: 'cloud' },
    }, 'POST')
  } catch (e) {
    if (!String(e).includes('404')) throw e
  }

  return dailyFetch('/rooms', {
    name: roomName,
    privacy: 'private',
    properties: {
      exp: Math.floor(Date.now() / 1000) + 7200,
      max_participants: 4,
      enable_screenshare: true,
      enable_chat: true,
      enable_recording: 'cloud',
      start_video_off: false,
      start_audio_off: false,
    },
  })
}

async function createToken(roomName, userName, isOwner) {
  const props = {
    room_name: roomName,
    user_name: userName || 'Katılımcı',
    is_owner: Boolean(isOwner),
    exp: Math.floor(Date.now() / 1000) + 3600,
    nbf: Math.floor(Date.now() / 1000) - 60,
  }

  if (isOwner) {
    props.start_cloud_recording = true
    props.enable_recording = 'cloud'
  }

  return dailyFetch('/meeting-tokens', { properties: props })
}

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST bekleniyor' })

  const auth = await requireAuth(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error })
  }

  if (!process.env.DAILY_API_KEY) {
    return res.status(503).json({ ok: false, error: 'DAILY_API_KEY tanımlı değil (opsiyonel)' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { roomName, userName, isOwner } = body || {}
    if (!roomName) return res.status(400).json({ ok: false, error: 'roomName gerekli' })

    await ensureRoom(roomName)
    const tokenData = await createToken(roomName, userName || 'Katılımcı', isOwner)
    const domain = getDailyDomain()

    return res.status(200).json({
      ok: true,
      token: tokenData.token,
      roomUrl: domain ? `https://${domain}/${roomName}` : null,
      recordingEnabled: true,
    })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) })
  }
}

/**
 * Vercel Serverless — Daily.co oda oluşturma + katılım tokeni.
 *
 * Neden sunucu tarafı?
 *  - DAILY_API_KEY gizli kalır (tarayıcıda görünmez).
 *  - Private oda → yalnızca token sahibi katılabilir (güvenli görüşme).
 *  - Token'ın süresi sınırlıdır (nbf/exp ile); URL'yi bilen herkes giremez.
 *
 * İstek: { roomName, userName, isOwner? }
 * Yanıt: { ok, token, roomUrl }
 *
 * DAILY_API_KEY yoksa 503 döner; uygulama tokensiz (public) modda çalışmaya devam eder.
 */

const DAILY_API = 'https://api.daily.co/v1'

function getDomain() {
  return (process.env.VITE_DAILY_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
}

async function dailyFetch(path, body) {
  const key = process.env.DAILY_API_KEY
  if (!key) throw new Error('DAILY_API_KEY yok')
  const res = await fetch(`${DAILY_API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Daily API ${res.status}: ${err.slice(0, 200)}`)
  }
  return res.json()
}

async function ensureRoom(roomName) {
  try {
    // Oda zaten var mı?
    return await dailyFetch(`/rooms/${roomName}`)
  } catch (e) {
    if (!String(e).includes('404')) throw e
  }
  // Yoksa oluştur: private (token zorunlu), 2 saatlik otomatik silme
  return dailyFetch('/rooms', {
    name: roomName,
    privacy: 'private',
    properties: {
      exp: Math.floor(Date.now() / 1000) + 7200, // 2 saat sonra odayı kapat
      max_participants: 4,
      enable_screenshare: true,
      enable_chat: true,
      start_video_off: false,
      start_audio_off: false,
    },
  })
}

async function createToken(roomName, userName, isOwner) {
  return dailyFetch('/meeting-tokens', {
    properties: {
      room_name: roomName,
      user_name: userName || 'Katılımcı',
      is_owner: Boolean(isOwner),
      exp: Math.floor(Date.now() / 1000) + 3600, // token 1 saat geçerli
      nbf: Math.floor(Date.now() / 1000) - 60,
    },
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST bekleniyor' })

  if (!process.env.DAILY_API_KEY) {
    return res.status(503).json({ ok: false, error: 'DAILY_API_KEY tanımlı değil (opsiyonel)' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { roomName, userName, isOwner } = body || {}
    if (!roomName) return res.status(400).json({ ok: false, error: 'roomName gerekli' })

    await ensureRoom(roomName)
    const tokenData = await createToken(roomName, userName || 'Katılımcı', isOwner)
    const domain = getDomain()

    return res.status(200).json({
      ok: true,
      token: tokenData.token,
      roomUrl: domain ? `https://${domain}/${roomName}` : null,
    })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) })
  }
}

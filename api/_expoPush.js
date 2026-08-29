/**
 * Expo Push API — member / staff outbound (application-notify).
 * Payload data matches mobile routeFromPushData / notifications navigate map.
 *
 * Ticket kontrol akışı:
 *   POST /v2/push/send → tickets[] → status 'ok' | 'error'
 *   error.details.error:
 *     DeviceNotRegistered → token geçersiz → DB'den sil
 *     InvalidCredentials  → APNs/FCM kimlik bilgisi eksik → log
 *     MessageTooBig       → payload boyutu → log
 *     MessageRateExceeded → hız sınırı → log
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const ANDROID_CHANNEL_ID = 'yeniform-alerts-v3'

/** Vercel ortam değişkeni varsa authenticated push (daha yüksek rate limit). */
function expoAuthHeaders() {
  const token = process.env.EXPO_ACCESS_TOKEN
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export function memberPushEnabled(memberData) {
  const settings = memberData?.settings || {}
  if (settings.pushNotifs === false) return false
  return true
}

export function staffPushEnabled(staffData) {
  const settings = staffData?.settings || {}
  if (settings.pushNotifs === false) return false
  return true
}

/** Navigate map fields for Expo `data` */
export function buildExpoPushData(notification = {}, extra = {}) {
  const data = {
    type: notification.type || '',
  }
  if (notification.staffRole) data.staffRole = String(notification.staffRole)
  if (notification.ticketId) data.ticketId = String(notification.ticketId)
  if (notification.action) data.action = String(notification.action)
  if (notification.threadId) data.threadId = String(notification.threadId)
  if (notification.programId) data.programId = String(notification.programId)
  if (notification.programType) data.programType = String(notification.programType)
  if (notification.memberId) data.memberId = String(notification.memberId)
  if (notification.sessionId) data.sessionId = String(notification.sessionId)
  const audience = extra.audience || notification.audience
  if (audience) data.audience = String(audience)
  const userId = extra.userId || notification.userId
  if (userId) data.userId = String(userId)
  const senderId = extra.senderId || notification.senderId
  if (senderId) data.senderId = String(senderId)
  return data
}

async function pushPrefsEnabled(admin, userId, audience) {
  if (audience === 'staff') {
    const { data: row, error } = await admin
      .from('staff')
      .select('data')
      .eq('id', userId)
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!staffPushEnabled(row?.data || {})) {
      return { ok: true, skipped: true, reason: 'push_prefs_off' }
    }
    return { ok: true }
  }

  const { data: row, error } = await admin
    .from('members')
    .select('data')
    .eq('id', userId)
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!memberPushEnabled(row?.data || {})) {
    return { ok: true, skipped: true, reason: 'push_prefs_off' }
  }
  return { ok: true }
}

/**
 * Expo ticket listesini kontrol et; geçersiz tokenları DB'den kaldır.
 * Ticket'lar array veya tek obje olabilir (tek mesaj gönderildiğinde).
 */
async function processTickets(admin, userId, tokens, rawTickets) {
  const ticketList = Array.isArray(rawTickets) ? rawTickets : [rawTickets]
  const staleTokens = []

  ticketList.forEach((ticket, i) => {
    if (!ticket || ticket.status === 'ok') return
    const errCode = ticket.details?.error || ticket.message || 'unknown'

    if (errCode === 'DeviceNotRegistered') {
      // Token geçersiz — DB'den kaldır
      const token = tokens[i]
      if (token) staleTokens.push(token)
    } else if (errCode === 'InvalidCredentials') {
      // APNs/FCM kimlik yapılandırma sorunu — Expo dashboard'unu kontrol et
      console.error('[expoPush] InvalidCredentials: APNs/FCM kimlik bilgisi eksik veya süresi dolmuş. Expo Dashboard > Credentials bölümünü kontrol edin.')
    } else if (errCode === 'MessageTooBig') {
      console.error('[expoPush] MessageTooBig: Push payload çok büyük.')
    } else {
      console.warn('[expoPush] ticket error:', errCode, ticket.message || '')
    }
  })

  if (staleTokens.length > 0) {
    try {
      await admin
        .from('device_push_tokens')
        .delete()
        .in('expo_push_token', staleTokens)
    } catch (e) {
      console.warn('[expoPush] stale token temizleme başarısız:', e?.message)
    }
  }

  return { staleTokens }
}

const CHAT_ECHO_TYPES = new Set(['chat', 'collab', 'admin-chat'])

/**
 * @param {object} [opts]
 * @param {'member' | 'staff'} [opts.audience]
 * @param {string} [opts.senderId] — chat/collab/admin-chat never echo to the author
 */
export async function sendExpoPushToUser(admin, userId, notification, opts = {}) {
  if (!admin || !userId || !notification?.title) {
    return { ok: false, skipped: true, reason: 'invalid' }
  }

  const senderId = opts.senderId || notification.senderId || null
  if (
    senderId
    && String(senderId) === String(userId)
    && CHAT_ECHO_TYPES.has(String(notification.type || ''))
  ) {
    return { ok: true, skipped: true, reason: 'self_sender' }
  }

  const audience = opts.audience || notification.audience || 'member'
  const prefs = await pushPrefsEnabled(admin, userId, audience)
  if (!prefs.ok) return prefs
  if (prefs.skipped) return prefs

  const { data: tokenRows, error: tokErr } = await admin
    .from('device_push_tokens')
    .select('expo_push_token, platform')
    .eq('user_id', userId)
  if (tokErr) return { ok: false, error: tokErr.message }
  if (!tokenRows?.length) {
    return { ok: true, skipped: true, reason: 'no_token' }
  }

  const data = buildExpoPushData(notification, {
    audience,
    userId,
    senderId,
  })

  const validTokenStrings = tokenRows
    .map((t) => String(t.expo_push_token || '').trim())
    .filter((token) => /^ExponentPushToken\[.+\]$/.test(token))

  const messages = validTokenStrings.map((token) => ({
    to: token,
    title: String(notification.title),
    body: String(notification.message || ''),
    data,
    sound: 'default',
    channelId: ANDROID_CHANNEL_ID,
    priority: 'high',
  }))

  console.log('[expoPush] send', {
    userId,
    audience,
    type: notification.type || '',
    senderId: senderId || null,
    tokens: validTokenStrings.length,
  })

  if (!messages.length) {
    return { ok: true, skipped: true, reason: 'no_valid_token' }
  }

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
        ...expoAuthHeaders(),
      },
      // Her zaman array gönder — tekil mesajda da tutarlı yanıt formatı
      body: JSON.stringify(messages),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      const errMsg = json?.errors?.[0]?.message || `Expo push HTTP ${res.status}`
      console.error('[expoPush] HTTP hata:', res.status, errMsg)
      return { ok: false, error: errMsg }
    }

    // Ticket kontrolü: başarısız gönderimler + stale token temizleme
    const tickets = json?.data || json
    const ticketArray = Array.isArray(tickets) ? tickets : [tickets]
    const { staleTokens } = await processTickets(admin, userId, validTokenStrings, ticketArray)

    const failedCount = ticketArray.filter((t) => t?.status === 'error').length
    if (failedCount > 0) {
      console.warn(`[expoPush] ${failedCount}/${ticketArray.length} push başarısız (userId=${userId})`)
    }

    return {
      ok: true,
      tickets,
      staleTokensRemoved: staleTokens.length,
    }
  } catch (err) {
    console.error('[expoPush] fetch hatası:', err?.message)
    return { ok: false, error: err?.message || 'Expo push failed' }
  }
}

export async function sendExpoPushToMember(admin, memberId, notification, opts = {}) {
  return sendExpoPushToUser(admin, memberId, notification, {
    ...opts,
    audience: 'member',
  })
}

export async function sendExpoPushToStaff(admin, staffId, notification, opts = {}) {
  return sendExpoPushToUser(admin, staffId, notification, {
    ...opts,
    audience: 'staff',
  })
}

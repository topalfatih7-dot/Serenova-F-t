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
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts'
const ANDROID_CHANNEL_ID = 'yeniform-alerts-v3'
const ANDROID_CHANNEL_SILENT = 'yeniform-alerts-v3-silent'
const EXPO_BATCH_SIZE = 100

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

function soundNotifsEnabled(rowData) {
  const settings = rowData?.settings || {}
  return settings.soundNotifs !== false
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
  if (notification.sessionType) data.sessionType = String(notification.sessionType)
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
    return { ok: true, sound: soundNotifsEnabled(row?.data || {}) }
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
  return { ok: true, sound: soundNotifsEnabled(row?.data || {}) }
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

export async function recordPushTickets(admin, rows) {
  if (!admin || !rows?.length) return
  const payload = rows
    .map((row) => {
      const ticketId = String(row.ticketId || '').trim()
      if (!ticketId) return null
      return {
        ticket_id: ticketId,
        user_id: row.userId || null,
        expo_push_token: row.token || null,
        status: 'pending',
      }
    })
    .filter(Boolean)
  if (!payload.length) return
  try {
    const { error } = await admin.from('push_receipts').upsert(payload, { onConflict: 'ticket_id' })
    if (error) console.warn('[expoPush] receipt kaydı', error.message)
  } catch (e) {
    console.warn('[expoPush] receipt kaydı', e?.message)
  }
}

async function postExpoPush(messages) {
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
      ...expoAuthHeaders(),
    },
    body: JSON.stringify(messages),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const errMsg = json?.errors?.[0]?.message || `Expo push HTTP ${res.status}`
    return { ok: false, error: errMsg, json }
  }
  const tickets = json?.data || json
  const ticketArray = Array.isArray(tickets) ? tickets : [tickets]
  return { ok: true, tickets: ticketArray, json }
}

export { EXPO_BATCH_SIZE, EXPO_RECEIPTS_URL, expoAuthHeaders }

const CHAT_ECHO_TYPES = new Set(['chat', 'collab', 'admin-chat'])

function expoCollapseId(notification, data) {
  const type = String(data?.type || notification?.type || '')
  const threadId = String(data?.threadId || notification?.threadId || '')
  if (CHAT_ECHO_TYPES.has(type) && threadId) return `${type}-${threadId}`
  return null
}

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
    console.log('[expoPush] skip', {
      userId,
      type: notification.type || '',
      reason: 'self_sender',
      senderId,
    })
    return { ok: true, skipped: true, reason: 'self_sender' }
  }

  const audience = opts.audience || notification.audience || 'member'
  const prefs = await pushPrefsEnabled(admin, userId, audience)
  if (!prefs.ok) return prefs
  if (prefs.skipped) {
    const payload = {
      userId,
      audience,
      type: notification.type || '',
      reason: prefs.reason || 'push_prefs_off',
    }
    if (audience === 'staff') console.warn('[expoPush] skip', payload)
    else console.log('[expoPush] skip', payload)
    return prefs
  }

  const soundOn = prefs.sound !== false
  const channelId = soundOn ? ANDROID_CHANNEL_ID : ANDROID_CHANNEL_SILENT

  const { data: tokenRows, error: tokErr } = await admin
    .from('device_push_tokens')
    .select('expo_push_token, platform')
    .eq('user_id', userId)
  if (tokErr) return { ok: false, error: tokErr.message }
  if (!tokenRows?.length) {
    const payload = {
      userId,
      audience,
      type: notification.type || '',
      reason: 'no_token',
    }
    if (audience === 'staff') console.warn('[expoPush] skip', payload)
    else console.log('[expoPush] skip', payload)
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

  const collapseId = expoCollapseId(notification, data)
  const messages = validTokenStrings.map((token) => ({
    to: token,
    title: String(notification.title),
    body: String(notification.message || ''),
    data,
    sound: soundOn ? 'default' : null,
    channelId,
    priority: 'high',
    ...(collapseId ? { collapseId } : {}),
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
    const posted = await postExpoPush(messages)
    if (!posted.ok) {
      console.error('[expoPush] HTTP hata:', posted.error)
      return { ok: false, error: posted.error }
    }

    const ticketArray = posted.tickets || []
    const { staleTokens } = await processTickets(admin, userId, validTokenStrings, ticketArray)

    await recordPushTickets(
      admin,
      ticketArray.map((ticket, i) => ({
        ticketId: ticket?.id,
        userId,
        token: validTokenStrings[i],
      })),
    )

    const failedCount = ticketArray.filter((t) => t?.status === 'error').length
    if (failedCount > 0) {
      console.warn(`[expoPush] ${failedCount}/${ticketArray.length} push başarısız (userId=${userId})`)
    }

    return {
      ok: true,
      tickets: ticketArray,
      staleTokensRemoved: staleTokens.length,
    }
  } catch (err) {
    console.error('[expoPush] fetch hatası:', err?.message)
    return { ok: false, error: err?.message || 'Expo push failed' }
  }
}

/**
 * Expo tek istekte en fazla 100 mesaj kabul eder.
 * @param {object} admin
 * @param {Array<{ userId: string, audience?: 'member'|'staff', notification: object, senderId?: string }>} jobs
 */
export async function sendExpoPushBatch(admin, jobs) {
  const results = new Map()
  if (!admin || !Array.isArray(jobs) || !jobs.length) return results

  const messages = []
  const messageMeta = []

  for (const job of jobs) {
    const userId = job?.userId
    const notification = job?.notification
    const audience = job.audience || notification?.audience || 'member'
    if (!userId || !notification?.title) {
      if (userId) results.set(userId, { ok: false, skipped: true, reason: 'invalid' })
      continue
    }

    const senderId = job.senderId || notification.senderId || null
    if (
      senderId
      && String(senderId) === String(userId)
      && CHAT_ECHO_TYPES.has(String(notification.type || ''))
    ) {
      results.set(userId, { ok: true, skipped: true, reason: 'self_sender' })
      continue
    }

    const prefs = await pushPrefsEnabled(admin, userId, audience)
    if (!prefs.ok) {
      results.set(userId, prefs)
      continue
    }
    if (prefs.skipped) {
      const payload = { userId, audience, type: notification.type || '', reason: prefs.reason || 'push_prefs_off' }
      if (audience === 'staff') console.warn('[expoPush] skip', payload)
      else console.log('[expoPush] skip', payload)
      results.set(userId, prefs)
      continue
    }

    const soundOn = prefs.sound !== false
    const channelId = soundOn ? ANDROID_CHANNEL_ID : ANDROID_CHANNEL_SILENT
    const { data: tokenRows, error: tokErr } = await admin
      .from('device_push_tokens')
      .select('expo_push_token, platform')
      .eq('user_id', userId)
    if (tokErr) {
      results.set(userId, { ok: false, error: tokErr.message })
      continue
    }
    const validTokenStrings = (tokenRows || [])
      .map((t) => String(t.expo_push_token || '').trim())
      .filter((token) => /^ExponentPushToken\[.+\]$/.test(token))
    if (!validTokenStrings.length) {
      const payload = { userId, audience, type: notification.type || '', reason: 'no_token' }
      if (audience === 'staff') console.warn('[expoPush] skip', payload)
      else console.log('[expoPush] skip', payload)
      results.set(userId, { ok: true, skipped: true, reason: 'no_token' })
      continue
    }

    const data = buildExpoPushData(notification, { audience, userId, senderId })
    const collapseId = expoCollapseId(notification, data)
    for (const token of validTokenStrings) {
      messages.push({
        to: token,
        title: String(notification.title),
        body: String(notification.message || ''),
        data,
        sound: soundOn ? 'default' : null,
        channelId,
        priority: 'high',
        ...(collapseId ? { collapseId } : {}),
      })
      messageMeta.push({ userId, token })
    }
    results.set(userId, { ok: true, queued: validTokenStrings.length })
  }

  for (let i = 0; i < messages.length; i += EXPO_BATCH_SIZE) {
    const chunk = messages.slice(i, i + EXPO_BATCH_SIZE)
    const meta = messageMeta.slice(i, i + EXPO_BATCH_SIZE)
    try {
      const posted = await postExpoPush(chunk)
      if (!posted.ok) {
        for (const row of meta) {
          results.set(row.userId, { ok: false, error: posted.error })
        }
        continue
      }
      const ticketArray = posted.tickets || []
      const tokens = meta.map((m) => m.token)
      await processTickets(admin, null, tokens, ticketArray)
      await recordPushTickets(
        admin,
        ticketArray.map((ticket, idx) => ({
          ticketId: ticket?.id,
          userId: meta[idx]?.userId,
          token: meta[idx]?.token,
        })),
      )
      ticketArray.forEach((ticket, idx) => {
        const userId = meta[idx]?.userId
        if (!userId) return
        if (ticket?.status === 'error') {
          results.set(userId, {
            ok: false,
            error: ticket.details?.error || ticket.message || 'Expo ticket error',
          })
        }
      })
    } catch (err) {
      for (const row of meta) {
        results.set(row.userId, { ok: false, error: err?.message || 'Expo push failed' })
      }
    }
  }

  return results
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

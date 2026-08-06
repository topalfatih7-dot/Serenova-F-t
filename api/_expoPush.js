/**
 * Expo Push API — member outbound (application-notify).
 * Payload data matches mobile routeFromPushData / notifications navigate map.
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

export function memberPushEnabled(memberData) {
  const settings = memberData?.settings || {}
  if (settings.pushNotifs === false) return false
  return true
}

/** Navigate map fields for Expo `data` */
export function buildExpoPushData(notification = {}) {
  const data = {
    type: notification.type || '',
  }
  if (notification.staffRole) data.staffRole = String(notification.staffRole)
  if (notification.ticketId) data.ticketId = String(notification.ticketId)
  if (notification.action) data.action = String(notification.action)
  if (notification.threadId) data.threadId = String(notification.threadId)
  if (notification.programId) data.programId = String(notification.programId)
  if (notification.programType) data.programType = String(notification.programType)
  return data
}

export async function sendExpoPushToMember(admin, memberId, notification) {
  if (!admin || !memberId || !notification?.title) {
    return { ok: false, skipped: true, reason: 'invalid' }
  }

  const { data: row, error: memberErr } = await admin
    .from('members')
    .select('data')
    .eq('id', memberId)
    .maybeSingle()
  if (memberErr) return { ok: false, error: memberErr.message }
  if (!memberPushEnabled(row?.data || {})) {
    return { ok: true, skipped: true, reason: 'push_prefs_off' }
  }

  const { data: tokens, error: tokErr } = await admin
    .from('device_push_tokens')
    .select('expo_push_token, platform')
    .eq('user_id', memberId)
  if (tokErr) return { ok: false, error: tokErr.message }
  if (!tokens?.length) {
    return { ok: true, skipped: true, reason: 'no_token' }
  }

  const data = buildExpoPushData(notification)
  const messages = tokens
    .map((t) => String(t.expo_push_token || '').trim())
    .filter((token) => /^ExponentPushToken\[.+\]$/.test(token))
    .map((token) => ({
      to: token,
      title: String(notification.title),
      body: String(notification.message || ''),
      data,
      sound: 'default',
      channelId: 'yeniform-alerts',
      priority: 'high',
    }))

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
      },
      body: JSON.stringify(messages.length === 1 ? messages[0] : messages),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: json?.errors?.[0]?.message || `Expo push HTTP ${res.status}` }
    }
    return { ok: true, tickets: json?.data || json }
  } catch (err) {
    return { ok: false, error: err?.message || 'Expo push failed' }
  }
}

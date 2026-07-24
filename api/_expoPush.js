/**
 * Expo Push Service helper (server-only).
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

export function isExpoPushToken(token) {
  return typeof token === 'string' && /^ExponentPushToken\[.+\]$/.test(token)
}

/** Navigate data for mobile deep links (parity with docs/mobile notifications map). */
export function notificationToPushData(notification) {
  if (!notification || typeof notification !== 'object') return {}
  const type = notification.type
  const data = {
    type: type || undefined,
    staffRole: notification.staffRole || undefined,
    threadId: notification.threadId || undefined,
    ticketId: notification.ticketId || undefined,
    action: notification.action || undefined,
  }

  if (type === 'chat' && notification.staffRole) {
    data.pathname = `/messages/${notification.staffRole}`
    if (notification.threadId) data.pathname = `/messages/${notification.threadId}`
  } else if (type === 'program') {
    data.pathname = '/programs'
  } else if (type === 'availability' || notification.action === 'availability') {
    data.pathname = '/calendar?avail=1'
  } else if (type === 'support-reply' || type === 'support') {
    data.pathname = '/profile/support'
  } else {
    data.pathname = '/profile/notifications'
    data.screen = 'notifications'
  }
  return data
}

export async function sendExpoPushMessages(messages) {
  const list = (Array.isArray(messages) ? messages : []).filter(
    (m) => m && isExpoPushToken(m.to),
  )
  if (list.length === 0) return { ok: true, sent: 0 }

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(list),
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, error: body?.errors?.[0]?.message || `Expo Push ${res.status}`, sent: 0 }
  }
  return { ok: true, sent: list.length, tickets: body?.data }
}

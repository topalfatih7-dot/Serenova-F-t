import { supabase } from './supabaseClient'
import { getApiAuthHeaders } from './apiAuth'

const nowISO = () => new Date().toISOString()

const COLLAB_SENDER_TITLE = {
  coach: 'Koçtan ekip mesajı',
  dietitian: 'Diyetisyenden ekip mesajı',
  doctor: 'Doktordan ekip mesajı',
}

/**
 * Expo push: staff outbound.
 * `memberId` top-level ASLA Expo hedefi değildir —
 * buraya danışan id'si yazılırsa gönderen kendi push'unu alır.
 * Bkz. application-notify.js handleStaffOutbound.
 */
async function dispatchStaffOutbound(staffId, notification, extra = {}) {
  try {
    const headers = await getApiAuthHeaders()
    await fetch('/api/application-notify', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        audience: 'staff',
        staffId,
        notification,
        threadId: extra.threadId ?? notification.threadId ?? null,
        sessionId: extra.sessionId ?? notification.sessionId ?? null,
      }),
    })
  } catch {
    /* ignore — in-app notification must not fail */
  }
}

export function buildStaffNotification({ type, title, message, ...extra }) {
  return {
    id: `n-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    title,
    message,
    read: false,
    createdAt: nowISO(),
    ...extra,
  }
}

export function buildAppointmentStaffNotification({
  memberId,
  memberName,
  sessionId,
  sessionType,
  startsAt,
}) {
  const when = startsAt
    ? new Date(startsAt).toLocaleString('tr-TR', {
      timeZone: 'Europe/Istanbul',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : ''
  return buildStaffNotification({
    type: 'appointment',
    title: 'Yeni randevu',
    message: `${memberName || 'Danışan'}${when ? ` — ${when}` : ''}`,
    memberId: memberId || null,
    sessionId: sessionId || null,
    sessionType: sessionType || null,
    startsAt: startsAt || null,
  })
}

/** staff.data.notifications — RPC ile atomik ekleme + Expo push. */
export async function pushStaffNotification(staffId, notification, outboundExtra = {}) {
  if (!staffId || !notification?.title) {
    return { success: false, error: 'Eksik bildirim bilgisi' }
  }
  if (!supabase) return { success: false, error: 'Supabase yok' }

  const { error } = await supabase.rpc('append_staff_notification', {
    p_staff_id: staffId,
    p_notification: notification,
  })
  if (error) {
    console.warn('[staffNotifications] append_staff_notification', error.message)
  }
  await dispatchStaffOutbound(staffId, notification, outboundExtra)
  return error ? { success: false, error: error.message } : { success: true }
}

/** Okundu / tüm liste yazma — personelin kendi satırı. */
export async function setStaffNotifications(notifications) {
  if (!supabase) return { success: false, error: 'Supabase yok' }
  const { error } = await supabase.rpc('staff_set_notifications', {
    p_notifications: Array.isArray(notifications) ? notifications : [],
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

/** Atomik okundu — tüm staff.data blob'unu ezmez. p_ids yoksa hepsi. */
export async function markStaffNotificationsRead(ids = null) {
  if (!supabase) return { success: false, error: 'Supabase yok' }
  const { data, error } = await supabase.rpc('mark_staff_notifications_read', {
    p_ids: Array.isArray(ids) ? ids.filter(Boolean) : null,
  })
  if (error) return { success: false, error: error.message, notifications: null }
  return { success: true, notifications: Array.isArray(data) ? data : [] }
}

export async function notifyStaffChatMessage({
  staffId,
  memberId,
  memberName,
  preview,
  threadId,
}) {
  const name = memberName || 'Danışan'
  return pushStaffNotification(
    staffId,
    buildStaffNotification({
      type: 'chat',
      title: `${name} yeni mesaj gönderdi`,
      message: preview || 'Yeni bir mesajınız var.',
      threadId: threadId || null,
      memberId: memberId || null,
      senderId: memberId || null,
      audience: 'staff',
    }),
    { threadId: threadId || null },
  )
}

export async function notifyStaffAdminMessage({ staffId, preview, threadId }) {
  if (!staffId) return { success: false, error: 'Personel yok.' }
  return pushStaffNotification(
    staffId,
    buildStaffNotification({
      type: 'admin-chat',
      title: 'Yönetimden yeni mesaj',
      message: preview || 'Yeni bir mesajınız var.',
      threadId: threadId || null,
      audience: 'staff',
    }),
    { threadId: threadId || null },
  )
}

export function collabNotificationTitle(senderRole) {
  return COLLAB_SENDER_TITLE[String(senderRole || '')] || 'Ekip mesajı'
}

export async function notifyStaffCollabMessage({
  staffId,
  preview,
  threadId,
  memberId,
  memberName,
  senderRole,
  senderId,
}) {
  if (!staffId) return { success: false, error: 'Personel yok.' }
  const title = collabNotificationTitle(senderRole)
  return pushStaffNotification(
    staffId,
    buildStaffNotification({
      type: 'collab',
      title,
      message: memberName ? `${memberName}: ${preview}` : (preview || 'Yeni bir mesajınız var.'),
      threadId: threadId || null,
      memberId: memberId || null,
      senderId: senderId || null,
      audience: 'staff',
    }),
    { threadId: threadId || null },
  )
}

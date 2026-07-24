import { supabase } from './supabaseClient'

const nowISO = () => new Date().toISOString()

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

/** staff.data.notifications — RPC ile atomik ekleme. */
export async function pushStaffNotification(staffId, notification) {
  if (!staffId || !notification?.title) {
    return { success: false, error: 'Eksik bildirim bilgisi' }
  }
  if (!supabase) return { success: false, error: 'Supabase yok' }

  const { error } = await supabase.rpc('append_staff_notification', {
    p_staff_id: staffId,
    p_notification: notification,
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
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

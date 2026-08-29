import { supabase } from './supabaseClient'
import { getApiAuthHeaders } from './apiAuth'

const nowISO = () => new Date().toISOString()

/** Fire-and-forget WhatsApp outbound (Meta Cloud API). */
async function dispatchOutbound(memberId, notification, extra = {}) {
  try {
    const headers = await getApiAuthHeaders()
    await fetch('/api/application-notify', {
      method: 'POST',
      headers,
      body: JSON.stringify({ memberId, notification, ...extra }),
    })
  } catch {
    /* ignore */
  }
}

export function buildMemberNotification({ type, title, message, ...extra }) {
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

const STAFF_ROLE_LABELS = {
  coach: 'Koçunuz',
  dietitian: 'Diyetisyeniniz',
  doctor: 'Doktorunuz',
}

export function staffRoleNotificationLabel(role) {
  return STAFF_ROLE_LABELS[role] || 'Uzmanınız'
}

/** members.data.notifications — RPC ile atomik ekleme (RLS güvenli). */
export async function pushMemberNotification(memberId, notification, outboundExtra = {}) {
  if (!memberId || !notification?.title) {
    return { success: false, error: 'Eksik bildirim bilgisi' }
  }

  const { error } = await supabase.rpc('append_member_notification', {
    p_member_id: memberId,
    p_notification: notification,
  })

  if (error) return { success: false, error: error.message }
  void dispatchOutbound(memberId, notification, outboundExtra)
  return { success: true }
}

/** Atomik okundu — tüm members.data blob'unu ezmez. p_ids yoksa hepsi. */
export async function markMemberNotificationsRead(ids = null) {
  if (!supabase) return { success: false, error: 'Supabase yok' }
  const { data, error } = await supabase.rpc('mark_member_notifications_read', {
    p_ids: Array.isArray(ids) ? ids.filter(Boolean) : null,
  })
  if (error) return { success: false, error: error.message, notifications: null }
  return { success: true, notifications: Array.isArray(data) ? data : [] }
}

export async function notifyMemberProgram({ memberId, staffName, title, programType, programId }) {
  const typeLabel = programType === 'nutrition' ? 'Beslenme' : 'Antrenman'
  return pushMemberNotification(memberId, buildMemberNotification({
    type: 'program',
    title: `Yeni ${typeLabel} Programı`,
    message: `${staffName || 'Uzmanınız'} size "${title}" programını hazırladı. Programlarım bölümünden inceleyebilirsiniz.`,
    programId: programId || null,
    programType: programType || 'workout',
  }), {
    staffName: staffName || null,
    programTitle: title || typeLabel,
    programType: programType || 'workout',
  })
}

const STAFF_ROLE_FROM_LABELS = {
  coach: 'Koçunuzdan',
  dietitian: 'Diyetisyeninizden',
  doctor: 'Doktorunuzdan',
}

export async function notifyMemberChatMessage({ memberId, preview, threadId, staffRole }) {
  const fromLabel = STAFF_ROLE_FROM_LABELS[String(staffRole || '')] || 'Uzmanınızdan'
  return pushMemberNotification(memberId, buildMemberNotification({
    type: 'chat',
    title: `${fromLabel} yeni mesaj`,
    message: preview,
    threadId: threadId || null,
    staffRole: staffRole || null,
  }), {
    threadId: threadId || null,
    staffRole: staffRole || null,
  })
}

/** Cancel / reschedule → WhatsApp + staff in-app (server). */
export async function notifyWhatsAppEvent(event, payload = {}) {
  try {
    const headers = await getApiAuthHeaders()
    await fetch('/api/application-notify', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'whatsapp-event', event, ...payload }),
    })
  } catch {
    /* ignore */
  }
}

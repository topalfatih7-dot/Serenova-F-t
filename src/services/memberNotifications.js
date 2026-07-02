import { supabase } from './supabaseClient'

const nowISO = () => new Date().toISOString()

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
export async function pushMemberNotification(memberId, notification) {
  if (!memberId || !notification?.title) {
    return { success: false, error: 'Eksik bildirim bilgisi' }
  }

  const { error } = await supabase.rpc('append_member_notification', {
    p_member_id: memberId,
    p_notification: notification,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function notifyMemberProgram({ memberId, staffName, title, programType, programId }) {
  const typeLabel = programType === 'nutrition' ? 'Beslenme' : 'Antrenman'
  return pushMemberNotification(memberId, buildMemberNotification({
    type: 'program',
    title: `Yeni ${typeLabel} Programı`,
    message: `${staffName || 'Uzmanınız'} size "${title}" programını hazırladı. Programlarım bölümünden inceleyebilirsiniz.`,
    programId: programId || null,
    programType: programType || 'workout',
  }))
}

export async function notifyMemberChatMessage({ memberId, preview, threadId, staffRole }) {
  const roleLabel = staffRoleNotificationLabel(staffRole)
  return pushMemberNotification(memberId, buildMemberNotification({
    type: 'chat',
    title: `${roleLabel}den yeni mesaj`,
    message: preview,
    threadId: threadId || null,
    staffRole: staffRole || null,
  }))
}

/**
 * Personel randevu talebi onay / red.
 * POST /api/auth { action: 'respond-session', memberId, sessionId, sessionType, decision: 'approve'|'reject' }
 */
import { getSessionJoinTiming } from './_videoJoinWindows.js'

const TZ = 'Europe/Istanbul'
const SESSION_KEYS = { coach: 'coachSessions', dietitian: 'dietitianSessions', doctor: 'doctorSessions' }

function sessionKey(type) {
  return SESSION_KEYS[type] || 'dietitianSessions'
}

function assignColumn(type) {
  if (type === 'coach') return 'assigned_coach_id'
  if (type === 'doctor') return 'assigned_doctor_id'
  return 'assigned_dietitian_id'
}

export async function respondSessionForStaff(admin, staffAuthUser, {
  memberId,
  sessionId,
  sessionType,
  decision,
}) {
  const type = String(sessionType || '').toLowerCase()
  const dec = String(decision || '').toLowerCase()
  if (!['coach', 'dietitian', 'doctor'].includes(type)) {
    return { ok: false, error: 'Geçersiz randevu türü.' }
  }
  if (!['approve', 'reject'].includes(dec)) {
    return { ok: false, error: 'Geçersiz karar.' }
  }
  if (!memberId || !sessionId) {
    return { ok: false, error: 'Eksik parametre.' }
  }

  const staffEmail = (staffAuthUser.email || '').trim().toLowerCase()
  if (!staffEmail) return { ok: false, error: 'Personel oturumu geçersiz.' }

  const { data: staffRow, error: staffErr } = await admin
    .from('staff')
    .select('id, name, role, data')
    .ilike('email', staffEmail)
    .maybeSingle()
  if (staffErr || !staffRow) return { ok: false, error: 'Personel kaydı bulunamadı.' }

  const col = assignColumn(type)
  const { data: memberRow, error: memberErr } = await admin
    .from('members')
    .select('id, name, data, assigned_coach_id, assigned_dietitian_id, assigned_doctor_id')
    .eq('id', memberId)
    .maybeSingle()
  if (memberErr || !memberRow) return { ok: false, error: 'Üye bulunamadı.' }

  const assignedId = memberRow[col]
  if (String(assignedId || '') !== String(staffRow.id)) {
    return { ok: false, error: 'Bu danışan için yetkiniz yok.' }
  }

  const key = sessionKey(type)
  const data = { ...(memberRow.data || {}) }
  const sessions = Array.isArray(data[key]) ? [...data[key]] : []
  const idx = sessions.findIndex((s) => String(s?.id) === String(sessionId))
  if (idx < 0) return { ok: false, error: 'Randevu bulunamadı.' }

  const session = sessions[idx]
  if ((session.status || 'scheduled') !== 'pending') {
    return { ok: false, error: 'Bu randevu onay bekleyen durumda değil.' }
  }

  if (dec === 'approve') {
    const timing = getSessionJoinTiming(session, type)
    if (timing.isExpired) {
      return { ok: false, error: 'Görüşme saati geçti. Talebi reddedip üyenin yeniden randevu almasını sağlayın.' }
    }
  }

  const nextStatus = dec === 'approve' ? 'scheduled' : 'rejected'
  sessions[idx] = {
    ...session,
    status: nextStatus,
    respondedAt: new Date().toISOString(),
    respondedBy: staffRow.id,
  }
  data[key] = sessions

  const when = session.date
    ? new Intl.DateTimeFormat('tr-TR', {
      timeZone: TZ,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(session.date))
    : ''
  const notification = {
    id: `n-appt-${dec}-${Date.now().toString(36)}`,
    type: 'appointment',
    title: dec === 'approve' ? 'Randevunuz onaylandı' : 'Randevu talebiniz reddedildi',
    message: dec === 'approve'
      ? `${when} tarihli görüşmeniz onaylandı.`
      : `${when} tarihli talebiniz reddedildi. Yeni bir randevu talep edebilirsiniz.`,
    read: false,
    createdAt: new Date().toISOString(),
    sessionId: session.id,
    sessionType: type,
    startsAt: session.date,
  }
  const prevNotes = Array.isArray(data.notifications) ? data.notifications : []
  data.notifications = [notification, ...prevNotes].slice(0, 100)

  const { error: updErr } = await admin
    .from('members')
    .update({ data, updated_at: new Date().toISOString() })
    .eq('id', memberId)
  if (updErr) return { ok: false, error: updErr.message }

  return { ok: true, session: sessions[idx] }
}

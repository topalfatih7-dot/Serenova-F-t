/**
 * Üye yeniden planlama — ≥24s kuralı + mevcut +3/+5 gün.
 * POST /api/auth { action: 'reschedule-session', sessionId, sessionType, days? }
 */
import { sendExpoPushToStaff } from './_expoPush.js'

const TZ = 'Europe/Istanbul'
const CANCEL_NOTICE_MS = 24 * 60 * 60 * 1000
const SESSION_KEYS = { coach: 'coachSessions', dietitian: 'dietitianSessions', doctor: 'doctorSessions' }

function sessionKey(type) {
  return SESSION_KEYS[type] || 'dietitianSessions'
}

function defaultDays(type) {
  return type === 'coach' ? 3 : 5
}

function assignColumn(type) {
  if (type === 'coach') return 'assigned_coach_id'
  if (type === 'doctor') return 'assigned_doctor_id'
  return 'assigned_dietitian_id'
}

function formatWhen(dateISO) {
  if (!dateISO) return ''
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateISO))
}

export async function rescheduleSessionForMember(admin, userId, {
  sessionId,
  sessionType,
  days,
}) {
  const type = String(sessionType || '').toLowerCase()
  if (!['coach', 'dietitian', 'doctor'].includes(type)) {
    return { ok: false, error: 'Geçersiz randevu türü.' }
  }
  if (!sessionId) return { ok: false, error: 'Eksik parametre.' }

  const { data: memberRow, error } = await admin
    .from('members')
    .select('id, name, data, assigned_coach_id, assigned_dietitian_id, assigned_doctor_id')
    .eq('id', userId)
    .maybeSingle()
  if (error || !memberRow) return { ok: false, error: 'Üye kaydı bulunamadı.' }

  const key = sessionKey(type)
  const data = { ...(memberRow.data || {}) }
  const sessions = Array.isArray(data[key]) ? [...data[key]] : []
  const idx = sessions.findIndex((s) => String(s?.id) === String(sessionId))
  if (idx < 0) return { ok: false, error: 'Randevu bulunamadı.' }

  const session = sessions[idx]
  const status = session.status || 'scheduled'
  if (status !== 'scheduled' && status !== 'rescheduled') {
    return { ok: false, error: 'Bu randevu yeniden planlanamaz.' }
  }

  const start = new Date(session.date || '')
  if (Number.isNaN(start.getTime())) return { ok: false, error: 'Randevu tarihi geçersiz.' }
  if (start.getTime() - Date.now() < CANCEL_NOTICE_MS) {
    return { ok: false, error: 'Randevuya 24 saatten az kaldığı için yeniden planlama yapılamaz.' }
  }

  const shift = Math.max(1, Number(days) || defaultDays(type))
  const nextDate = new Date(start.getTime() + shift * 24 * 60 * 60 * 1000)

  sessions[idx] = {
    ...session,
    date: nextDate.toISOString(),
    status: 'rescheduled',
  }
  data[key] = sessions

  const { error: updErr } = await admin
    .from('members')
    .update({ data, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (updErr) return { ok: false, error: updErr.message }

  const staffId = memberRow[assignColumn(type)]
  if (staffId) {
    try {
      const { data: staffRow } = await admin.from('staff').select('data').eq('id', staffId).maybeSingle()
      if (staffRow) {
        const notification = {
          id: `n-reschedule-${Date.now().toString(36)}`,
          type: 'appointment',
          title: 'Randevu yeniden planlandı',
          message: `${memberRow.name || 'Danışan'} — ${formatWhen(session.date)} → ${formatWhen(sessions[idx].date)}`,
          read: false,
          createdAt: new Date().toISOString(),
          audience: 'staff',
          memberId: userId,
          sessionId: session.id,
          sessionType: type,
          startsAt: sessions[idx].date,
        }
        const staffData = { ...(staffRow.data || {}) }
        const prev = Array.isArray(staffData.notifications) ? staffData.notifications : []
        staffData.notifications = [notification, ...prev].slice(0, 100)
        await admin.from('staff').update({ data: staffData }).eq('id', staffId)
        await sendExpoPushToStaff(admin, staffId, notification, { senderId: userId })
      }
    } catch {
      /* randevu kaydı asıl; bildirim opsiyonel */
    }
  }

  return {
    ok: true,
    session: sessions[idx],
    oldStartsAt: session.date,
    newStartsAt: sessions[idx].date,
  }
}

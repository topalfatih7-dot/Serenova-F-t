/**
 * Üye yeniden planlama — ≥24s kuralı + mevcut +3/+5 gün.
 * POST /api/auth { action: 'reschedule-session', sessionId, sessionType, days? }
 */
const CANCEL_NOTICE_MS = 24 * 60 * 60 * 1000
const SESSION_KEYS = { coach: 'coachSessions', dietitian: 'dietitianSessions', doctor: 'doctorSessions' }

function sessionKey(type) {
  return SESSION_KEYS[type] || 'dietitianSessions'
}

function defaultDays(type) {
  return type === 'coach' ? 3 : 5
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
    .select('id, data')
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

  return {
    ok: true,
    session: sessions[idx],
    oldStartsAt: session.date,
    newStartsAt: sessions[idx].date,
  }
}

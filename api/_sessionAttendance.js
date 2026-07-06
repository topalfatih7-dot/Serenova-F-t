/**
 * Görüşme katılım kaydı — members.data içindeki seans objesine yazar.
 */

const SESSION_KEYS = {
  coach: 'coachSessions',
  dietitian: 'dietitianSessions',
  doctor: 'doctorSessions',
}

function applyAttendanceEvent(attendance = {}, role, event, at = new Date().toISOString()) {
  const side = role === 'staff' ? 'staff' : 'member'
  const current = attendance[side] || {}

  if (event === 'join') {
    return {
      ...attendance,
      [side]: current.joinedAt ? current : { role: side, joinedAt: at },
    }
  }

  if (event === 'leave' && current.joinedAt) {
    return {
      ...attendance,
      [side]: { ...current, leftAt: at },
    }
  }

  return attendance
}

function computeOverlapMinutes(memberSeg, staffSeg) {
  const toMs = (iso) => {
    const t = new Date(iso).getTime()
    return Number.isNaN(t) ? null : t
  }
  if (!memberSeg?.joinedAt || !staffSeg?.joinedAt) return 0
  const mStart = toMs(memberSeg.joinedAt)
  const mEnd = toMs(memberSeg.leftAt || new Date().toISOString())
  const sStart = toMs(staffSeg.joinedAt)
  const sEnd = toMs(staffSeg.leftAt || new Date().toISOString())
  if (mStart == null || mEnd == null || sStart == null || sEnd == null) return 0
  const overlapStart = Math.max(mStart, sStart)
  const overlapEnd = Math.min(mEnd, sEnd)
  if (overlapEnd <= overlapStart) return 0
  return Math.floor((overlapEnd - overlapStart) / 60_000)
}

function evaluateBillable(attendance, minOverlap = 5) {
  const memberSeg = attendance?.member
  const staffSeg = attendance?.staff
  if (!memberSeg?.joinedAt) return { billable: false, overlapMinutes: 0 }
  if (!staffSeg?.joinedAt) return { billable: false, overlapMinutes: 0 }
  const overlapMinutes = computeOverlapMinutes(memberSeg, staffSeg)
  return {
    billable: overlapMinutes >= minOverlap,
    overlapMinutes,
  }
}

async function findMemberSession(admin, userId, sessionType, sessionId, isStaff) {
  const key = SESSION_KEYS[sessionType]
  if (!key) return { error: 'Geçersiz seans türü.' }

  if (isStaff) {
    const { data: staffRow } = await admin.from('staff').select('id, role').eq('id', userId).maybeSingle()
    if (!staffRow || staffRow.role !== sessionType) {
      return { error: 'Bu görüşmeye erişiminiz yok.' }
    }

    const { data: members } = await admin.from('members').select('id, name, data')
    for (const member of members || []) {
      const assignKey = sessionType === 'coach'
        ? 'assignedCoachId'
        : sessionType === 'dietitian'
          ? 'assignedDietitianId'
          : 'assignedDoctorId'
      if (String(member.data?.[assignKey]) !== String(userId)) continue
      const sessions = member.data?.[key] || []
      const idx = sessions.findIndex((s) => s.id === sessionId)
      if (idx >= 0) {
        return { member, key, idx, session: sessions[idx], role: 'staff' }
      }
    }
    return { error: 'Randevu bulunamadı.' }
  }

  const { data: member, error } = await admin
    .from('members')
    .select('id, name, data')
    .eq('id', userId)
    .maybeSingle()
  if (error || !member) return { error: 'Üye kaydı bulunamadı.' }

  const sessions = member.data?.[key] || []
  const idx = sessions.findIndex((s) => s.id === sessionId)
  if (idx < 0) return { error: 'Randevu bulunamadı.' }
  return { member, key, idx, session: sessions[idx], role: 'member' }
}

export async function recordSessionAttendance(admin, userId, { sessionType, sessionId, event }, { isStaff = false } = {}) {
  if (!sessionType || !sessionId || !['join', 'leave'].includes(event)) {
    return { ok: false, error: 'sessionType, sessionId ve event (join|leave) gerekli.' }
  }

  const found = await findMemberSession(admin, userId, sessionType, sessionId, isStaff)
  if (found.error) return { ok: false, error: found.error }

  const { member, key, idx, session, role } = found
  const attendance = applyAttendanceEvent(session.attendance || {}, role, event)
  const evaluation = evaluateBillable(attendance)

  const updatedSession = {
    ...session,
    attendance: {
      ...attendance,
      overlapMinutes: evaluation.overlapMinutes,
      billable: evaluation.billable,
      evaluatedAt: new Date().toISOString(),
    },
    ...(evaluation.billable && session.status === 'scheduled' ? { status: 'completed' } : {}),
  }

  const data = { ...(member.data || {}) }
  const sessions = [...(data[key] || [])]
  sessions[idx] = updatedSession
  data[key] = sessions

  const { error: updErr } = await admin
    .from('members')
    .update({ data, updated_at: new Date().toISOString() })
    .eq('id', member.id)

  if (updErr) return { ok: false, error: updErr.message }
  return { ok: true, attendance: updatedSession.attendance }
}

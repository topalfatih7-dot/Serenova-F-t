/**
 * Video görüşme katılımı → seans attendance + staff_earnings.
 * HTTP: POST /api/auth { action: 'session-attendance', sessionId, sessionType, event: 'join'|'leave' }
 */

const SESSION_KEYS = {
  coach: 'coachSessions',
  dietitian: 'dietitianSessions',
  doctor: 'doctorSessions',
}

const EARNING_TYPE = {
  coach: 'coach_session',
  dietitian: 'dietitian_session',
  doctor: 'doctor_session',
}

const ASSIGN_COL = {
  coach: 'assigned_coach_id',
  dietitian: 'assigned_dietitian_id',
  doctor: 'assigned_doctor_id',
}

const STAFF_MIN_OVERLAP_MINUTES = 15
const STAFF_SESSION_RATE_TRY = 500
const BILLABLE_TYPES = new Set(['coach_session', 'dietitian_session'])

function toMs(iso) {
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? null : t
}

function computeOverlapMinutes(memberSeg, staffSeg) {
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

function evaluateSessionBillable(session, attendance) {
  if (!session || session.status === 'cancelled') {
    return { billable: false, reason: 'Randevu iptal edilmiş.', overlapMinutes: 0 }
  }
  const memberSeg = attendance?.member
  const staffSeg = attendance?.staff
  if (!memberSeg?.joinedAt) return { billable: false, reason: 'Üye videoya katılmadı.', overlapMinutes: 0 }
  if (!staffSeg?.joinedAt) return { billable: false, reason: 'Personel videoya katılmadı.', overlapMinutes: 0 }
  const overlapMinutes = computeOverlapMinutes(memberSeg, staffSeg)
  if (overlapMinutes < STAFF_MIN_OVERLAP_MINUTES) {
    return {
      billable: false,
      reason: `Eşzamanlı görüşme süresi yetersiz (${overlapMinutes}/${STAFF_MIN_OVERLAP_MINUTES} dk).`,
      overlapMinutes,
    }
  }
  return { billable: true, overlapMinutes, reason: null }
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

function buildSessionAttendancePatch(session, attendance) {
  const evaluation = evaluateSessionBillable(session, attendance)
  return {
    attendance: {
      ...attendance,
      overlapMinutes: evaluation.overlapMinutes ?? attendance?.overlapMinutes ?? 0,
      billable: evaluation.billable,
      evaluatedAt: new Date().toISOString(),
      rejectReason: evaluation.billable ? null : evaluation.reason,
    },
    status: evaluation.billable ? 'completed' : session.status,
  }
}

function isoWeekPeriodKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export async function resolveCaller(admin, user) {
  const email = String(user.email || '').toLowerCase()
  if (email) {
    const { data: staffRow } = await admin
      .from('staff')
      .select('id, email, role')
      .ilike('email', email)
      .maybeSingle()
    if (staffRow) {
      return { kind: 'staff', staffId: staffRow.id, role: staffRow.role, userId: user.id }
    }
  }
  return { kind: 'member', memberId: user.id, userId: user.id }
}

export async function findSessionContext(admin, sessionId, sessionTypeHint, caller) {
  const types = sessionTypeHint && SESSION_KEYS[sessionTypeHint]
    ? [sessionTypeHint]
    : ['coach', 'dietitian', 'doctor']

  if (caller.kind === 'member') {
    const { data: row, error } = await admin
      .from('members')
      .select('id, assigned_coach_id, assigned_dietitian_id, assigned_doctor_id, data')
      .eq('id', caller.memberId)
      .maybeSingle()
    if (error || !row) return { ok: false, error: 'Üye bulunamadı.' }

    for (const type of types) {
      const key = SESSION_KEYS[type]
      const list = row.data?.[key] || []
      const idx = list.findIndex((s) => s?.id === sessionId)
      if (idx >= 0) {
        return {
          ok: true,
          memberId: row.id,
          sessionType: type,
          sessionKey: key,
          sessionIndex: idx,
          session: list[idx],
          sessions: list,
          memberRow: row,
          staffId: row[ASSIGN_COL[type]] || null,
        }
      }
    }
    return { ok: false, error: 'Randevu bulunamadı.' }
  }

  const searchTypes = types
  for (const type of searchTypes) {
    const assignCol = ASSIGN_COL[type]
    const { data: members, error } = await admin
      .from('members')
      .select('id, assigned_coach_id, assigned_dietitian_id, assigned_doctor_id, data')
      .eq(assignCol, caller.staffId)
      .limit(300)
    if (error) return { ok: false, error: error.message }

    for (const row of members || []) {
      const key = SESSION_KEYS[type]
      const list = row.data?.[key] || []
      const idx = list.findIndex((s) => s?.id === sessionId)
      if (idx >= 0) {
        return {
          ok: true,
          memberId: row.id,
          sessionType: type,
          sessionKey: key,
          sessionIndex: idx,
          session: list[idx],
          sessions: list,
          memberRow: row,
          staffId: caller.staffId,
        }
      }
    }
  }
  return { ok: false, error: 'Randevu bulunamadı veya bu görüşmeye erişiminiz yok.' }
}

export async function recordSessionAttendance(admin, user, {
  sessionId,
  sessionType,
  event,
} = {}) {
  if (!sessionId || !['join', 'leave'].includes(event)) {
    return { ok: false, error: 'Geçersiz katılım isteği.' }
  }

  const caller = await resolveCaller(admin, user)
  const found = await findSessionContext(admin, sessionId, sessionType, caller)
  if (!found.ok) return found

  const role = caller.kind === 'staff' ? 'staff' : 'member'
  const prevAttendance = found.session.attendance || {}
  const nextAttendance = applyAttendanceEvent(prevAttendance, role, event)
  const patch = buildSessionAttendancePatch(found.session, nextAttendance)
  const updatedSession = { ...found.session, ...patch }

  const nextSessions = [...found.sessions]
  nextSessions[found.sessionIndex] = updatedSession
  const nextData = {
    ...(found.memberRow.data || {}),
    [found.sessionKey]: nextSessions,
  }

  const { error: updErr } = await admin
    .from('members')
    .update({ data: nextData, updated_at: new Date().toISOString() })
    .eq('id', found.memberId)
  if (updErr) return { ok: false, error: updErr.message }

  const evaluation = evaluateSessionBillable(updatedSession, updatedSession.attendance)
  const earningType = EARNING_TYPE[found.sessionType] || 'coach_session'

  let earning = null
  if (evaluation.billable && BILLABLE_TYPES.has(earningType) && found.staffId) {
    const periodKey = isoWeekPeriodKey(new Date(updatedSession.date || Date.now()))
    const row = {
      staff_id: found.staffId,
      member_id: found.memberId,
      session_id: sessionId,
      session_type: earningType,
      amount_try: STAFF_SESSION_RATE_TRY,
      overlap_minutes: evaluation.overlapMinutes || 0,
      period_key: periodKey,
      status: 'pending',
      reject_reason: null,
      updated_at: new Date().toISOString(),
    }
    const { data: upserted, error: earnErr } = await admin
      .from('staff_earnings')
      .upsert(row, { onConflict: 'staff_id,session_id' })
      .select('*')
      .maybeSingle()
    if (earnErr) return { ok: false, error: earnErr.message }
    earning = upserted
  }

  return {
    ok: true,
    attendance: updatedSession.attendance,
    billable: evaluation.billable,
    earning,
  }
}

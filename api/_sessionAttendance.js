/**
 * Video görüşme katılımı → seans attendance + staff_earnings.
 * HTTP: POST /api/auth { action: 'session-attendance', sessionId, sessionType, event: 'join'|'leave' }
 * Daily webhook: POST /api/daily-room (imzalı)
 */
import { STAFF_SESSION_RATE_TRY, staffPayoutPeriodKey } from '../src/data/staffPayouts.js'
import {
  applyAttendanceEvent,
  buildSessionAttendancePatch,
  closeOpenAttendanceSegments,
  computeBillableOverlapMinutes,
  evaluateSessionBillable,
  isMeetingAttendanceClosed,
} from '../src/services/sessionAttendance.js'
import { getJoinWindowMinutes, getSessionJoinTiming } from './_videoJoinWindows.js'
import { buildDailyRoomName, deleteDailyRoom, isDailyWebhookConfigured } from './_daily.js'

const SESSION_KEYS = {
  coach: 'coachSessions',
  dietitian: 'dietitianSessions',
}

const EARNING_TYPE = {
  coach: 'coach_session',
  dietitian: 'dietitian_session',
}

const ASSIGN_COL = {
  coach: 'assigned_coach_id',
  dietitian: 'assigned_dietitian_id',
}

const BILLABLE_TYPES = new Set(['coach_session', 'dietitian_session'])
const MEMBER_SCAN_PAGE = 200

export { SESSION_KEYS, EARNING_TYPE, ASSIGN_COL }

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

function sessionMatchesId(session, sessionId) {
  const want = String(sessionId || '').toLowerCase()
  return String(session?.id || '').toLowerCase() === want
}

function foundPayload(row, type, idx, list, staffId) {
  return {
    ok: true,
    memberId: row.id,
    sessionType: type,
    sessionKey: SESSION_KEYS[type],
    sessionIndex: idx,
    session: list[idx],
    sessions: list,
    memberRow: row,
    staffId: staffId || row[ASSIGN_COL[type]] || null,
  }
}

export async function findSessionById(admin, sessionId, sessionTypeHint) {
  const types = sessionTypeHint && SESSION_KEYS[sessionTypeHint]
    ? [sessionTypeHint]
    : ['coach', 'dietitian']

  let from = 0
  for (;;) {
    const { data: members, error } = await admin
      .from('members')
      .select('id, name, assigned_coach_id, assigned_dietitian_id, data')
      .range(from, from + MEMBER_SCAN_PAGE - 1)
    if (error) return { ok: false, error: error.message }
    if (!members?.length) break

    for (const row of members) {
      for (const type of types) {
        const list = row.data?.[SESSION_KEYS[type]] || []
        const idx = list.findIndex((s) => sessionMatchesId(s, sessionId))
        if (idx >= 0) return foundPayload(row, type, idx, list)
      }
    }
    if (members.length < MEMBER_SCAN_PAGE) break
    from += MEMBER_SCAN_PAGE
  }
  return { ok: false, error: 'Randevu bulunamadı.' }
}

export async function findSessionContext(admin, sessionId, sessionTypeHint, caller) {
  const types = sessionTypeHint && SESSION_KEYS[sessionTypeHint]
    ? [sessionTypeHint]
    : ['coach', 'dietitian']

  if (caller.kind === 'member') {
    const { data: row, error } = await admin
      .from('members')
      .select('id, name, assigned_coach_id, assigned_dietitian_id, data')
      .eq('id', caller.memberId)
      .maybeSingle()
    if (error || !row) return { ok: false, error: 'Üye bulunamadı.' }

    for (const type of types) {
      const list = row.data?.[SESSION_KEYS[type]] || []
      const idx = list.findIndex((s) => sessionMatchesId(s, sessionId))
      if (idx >= 0) return foundPayload(row, type, idx, list)
    }
    return { ok: false, error: 'Randevu bulunamadı.' }
  }

  for (const type of types) {
    const assignCol = ASSIGN_COL[type]
    const { data: members, error } = await admin
      .from('members')
      .select('id, name, assigned_coach_id, assigned_dietitian_id, data')
      .eq(assignCol, caller.staffId)
      .limit(300)
    if (error) return { ok: false, error: error.message }

    for (const row of members || []) {
      const list = row.data?.[SESSION_KEYS[type]] || []
      const idx = list.findIndex((s) => sessionMatchesId(s, sessionId))
      if (idx >= 0) return foundPayload(row, type, idx, list, caller.staffId)
    }
  }
  return { ok: false, error: 'Randevu bulunamadı veya bu görüşmeye erişiminiz yok.' }
}

function joinWindowFor(sessionType) {
  return getJoinWindowMinutes(sessionType)
}

function shouldFinalizeNow({ event, attendance, forceFinalize }) {
  if (forceFinalize) return true
  if (event === 'end' || event === 'finalize') return true
  if (!isMeetingAttendanceClosed(attendance)) return false
  if (isDailyWebhookConfigured() && event !== 'end' && event !== 'finalize') return false
  return true
}

async function upsertEarning(admin, found, updatedSession, evaluation) {
  const earningType = EARNING_TYPE[found.sessionType] || 'coach_session'
  if (!BILLABLE_TYPES.has(earningType) || !found.staffId) return null

  const { data: existing } = await admin
    .from('staff_earnings')
    .select('id, status, overlap_minutes')
    .eq('staff_id', found.staffId)
    .eq('session_id', found.session.id)
    .maybeSingle()

  if (existing?.status === 'paid') return existing

  if (!evaluation.billable) {
    if (existing && (existing.status === 'pending' || existing.status === 'approved')) {
      const { data } = await admin
        .from('staff_earnings')
        .update({
          status: 'rejected',
          reject_reason: evaluation.reason || 'Eşzamanlı süre yetersiz.',
          overlap_minutes: evaluation.overlapMinutes || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('*')
        .maybeSingle()
      return data || existing
    }
    return null
  }

  const startedAt = updatedSession.date || new Date().toISOString()
  const row = {
    staff_id: found.staffId,
    member_id: found.memberId,
    member_name: found.memberRow?.name || null,
    session_id: found.session.id,
    session_type: earningType,
    session_started_at: startedAt,
    amount_try: STAFF_SESSION_RATE_TRY,
    overlap_minutes: evaluation.overlapMinutes || 0,
    period_key: staffPayoutPeriodKey(startedAt),
    status: existing?.status === 'approved' ? 'approved' : 'pending',
    reject_reason: null,
    updated_at: new Date().toISOString(),
  }
  const { data: upserted, error: earnErr } = await admin
    .from('staff_earnings')
    .upsert(row, { onConflict: 'staff_id,session_id' })
    .select('*')
    .maybeSingle()
  if (earnErr) throw earnErr
  return upserted
}

async function persistFoundSession(admin, found, nextAttendance, { finalize = false, at } = {}) {
  let attendance = nextAttendance
  if (finalize) {
    attendance = closeOpenAttendanceSegments(attendance, at || new Date().toISOString())
  }
  const evalOpts = { joinWindow: joinWindowFor(found.sessionType), finalized: finalize }
  const patch = buildSessionAttendancePatch(found.session, attendance, evalOpts)
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

  let earning = null
  if (patch.evaluation?.ready) {
    try {
      earning = await upsertEarning(admin, found, updatedSession, patch.evaluation)
    } catch (e) {
      return { ok: false, error: e?.message || 'Hakediş yazılamadı.' }
    }
  }

  return {
    ok: true,
    attendance: updatedSession.attendance,
    billable: patch.evaluation?.billable || false,
    ready: patch.evaluation?.ready || false,
    earning,
    sessionType: found.sessionType,
    sessionId: found.session.id,
    nextData,
    session: updatedSession,
  }
}

export async function recordSessionAttendance(admin, user, {
  sessionId,
  sessionType,
  event,
  at,
  dailySessionId,
  source = 'client',
  forceFinalize = false,
} = {}) {
  if (!sessionId || !['join', 'leave'].includes(event)) {
    return { ok: false, error: 'Geçersiz katılım isteği.' }
  }

  const caller = await resolveCaller(admin, user)
  const found = await findSessionContext(admin, sessionId, sessionType, caller)
  if (!found.ok) return found

  const role = caller.kind === 'staff' ? 'staff' : 'member'
  const when = at || new Date().toISOString()
  const prevAttendance = found.session.attendance || {}
  const nextAttendance = applyAttendanceEvent(prevAttendance, role, event, when, {
    dailySessionId,
    source,
  })
  const finalize = shouldFinalizeNow({ event, attendance: nextAttendance, forceFinalize })
  return persistFoundSession(admin, found, nextAttendance, { finalize, at: when })
}

export async function recordDailyPresenceEvent(admin, {
  sessionId,
  sessionType,
  role,
  event,
  at,
  dailySessionId,
  endRoom = false,
} = {}) {
  if (!sessionId || !['join', 'leave', 'end'].includes(event)) {
    return { ok: false, error: 'Geçersiz Daily olayı.' }
  }
  if (event !== 'end' && !role) {
    return { ok: true, skipped: true, reason: 'unmapped-participant' }
  }

  const found = await findSessionById(admin, sessionId, sessionType)
  if (!found.ok) return found

  const when = at || new Date().toISOString()
  let nextAttendance = found.session.attendance || {}
  if (event === 'end') {
    nextAttendance = applyAttendanceEvent(nextAttendance, 'member', 'end', when)
  } else {
    nextAttendance = applyAttendanceEvent(nextAttendance, role, event, when, {
      dailySessionId,
      source: 'daily',
    })
  }
  const finalize = event === 'end' || isMeetingAttendanceClosed(nextAttendance)
  const saved = await persistFoundSession(admin, found, nextAttendance, {
    finalize,
    at: when,
  })
  if (saved.ok && (endRoom || event === 'end' || (finalize && isMeetingAttendanceClosed(saved.attendance)))) {
    await deleteDailyRoom(buildDailyRoomName(found.sessionType, found.session.id))
  }
  return saved
}

export async function finalizeExpiredSessionAttendances(admin, now = new Date()) {
  const weekAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  let from = 0
  let scanned = 0
  let finalized = 0
  const errors = []

  for (;;) {
    const { data: members, error } = await admin
      .from('members')
      .select('id, name, assigned_coach_id, assigned_dietitian_id, data')
      .range(from, from + MEMBER_SCAN_PAGE - 1)
    if (error) return { ok: false, error: error.message }
    if (!members?.length) break

    for (const row of members) {
      scanned += 1
      for (const type of ['coach', 'dietitian']) {
        const list = row.data?.[SESSION_KEYS[type]] || []
        for (let idx = 0; idx < list.length; idx += 1) {
          const session = list[idx]
          if (!session?.attendance) continue
          if (session.attendance.finalizedAt && isMeetingAttendanceClosed(session.attendance)) continue
          const start = new Date(session.date || 0)
          if (Number.isNaN(start.getTime()) || start < weekAgo) continue
          const timing = getSessionJoinTiming(session, type, now)
          const closed = isMeetingAttendanceClosed(session.attendance)
          if (!timing.isExpired && !closed) continue
          const closeAt = timing.isExpired
            ? timing.windowEnd.toISOString()
            : now.toISOString()
          const found = foundPayload(row, type, idx, list)
          const saved = await persistFoundSession(admin, found, session.attendance, {
            finalize: true,
            at: closeAt,
          })
          if (!saved.ok) errors.push(saved.error)
          else {
            finalized += 1
            if (saved.nextData) row.data = saved.nextData
            if (timing.isExpired) {
              await deleteDailyRoom(buildDailyRoomName(type, session.id))
            }
          }
        }
      }
    }
    if (members.length < MEMBER_SCAN_PAGE) break
    from += MEMBER_SCAN_PAGE
  }

  return { ok: true, scanned, finalized, errors: errors.slice(0, 8) }
}

export async function auditInflatedStaffEarnings(admin) {
  const { data: rows, error } = await admin
    .from('staff_earnings')
    .select('id, staff_id, member_id, session_id, session_type, overlap_minutes, status, reject_reason')
    .in('status', ['pending', 'approved'])
  if (error) return { ok: false, error: error.message }

  let updated = 0
  let rejected = 0
  for (const row of rows || []) {
    const typeHint = String(row.session_type || '').replace(/_session$/, '')
    const found = await findSessionById(admin, row.session_id, SESSION_KEYS[typeHint] ? typeHint : null)
    if (!found.ok) continue
    const joinWindow = joinWindowFor(found.sessionType)
    const overlapMinutes = computeBillableOverlapMinutes(found.session.attendance || {}, found.session, joinWindow)
    const evaluation = evaluateSessionBillable(found.session, found.session.attendance || {}, {
      joinWindow,
      finalized: true,
    })
    if (evaluation.billable && overlapMinutes === Number(row.overlap_minutes || 0)) continue

    if (!evaluation.billable) {
      await admin
        .from('staff_earnings')
        .update({
          overlap_minutes: overlapMinutes,
          status: 'rejected',
          reject_reason: evaluation.reason || 'Eşzamanlı süre yeniden hesaplandı.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
      rejected += 1
      continue
    }

    if (overlapMinutes !== Number(row.overlap_minutes || 0)) {
      await admin
        .from('staff_earnings')
        .update({
          overlap_minutes: overlapMinutes,
          reject_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
      updated += 1
    }
  }

  return { ok: true, checked: (rows || []).length, updated, rejected }
}

export { computeBillableOverlapMinutes, evaluateSessionBillable }

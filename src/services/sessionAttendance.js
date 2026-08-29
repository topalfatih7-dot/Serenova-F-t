import { STAFF_MIN_OVERLAP_MINUTES } from '../data/staffPayouts.js'

/**
 * Görüşme katılımı — üye + personel presence segmentleri.
 *
 * @typedef {{ in: string, out?: string|null, dailySessionId?: string|null, source?: string }} PresenceInterval
 * @typedef {{ role: 'member'|'staff', joinedAt?: string, leftAt?: string, segments?: PresenceInterval[] }} AttendanceSide
 * @typedef {{
 *   member?: AttendanceSide,
 *   staff?: AttendanceSide,
 *   overlapMinutes?: number,
 *   billable?: boolean,
 *   evaluatedAt?: string,
 *   rejectReason?: string|null,
 *   finalizedAt?: string|null,
 * }} SessionAttendance
 */

function toMs(iso) {
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? null : t
}

function toIso(ms) {
  return new Date(ms).toISOString()
}

function cloneSegments(segments = []) {
  return segments.map((s) => ({
    in: s.in,
    out: s.out ?? null,
    dailySessionId: s.dailySessionId || null,
    source: s.source || null,
  }))
}

/** Eski tek joinedAt/leftAt kaydını segment listesine çevirir. */
export function normalizeAttendanceSide(side, role = 'member') {
  if (!side || typeof side !== 'object') {
    return { role, segments: [] }
  }
  let segments = Array.isArray(side.segments) ? cloneSegments(side.segments.filter((s) => s?.in)) : []
  if (!segments.length && side.joinedAt) {
    segments = [{
      in: side.joinedAt,
      out: side.leftAt || null,
      dailySessionId: null,
      source: 'legacy',
    }]
  }
  return {
    role: side.role || role,
    joinedAt: side.joinedAt || segments[0]?.in || undefined,
    leftAt: side.leftAt,
    segments,
  }
}

export function hasJoinedSide(side) {
  return normalizeAttendanceSide(side).segments.length > 0
}

export function sideHasOpenSegment(side) {
  return normalizeAttendanceSide(side).segments.some((s) => !s.out)
}

export function isMeetingAttendanceClosed(attendance) {
  const member = normalizeAttendanceSide(attendance?.member, 'member')
  const staff = normalizeAttendanceSide(attendance?.staff, 'staff')
  if (!member.segments.length || !staff.segments.length) return false
  return member.segments.every((s) => s.out) && staff.segments.every((s) => s.out)
}

function closedIntervals(side) {
  return normalizeAttendanceSide(side).segments
    .map((s) => {
      const a = toMs(s.in)
      const b = toMs(s.out)
      if (a == null || b == null || b <= a) return null
      return [a, b]
    })
    .filter(Boolean)
}

export function clipIntervals(intervals, windowStartMs, windowEndMs) {
  if (windowStartMs == null || windowEndMs == null) return intervals
  return intervals
    .map(([a, b]) => [Math.max(a, windowStartMs), Math.min(b, windowEndMs)])
    .filter(([a, b]) => b > a)
}

export function intersectOverlapMs(memberIntervals, staffIntervals) {
  let ms = 0
  for (const [a0, a1] of memberIntervals) {
    for (const [b0, b1] of staffIntervals) {
      const start = Math.max(a0, b0)
      const end = Math.min(a1, b1)
      if (end > start) ms += end - start
    }
  }
  return ms
}

export function resolveBillableWindow(session, joinWindow = { before: 10, after: 20 }) {
  const start = toMs(session?.date)
  const durationMin = Math.max(1, Number(session?.duration) || 30)
  if (start == null) {
    return { windowStartMs: null, windowEndMs: null, maxMinutes: durationMin, durationMin }
  }
  const before = Math.max(0, Number(joinWindow?.before) || 0)
  const after = Math.max(0, Number(joinWindow?.after) || 0)
  return {
    windowStartMs: start - before * 60_000,
    windowEndMs: start + (durationMin + after) * 60_000,
    maxMinutes: durationMin,
    durationMin,
  }
}

/**
 * Faturalandırılabilir eşzamanlı dakika.
 * Açık (out yok) segmentler sayılmaz — `now` fallback yok.
 * Randevu penceresine kırpılır, `session.duration` tavanı uygulanır.
 */
export function computeBillableOverlapMinutes(attendance, session, joinWindow = { before: 10, after: 20 }) {
  const member = clipIntervals(
    closedIntervals(attendance?.member),
    ...(() => {
      const w = resolveBillableWindow(session, joinWindow)
      return [w.windowStartMs, w.windowEndMs]
    })(),
  )
  const staff = clipIntervals(
    closedIntervals(attendance?.staff),
    ...(() => {
      const w = resolveBillableWindow(session, joinWindow)
      return [w.windowStartMs, w.windowEndMs]
    })(),
  )
  const { maxMinutes } = resolveBillableWindow(session, joinWindow)
  const minutes = Math.floor(intersectOverlapMs(member, staff) / 60_000)
  return Math.max(0, Math.min(minutes, maxMinutes))
}

/** @deprecated tek segment; test uyumu için kapalı aralıklarda window’süz kesişim */
export function computeOverlapMinutes(memberSeg, staffSeg) {
  const attendance = { member: memberSeg, staff: staffSeg }
  const raw = Math.floor(
    intersectOverlapMs(closedIntervals(memberSeg), closedIntervals(staffSeg)) / 60_000,
  )
  if (raw > 0) return raw
  if (!memberSeg?.joinedAt || !staffSeg?.joinedAt) return 0
  if (!memberSeg?.leftAt || !staffSeg?.leftAt) return 0
  const mStart = toMs(memberSeg.joinedAt)
  const mEnd = toMs(memberSeg.leftAt)
  const sStart = toMs(staffSeg.joinedAt)
  const sEnd = toMs(staffSeg.leftAt)
  if (mStart == null || mEnd == null || sStart == null || sEnd == null) return 0
  const overlapStart = Math.max(mStart, sStart)
  const overlapEnd = Math.min(mEnd, sEnd)
  if (overlapEnd <= overlapStart) return 0
  return Math.floor((overlapEnd - overlapStart) / 60_000)
}

function firstIn(side) {
  const segs = normalizeAttendanceSide(side).segments
  const times = segs.map((s) => toMs(s.in)).filter((n) => n != null).sort((a, b) => a - b)
  return times[0] != null ? toIso(times[0]) : undefined
}

function lastOut(side) {
  const segs = normalizeAttendanceSide(side).segments
  const times = segs.map((s) => toMs(s.out)).filter((n) => n != null).sort((a, b) => a - b)
  return times.length ? toIso(times[times.length - 1]) : undefined
}

export function closeOpenAttendanceSegments(attendance = {}, at = new Date().toISOString()) {
  const closeSide = (side, role) => {
    const n = normalizeAttendanceSide(side, role)
    const segments = n.segments.map((s) => (s.out ? s : { ...s, out: at }))
    return {
      ...n,
      segments,
      joinedAt: firstIn({ segments }) || n.joinedAt,
      leftAt: lastOut({ segments }) || at,
    }
  }
  return {
    ...attendance,
    member: closeSide(attendance.member, 'member'),
    staff: closeSide(attendance.staff, 'staff'),
  }
}

/**
 * Join yeni açık segment açar (rejoin boşluğu yutmaz).
 * Leave yalnızca açık segmenti kapatır.
 */
export function applyAttendanceEvent(attendance = {}, role, event, at = new Date().toISOString(), extra = {}) {
  if (event === 'end' || event === 'finalize') {
    return closeOpenAttendanceSegments(attendance, at)
  }

  const sideKey = role === 'staff' ? 'staff' : 'member'
  const current = normalizeAttendanceSide(attendance[sideKey], sideKey)
  const dailySessionId = extra.dailySessionId || null
  const source = extra.source || 'client'

  if (event === 'join') {
    if (dailySessionId && current.segments.some((s) => s.dailySessionId === dailySessionId)) {
      return { ...attendance, [sideKey]: current }
    }
    const open = current.segments.find((s) => !s.out)
    if (open) {
      if (dailySessionId && !open.dailySessionId) open.dailySessionId = dailySessionId
      return {
        ...attendance,
        finalizedAt: null,
        [sideKey]: {
          ...current,
          joinedAt: firstIn(current) || at,
          leftAt: undefined,
        },
      }
    }
    const segments = [
      ...current.segments,
      { in: at, out: null, dailySessionId, source },
    ]
    return {
      ...attendance,
      finalizedAt: null,
      billable: false,
      [sideKey]: {
        role: sideKey,
        segments,
        joinedAt: firstIn({ segments }) || at,
        leftAt: undefined,
      },
    }
  }

  if (event === 'leave') {
    const segments = cloneSegments(current.segments)
    let idx = dailySessionId
      ? segments.findIndex((s) => s.dailySessionId === dailySessionId && !s.out)
      : -1
    if (idx < 0) {
      for (let i = segments.length - 1; i >= 0; i -= 1) {
        if (!segments[i].out) {
          idx = i
          break
        }
      }
    }
    if (idx >= 0) {
      const start = toMs(segments[idx].in)
      const end = toMs(at)
      segments[idx] = {
        ...segments[idx],
        out: start != null && end != null && end < start ? segments[idx].in : at,
        dailySessionId: segments[idx].dailySessionId || dailySessionId,
      }
    } else if (!segments.length && current.joinedAt) {
      segments.push({ in: current.joinedAt, out: at, dailySessionId, source })
    }
    return {
      ...attendance,
      [sideKey]: {
        role: sideKey,
        segments,
        joinedAt: firstIn({ segments }) || current.joinedAt,
        leftAt: lastOut({ segments }),
      },
    }
  }

  return attendance
}

export function evaluateSessionBillable(session, attendance, {
  minOverlapMinutes = STAFF_MIN_OVERLAP_MINUTES,
  joinWindow = { before: 10, after: 20 },
  finalized = false,
} = {}) {
  if (!session || session.status === 'cancelled') {
    return { billable: false, reason: 'Randevu iptal edilmiş.', overlapMinutes: 0, ready: true }
  }

  const overlapMinutes = computeBillableOverlapMinutes(attendance, session, joinWindow)
  const memberJoined = hasJoinedSide(attendance?.member)
  const staffJoined = hasJoinedSide(attendance?.staff)

  if (!memberJoined) {
    return { billable: false, reason: 'Üye videoya katılmadı.', overlapMinutes, ready: finalized }
  }
  if (!staffJoined) {
    return { billable: false, reason: 'Personel videoya katılmadı.', overlapMinutes, ready: finalized }
  }

  const closed = isMeetingAttendanceClosed(attendance)
  if (!finalized && !closed) {
    return {
      billable: false,
      reason: 'Görüşme henüz kapanmadı.',
      overlapMinutes,
      ready: false,
    }
  }

  if (overlapMinutes < minOverlapMinutes) {
    return {
      billable: false,
      reason: `Eşzamanlı görüşme süresi yetersiz (${overlapMinutes}/${minOverlapMinutes} dk).`,
      overlapMinutes,
      ready: true,
    }
  }

  return { billable: true, overlapMinutes, reason: null, ready: true }
}

export function buildSessionAttendancePatch(session, attendance, evalOpts = {}) {
  const closed = isMeetingAttendanceClosed(attendance)
  const evaluation = evaluateSessionBillable(session, attendance, {
    ...evalOpts,
    finalized: Boolean(evalOpts.finalized) || closed,
  })
  return {
    attendance: {
      ...attendance,
      overlapMinutes: evaluation.overlapMinutes ?? attendance?.overlapMinutes ?? 0,
      billable: evaluation.billable,
      evaluatedAt: new Date().toISOString(),
      rejectReason: evaluation.billable ? null : evaluation.reason,
      finalizedAt: evaluation.ready
        ? (attendance?.finalizedAt || new Date().toISOString())
        : (attendance?.finalizedAt || null),
    },
    status: evaluation.billable ? 'completed' : session.status,
    evaluation,
  }
}

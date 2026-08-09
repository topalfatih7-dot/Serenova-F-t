import { getJoinWindowMinutes } from '../config/videoCall'
import { formatDurationTr } from '../utils/formatDuration'
import {
  assignedKeyForRole,
  normalizeSessionType,
  normalizeStaffRole,
  sessionsKeyForRole,
} from '../utils/staffRoles'

export function getSessionTiming(session, now = new Date(), sessionType = 'coach') {
  const type = normalizeSessionType(sessionType)
  const start = new Date(session?.date)
  const durationMin = Number(session?.duration) || 30
  const { before, after } = getJoinWindowMinutes(type)
  const windowStart = new Date(start.getTime() - before * 60_000)
  const sessionEnd = new Date(start.getTime() + durationMin * 60_000)
  const windowEnd = new Date(start.getTime() + (durationMin + after) * 60_000)

  const untilWindowOpensMs = Math.max(0, windowStart - now)
  const untilStartMs = Math.max(0, start - now)
  const untilSessionEndMs = Math.max(0, sessionEnd - now)
  const untilWindowEndMs = Math.max(0, windowEnd - now)

  return {
    start,
    sessionEnd,
    windowStart,
    windowEnd,
    joinMinutesBefore: before,
    joinMinutesAfter: after,
    isExpired: now > windowEnd,
    isBeforeWindow: now < windowStart,
    isInJoinWindow: now >= windowStart && now <= windowEnd,
    isLive: now >= start && now <= sessionEnd,
    untilWindowOpensMs,
    untilStartMs,
    untilSessionEndMs,
    untilWindowEndMs,
  }
}

/** Görüşme odası sayfasına erişilebilir mi? (planlı / iptal onayı bekleyen) */
export function canAccessCallRoom(session, now = new Date(), sessionType = 'coach') {
  const st = session?.status || 'scheduled'
  if (!session || !['scheduled', 'cancel_pending', 'admin_cancel_pending'].includes(st)) {
    return { ok: false, reason: 'Bu randevu aktif değil veya iptal edilmiş.' }
  }
  const start = new Date(session.date)
  if (Number.isNaN(start.getTime())) {
    return { ok: false, reason: 'Randevu tarihi geçersiz.' }
  }

  const timing = getSessionTiming(session, now, sessionType)
  if (timing.isExpired) {
    return { ok: false, reason: 'Görüşme süresi doldu.', timing }
  }

  return { ok: true, timing }
}

/** Canlı görüşmeye katılım durumu ve kalan süre mesajları */
export function canJoinSession(session, now = new Date(), sessionType = 'coach') {
  const access = canAccessCallRoom(session, now, sessionType)
  if (!access.ok) return access

  const { timing } = access

  if (timing.isBeforeWindow) {
    return {
      ok: false,
      canEnterRoom: true,
      timing,
      reason: `Görüşme ${formatDurationTr(timing.untilWindowOpensMs)} sonra açılacak.`,
      statusLabel: `Açılışa ${formatDurationTr(timing.untilWindowOpensMs)} kaldı`,
    }
  }

  if (timing.isLive) {
    return {
      ok: true,
      canEnterRoom: true,
      timing,
      reason: null,
      statusLabel: `Canlı · Kalan ${formatDurationTr(timing.untilSessionEndMs)}`,
    }
  }

  if (timing.isInJoinWindow && timing.untilStartMs > 0) {
    return {
      ok: true,
      canEnterRoom: true,
      timing,
      reason: null,
      statusLabel: `Randevu ${formatDurationTr(timing.untilStartMs)} sonra başlayacak`,
    }
  }

  return {
    ok: true,
    canEnterRoom: true,
    timing,
    reason: null,
    statusLabel: `Oda kapanmasına ${formatDurationTr(timing.untilWindowEndMs)} kaldı`,
  }
}

const SESSION_LIST_KEYS = {
  coach: 'coachSessions',
  dietitian: 'dietitianSessions',
  doctor: 'doctorSessions',
}

function remoteStaffLabel(sessionType) {
  if (sessionType === 'dietitian') return 'Diyetisyeniniz'
  if (sessionType === 'doctor') return 'Doktorunuz'
  return 'Koçunuz'
}

/** Üye için oturum bilgisi */
export function findMemberSession(
  { coachSessions, dietitianSessions, doctorSessions },
  sessionType,
  sessionId,
) {
  const type = normalizeSessionType(sessionType)
  const list = type === 'coach'
    ? coachSessions
    : type === 'dietitian'
      ? dietitianSessions
      : doctorSessions
  const session = (list || []).find((s) => s.id === sessionId)
  if (!session) return null
  return { session, sessionType: type, key: SESSION_LIST_KEYS[type] }
}

/** Koç / diyetisyen / doktor için danışan oturumu */
export function findStaffSession(members, staffId, staffRole, sessionType, sessionId) {
  const role = normalizeStaffRole(staffRole)
  const type = normalizeSessionType(sessionType)
  if (role !== type) return null

  const assignKey = assignedKeyForRole(type)
  const sessionKey = sessionsKeyForRole(type)

  for (const member of members || []) {
    if (String(member[assignKey]) !== String(staffId)) continue
    const session = (member[sessionKey] || []).find((s) => s.id === sessionId)
    if (session) {
      return { session, sessionType: type, member }
    }
  }
  return null
}

export function resolveCallContext({
  audience,
  sessionType,
  sessionId,
  user,
  staffUser,
  isStaff,
  platformMembers,
  coachSessions,
  dietitianSessions,
  doctorSessions,
}) {
  const type = normalizeSessionType(sessionType)

  if (audience === 'staff' || isStaff) {
    const staffRole = normalizeStaffRole(staffUser?.role)
    const found = findStaffSession(platformMembers, staffUser?.id, staffRole, type, sessionId)
    if (!found) return { error: 'Randevu bulunamadı veya bu görüşmeye erişiminiz yok.' }
    const joinCheck = canJoinSession(found.session, new Date(), type)
    const roomAccess = canAccessCallRoom(found.session, new Date(), type)
    return {
      session: found.session,
      sessionType: type,
      displayName: staffUser?.name || 'Uzman',
      remoteLabel: found.member?.name || 'Danışan',
      participantRole: staffRole,
      side: 'staff',
      member: found.member,
      joinCheck,
      roomAccess,
    }
  }

  const found = findMemberSession(
    { coachSessions, dietitianSessions, doctorSessions },
    type,
    sessionId,
  )
  if (!found) return { error: 'Randevu bulunamadı.' }
  const joinCheck = canJoinSession(found.session, new Date(), type)
  const roomAccess = canAccessCallRoom(found.session, new Date(), type)
  return {
    session: found.session,
    sessionType: type,
    displayName: user?.name || 'Danışan',
    remoteLabel: found.session.coach || remoteStaffLabel(type),
    participantRole: 'member',
    side: 'member',
    joinCheck,
    roomAccess,
  }
}

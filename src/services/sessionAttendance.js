import { STAFF_MIN_OVERLAP_MINUTES } from '../data/staffPayouts'

/**
 * Görüşme katılım kaydı — üye + personel join/leave olaylarından üretilir.
 * @typedef {{ role: 'member'|'staff', joinedAt: string, leftAt?: string }} AttendanceSegment
 * @typedef {{ member?: AttendanceSegment, staff?: AttendanceSegment, overlapMinutes?: number, billable?: boolean, evaluatedAt?: string }} SessionAttendance
 */

function toMs(iso) {
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? null : t
}

/** İki segment arasındaki eşzamanlı süre (dakika) */
export function computeOverlapMinutes(memberSeg, staffSeg) {
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

/**
 * Görüşme hakedişe uygun mu?
 * - İptal / geçersiz statüde değil
 * - Üye ve personel katıldı
 * - Eşzamanlı süre minimum eşiği geçti
 */
export function evaluateSessionBillable(session, attendance, { minOverlapMinutes = STAFF_MIN_OVERLAP_MINUTES } = {}) {
  if (!session || session.status === 'cancelled') {
    return { billable: false, reason: 'Randevu iptal edilmiş.' }
  }

  const memberSeg = attendance?.member
  const staffSeg = attendance?.staff

  if (!memberSeg?.joinedAt) {
    return { billable: false, reason: 'Üye videoya katılmadı.' }
  }
  if (!staffSeg?.joinedAt) {
    return { billable: false, reason: 'Personel videoya katılmadı.' }
  }

  const overlapMinutes = computeOverlapMinutes(memberSeg, staffSeg)
  if (overlapMinutes < minOverlapMinutes) {
    return {
      billable: false,
      reason: `Eşzamanlı görüşme süresi yetersiz (${overlapMinutes}/${minOverlapMinutes} dk).`,
      overlapMinutes,
    }
  }

  return { billable: true, overlapMinutes, reason: null }
}

/** Join/leave olayından attendance objesi güncelle */
export function applyAttendanceEvent(attendance = {}, role, event, at = new Date().toISOString()) {
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

/** Katılım değerlendirmesi sonrası seansa yazılacak alanlar */
export function buildSessionAttendancePatch(session, attendance) {
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

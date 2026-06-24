import { isPaidMembership } from '../data/membershipPlans'

function timeToMinutes(t) {
  const [h, m] = String(t || '0:0').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function staffAvailableAt(staff, day, time) {
  if (!(staff.workDays || []).includes(Number(day))) return false
  if (!time) return true
  const t = timeToMinutes(time)
  return t >= timeToMinutes(staff.workStart || '09:00') && t < timeToMinutes(staff.workEnd || '17:00')
}

export function findAvailableStaff(members, staffList, role, day, time, excludeMemberId = null) {
  const candidates = staffList.filter(
    (s) => s.role === role && s.active !== false && staffAvailableAt(s, day, time)
  )
  if (!candidates.length) return null
  const key = role === 'coach' ? 'assignedCoachId' : 'assignedDietitianId'
  return candidates
    .map((s) => ({
      s,
      load: members.filter((m) => m[key] === s.id && m.id !== excludeMemberId).length,
    }))
    .sort((a, b) => a.load - b.load)[0].s
}

/** Yalnızca koç/diyetisyen atar; randevu oluşturmaz (admin elle girer). */
export function assignStaffOnly(member, staffList, members, options = {}) {
  const { autoAssign = false, manualCoachId, manualDietitianId } = options
  const schedule = member.supportSchedule
  const pkg = member.packageConfig || {}
  let coachId = manualCoachId ?? member.assignedCoachId ?? null
  let dietitianId = manualDietitianId ?? member.assignedDietitianId ?? null

  const needCoach = (Number(pkg.coachMeetingsPerMonth) || Number(pkg.coachMeetingsPerWeek) || 0) > 0
  const needDiet = (Number(pkg.dietitianMeetingsPerMonth) || 0) > 0

  if (autoAssign && schedule) {
    if (needCoach && !coachId && schedule.coachDay != null) {
      coachId = findAvailableStaff(members, staffList, 'coach', schedule.coachDay, schedule.coachTime, member.id)?.id || null
    }
    if (needDiet && !dietitianId && schedule.dietitianDay != null) {
      dietitianId = findAvailableStaff(members, staffList, 'dietitian', schedule.dietitianDay, schedule.dietitianTime, member.id)?.id || null
    }
  }

  return {
    assignedCoachId: coachId,
    assignedDietitianId: dietitianId,
  }
}

/** @deprecated Otomatik randevu üretimi kaldırıldı — admin panelinden elle girilir. */
export function applyStaffAssignments(member, staffList, members, options = {}) {
  const staffOnly = assignStaffOnly(member, staffList, members, options)
  return {
    ...staffOnly,
    coachSessions: options.coachSessions ?? member.coachSessions ?? [],
    dietitianSessions: options.dietitianSessions ?? member.dietitianSessions ?? [],
  }
}

export function countStaffClients(members, staffId, role) {
  const key = role === 'coach' ? 'assignedCoachId' : 'assignedDietitianId'
  return members.filter((m) => isPaidMembership(m.membership) && m[key] === staffId).length
}

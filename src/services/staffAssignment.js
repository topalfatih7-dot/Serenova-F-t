import { isPaidMembership, packageIncludesCoach, packageIncludesDietitian } from '../data/membershipPlans'
import { hasAvailabilitySlots } from '../data/staffProfile'

function timeToMinutes(t) {
  const [h, m] = String(t || '0:0').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function hoursForDay(availability, day) {
  if (!availability || typeof availability !== 'object') return []
  return availability[day] || availability[String(day)] || []
}

export function staffAvailableAt(staff, day, time) {
  if (hasAvailabilitySlots(staff.availability)) {
    const hours = hoursForDay(staff.availability, day)
    if (!hours.length) return false
    if (!time) return true
    const t = timeToMinutes(time)
    return hours.some((h) => {
      const start = timeToMinutes(h)
      return t >= start && t < start + 60
    })
  }

  const days = staff.workDays || []
  if (days.length && !days.includes(Number(day))) return false
  if (!time) return true
  if (!staff.workStart && !staff.workEnd) return true
  const t = timeToMinutes(time)
  return t >= timeToMinutes(staff.workStart || '00:00') && t < timeToMinutes(staff.workEnd || '24:00')
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

  const needCoach = packageIncludesCoach(pkg)
  const needDiet = packageIncludesDietitian(pkg)

  if (!needCoach) coachId = null
  if (!needDiet) dietitianId = null

  if (autoAssign && schedule) {
    if (needCoach && !coachId && schedule.coachDay != null) {
      coachId = findAvailableStaff(members, staffList, 'coach', schedule.coachDay, schedule.coachTime, member.id)?.id || null
    }
    if (needDiet && !dietitianId && schedule.dietitianDay != null) {
      dietitianId = findAvailableStaff(members, staffList, 'dietitian', schedule.dietitianDay, schedule.dietitianTime, member.id)?.id || null
    }
  }

  return {
    assignedCoachId: needCoach ? coachId : null,
    assignedDietitianId: needDiet ? dietitianId : null,
  }
}

export function countStaffClients(members, staffId, role) {
  const key = role === 'coach' ? 'assignedCoachId' : 'assignedDietitianId'
  return members.filter((m) => isPaidMembership(m.membership) && m[key] === staffId).length
}

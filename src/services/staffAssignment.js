import { generateSupportSessions } from './supportSessions'

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

export function applyStaffAssignments(member, staffList, members, options = {}) {
  const { autoAssign = true, manualCoachId, manualDietitianId } = options
  const schedule = member.supportSchedule
  const pkg = member.packageConfig || {}
  let coachId = manualCoachId ?? member.assignedCoachId ?? null
  let dietitianId = manualDietitianId ?? member.assignedDietitianId ?? null

  const needCoach = (Number(pkg.coachMeetingsPerWeek) || 0) > 0 && schedule?.coachDay != null
  const needDiet = (Number(pkg.dietitianMeetingsPerMonth) || 0) > 0 && schedule?.dietitianDay != null

  if (autoAssign) {
    if (needCoach && !coachId) {
      coachId = findAvailableStaff(members, staffList, 'coach', schedule.coachDay, schedule.coachTime, member.id)?.id || null
    }
    if (needDiet && !dietitianId) {
      dietitianId = findAvailableStaff(members, staffList, 'dietitian', schedule.dietitianDay, schedule.dietitianTime, member.id)?.id || null
    }
  }

  const coach = staffList.find((s) => s.id === coachId) || null
  const dietitian = staffList.find((s) => s.id === dietitianId) || null
  const sessions = generateSupportSessions(pkg, schedule, new Date(), {
    coachName: coach?.name,
    dietitianName: dietitian?.name,
  })

  return {
    assignedCoachId: coachId,
    assignedDietitianId: dietitianId,
    coachSessions: sessions.coachSessions,
    dietitianSessions: sessions.dietitianSessions,
  }
}

export function countStaffClients(members, staffId, role) {
  const key = role === 'coach' ? 'assignedCoachId' : 'assignedDietitianId'
  return members.filter((m) => m.membership === 'premium' && m[key] === staffId).length
}

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function nextWeekday(from, weekday) {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  const diff = (Number(weekday) - d.getDay() + 7) % 7
  d.setDate(d.getDate() + (diff === 0 ? 7 : diff))
  return d
}

function buildFallbackCoachSlots(schedule, perWeek) {
  const baseDay = Number(schedule.coachDay)
  const time = schedule.coachTime || '10:00'
  const spacing = Math.max(1, Math.floor(7 / Math.max(perWeek, 1)))
  const slots = []
  for (let c = 0; c < perWeek; c++) {
    slots.push({ day: (baseDay + c * spacing) % 7, time })
  }
  return slots
}

export function generateSupportSessions(packageConfig = {}, schedule, startDate = new Date(), names = {}) {
  const coachSessions = []
  const dietitianSessions = []
  if (!schedule) return { coachSessions, dietitianSessions }

  const coachName = names.coachName || 'Koçunuz'
  const dietitianName = names.dietitianName || 'Diyetisyeniniz'
  const weeks = Number(packageConfig.durationWeeks) || 12
  const perWeek = Number(packageConfig.coachMeetingsPerWeek) || 0
  const perMonth = Number(packageConfig.dietitianMeetingsPerMonth) || 0

  const coachSlots = Array.isArray(schedule.coachSlots) && schedule.coachSlots.length
    ? schedule.coachSlots
    : (schedule.coachDay != null ? buildFallbackCoachSlots(schedule, perWeek) : [])

  if (perWeek > 0 && coachSlots.length) {
    for (let w = 0; w < weeks; w++) {
      coachSlots.forEach((slot) => {
        const [ch, cm] = String(slot.time || '10:00').split(':').map(Number)
        const d = nextWeekday(startDate, slot.day)
        d.setDate(d.getDate() + w * 7)
        d.setHours(ch || 10, cm || 0, 0, 0)
        coachSessions.push({
          id: uid('cs'),
          type: 'coach',
          title: 'Koç Görüşmesi',
          date: d.toISOString(),
          duration: 30,
          status: 'scheduled',
          coach: coachName,
        })
      })
    }
  }

  const dietSlots = Array.isArray(schedule.dietitianSlots) && schedule.dietitianSlots.length
    ? schedule.dietitianSlots
    : (schedule.dietitianDay != null ? [{ day: schedule.dietitianDay, time: schedule.dietitianTime }] : [])

  if (perMonth > 0 && dietSlots.length) {
    const months = Math.ceil(weeks / 4)
    for (let m = 0; m < months; m++) {
      dietSlots.forEach((slot, k) => {
        const [dh, dm] = String(slot.time || '14:00').split(':').map(Number)
        const d = nextWeekday(startDate, slot.day)
        const weekOffset = Math.min(3, Math.floor((k * 4) / Math.max(perMonth, 1)))
        d.setDate(d.getDate() + (m * 4 + weekOffset) * 7)
        d.setHours(dh || 14, dm || 0, 0, 0)
        dietitianSessions.push({
          id: uid('ds'),
          type: 'dietitian',
          title: 'Diyetisyen Görüşmesi',
          date: d.toISOString(),
          duration: 40,
          status: 'scheduled',
          coach: dietitianName,
        })
      })
    }
  }

  return { coachSessions, dietitianSessions }
}

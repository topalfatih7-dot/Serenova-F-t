export const AVAILABILITY_HOURS = Array.from({ length: 14 }, (_, i) => `${String(8 + i).padStart(2, '0')}:00`)

export const AVAILABILITY_WEEKDAYS = [
  { value: 1, label: 'Pazartesi', short: 'Pzt' },
  { value: 2, label: 'Salı', short: 'Sal' },
  { value: 3, label: 'Çarşamba', short: 'Çar' },
  { value: 4, label: 'Perşembe', short: 'Per' },
  { value: 5, label: 'Cuma', short: 'Cum' },
  { value: 6, label: 'Cumartesi', short: 'Cmt' },
  { value: 0, label: 'Pazar', short: 'Paz' },
]

export function countAvailabilitySlots(value = {}) {
  return Object.values(value).reduce((sum, hours) => sum + (hours?.length || 0), 0)
}

function rangeLabel(start, prevHour) {
  const startHour = parseInt(start, 10)
  if (startHour === prevHour) return start
  const end = `${String(prevHour + 1).padStart(2, '0')}:00`
  return `${start}–${end}`
}

export function formatAvailabilityRanges(value = {}) {
  return AVAILABILITY_WEEKDAYS.filter((d) => (value[d.value] || []).length)
    .map((d) => {
      const sorted = [...value[d.value]].sort()
      const ranges = []
      let start = null
      let prev = null
      sorted.forEach((h) => {
        const hour = parseInt(h, 10)
        if (start === null) {
          start = h
          prev = hour
        } else if (hour === prev + 1) {
          prev = hour
        } else {
          ranges.push(rangeLabel(start, prev))
          start = h
          prev = hour
        }
      })
      if (start !== null) ranges.push(rangeLabel(start, prev))
      return { value: d.value, label: d.label, short: d.short, ranges }
    })
}

export function formatAvailabilitySummary(value = {}) {
  return formatAvailabilityRanges(value)
    .map((d) => `${d.label} ${d.ranges.join(', ')}`)
    .join(' · ')
}

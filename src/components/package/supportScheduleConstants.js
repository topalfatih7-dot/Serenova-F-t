export const WEEKDAYS = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
  { value: 0, label: 'Pazar' },
]

export const TIME_OPTIONS = (() => {
  const out = []
  for (let h = 8; h <= 21; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 21) out.push(`${String(h).padStart(2, '0')}:30`)
  }
  return out
})()

export const DEFAULT_SUPPORT_SCHEDULE = { coachSlots: [], dietitianSlots: [] }

export function weekdayLabel(value) {
  return WEEKDAYS.find((d) => d.value === Number(value))?.label || '—'
}

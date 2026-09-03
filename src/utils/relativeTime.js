import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export function isDateOnlyStamp(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
}

function parseStamp(dateInput) {
  if (dateInput == null || dateInput === '') return null
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return null
  return date
}

/** Saat: "14:32". Yalnızca tarih (YYYY-MM-DD) ise null. */
export function formatClock(dateInput) {
  if (isDateOnlyStamp(dateInput)) return null
  const date = parseStamp(dateInput)
  if (!date) return null
  return format(date, 'HH:mm')
}

/** Gerçek zamana göre Türkçe göreli süre: "Az önce", "32 dk önce", "2 saat önce" */
export function formatRelativeTime(dateInput) {
  const date = parseStamp(dateInput)
  if (!date) return '—'

  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return 'Az önce'

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} dk önce`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} saat önce`

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay} gün önce`

  const diffWeek = Math.floor(diffDay / 7)
  if (diffWeek < 5) return `${diffWeek} hafta önce`

  return format(date, 'd MMM yyyy', { locale: tr })
}

/** Göreli süre + saat: "2 saat önce · 14:32" */
export function formatRelativeTimeWithClock(dateInput) {
  const relative = formatRelativeTime(dateInput)
  const clock = formatClock(dateInput)
  if (!clock || relative === '—') return relative
  if (relative.includes(clock)) return relative
  return `${relative} · ${clock}`
}

/** Üye son aktif: tarih; timestamp varsa saat de. */
export function formatLastActiveAt(dateInput) {
  const date = parseStamp(dateInput)
  if (!date) return '—'
  const clock = formatClock(dateInput)
  if (clock) return `${format(date, 'd MMM yyyy', { locale: tr })} ${clock}`
  return format(date, 'd MMM yyyy', { locale: tr })
}

/** Liste bileşenlerinde sürenin güncel kalması için periyodik yenileme aralığı (ms) */
export const RELATIVE_TIME_TICK_MS = 30_000

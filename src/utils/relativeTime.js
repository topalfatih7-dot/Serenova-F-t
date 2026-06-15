import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

/** Gerçek zamana göre Türkçe göreli süre: "Az önce", "32 dk önce", "2 saat önce" */
export function formatRelativeTime(dateInput) {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return '—'

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

/** Liste bileşenlerinde sürenin güncel kalması için periyodik yenileme aralığı (ms) */
export const RELATIVE_TIME_TICK_MS = 30_000

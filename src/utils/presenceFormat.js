import { formatDistanceToNow, format } from 'date-fns'
import { tr } from 'date-fns/locale'

export function formatActiveDuration(seconds) {
  if (seconds == null || seconds < 0) return '—'
  if (seconds < 5) return 'Az önce'
  if (seconds < 60) return `${seconds} sn`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return s > 0 ? `${m} dk ${s} sn` : `${m} dk`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h} sa ${rm} dk` : `${h} sa`
}

export function sessionDurationSeconds(sessionStartedAt) {
  if (!sessionStartedAt) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(sessionStartedAt).getTime()) / 1000))
}

export function formatSessionStart(iso) {
  if (!iso) return '—'
  const clock = format(new Date(iso), 'HH:mm', { locale: tr })
  return `${clock} (${formatDistanceToNow(new Date(iso), { addSuffix: true, locale: tr })})`
}

export function roleLabel(role) {
  if (role === 'admin') return 'Admin'
  if (role === 'staff') return 'Personel'
  return 'Üye'
}

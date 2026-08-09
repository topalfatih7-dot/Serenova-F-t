import { sessionsKeyForRole } from '../../utils/staffRoles'

const UPCOMING_STAFF = new Set(['scheduled', 'rescheduled', 'cancel_pending', 'admin_cancel_pending'])

/** Staff overview / clients — yaklaşan onaylı / iptal bekleyen randevular. */
export function getStaffAppointments(clients, role) {
  const now = new Date()
  const key = sessionsKeyForRole(role)
  const list = []
  clients.forEach((m) => {
    (m[key] || []).forEach((s) => {
      const st = s.status || 'scheduled'
      if (UPCOMING_STAFF.has(st) && new Date(s.date) >= now) {
        list.push({ ...s, memberName: m.name, memberId: m.id })
      }
    })
  })
  return list.sort((a, b) => new Date(a.date) - new Date(b.date))
}

/** Onay bekleyen randevu talepleri */
export function getStaffPendingAppointments(clients, role) {
  const now = new Date()
  const key = sessionsKeyForRole(role)
  const list = []
  clients.forEach((m) => {
    (m[key] || []).forEach((s) => {
      if (s.status === 'pending' && new Date(s.date) >= now) {
        list.push({ ...s, memberName: m.name, memberId: m.id })
      }
    })
  })
  return list.sort((a, b) => new Date(a.date) - new Date(b.date))
}

/** Üye iptal talepleri (personel onay/red) */
export function getStaffCancelPendingAppointments(clients, role) {
  const now = new Date()
  const key = sessionsKeyForRole(role)
  const list = []
  clients.forEach((m) => {
    (m[key] || []).forEach((s) => {
      if (s.status === 'cancel_pending' && new Date(s.date) >= now) {
        list.push({ ...s, memberName: m.name, memberId: m.id })
      }
    })
  })
  return list.sort((a, b) => new Date(a.date) - new Date(b.date))
}

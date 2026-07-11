import { sessionsKeyForRole } from '../../utils/staffRoles'

/** Staff overview / clients — yaklaşan randevular. */
export function getStaffAppointments(clients, role) {
  const now = new Date()
  const key = sessionsKeyForRole(role)
  const list = []
  clients.forEach((m) => {
    (m[key] || []).forEach((s) => {
      if (s.status === 'scheduled' && new Date(s.date) >= now) {
        list.push({ ...s, memberName: m.name, memberId: m.id })
      }
    })
  })
  return list.sort((a, b) => new Date(a.date) - new Date(b.date))
}

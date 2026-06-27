import { packageIncludesCoach, packageIncludesDietitian, isPaidMembership } from '../data/membershipPlans'

export const CHAT_CONSENT_KEY = 'yeniform-chat-consent-v1'

export const CHAT_CONSENT_TEXT = `Bu mesajlaşma alanı, atanmış koçunuz ve/veya diyetisyeninizle paketiniz kapsamında iletişim kurmanız içindir.

Gönderdiğiniz ve aldığınız tüm mesajlar güvenli şekilde kaydedilir; hizmet kalitesi, uyumluluk ve olası süreç takipleri için saklanabilir.

Tıbbi acil durumlarda bu kanalı kullanmayın; 112 veya en yakın sağlık kuruluşuna başvurun.`

export function getMemberChatContacts(member, staffList = []) {
  if (!member) return []
  const pkg = member.packageConfig || {}
  const contacts = []

  if (packageIncludesCoach(pkg) && member.assignedCoachId) {
    const coach = staffList.find((s) => String(s.id) === String(member.assignedCoachId))
    if (coach) {
      contacts.push({
        role: 'coach',
        staffId: coach.id,
        name: coach.name,
        title: coach.title || 'Koçunuz',
        photo: coach.photo,
      })
    }
  }

  if (packageIncludesDietitian(pkg) && member.assignedDietitianId) {
    const dietitian = staffList.find((s) => String(s.id) === String(member.assignedDietitianId))
    if (dietitian) {
      contacts.push({
        role: 'dietitian',
        staffId: dietitian.id,
        name: dietitian.name,
        title: dietitian.title || 'Diyetisyeniniz',
        photo: dietitian.photo,
      })
    }
  }

  return contacts
}

export function getStaffClients(members, role, staffId) {
  const sid = String(staffId || '')
  return (members || []).filter((m) => {
    if (!isPaidMembership(m.membership)) return false
    if (m.membershipStatus !== 'active' && m.membershipStatus !== 'expiring') return false
    if (role === 'coach') {
      if (!packageIncludesCoach(m.packageConfig)) return false
      return String(m.assignedCoachId || '') === sid
    }
    if (!packageIncludesDietitian(m.packageConfig)) return false
    return String(m.assignedDietitianId || '') === sid
  })
}

export function memberHasChatAccess(member) {
  const pkg = member?.packageConfig || {}
  return Boolean(
    (packageIncludesCoach(pkg) && member?.assignedCoachId)
    || (packageIncludesDietitian(pkg) && member?.assignedDietitianId),
  )
}

export function sortThreadsForInbox(threads, perspective = 'member') {
  const unreadKey = perspective === 'staff' ? 'staffUnread' : 'memberUnread'
  return [...threads].sort((a, b) => {
    const aUnread = Number(a[unreadKey] || a.data?.[unreadKey] || 0) > 0 ? 1 : 0
    const bUnread = Number(b[unreadKey] || b.data?.[unreadKey] || 0) > 0 ? 1 : 0
    if (bUnread !== aUnread) return bUnread - aUnread
    const aTime = new Date(a.lastMessageAt || a.createdAt || 0).getTime()
    const bTime = new Date(b.lastMessageAt || b.createdAt || 0).getTime()
    return bTime - aTime
  })
}

export function threadUnreadCount(thread, perspective = 'member') {
  if (!thread) return 0
  const key = perspective === 'staff' ? 'staffUnread' : 'memberUnread'
  return Number(thread[key] ?? thread.data?.[key] ?? 0)
}

export function totalUnreadThreads(threads, perspective = 'member') {
  return (threads || []).reduce((sum, t) => sum + threadUnreadCount(t, perspective), 0)
}

export function adminStaffThreadUnreadCount(thread, perspective = 'admin') {
  if (!thread) return 0
  const key = perspective === 'staff' ? 'staffUnread' : 'adminUnread'
  return Number(thread[key] ?? thread.data?.[key] ?? 0)
}

export function sortAdminStaffThreads(threads, perspective = 'admin') {
  const unreadKey = perspective === 'staff' ? 'staffUnread' : 'adminUnread'
  return [...threads].sort((a, b) => {
    const aUnread = Number(a[unreadKey] || a.data?.[unreadKey] || 0) > 0 ? 1 : 0
    const bUnread = Number(b[unreadKey] || b.data?.[unreadKey] || 0) > 0 ? 1 : 0
    if (bUnread !== aUnread) return bUnread - aUnread
    const aTime = new Date(a.lastMessageAt || a.createdAt || 0).getTime()
    const bTime = new Date(b.lastMessageAt || b.createdAt || 0).getTime()
    return bTime - aTime
  })
}

export function staffRoleLabel(role) {
  if (role === 'dietitian') return 'Diyetisyen'
  if (role === 'coach') return 'Koç'
  return 'Personel'
}

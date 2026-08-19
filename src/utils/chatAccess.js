import { packageIncludesCoach, packageIncludesDietitian, packageIncludesDoctor, isPaidMembership } from '../data/membershipPlans'
import { publicStaffTitle } from '../data/staffProfile'
import { normalizeStaffRole } from './staffRoles'
import { staffCollabMembersSignature } from '../services/staffCollabChatDb'

export const CHAT_CONSENT_KEY = 'yeniform-chat-consent-v1'

export const CHAT_CONSENT_TEXT = `Bu mesajlaşma alanı, atanmış koçunuz, diyetisyeniniz ve/veya doktorunuzla paketiniz kapsamında iletişim kurmanız içindir.

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
        title: publicStaffTitle(coach) || 'Koçunuz',
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
        title: publicStaffTitle(dietitian) || 'Diyetisyeniniz',
        photo: dietitian.photo,
      })
    }
  }

  if (packageIncludesDoctor(pkg) && member.assignedDoctorId) {
    const doctor = staffList.find((s) => String(s.id) === String(member.assignedDoctorId))
    if (doctor) {
      contacts.push({
        role: 'doctor',
        staffId: doctor.id,
        name: doctor.name,
        title: publicStaffTitle(doctor) || 'Doktorunuz',
        photo: doctor.photo,
      })
    }
  }

  return contacts
}

export function getStaffClients(members, role, staffId) {
  const sid = String(staffId || '')
  if (!sid) return []
  const normalizedRole = normalizeStaffRole(role)
  const assignmentKey = normalizedRole === 'coach'
    ? 'assignedCoachId'
    : normalizedRole === 'doctor'
      ? 'assignedDoctorId'
      : 'assignedDietitianId'

  return (members || []).filter((m) => {
    if (!isPaidMembership(m.membership)) return false
    const status = m.membershipStatus || 'active'
    if (status !== 'active' && status !== 'expiring') return false
    if (String(m[assignmentKey] || '') !== sid) return false
    if (normalizedRole === 'coach') {
      return packageIncludesCoach(m.packageConfig) || Boolean(m.assignedCoachId)
    }
    if (normalizedRole === 'doctor') {
      return packageIncludesDoctor(m.packageConfig) || Boolean(m.assignedDoctorId)
    }
    return packageIncludesDietitian(m.packageConfig) || Boolean(m.assignedDietitianId)
  })
}

/** Personel paneli: atanmış danışanları mevcut thread kayıtlarıyla eşleştirir */
export function buildStaffChatInbox(clients, threads, staffUser) {
  const staffId = String(staffUser?.id || '')
  const role = normalizeStaffRole(staffUser?.role)
  const roleThreads = (threads || []).filter(
    (t) => String(t.staffId) === staffId && t.staffRole === role,
  )
  const threadByMember = new Map(roleThreads.map((t) => [String(t.memberId), t]))

  return (clients || []).map((member) => ({
    member,
    thread: threadByMember.get(String(member.id)) || null,
  }))
}

export function sortStaffInboxItems(items) {
  return [...items].sort((a, b) => {
    const aUnread = threadUnreadCount(a.thread, 'staff') > 0 ? 1 : 0
    const bUnread = threadUnreadCount(b.thread, 'staff') > 0 ? 1 : 0
    if (bUnread !== aUnread) return bUnread - aUnread
    const aTime = new Date(a.thread?.lastMessageAt || 0).getTime()
    const bTime = new Date(b.thread?.lastMessageAt || 0).getTime()
    if (bTime !== aTime) return bTime - aTime
    return (a.member?.name || '').localeCompare(b.member?.name || '', 'tr')
  })
}

export function staffClientsSignature(members, role, staffId) {
  return getStaffClients(members, role, staffId)
    .map((m) => m.id)
    .sort()
    .join(',')
}

/** Üye sohbeti: yalnızca atama + paket değişince yeniden hydrate gerekir */
export function memberChatHydrationSignature(member) {
  if (!member?.id) return ''
  const pkg = member.packageConfig || {}
  const parts = [member.id, member.membership || 'free', member.membershipStatus || 'active']
  if (packageIncludesCoach(pkg) && member.assignedCoachId) {
    parts.push(`coach:${member.assignedCoachId}`)
  }
  if (packageIncludesDietitian(pkg) && member.assignedDietitianId) {
    parts.push(`diet:${member.assignedDietitianId}`)
  }
  if (packageIncludesDoctor(pkg) && member.assignedDoctorId) {
    parts.push(`doctor:${member.assignedDoctorId}`)
  }
  return parts.join('|')
}

function staffListSignature(staffList = []) {
  return staffList.map((s) => s.id).filter(Boolean).sort().join(',')
}

/**
 * Sohbet thread hydrate anahtarı — kilo/progress vb. güncellemelerinde değişmez.
 */
export function chatHydrationKey(session, member, staffUser, members = [], staffList = []) {
  const type = session?.type || ''
  const sessionId = session?.memberId || session?.staffId || staffUser?.id || ''
  const staffKey = staffListSignature(staffList)

  if (type === 'admin') return `admin|${staffKey}`
  if (type === 'member') {
    return `member|${sessionId}|${memberChatHydrationSignature(member)}|staff:${staffKey}`
  }
  if (type === 'staff' && staffUser?.id) {
    return [
      'staff',
      staffUser.id,
      staffClientsSignature(members, staffUser.role, staffUser.id),
      staffCollabMembersSignature(members, staffUser),
      `staff:${staffKey}`,
    ].join('|')
  }
  return `${type}|${sessionId}`
}

export function memberHasChatAccess(member) {
  const pkg = member?.packageConfig || {}
  return Boolean(
    (packageIncludesCoach(pkg) && member?.assignedCoachId)
    || (packageIncludesDietitian(pkg) && member?.assignedDietitianId)
    || (packageIncludesDoctor(pkg) && member?.assignedDoctorId),
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
  if (role === 'doctor') return 'Doktor'
  return 'Personel'
}

export function staffCollabThreadUnreadCount(thread, perspective = 'coach') {
  if (!thread) return 0
  const key = perspective === 'dietitian'
    ? 'dietitianUnread'
    : perspective === 'doctor'
      ? 'doctorUnread'
      : 'coachUnread'
  return Number(thread[key] ?? thread.data?.[key] ?? 0)
}

export function sortStaffCollabThreads(threads, perspective = 'coach') {
  const unreadKey = perspective === 'dietitian'
    ? 'dietitianUnread'
    : perspective === 'doctor'
      ? 'doctorUnread'
      : 'coachUnread'
  return [...threads].sort((a, b) => {
    const aUnread = Number(a[unreadKey] || a.data?.[unreadKey] || 0) > 0 ? 1 : 0
    const bUnread = Number(b[unreadKey] || b.data?.[unreadKey] || 0) > 0 ? 1 : 0
    if (bUnread !== aUnread) return bUnread - aUnread
    const aTime = new Date(a.lastMessageAt || a.createdAt || 0).getTime()
    const bTime = new Date(b.lastMessageAt || b.createdAt || 0).getTime()
    return bTime - aTime
  })
}

export function buildStaffCollabInbox(members, threads, staffUser) {
  const role = normalizeStaffRole(staffUser?.role)
  const threadByMember = new Map((threads || []).map((t) => [String(t.memberId), t]))
  return (members || []).map((member) => {
    const thread = threadByMember.get(String(member.id)) || null
    let peerName = ''
    if (role === 'coach') {
      peerName = [thread?.dietitianName, thread?.doctorName].filter(Boolean).join(' · ')
    } else if (role === 'dietitian') {
      peerName = [thread?.coachName, thread?.doctorName].filter(Boolean).join(' · ')
    } else if (role === 'doctor') {
      peerName = [thread?.coachName, thread?.dietitianName].filter(Boolean).join(' · ')
    }
    return { member, thread, peerName }
  })
}

export function sortStaffCollabInbox(items, perspective = 'coach') {
  return [...items].sort((a, b) => {
    const aUnread = staffCollabThreadUnreadCount(a.thread, perspective) > 0 ? 1 : 0
    const bUnread = staffCollabThreadUnreadCount(b.thread, perspective) > 0 ? 1 : 0
    if (bUnread !== aUnread) return bUnread - aUnread
    const aTime = new Date(a.thread?.lastMessageAt || 0).getTime()
    const bTime = new Date(b.thread?.lastMessageAt || 0).getTime()
    if (bTime !== aTime) return bTime - aTime
    return (a.member?.name || '').localeCompare(b.member?.name || '', 'tr')
  })
}

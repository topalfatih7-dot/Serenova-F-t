import { getStaffClients } from './chatAccess'

export const MEMBER_SESSION_KEYS = ['coachSessions', 'dietitianSessions', 'doctorSessions']

/** Bellek/context yükünü azaltmak için randevu dizilerini boşaltır (DB'de kalır). */
export function stripMemberSessions(member) {
  if (!member) return member
  return {
    ...member,
    coachSessions: [],
    dietitianSessions: [],
    doctorSessions: [],
  }
}

/**
 * Personel tarafında üye e-posta/telefon gizlenir.
 * `_contactHidden`: updateMemberRow'un boş iletişim yazmasını engeller.
 */
export function stripMemberContact(member) {
  if (!member || member._contactHidden) return member
  return {
    ...member,
    email: '',
    phone: '',
    phoneCountry: '',
    _contactHidden: true,
  }
}

/**
 * Admin: tüm üyelerden session strip.
 * Staff: danışanlar + iletişim strip; atanmadığı üyelerden session strip.
 * Member: dokunulmaz.
 */
export function compactMembersForRole(members, role, staffUser = null) {
  if (role === 'member' || !Array.isArray(members)) return members
  if (role === 'admin') return members.map(stripMemberSessions)
  if (role === 'staff' && staffUser?.id) {
    const clientIds = new Set(
      getStaffClients(members, staffUser.role, staffUser.id).map((m) => m.id),
    )
    return members.map((m) => {
      const base = clientIds.has(m.id) ? m : stripMemberSessions(m)
      return stripMemberContact(base)
    })
  }
  return members.map((m) => stripMemberContact(stripMemberSessions(m)))
}

export function applySessionCompactionToMember(member, role, staffUser = null, allMembers = []) {
  if (role === 'member') return member
  if (role === 'admin') return stripMemberSessions(member)
  if (role === 'staff' && staffUser?.id) {
    const clientIds = new Set(
      getStaffClients(allMembers, staffUser.role, staffUser.id).map((m) => m.id),
    )
    const base = clientIds.has(member.id) ? member : stripMemberSessions(member)
    return stripMemberContact(base)
  }
  return stripMemberContact(stripMemberSessions(member))
}

export function extractSessionsFromMemberData(data = {}) {
  return {
    coachSessions: data.coachSessions || [],
    dietitianSessions: data.dietitianSessions || [],
    doctorSessions: data.doctorSessions || [],
  }
}

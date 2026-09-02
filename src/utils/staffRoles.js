import { Dumbbell, Apple } from 'lucide-react'

export const STAFF_ROLES = [
  { value: 'coach', label: 'Koç', icon: Dumbbell, color: 'brand' },
  { value: 'dietitian', label: 'Diyetisyen', icon: Apple, color: 'sage' },
]

export function isKnownStaffRole(role) {
  return role === 'coach' || role === 'dietitian'
}

export function normalizeStaffRole(role) {
  if (role === 'dietitian') return 'dietitian'
  return 'coach'
}

export function staffRoleMeta(role) {
  return STAFF_ROLES.find((r) => r.value === role) || STAFF_ROLES[0]
}

export function staffRoleLabel(role) {
  return staffRoleMeta(role).label
}

export function isCoachRole(role) {
  return normalizeStaffRole(role) === 'coach'
}

export function isDietitianRole(role) {
  return normalizeStaffRole(role) === 'dietitian'
}

/** coachSessions | dietitianSessions */
export function sessionsKeyForRole(role) {
  return normalizeStaffRole(role) === 'dietitian' ? 'dietitianSessions' : 'coachSessions'
}

/** assignedCoachId | assignedDietitianId */
export function assignedKeyForRole(role) {
  return normalizeStaffRole(role) === 'dietitian' ? 'assignedDietitianId' : 'assignedCoachId'
}

/** Video / randevu sessionType: coach | dietitian */
export function sessionTypeForRole(role) {
  return normalizeStaffRole(role)
}

export function panelTitleForRole(role) {
  return normalizeStaffRole(role) === 'dietitian' ? 'Diyetisyen paneli' : 'Koç paneli'
}

export function fallbackNameForRole(role) {
  return staffRoleLabel(role)
}

/** URL / route param → sessionType */
export function normalizeSessionType(sessionType) {
  if (sessionType === 'dietitian') return 'dietitian'
  return 'coach'
}

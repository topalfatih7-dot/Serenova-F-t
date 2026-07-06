import { Dumbbell, Apple, Stethoscope } from 'lucide-react'

export const STAFF_ROLES = [
  { value: 'coach', label: 'Koç', icon: Dumbbell, color: 'brand' },
  { value: 'dietitian', label: 'Diyetisyen', icon: Apple, color: 'sage' },
  { value: 'doctor', label: 'Doktor', icon: Stethoscope, color: 'cream' },
]

export function normalizeStaffRole(role) {
  if (role === 'dietitian' || role === 'doctor') return role
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

export function isDoctorRole(role) {
  return normalizeStaffRole(role) === 'doctor'
}

/** coachSessions | dietitianSessions | doctorSessions */
export function sessionsKeyForRole(role) {
  const r = normalizeStaffRole(role)
  if (r === 'dietitian') return 'dietitianSessions'
  if (r === 'doctor') return 'doctorSessions'
  return 'coachSessions'
}

/** assignedCoachId | assignedDietitianId | assignedDoctorId */
export function assignedKeyForRole(role) {
  const r = normalizeStaffRole(role)
  if (r === 'dietitian') return 'assignedDietitianId'
  if (r === 'doctor') return 'assignedDoctorId'
  return 'assignedCoachId'
}

/** Video / randevu sessionType: coach | dietitian | doctor */
export function sessionTypeForRole(role) {
  return normalizeStaffRole(role)
}

export function panelTitleForRole(role) {
  const r = normalizeStaffRole(role)
  if (r === 'dietitian') return 'Diyetisyen paneli'
  if (r === 'doctor') return 'Doktor paneli'
  return 'Koç paneli'
}

export function fallbackNameForRole(role) {
  return staffRoleLabel(role)
}

/** URL / route param → sessionType */
export function normalizeSessionType(sessionType) {
  if (sessionType === 'dietitian' || sessionType === 'doctor') return sessionType
  return 'coach'
}

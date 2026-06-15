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

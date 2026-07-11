import { getCoachMeetingsPerMonth } from '../../data/membershipPlans'
import { doctorBookingLimit, doctorLimitIsOneTime } from '../../utils/memberPackages'

export function coachMonthlyLimit(packageConfig) {
  return getCoachMeetingsPerMonth(packageConfig)
}

export function dietitianMonthlyLimit(packageConfig) {
  return Number(packageConfig?.dietitianMeetingsPerMonth) || 0
}

export function doctorMonthlyLimit(packageConfig, member = null) {
  return doctorBookingLimit(packageConfig, member)
}

export function doctorLimitLabel(packageConfig, member = null) {
  if (doctorLimitIsOneTime(packageConfig)) {
    const n = doctorBookingLimit(packageConfig, member)
    return n > 0 ? `${n} görüşme hakkı` : 'Hak kullanıldı'
  }
  const n = Number(packageConfig?.doctorMeetingsPerMonth) || 0
  return n > 0 ? `Ayda ${n} görüşme` : '—'
}

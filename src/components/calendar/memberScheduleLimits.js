import { getCoachMeetingsPerMonth } from '../../data/membershipPlans'

export function coachMonthlyLimit(packageConfig) {
  return getCoachMeetingsPerMonth(packageConfig)
}

export function dietitianMonthlyLimit(packageConfig) {
  return Number(packageConfig?.dietitianMeetingsPerMonth) || 0
}

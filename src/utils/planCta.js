import { isPaidMembership } from '../data/membershipPlans'
import { isOneTimePlan, memberHasActivePaidPackages } from './memberPackages'

const PLAN_RANK = {
  free: 0,
  eko: 1,
  eko_diyet: 2,
  eko_spor: 3,
  diyet: 4,
  spor: 5,
  doktor: 6,
  vip: 7,
}

/** Plan kartı / karşılaştırma CTA metni */
export function getPlanCtaLabel(plan, { forMember = false, member = null, currentMembership = 'free' } = {}) {
  if (!forMember) {
    return plan.price === 0 ? 'Paketleri İncele' : `${plan.name} ile Kayıt Ol`
  }

  if (plan.price === 0) return 'Paketsiz moda geç'
  if (isOneTimePlan(plan.id)) return 'Doktor Paketi Ekle'

  const hasPaid = member
    ? memberHasActivePaidPackages(member)
    : isPaidMembership(currentMembership)

  if (!hasPaid) return 'Bu Plana Geç'

  const planRank = PLAN_RANK[plan.id] ?? 0
  const curRank = PLAN_RANK[currentMembership] ?? 0
  if (planRank > curRank) return `${plan.name}'a Yükselt`
  return `${plan.name} Ekle`
}

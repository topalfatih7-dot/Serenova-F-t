/**
 * Sunucu tarafı plan entitlements — DB `plans` tablosu + legacy fallback.
 * Client `membershipPlans.js` ile aynı şekil.
 */

const LEGACY_PACKAGE = {
  eko: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 0 },
  eko_diyet: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 1 },
  eko_spor: { coachMeetingsPerMonth: 1, dietitianMeetingsPerMonth: 0 },
  diyet: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 2 },
  spor: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 0 },
  vip: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2 },
  kurucu: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2 },
  gumus: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 1, coachMeetingsPerWeek: 1 },
  altin: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2, coachMeetingsPerWeek: 2 },
  platinum: { coachMeetingsPerMonth: 4, dietitianMeetingsPerMonth: 4, coachMeetingsPerWeek: 3 },
  premium: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2, coachMeetingsPerWeek: 2 },
}

const LEGACY_PHOTO = new Set(['eko_diyet', 'eko_spor', 'diyet', 'spor', 'vip', 'platinum', 'premium'])
const LEGACY_MANUAL_EXCLUDE = new Set(['free', 'kurucu'])
const LEGACY_PAID = new Set([
  'eko', 'eko_diyet', 'eko_spor', 'diyet', 'spor', 'vip',
  'gumus', 'altin', 'platinum', 'premium', 'kurucu',
])

let _cache = { at: 0, byId: new Map() }
const CACHE_TTL_MS = 30_000

export function normalizeEntitlements(raw = {}) {
  return {
    coachMeetingsPerMonth: Math.max(0, Number(raw.coachMeetingsPerMonth) || 0),
    dietitianMeetingsPerMonth: Math.max(0, Number(raw.dietitianMeetingsPerMonth) || 0),
    photoCalorie: Boolean(raw.photoCalorie),
    manualCalorie: Boolean(raw.manualCalorie),
  }
}

function mapPlanRow(row) {
  if (!row) return null
  const isSellable = row.is_sellable == null ? undefined : row.is_sellable === true
  const ent = row.entitlements
  const hasEnt = ent && typeof ent === 'object' && !Array.isArray(ent) && Object.keys(ent).length > 0
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price) || 0,
    period: row.period || 'Aylık',
    isActive: row.is_active !== false,
    isSellable,
    billingType: row.billing_type === 'one_time' ? 'one_time' : 'recurring',
    entitlements: hasEnt ? normalizeEntitlements(ent) : null,
    pricingTiers: row.pricing_tiers || [],
  }
}

export async function loadPlansById(admin) {
  const now = Date.now()
  if (_cache.byId.size && (now - _cache.at) < CACHE_TTL_MS) return _cache.byId
  if (!admin) return _cache.byId

  const { data, error } = await admin.from('plans').select('*')
  if (error || !data) return _cache.byId

  const byId = new Map()
  for (const row of data) {
    const plan = mapPlanRow(row)
    if (plan?.id) byId.set(plan.id, plan)
  }
  _cache = { at: now, byId }
  return byId
}

export function invalidatePlanCache() {
  _cache = { at: 0, byId: new Map() }
}

export function isOneTimePlanId(planId, plan = null) {
  if (plan?.billingType === 'one_time') return true
  if (plan?.period === 'Tek Seferlik') return true
  return Boolean(LEGACY_PACKAGE[planId]?.billingType === 'one_time')
}

export function defaultPackageForPlan(planId, durationMonths = 1, plan = null) {
  if (plan?.entitlements && typeof plan.entitlements === 'object') {
    const e = normalizeEntitlements(plan.entitlements)
    const oneTime = isOneTimePlanId(planId, plan)
    const months = Number(durationMonths) || 1
    return {
      coachMeetingsPerMonth: e.coachMeetingsPerMonth,
      dietitianMeetingsPerMonth: e.dietitianMeetingsPerMonth,
      coachMeetingsPerWeek: 0,
      addOns: [],
      ...(oneTime
        ? { billingType: 'one_time', durationMonths: 0, durationWeeks: 0 }
        : { durationMonths: months, durationWeeks: months * 4 }),
    }
  }

  const months = Number(durationMonths) || 1
  const base = LEGACY_PACKAGE[planId] || {
    coachMeetingsPerMonth: 0,
    dietitianMeetingsPerMonth: 0,
  }
  return {
    coachMeetingsPerWeek: 0,
    addOns: [],
    ...base,
    durationMonths: months,
    durationWeeks: months * 4,
  }
}

export function planHasPhotoCalorie(planId, plan = null) {
  if (plan && typeof plan.entitlements?.photoCalorie === 'boolean') return plan.entitlements.photoCalorie
  return LEGACY_PHOTO.has(planId)
}

export function planHasManualCalorie(planId, plan = null) {
  if (plan && typeof plan.entitlements?.manualCalorie === 'boolean') return plan.entitlements.manualCalorie
  if (LEGACY_MANUAL_EXCLUDE.has(planId)) return false
  return planId !== 'free'
}

export function isLegacyPaidPlanId(id) {
  return LEGACY_PAID.has(id)
}

/** Checkout: aktif + satılabilir + fiyat > 0 (veya one_time) */
export function isCheckoutEligiblePlan(plan) {
  if (!plan || plan.id === 'free') return false
  if (plan.isActive === false) return false
  if (plan.isSellable !== true) return false
  return Number(plan.price) > 0 || isOneTimePlanId(plan.id, plan)
}

export function tierPriceFromPlan(plan, months = 1) {
  if (!plan) return 0
  const m = Number(months) || 1
  const tiers = plan.pricingTiers || plan.pricing_tiers || []
  if (Array.isArray(tiers) && tiers.length) {
    const tier = tiers.find((t) => Number(t.months) === m)
    if (tier != null && Number(tier.price) > 0) return Number(tier.price)
    if (m === 1) {
      const priced = tiers.find((t) => Number(t.price) > 0)
      if (priced) return Number(priced.price)
    }
  }
  return Number(plan.price) || 0
}

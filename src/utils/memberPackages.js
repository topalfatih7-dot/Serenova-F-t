import {
  DEFAULT_PACKAGE,
  getDefaultPackageForPlan,
  getPlanFromCatalog,
  hasManualCalorieAccess,
  hasPhotoCalorieAccess,
  isPaidMembership,
  PLAN_IDS,
  sanitizeStaffForPackage,
} from '../data/membershipPlans'
import { computePremiumExpiresAt, getDurationMonths } from '../services/premiumMembership'

const today = () => new Date().toISOString().split('T')[0]

export const ONE_TIME_PLANS = new Set()

export function isOneTimePlan(planId) {
  if (!planId) return false
  if (ONE_TIME_PLANS.has(planId)) return true
  const plan = getPlanFromCatalog(planId)
  return plan?.billingType === 'one_time' || plan?.period === 'Tek Seferlik'
}

export function isOneTimePackage(pkg) {
  if (!pkg) return false
  return isOneTimePlan(pkg.planId) || pkg.packageConfig?.billingType === 'one_time'
}

export function isPackageEntryActive(pkg, now = today()) {
  if (!pkg || pkg.status !== 'active') return false
  if (isOneTimePackage(pkg)) return true
  if (!pkg.expiresAt) return true
  return pkg.expiresAt >= now
}

/** Eski tekil üyelik → activePackages dizisine taşır */
export function migrateLegacyToPackages(member) {
  // Explicit array (including []) is authoritative — do not revive from membership
  if (Array.isArray(member?.activePackages)) {
    return member.activePackages
  }
  if (!member || !isPaidMembership(member.membership)) return []
  const planId = member.membership
  const packageConfig = member.packageConfig || getDefaultPackageForPlan(planId)
  return [{
    id: `legacy-${member.id}-${planId}`,
    planId,
    packageConfig,
    startedAt: member.premiumStartedAt || member.joinedAt || today(),
    expiresAt: isOneTimePlan(planId) ? null : (member.premiumExpiresAt || null),
    status: 'active',
    purchasedAt: member.premiumStartedAt || member.joinedAt || today(),
  }]
}

export function mergePackageConfigs(packages = [], member = null) {
  const active = packages.filter((p) => isPackageEntryActive(p))
  const merged = { ...DEFAULT_PACKAGE, addOns: [] }

  active.forEach((pkg) => {
    const c = pkg.packageConfig || {}
    merged.coachMeetingsPerMonth = Math.max(
      merged.coachMeetingsPerMonth,
      Number(c.coachMeetingsPerMonth) || 0
    )
    merged.dietitianMeetingsPerMonth = Math.max(
      merged.dietitianMeetingsPerMonth,
      Number(c.dietitianMeetingsPerMonth) || 0
    )
    merged.coachMeetingsPerWeek = Math.max(
      merged.coachMeetingsPerWeek,
      Number(c.coachMeetingsPerWeek) || 0
    )
    merged.durationMonths = Math.max(merged.durationMonths || 0, getDurationMonths(c))
  })

  const hasSubscription = active.some((p) => !isOneTimePackage(p))
  if (!hasSubscription && active.some(isOneTimePackage)) {
    merged.billingType = 'one_time'
  }

  return merged
}

const PLAN_RANK = Object.fromEntries(PLAN_IDS.map((id, i) => [id, i]))

/** Geriye dönük plan id → sıra (resolvePrimaryMembership) */
export const LEGACY_PLAN_RANK = {
  gumus: 1,
  altin: 6,
  kurucu: 6,
  platinum: 7,
  premium: 7,
}

export function planRank(planId) {
  if (PLAN_RANK[planId] != null) return PLAN_RANK[planId]
  return LEGACY_PLAN_RANK[planId] ?? 0
}

/** Görüntüleme için birincil plan (en yüksek abonelik). */
export function resolvePrimaryMembership(activePackages = [], fallback = 'free') {
  const active = activePackages.filter((p) => isPackageEntryActive(p))
  if (!active.length) return fallback === 'free' ? 'free' : fallback

  const subs = active.filter((p) => !isOneTimePackage(p))
  const pool = subs.length ? subs : active
  return pool.reduce((best, p) => {
    const rank = planRank(p.planId)
    const bestRank = planRank(best)
    return rank >= bestRank ? p.planId : best
  }, pool[0].planId)
}

const KNOWN_PROVIDERS = new Set(['stripe', 'revenuecat', 'admin'])

export function normalizePackageProvider(pkg) {
  const p = String(pkg?.provider || '').trim()
  if (KNOWN_PROVIDERS.has(p)) return p
  return 'legacy'
}

export function createPackageEntry(planId, packageConfig, meta = {}) {
  const startedAt = meta.startedAt || today()
  const oneTime = isOneTimePlan(planId) || packageConfig?.billingType === 'one_time'
  const provider = KNOWN_PROVIDERS.has(String(meta.provider || '').trim())
    ? String(meta.provider).trim()
    : 'legacy'
  const entry = {
    id: meta.id || `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    planId,
    packageConfig,
    startedAt,
    expiresAt: oneTime
      ? null
      : (meta.expiresAt || computePremiumExpiresAt(startedAt, getDurationMonths(packageConfig))),
    status: 'active',
    purchasedAt: meta.purchasedAt || new Date().toISOString(),
    price: meta.price || 0,
    provider,
  }
  const sid = String(meta.stripeSubscriptionId || '').trim()
  if (sid) entry.stripeSubscriptionId = sid
  if (meta.cancelAtPeriodEnd != null) entry.cancelAtPeriodEnd = Boolean(meta.cancelAtPeriodEnd)
  const periodEnd = String(meta.currentPeriodEnd || '').trim()
  if (periodEnd) entry.currentPeriodEnd = periodEnd
  return entry
}

export function addMemberPackage(activePackages = [], planId, packageConfig, meta = {}) {
  return [...(activePackages || []), createPackageEntry(planId, packageConfig, meta)]
}

/** Tek paket çıkar — status: expired; syncMemberPackages birleşik hakları yeniden hesaplar */
export function removeMemberPackage(activePackages = [], packageId) {
  if (!packageId) return activePackages || []
  return (activePackages || []).map((p) => (
    p.id === packageId ? { ...p, status: 'expired' } : p
  ))
}

/** Abonelik paketleri arasında hedef (veya birincil) entry id */
export function resolveTargetSubscriptionPackageId(activePackages = [], targetPackageId = null) {
  const active = (activePackages || []).filter((p) => isPackageEntryActive(p) && !isOneTimePackage(p))
  if (!active.length) return null
  if (targetPackageId && active.some((p) => p.id === targetPackageId)) return targetPackageId
  const primaryId = resolvePrimaryMembership(active, active[0].planId)
  const primary = active.find((p) => p.planId === primaryId)
  return primary?.id || active[0].id
}

/** Süre ayını yeniden yaz; startedAt korunur, expiresAt yeniden hesaplanır */
export function updatePackageDuration(activePackages = [], packageId, durationMonths) {
  const months = Number(durationMonths) || 1
  return (activePackages || []).map((p) => {
    if (p.id !== packageId || isOneTimePackage(p)) return p
    const packageConfig = {
      ...(p.packageConfig || {}),
      durationMonths: months,
      durationWeeks: months * 4,
    }
    return {
      ...p,
      packageConfig,
      expiresAt: computePremiumExpiresAt(p.startedAt || today(), months),
    }
  })
}

/** Kalan gün / uzatma / açık bitiş — yalnızca hedef (veya birincil) abonelik */
export function patchPackageExpiry(activePackages = [], {
  targetPackageId = null,
  extendDays = null,
  setRemainingDays = null,
  premiumExpiresAt = null,
  extendAll = false,
} = {}) {
  const targetId = resolveTargetSubscriptionPackageId(activePackages, targetPackageId)

  if (extendDays != null && Number(extendDays) !== 0) {
    const days = Number(extendDays)
    return (activePackages || []).map((p) => {
      if (isOneTimePackage(p) || !isPackageEntryActive(p)) return p
      if (!extendAll && p.id !== targetId) return p
      const base = p.expiresAt && p.expiresAt >= today()
        ? new Date(p.expiresAt)
        : new Date()
      base.setHours(0, 0, 0, 0)
      base.setDate(base.getDate() + days)
      return { ...p, expiresAt: base.toISOString().split('T')[0] }
    })
  }

  if (setRemainingDays != null && Number(setRemainingDays) >= 0) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + Number(setRemainingDays))
    const newExpiry = d.toISOString().split('T')[0]
    return (activePackages || []).map((p) => (
      p.id === targetId ? { ...p, expiresAt: newExpiry } : p
    ))
  }

  if (premiumExpiresAt) {
    return (activePackages || []).map((p) => (
      p.id === targetId ? { ...p, expiresAt: premiumExpiresAt } : p
    ))
  }

  return activePackages || []
}

export function memberHasActivePaidPackages(member) {
  const packages = migrateLegacyToPackages(member)
  return packages.some((p) => isPackageEntryActive(p))
}

export function unixSecondsToIsoDate(unix) {
  const n = Number(unix)
  if (!Number.isFinite(n) || n <= 0) return null
  const ms = n > 1e12 ? n : n * 1000
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().split('T')[0]
}

export function packageStripeSubscriptionId(pkg) {
  const sid = String(pkg?.stripeSubscriptionId || '').trim()
  return sid || null
}

export function findPackageBySubscriptionId(packages, subscriptionId, member = null) {
  const sid = String(subscriptionId || '').trim()
  if (!sid) return null
  const pkgs = packages || []
  const exact = pkgs.find((p) => packageStripeSubscriptionId(p) === sid)
  if (exact) return exact
  const memberSid = String(member?.stripeSubscriptionId || '').trim()
  if (memberSid !== sid) return null
  const unlabeled = pkgs.filter((p) => (
    isPackageEntryActive(p)
    && !isOneTimePackage(p)
    && !packageStripeSubscriptionId(p)
    && (normalizePackageProvider(p) === 'stripe' || normalizePackageProvider(p) === 'legacy')
  ))
  if (unlabeled.length === 1) return unlabeled[0]
  const stripeRecurring = pkgs.filter((p) => (
    isPackageEntryActive(p)
    && !isOneTimePackage(p)
    && (normalizePackageProvider(p) === 'stripe' || normalizePackageProvider(p) === 'legacy')
  ))
  if (stripeRecurring.length === 1) return stripeRecurring[0]
  return null
}

export function packageBillingSubscriptionId(pkg, member) {
  const sid = packageStripeSubscriptionId(pkg)
  if (sid) return sid
  if (isOneTimePackage(pkg)) return null
  const memberSid = String(member?.stripeSubscriptionId || '').trim()
  if (!memberSid) return null
  const match = findPackageBySubscriptionId(migrateLegacyToPackages(member), memberSid, member)
  return match?.id === pkg?.id ? memberSid : null
}

function clearMemberLevelSubIfMatch(member, subscriptionId) {
  if (String(member?.stripeSubscriptionId || '').trim() !== String(subscriptionId || '').trim()) {
    return member
  }
  return { ...member, stripeSubscriptionId: null }
}

export function expirePackageBySubscriptionId(member, subscriptionId) {
  if (!member) return member
  const sid = String(subscriptionId || '').trim()
  if (!sid) return member
  const packages = migrateLegacyToPackages(member)
  const target = findPackageBySubscriptionId(packages, sid, member)
  if (!target) return member
  const next = packages.map((pkg) => {
    if (pkg.id !== target.id && packageStripeSubscriptionId(pkg) !== sid) return pkg
    return { ...pkg, status: 'expired', cancelAtPeriodEnd: false }
  })
  return syncMemberPackages(clearMemberLevelSubIfMatch({
    ...member,
    activePackages: next,
  }, sid))
}

export function applyStripeSubscriptionState(member, subscription = {}) {
  if (!member) return member
  const sid = String(subscription.id || '').trim()
  if (!sid) return member
  const status = String(subscription.status || '')
  if (status === 'canceled' || status === 'incomplete_expired') {
    return expirePackageBySubscriptionId(member, sid)
  }
  const packages = migrateLegacyToPackages(member)
  const target = findPackageBySubscriptionId(packages, sid, member)
  if (!target) return member
  const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end)
  const currentPeriodEnd = unixSecondsToIsoDate(subscription.current_period_end)
  const next = packages.map((pkg) => {
    if (pkg.id !== target.id && packageStripeSubscriptionId(pkg) !== sid) return pkg
    const updated = {
      ...pkg,
      stripeSubscriptionId: sid,
      provider: pkg.provider === 'admin' ? pkg.provider : 'stripe',
      cancelAtPeriodEnd,
      status: pkg.status === 'expired' ? 'active' : (pkg.status || 'active'),
    }
    if (currentPeriodEnd) {
      updated.currentPeriodEnd = currentPeriodEnd
      if (!updated.expiresAt || cancelAtPeriodEnd || currentPeriodEnd > updated.expiresAt) {
        updated.expiresAt = currentPeriodEnd
      }
    }
    return updated
  })
  return syncMemberPackages({
    ...member,
    activePackages: next,
    stripeSubscriptionId: member.stripeSubscriptionId || sid,
  })
}

export function listCancelAtPeriodEndPackages(member) {
  return migrateLegacyToPackages(member).filter((p) => (
    isPackageEntryActive(p)
    && !isOneTimePackage(p)
    && Boolean(p.cancelAtPeriodEnd)
  ))
}

export function memberHasActiveRecurringPackages(member) {
  return migrateLegacyToPackages(member).some((p) => isPackageEntryActive(p) && !isOneTimePackage(p))
}

export function shouldStackNewPackage(member, planId) {
  if (planId === 'free') return false
  return memberHasActivePaidPackages(member)
}

function upsertByStripeSubscriptionId(packages, planId, packageConfig, meta, provider) {
  const sid = String(meta.stripeSubscriptionId || '').trim()
  if (sid) {
    const idx = (packages || []).findIndex((p) => String(p?.stripeSubscriptionId || '').trim() === sid)
    if (idx >= 0) {
      const next = [...packages]
      next[idx] = createPackageEntry(planId, packageConfig, {
        ...meta,
        provider,
        id: packages[idx].id,
      })
      return next
    }
  }
  return addMemberPackage(packages, planId, packageConfig, { ...meta, provider })
}

/**
 * Ücretli plan satın alma:
 * - Tek seferlik, Stripe veya addPackage → ekler (bağımsız fatura)
 * - Aynı stripeSubscriptionId → o satır güncellenir
 * - Admin / RevenueCat: aynı provider aboneliğini değiştirir
 */
export function resolvePackagePurchase(activePackages = [], planId, packageConfig, meta = {}, options = {}) {
  const { addPackage = false } = options
  const packages = activePackages || []
  const provider = KNOWN_PROVIDERS.has(String(meta.provider || '').trim())
    ? String(meta.provider).trim()
    : 'legacy'

  if (addPackage || isOneTimePlan(planId) || packageConfig?.billingType === 'one_time' || provider === 'stripe') {
    return upsertByStripeSubscriptionId(packages, planId, packageConfig, meta, provider)
  }

  const keep = packages.filter((p) => {
    if (!isPackageEntryActive(p)) return false
    if (isOneTimePackage(p)) return true
    const pProv = normalizePackageProvider(p)
    if (provider === 'revenuecat') return pProv !== 'revenuecat'
    return pProv !== provider
  })
  return [...keep, createPackageEntry(planId, packageConfig, { ...meta, provider })]
}

/** Paket süreleri, tüketim ve birleşik config */
export function syncMemberPackages(member) {
  if (!member) return member

  let packages = migrateLegacyToPackages(member)
  const now = today()

  packages = packages.map((pkg) => {
    // Provider expire / admin iptal: açık expired korunur
    if (pkg.status === 'expired') return { ...pkg, status: 'expired' }
    if (isOneTimePackage(pkg)) return pkg
    if (pkg.status === 'consumed') return { ...pkg, status: 'consumed' }
    if (pkg.expiresAt && pkg.expiresAt < now) return { ...pkg, status: 'expired' }
    return { ...pkg, status: 'active' }
  })

  const active = packages.filter((p) => isPackageEntryActive(p))
  const merged = mergePackageConfigs(packages, member)
  const primary = resolvePrimaryMembership(active, member.membership)

  const subExpiries = active
    .filter((p) => !isOneTimePackage(p) && p.expiresAt)
    .map((p) => p.expiresAt)
    .sort()
  const latestExpiry = subExpiries.length ? subExpiries[subExpiries.length - 1] : null

  let membership = active.length ? primary : 'free'
  let membershipStatus = member.membershipStatus || 'active'
  const adminHeld = membershipStatus === 'paused' || membershipStatus === 'cancelled'
  const wasPaid = isPaidMembership(member.membership)

  if (!active.length && wasPaid) {
    membership = 'free'
    if (!adminHeld) membershipStatus = 'active'
  } else if (latestExpiry && !adminHeld) {
    const remaining = Math.ceil((new Date(latestExpiry) - new Date(now)) / (1000 * 60 * 60 * 24))
    if (remaining <= 0) {
      membership = active.length ? primary : 'free'
    } else if (remaining <= 7) {
      membershipStatus = 'expiring'
    } else if (membershipStatus === 'expiring') {
      membershipStatus = 'active'
    }
  } else if (adminHeld) {
    membershipStatus = member.membershipStatus
  }

  // Ücretsiz: deneme alanı kullanılmaz; ücretli düşüşte premium tarihleri temizlenir
  const goingFree = membership === 'free' && !active.length
  const synced = {
    ...member,
    activePackages: packages,
    packageConfig: goingFree ? { ...DEFAULT_PACKAGE } : merged,
    membership,
    membershipStatus,
    premiumExpiresAt: goingFree ? null : (latestExpiry ?? member.premiumExpiresAt ?? null),
    premiumStartedAt: goingFree ? null : (member.premiumStartedAt || packages[0]?.startedAt || null),
    freeTrialExpiresAt: null,
  }
  return sanitizeStaffForPackage(synced.packageConfig, synced)
}

/** Abonelik iptali / anında free: paketleri expire et + atama/randevu temizliği */
export function forceMemberToFree(member) {
  if (!member) return member
  const packages = migrateLegacyToPackages(member).map((pkg) => ({
    ...pkg,
    status: 'expired',
  }))
  return syncMemberPackages({
    ...member,
    activePackages: packages,
    membership: 'free',
    membershipStatus: member.membershipStatus === 'paused' ? 'paused' : 'active',
    premiumExpiresAt: null,
    premiumStartedAt: null,
    freeTrialExpiresAt: null,
  })
}

/** hydrate sırasında süre dolumu senkronunun DB'ye yazılması gerekip gerekmediği */
export function memberExpirySyncNeedsPersist(before, after) {
  if (!before || !after) return false
  if (before.membership !== after.membership) return true
  if (before.membershipStatus !== after.membershipStatus) return true
  if (before.assignedCoachId !== after.assignedCoachId) return true
  if (before.assignedDietitianId !== after.assignedDietitianId) return true
  if ((before.freeTrialExpiresAt || null) !== (after.freeTrialExpiresAt || null)) return true
  if ((before.premiumExpiresAt || null) !== (after.premiumExpiresAt || null)) return true
  if ((before.premiumStartedAt || null) !== (after.premiumStartedAt || null)) return true
  if (JSON.stringify(before.activePackages || []) !== JSON.stringify(after.activePackages || [])) return true
  // Gelecek seans iptalleri (paket bitişi) de yazılsın
  for (const key of ['coachSessions', 'dietitianSessions']) {
    if (JSON.stringify(before[key] || []) !== JSON.stringify(after[key] || [])) return true
  }
  return false
}

/** Aktif paketler + birleşik config */
export function resolveMemberEntitlements(member) {
  if (!member) {
    return { membership: 'free', packageConfig: { ...DEFAULT_PACKAGE }, activePackages: [] }
  }
  const activePackages = migrateLegacyToPackages(member)
  const active = activePackages.filter((p) => isPackageEntryActive(p))
  const packageConfig = active.length
    ? mergePackageConfigs(activePackages, member)
    : (member.packageConfig || { ...DEFAULT_PACKAGE })
  const membership = resolvePrimaryMembership(active, member.membership || 'free')
  return { membership, packageConfig, activePackages: active }
}

function activePlanIds(member) {
  const { activePackages, membership } = resolveMemberEntitlements(member)
  const ids = activePackages.map((p) => p.planId)
  return ids.length ? ids : [membership]
}

export function memberHasPhotoCalorieAccess(member) {
  return activePlanIds(member).some((id) => hasPhotoCalorieAccess(id))
}

export function memberHasManualCalorieAccess(member) {
  return activePlanIds(member).some((id) => hasManualCalorieAccess(id))
}

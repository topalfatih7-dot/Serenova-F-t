import {
  DEFAULT_PACKAGE,
  getDefaultPackageForPlan,
  getPlanFromCatalog,
  hasFullVideoAccess,
  hasManualCalorieAccess,
  hasPhotoCalorieAccess,
  isPaidMembership,
  PLAN_IDS,
  sanitizeStaffForPackage,
} from '../data/membershipPlans'
import { computePremiumExpiresAt, getDurationMonths } from '../services/premiumMembership'

const today = () => new Date().toISOString().split('T')[0]

export const ONE_TIME_PLANS = new Set(['doktor'])

export function isOneTimePlan(planId) {
  if (!planId) return false
  if (ONE_TIME_PLANS.has(planId)) return true
  const plan = getPlanFromCatalog(planId)
  return plan?.billingType === 'one_time' || plan?.period === 'Tek Seferlik'
}

export function isPackageEntryActive(pkg, now = today()) {
  if (!pkg || pkg.status !== 'active') return false
  if (isOneTimePlan(pkg.planId) || pkg.packageConfig?.billingType === 'one_time') return true
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

export function countUsedDoctorSessions(member) {
  return (member?.doctorSessions || []).filter((s) =>
    ['scheduled', 'rescheduled', 'completed'].includes(s?.status || 'scheduled')
  ).length
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
    merged.doctorMeetingsPerMonth = Math.max(
      merged.doctorMeetingsPerMonth,
      Number(c.doctorMeetingsPerMonth) || 0
    )
    merged.coachMeetingsPerWeek = Math.max(
      merged.coachMeetingsPerWeek,
      Number(c.coachMeetingsPerWeek) || 0
    )
    merged.doctorSessionsTotal = (Number(merged.doctorSessionsTotal) || 0)
      + (Number(c.doctorSessionsTotal) || 0)
    if (c.billingType === 'one_time') merged.billingType = 'one_time'
    merged.durationMonths = Math.max(merged.durationMonths || 0, getDurationMonths(c))
  })

  const usedDoctor = member ? countUsedDoctorSessions(member) : 0
  if (merged.doctorSessionsTotal > 0) {
    merged.doctorSessionsRemaining = Math.max(0, merged.doctorSessionsTotal - usedDoctor)
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

/** Görüntüleme için birincil plan (en yüksek abonelik; yalnız doktor varsa doktor) */
export function resolvePrimaryMembership(activePackages = [], fallback = 'free') {
  const active = activePackages.filter((p) => isPackageEntryActive(p))
  if (!active.length) return fallback === 'free' ? 'free' : fallback

  const subs = active.filter((p) => !isOneTimePlan(p.planId))
  const pool = subs.length ? subs : active
  return pool.reduce((best, p) => {
    const rank = planRank(p.planId)
    const bestRank = planRank(best)
    return rank >= bestRank ? p.planId : best
  }, pool[0].planId)
}

export function createPackageEntry(planId, packageConfig, meta = {}) {
  const startedAt = meta.startedAt || today()
  const oneTime = isOneTimePlan(planId) || packageConfig?.billingType === 'one_time'
  return {
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
  }
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
  const active = (activePackages || []).filter((p) => isPackageEntryActive(p) && !isOneTimePlan(p.planId))
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
    if (p.id !== packageId || isOneTimePlan(p.planId)) return p
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
      if (isOneTimePlan(p.planId) || !isPackageEntryActive(p)) return p
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

export function shouldStackNewPackage(member, planId) {
  if (planId === 'free') return false
  return memberHasActivePaidPackages(member)
}

/**
 * Ücretli plan satın alma / değiştirme:
 * - Tek seferlik (doktor) veya addPackage → mevcut paketlere ekler
 * - Abonelik planı → aktif abonelikleri değiştirir, tek seferlik paketleri korur
 */
export function resolvePackagePurchase(activePackages = [], planId, packageConfig, meta = {}, options = {}) {
  const { addPackage = false } = options
  const packages = activePackages || []

  if (addPackage || isOneTimePlan(planId)) {
    return addMemberPackage(packages, planId, packageConfig, meta)
  }

  const keepOneTime = packages.filter((p) => isOneTimePlan(p.planId) && isPackageEntryActive(p))
  return [...keepOneTime, createPackageEntry(planId, packageConfig, meta)]
}

/** Paket süreleri, tüketim ve birleşik config */
export function syncMemberPackages(member) {
  if (!member) return member

  let packages = migrateLegacyToPackages(member)
  const now = today()
  const usedDoctor = countUsedDoctorSessions(member)

  packages = packages.map((pkg) => {
    if (isOneTimePlan(pkg.planId) || pkg.packageConfig?.billingType === 'one_time') {
      const total = Number(pkg.packageConfig?.doctorSessionsTotal) || 1
      if (usedDoctor >= total) return { ...pkg, status: 'consumed' }
      return { ...pkg, status: 'active' }
    }
    if (pkg.expiresAt && pkg.expiresAt < now) return { ...pkg, status: 'expired' }
    return { ...pkg, status: pkg.status === 'consumed' ? 'consumed' : 'active' }
  })

  const active = packages.filter((p) => isPackageEntryActive(p))
  const merged = mergePackageConfigs(active, member)
  const primary = resolvePrimaryMembership(active, member.membership)

  const subExpiries = active
    .filter((p) => !isOneTimePlan(p.planId) && p.expiresAt)
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

  // Ücretli geçmişi olan üyede eski 48s deneme kilidi kalmasın
  // (DB membership zaten free olsa bile premiumStartedAt / paket geçmişi yeter)
  let freeTrialExpiresAt = member.freeTrialExpiresAt ?? null
  const hadPaidHistory = wasPaid
    || Boolean(member.premiumStartedAt)
    || packages.some((p) => isPaidMembership(p.planId))
  if (membership === 'free' && hadPaidHistory && !active.length) {
    freeTrialExpiresAt = null
  }

  const synced = {
    ...member,
    activePackages: packages,
    packageConfig: merged,
    membership,
    membershipStatus,
    premiumExpiresAt: latestExpiry ?? (active.length ? member.premiumExpiresAt : null),
    premiumStartedAt: member.premiumStartedAt || packages[0]?.startedAt || null,
    freeTrialExpiresAt,
  }
  return sanitizeStaffForPackage(merged, synced)
}

/** hydrate sırasında süre dolumu senkronunun DB'ye yazılması gerekip gerekmediği */
export function memberExpirySyncNeedsPersist(before, after) {
  if (!before || !after) return false
  if (before.membership !== after.membership) return true
  if (before.membershipStatus !== after.membershipStatus) return true
  if (before.assignedCoachId !== after.assignedCoachId) return true
  if (before.assignedDietitianId !== after.assignedDietitianId) return true
  if (before.assignedDoctorId !== after.assignedDoctorId) return true
  if ((before.freeTrialExpiresAt || null) !== (after.freeTrialExpiresAt || null)) return true
  if ((before.premiumExpiresAt || null) !== (after.premiumExpiresAt || null)) return true
  // Gelecek seans iptalleri (paket bitişi) de yazılsın
  for (const key of ['coachSessions', 'dietitianSessions', 'doctorSessions']) {
    if (JSON.stringify(before[key] || []) !== JSON.stringify(after[key] || [])) return true
  }
  return false
}

/** Doktor randevu limiti: tek seferlik kalan hak veya aylık limit */
export function doctorBookingLimit(packageConfig = {}, member = null) {
  const total = Number(packageConfig.doctorSessionsTotal) || 0
  if (total > 0 && member) {
    return Math.max(0, total - countUsedDoctorSessions(member))
  }
  return Number(packageConfig.doctorMeetingsPerMonth) || 0
}

export function doctorLimitIsOneTime(packageConfig = {}) {
  return (Number(packageConfig.doctorSessionsTotal) || 0) > 0
}

/** Aktif paketler + birleşik config */
export function resolveMemberEntitlements(member) {
  if (!member) {
    return { membership: 'free', packageConfig: { ...DEFAULT_PACKAGE }, activePackages: [] }
  }
  const activePackages = migrateLegacyToPackages(member)
  const active = activePackages.filter((p) => isPackageEntryActive(p))
  const packageConfig = active.length
    ? mergePackageConfigs(active, member)
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

export function memberHasFullVideoAccess(member) {
  return activePlanIds(member).some((id) => hasFullVideoAccess(id))
}

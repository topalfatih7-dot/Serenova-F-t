/**
 * Sunucu tarafı çoklu paket yardımcıları (stripe-webhook vb.)
 * src/utils/memberPackages.js ile uyumlu tutulmalı.
 */

const ONE_TIME_PLANS = new Set(['doktor'])
const PAID_PLANS = new Set([
  'eko', 'eko_diyet', 'eko_spor', 'diyet', 'spor', 'doktor', 'vip',
  'gumus', 'altin', 'platinum', 'premium', 'kurucu',
])

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

const LEGACY_PLAN_RANK = { gumus: 1, altin: 6, kurucu: 6, platinum: 7, premium: 7 }

function planRank(planId) {
  if (PLAN_RANK[planId] != null) return PLAN_RANK[planId]
  return LEGACY_PLAN_RANK[planId] ?? 0
}

const today = () => new Date().toISOString().split('T')[0]

export function isOneTimePlan(planId) {
  return ONE_TIME_PLANS.has(planId)
}

export function isPaidMembership(planId) {
  if (!planId || planId === 'free') return false
  if (PAID_PLANS.has(planId)) return true
  // Admin’den oluşturulan dinamik plan ID’leri
  return /^[a-z][a-z0-9_]*$/.test(planId)
}

/** Ücretsiz kayıt denemesi — kayıt anından itibaren (client FREE_TRIAL_MS ile aynı). */
export const FREE_TRIAL_MS = 48 * 60 * 60 * 1000

export function computeFreeTrialExpiresAt(fromDate = new Date()) {
  const base = fromDate instanceof Date ? fromDate.getTime() : new Date(fromDate).getTime()
  const t = Number.isFinite(base) ? base : Date.now()
  return new Date(t + FREE_TRIAL_MS).toISOString()
}

/** Aktif 48s deneme — member satırı veya { membership, freeTrialExpiresAt }. */
export function isFreeTrialActive(memberOrFields = {}, now = Date.now()) {
  const membership = memberOrFields?.membership || 'free'
  const data = memberOrFields?.data && typeof memberOrFields.data === 'object'
    ? memberOrFields.data
    : null
  const expiresAt = memberOrFields?.freeTrialExpiresAt ?? data?.freeTrialExpiresAt ?? null
  if (membership !== 'free' || !expiresAt) return false
  const t = new Date(expiresAt).getTime()
  if (!Number.isFinite(t)) return false
  return now < t
}

export function countUsedDoctorSessions(member) {
  return (member?.doctorSessions || []).filter((s) =>
    ['scheduled', 'rescheduled', 'completed'].includes(s?.status || 'scheduled')
  ).length
}

export function isPackageEntryActive(pkg, now = today()) {
  if (!pkg || pkg.status !== 'active') return false
  if (isOneTimePlan(pkg.planId) || pkg.packageConfig?.billingType === 'one_time') return true
  if (!pkg.expiresAt) return true
  return pkg.expiresAt >= now
}

export function migrateLegacyToPackages(member) {
  // Explicit array (including []) is authoritative — do not revive from membership
  if (Array.isArray(member?.activePackages)) {
    return member.activePackages
  }
  if (!member || !isPaidMembership(member.membership)) return []
  const planId = member.membership
  const packageConfig = member.packageConfig || {}
  return [{
    id: `legacy-${member.id || 'x'}-${planId}`,
    planId,
    packageConfig,
    startedAt: member.premiumStartedAt || member.joinedAt || today(),
    expiresAt: isOneTimePlan(planId) ? null : (member.premiumExpiresAt || null),
    status: 'active',
    purchasedAt: member.premiumStartedAt || member.joinedAt || today(),
  }]
}

export function createPackageEntry(planId, packageConfig, meta = {}) {
  const startedAt = meta.startedAt || today()
  const oneTime = isOneTimePlan(planId) || packageConfig?.billingType === 'one_time'
  const months = Number(packageConfig?.durationMonths) || 1
  let expiresAt = null
  if (!oneTime) {
    const d = new Date(startedAt)
    d.setMonth(d.getMonth() + months)
    expiresAt = d.toISOString().split('T')[0]
  }
  return {
    id: meta.id || `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    planId,
    packageConfig,
    startedAt,
    expiresAt,
    status: 'active',
    purchasedAt: meta.purchasedAt || new Date().toISOString(),
    price: meta.price || 0,
  }
}

export function addMemberPackage(activePackages = [], planId, packageConfig, meta = {}) {
  return [...(activePackages || []), createPackageEntry(planId, packageConfig, meta)]
}

export function memberHasActivePaidPackages(member) {
  return migrateLegacyToPackages(member).some((p) => isPackageEntryActive(p))
}

export function shouldStackNewPackage(member, planId) {
  if (planId === 'free' || !isPaidMembership(planId)) return false
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

export function mergePackageConfigs(packages = [], member = null) {
  const active = packages.filter((p) => isPackageEntryActive(p))
  const merged = {
    coachMeetingsPerMonth: 0,
    dietitianMeetingsPerMonth: 0,
    doctorMeetingsPerMonth: 0,
    coachMeetingsPerWeek: 0,
    durationMonths: 1,
    durationWeeks: 4,
    addOns: [],
  }

  active.forEach((pkg) => {
    const c = pkg.packageConfig || {}
    merged.coachMeetingsPerMonth = Math.max(merged.coachMeetingsPerMonth, Number(c.coachMeetingsPerMonth) || 0)
    merged.dietitianMeetingsPerMonth = Math.max(merged.dietitianMeetingsPerMonth, Number(c.dietitianMeetingsPerMonth) || 0)
    merged.doctorMeetingsPerMonth = Math.max(merged.doctorMeetingsPerMonth, Number(c.doctorMeetingsPerMonth) || 0)
    merged.coachMeetingsPerWeek = Math.max(merged.coachMeetingsPerWeek, Number(c.coachMeetingsPerWeek) || 0)
    merged.doctorSessionsTotal = (Number(merged.doctorSessionsTotal) || 0) + (Number(c.doctorSessionsTotal) || 0)
    if (c.billingType === 'one_time') merged.billingType = 'one_time'
    merged.durationMonths = Math.max(merged.durationMonths || 0, Number(c.durationMonths) || 0)
  })

  const usedDoctor = member ? countUsedDoctorSessions(member) : 0
  if (merged.doctorSessionsTotal > 0) {
    merged.doctorSessionsRemaining = Math.max(0, merged.doctorSessionsTotal - usedDoctor)
  }

  return merged
}

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

export function memberExpirySyncNeedsPersist(before, after) {
  if (!before || !after) return false
  if (before.membership !== after.membership) return true
  if (before.membershipStatus !== after.membershipStatus) return true
  if (before.assignedCoachId !== after.assignedCoachId) return true
  if (before.assignedDietitianId !== after.assignedDietitianId) return true
  if (before.assignedDoctorId !== after.assignedDoctorId) return true
  if ((before.freeTrialExpiresAt || null) !== (after.freeTrialExpiresAt || null)) return true
  if ((before.premiumExpiresAt || null) !== (after.premiumExpiresAt || null)) return true
  // Gelecek seans iptalleri (paket bitişi) de yazılsın — client ile aynı
  for (const key of ['coachSessions', 'dietitianSessions', 'doctorSessions']) {
    if (JSON.stringify(before[key] || []) !== JSON.stringify(after[key] || [])) return true
  }
  return false
}

export function packageIncludesDoctor(pkg = {}) {
  const total = Number(pkg.doctorSessionsTotal) || 0
  if (total > 0) {
    const remaining = pkg.doctorSessionsRemaining
    if (remaining != null && !Number.isNaN(Number(remaining))) return Number(remaining) > 0
    return true
  }
  return (Number(pkg.doctorMeetingsPerMonth) || 0) > 0
}

export function packageIncludesCoach(pkg = {}) {
  return (Number(pkg.coachMeetingsPerMonth) || Number(pkg.coachMeetingsPerWeek) || 0) > 0
}

export function packageIncludesDietitian(pkg = {}) {
  return (Number(pkg.dietitianMeetingsPerMonth) || 0) > 0
}

export function sanitizeStaffForPackage(packageConfig, data = {}) {
  const includeCoach = packageIncludesCoach(packageConfig)
  const includeDiet = packageIncludesDietitian(packageConfig)
  const includeDoctor = packageIncludesDoctor(packageConfig)
  return {
    ...data,
    assignedCoachId: includeCoach ? (data.assignedCoachId ?? null) : null,
    assignedDietitianId: includeDiet ? (data.assignedDietitianId ?? null) : null,
    assignedDoctorId: includeDoctor ? (data.assignedDoctorId ?? null) : null,
    coachSessions: sanitizeSessionsForRole(data.coachSessions, includeCoach),
    dietitianSessions: sanitizeSessionsForRole(data.dietitianSessions, includeDiet),
    doctorSessions: sanitizeSessionsForRole(data.doctorSessions, includeDoctor),
  }
}

export function sanitizeSessionsForRole(sessions = [], keepRole) {
  if (keepRole) return Array.isArray(sessions) ? sessions : []
  const now = Date.now()
  return (Array.isArray(sessions) ? sessions : []).map((s) => {
    if (!s || typeof s !== 'object') return s
    const status = s.status || 'scheduled'
    if (status === 'completed' || status === 'cancelled') return s
    const t = new Date(s.date || s.start || 0).getTime()
    if (!t || Number.isNaN(t) || t < now) return s
    return {
      ...s,
      status: 'cancelled',
      cancelledReason: s.cancelledReason || 'package_ended',
      cancelledAt: s.cancelledAt || new Date().toISOString(),
    }
  })
}

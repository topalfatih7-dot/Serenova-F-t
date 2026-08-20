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

export const DEFAULT_PACKAGE = {
  coachMeetingsPerMonth: 0,
  dietitianMeetingsPerMonth: 0,
  doctorMeetingsPerMonth: 0,
  coachMeetingsPerWeek: 0,
  durationMonths: 1,
  durationWeeks: 4,
  addOns: [],
}

export function isOneTimePlan(planId, packageConfig = null) {
  if (planId && ONE_TIME_PLANS.has(planId)) return true
  if (packageConfig?.billingType === 'one_time') return true
  return false
}

export function isOneTimePackage(pkg) {
  if (!pkg) return false
  return isOneTimePlan(pkg.planId, pkg.packageConfig)
}

export function isPaidMembership(planId) {
  if (!planId || planId === 'free') return false
  if (PAID_PLANS.has(planId)) return true
  // Admin’den oluşturulan dinamik plan ID’leri
  return /^[a-z][a-z0-9_]*$/.test(planId)
}

/** videoCall.js / _videoJoinWindows.js DEFAULTS.doctor.after ile aynı */
const DOCTOR_JOIN_AFTER_MINUTES = 30

const DOCTOR_QUOTA_STATUSES = new Set([
  'pending', 'scheduled', 'rescheduled', 'cancel_pending', 'admin_cancel_pending', 'completed', 'no_show',
])
const DOCTOR_CONSUME_STATUSES = new Set(['completed', 'no_show'])

function doctorSessionWindowEnd(session) {
  const start = new Date(session?.date || session?.start || 0)
  if (Number.isNaN(start.getTime())) return null
  const durationMin = Number(session?.duration) || 30
  return new Date(start.getTime() + (durationMin + DOCTOR_JOIN_AFTER_MINUTES) * 60_000)
}

export function isDoctorApprovedNoShow(session, now = new Date()) {
  const status = session?.status || 'scheduled'
  if (status !== 'scheduled' && status !== 'rescheduled') return false
  const windowEnd = doctorSessionWindowEnd(session)
  return Boolean(windowEnd && now > windowEnd)
}

export function isDoctorExpiredPending(session, now = new Date()) {
  if ((session?.status || 'scheduled') !== 'pending') return false
  const windowEnd = doctorSessionWindowEnd(session)
  return Boolean(windowEnd && now > windowEnd)
}

export function applyDoctorSessionNoShows(sessions = [], now = new Date()) {
  return (Array.isArray(sessions) ? sessions : []).map((s) => {
    if (!s || typeof s !== 'object') return s
    if (!isDoctorApprovedNoShow(s, now)) return s
    if (s.status === 'no_show') return s
    return {
      ...s,
      status: 'no_show',
      noShowAt: s.noShowAt || now.toISOString(),
    }
  })
}

export function applyDoctorExpiredPendings(sessions = [], now = new Date()) {
  return (Array.isArray(sessions) ? sessions : []).map((s) => {
    if (!s || typeof s !== 'object') return s
    if (!isDoctorExpiredPending(s, now)) return s
    if (s.status === 'rejected') return s
    return {
      ...s,
      status: 'rejected',
      rejectedAt: s.rejectedAt || now.toISOString(),
      rejectedReason: s.rejectedReason || 'expired_pending',
    }
  })
}

function syncDoctorSessionStatuses(sessions = [], now = new Date()) {
  return applyDoctorExpiredPendings(applyDoctorSessionNoShows(sessions, now), now)
}

function packagePurchaseSortKey(pkg) {
  return String(pkg?.purchasedAt || pkg?.startedAt || '')
}

export function applyFifoOneTimeDoctorConsume(packages, consumedDoctor) {
  const next = (packages || []).map((pkg) => ({ ...pkg }))
  const fifo = next
    .map((pkg, index) => ({ pkg, index }))
    .filter(({ pkg }) => pkg.status !== 'expired' && isOneTimePackage(pkg))
    .sort((a, b) => {
      const ka = packagePurchaseSortKey(a.pkg)
      const kb = packagePurchaseSortKey(b.pkg)
      if (ka !== kb) return ka < kb ? -1 : 1
      return a.index - b.index
    })

  let remaining = Math.max(0, Number(consumedDoctor) || 0)
  for (const { pkg, index } of fifo) {
    const total = Number(pkg.packageConfig?.doctorSessionsTotal) || 1
    if (remaining >= total) {
      next[index] = { ...pkg, status: 'consumed' }
      remaining -= total
    } else {
      next[index] = { ...pkg, status: 'active' }
    }
  }
  return next
}

function consumedOneTimeDoctorTotals(packages = []) {
  return (packages || []).reduce((sum, pkg) => {
    if (pkg?.status !== 'consumed' || !isOneTimePackage(pkg)) return sum
    return sum + (Number(pkg.packageConfig?.doctorSessionsTotal) || 1)
  }, 0)
}

function usedDoctorTowardActiveQuota(member, packages = []) {
  const used = countUsedDoctorSessions(member)
  return Math.max(0, used - consumedOneTimeDoctorTotals(packages))
}

export function countUsedDoctorSessions(member) {
  return (member?.doctorSessions || []).filter((s) => {
    const status = s?.status || 'scheduled'
    if (DOCTOR_QUOTA_STATUSES.has(status)) return true
    return isDoctorApprovedNoShow(s)
  }).length
}

export function countConsumedDoctorSessions(member) {
  return (member?.doctorSessions || []).filter((s) => {
    const status = s?.status || 'scheduled'
    if (DOCTOR_CONSUME_STATUSES.has(status)) return true
    return isDoctorApprovedNoShow(s)
  }).length
}

export function isPackageEntryActive(pkg, now = today()) {
  if (!pkg || pkg.status !== 'active') return false
  if (isOneTimePackage(pkg)) return true
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
    expiresAt: isOneTimePlan(planId, packageConfig) ? null : (member.premiumExpiresAt || null),
    status: 'active',
    purchasedAt: member.premiumStartedAt || member.joinedAt || today(),
  }]
}

const KNOWN_PROVIDERS = new Set(['stripe', 'revenuecat', 'admin'])

/** @returns {'stripe'|'revenuecat'|'admin'|'legacy'} */
export function normalizePackageProvider(pkg) {
  const p = String(pkg?.provider || '').trim()
  if (KNOWN_PROVIDERS.has(p)) return p
  return 'legacy'
}

/**
 * Provider izolasyonu: legacy paketler Stripe expire’da (stripeSubscriptionId varken) Stripe sayılır.
 * RC expire legacy’yi silmez (web koruması).
 */
export function packageBelongsToProvider(pkg, provider, member = null) {
  const p = normalizePackageProvider(pkg)
  if (p === provider) return true
  if (p !== 'legacy') return false
  if (provider === 'stripe') return Boolean(member?.stripeSubscriptionId)
  return false
}

export function createPackageEntry(planId, packageConfig, meta = {}) {
  const startedAt = meta.startedAt || today()
  const oneTime = isOneTimePlan(planId, packageConfig)
  const months = Number(packageConfig?.durationMonths) || 1
  let expiresAt = null
  if (!oneTime) {
    if (meta.expiresAt) {
      expiresAt = meta.expiresAt
    } else {
      const d = new Date(startedAt)
      d.setMonth(d.getMonth() + months)
      expiresAt = d.toISOString().split('T')[0]
    }
  }
  const provider = KNOWN_PROVIDERS.has(String(meta.provider || '').trim())
    ? String(meta.provider).trim()
    : 'legacy'
  return {
    id: meta.id || `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    planId,
    packageConfig,
    startedAt,
    expiresAt,
    status: 'active',
    purchasedAt: meta.purchasedAt || new Date().toISOString(),
    price: meta.price || 0,
    provider,
  }
}

export function addMemberPackage(activePackages = [], planId, packageConfig, meta = {}) {
  return [...(activePackages || []), createPackageEntry(planId, packageConfig, meta)]
}

export function memberHasActivePaidPackages(member) {
  return migrateLegacyToPackages(member).some((p) => isPackageEntryActive(p))
}

/** Alias — webhook free kararı */
export function hasActivePaidPackages(member) {
  return memberHasActivePaidPackages(member)
}

export function memberHasActiveProviderSubscription(member, provider) {
  return migrateLegacyToPackages(member).some((p) => (
    isPackageEntryActive(p)
    && !isOneTimePackage(p)
    && packageBelongsToProvider(p, provider, member)
  ))
}

export function shouldStackNewPackage(member, planId) {
  if (planId === 'free' || !isPaidMembership(planId)) return false
  return memberHasActivePaidPackages(member)
}

/**
 * Ücretli plan satın alma / değiştirme:
 * - Tek seferlik (doktor) veya addPackage → mevcut paketlere ekler
 * - Abonelik: yalnız aynı provider’ın aboneliğini değiştirir; diğer provider + one-time korunur
 * - Stripe satın alırken legacy (etiketsiz) abonelikler de değiştirilir
 */
export function resolvePackagePurchase(activePackages = [], planId, packageConfig, meta = {}, options = {}) {
  const { addPackage = false } = options
  const packages = activePackages || []
  const provider = KNOWN_PROVIDERS.has(String(meta.provider || '').trim())
    ? String(meta.provider).trim()
    : 'legacy'

  if (addPackage || isOneTimePlan(planId, packageConfig)) {
    return addMemberPackage(packages, planId, packageConfig, { ...meta, provider })
  }

  const keep = packages.filter((p) => {
    if (!isPackageEntryActive(p)) return false
    if (isOneTimePackage(p)) return true
    const pProv = normalizePackageProvider(p)
    if (provider === 'stripe') {
      return pProv !== 'stripe' && pProv !== 'legacy'
    }
    if (provider === 'revenuecat') {
      return pProv !== 'revenuecat'
    }
    return pProv !== provider
  })
  return [...keep, createPackageEntry(planId, packageConfig, { ...meta, provider })]
}

/**
 * Yalnız ilgili provider paketlerini expire/consume et; kalan aktif paket varsa free olmaz.
 */
export function expirePackagesByProvider(member, provider) {
  if (!member || !provider) return member
  const packages = migrateLegacyToPackages(member).map((pkg) => {
    if (isOneTimePackage(pkg)) return pkg
    if (!packageBelongsToProvider(pkg, provider, member)) return pkg
    return { ...pkg, status: 'expired' }
  })
  return syncMemberPackages({
    ...member,
    activePackages: packages,
  })
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
    merged.durationMonths = Math.max(merged.durationMonths || 0, Number(c.durationMonths) || 0)
  })

  const hasSubscription = active.some((p) => !isOneTimePackage(p))
  if (!hasSubscription && active.some(isOneTimePackage)) {
    merged.billingType = 'one_time'
  }

  const usedDoctor = member ? usedDoctorTowardActiveQuota(member, packages) : 0
  if (merged.doctorSessionsTotal > 0) {
    merged.doctorSessionsRemaining = Math.max(0, merged.doctorSessionsTotal - usedDoctor)
  }

  return merged
}

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

export function syncMemberPackages(member) {
  if (!member) return member

  const syncedMember = {
    ...member,
    doctorSessions: syncDoctorSessionStatuses(member.doctorSessions),
  }

  let packages = migrateLegacyToPackages(syncedMember)
  const now = today()
  const consumedDoctor = countConsumedDoctorSessions(syncedMember)

  packages = packages.map((pkg) => {
    if (pkg.status === 'expired') return { ...pkg, status: 'expired' }
    if (isOneTimePackage(pkg)) return pkg
    if (pkg.status === 'consumed') return { ...pkg, status: 'consumed' }
    if (pkg.expiresAt && pkg.expiresAt < now) return { ...pkg, status: 'expired' }
    return { ...pkg, status: 'active' }
  })
  packages = applyFifoOneTimeDoctorConsume(packages, consumedDoctor)

  const active = packages.filter((p) => isPackageEntryActive(p))
  const merged = mergePackageConfigs(packages, syncedMember)
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

  const goingFree = membership === 'free' && !active.length
  const synced = {
    ...syncedMember,
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

/** Abonelik iptali: paketleri expire et + hemen free + atama/randevu temizliği */
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

export function memberExpirySyncNeedsPersist(before, after) {
  if (!before || !after) return false
  if (before.membership !== after.membership) return true
  if (before.membershipStatus !== after.membershipStatus) return true
  if (before.assignedCoachId !== after.assignedCoachId) return true
  if (before.assignedDietitianId !== after.assignedDietitianId) return true
  if (before.assignedDoctorId !== after.assignedDoctorId) return true
  if ((before.freeTrialExpiresAt || null) !== (after.freeTrialExpiresAt || null)) return true
  if ((before.premiumExpiresAt || null) !== (after.premiumExpiresAt || null)) return true
  if ((before.premiumStartedAt || null) !== (after.premiumStartedAt || null)) return true
  if (JSON.stringify(before.activePackages || []) !== JSON.stringify(after.activePackages || [])) return true
  // Gelecek seans iptalleri (paket bitişi) de yazılsın — client ile aynı
  for (const key of ['coachSessions', 'dietitianSessions', 'doctorSessions']) {
    if (JSON.stringify(before[key] || []) !== JSON.stringify(after[key] || [])) return true
  }
  return false
}

export function doctorBookingLimit(packageConfig = {}, member = null) {
  const total = Number(packageConfig.doctorSessionsTotal) || 0
  if (total > 0) {
    if (packageConfig.doctorSessionsRemaining != null) {
      return Math.max(0, Number(packageConfig.doctorSessionsRemaining) || 0)
    }
    if (member) {
      const packages = Array.isArray(member.activePackages)
        ? member.activePackages
        : migrateLegacyToPackages(member)
      return Math.max(0, total - usedDoctorTowardActiveQuota(member, packages))
    }
    return total
  }
  return Number(packageConfig.doctorMeetingsPerMonth) || 0
}

export function packageIncludesDoctor(pkg = {}) {
  return (Number(pkg.doctorSessionsTotal) || 0) > 0
    || (Number(pkg.doctorMeetingsPerMonth) || 0) > 0
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
    assignedDoctorId: data.assignedDoctorId ?? null,
    coachSessions: sanitizeSessionsForRole(data.coachSessions, includeCoach),
    dietitianSessions: sanitizeSessionsForRole(data.dietitianSessions, includeDiet),
    doctorSessions: sanitizeSessionsForRole(data.doctorSessions, includeDoctor),
  }
}

const KEEP_SESSION_STATUSES = new Set(['completed', 'cancelled', 'rejected', 'no_show'])

export function sanitizeSessionsForRole(sessions = [], keepRole, { keepPending = false } = {}) {
  if (keepRole) return Array.isArray(sessions) ? sessions : []
  const now = Date.now()
  return (Array.isArray(sessions) ? sessions : []).map((s) => {
    if (!s || typeof s !== 'object') return s
    const status = s.status || 'scheduled'
    if (KEEP_SESSION_STATUSES.has(status)) return s
    if (keepPending && status === 'pending') return s
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

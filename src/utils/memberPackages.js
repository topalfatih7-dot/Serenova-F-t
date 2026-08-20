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

export const ONE_TIME_PLANS = new Set(['doktor'])

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

/** Onaylı görüşme: katılma penceresi kapandı, completed değil. pending asla no_show olmaz. */
export function isDoctorApprovedNoShow(session, now = new Date()) {
  const status = session?.status || 'scheduled'
  if (status !== 'scheduled' && status !== 'rescheduled') return false
  const windowEnd = doctorSessionWindowEnd(session)
  return Boolean(windowEnd && now > windowEnd)
}

/** Onaysız talep: katılma penceresi kapandı → red (kota iade, paket tüketilmez). */
export function isDoctorExpiredPending(session, now = new Date()) {
  const status = session?.status || 'scheduled'
  if (status !== 'pending') return false
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

/** Satın alma sırasına göre one-time doktor paketlerini tüket (2 alım = 2 seans). */
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

/** Yeni randevu kotası — pending dahil yer tutar; red/iptal sayılmaz */
export function countUsedDoctorSessions(member) {
  return (member?.doctorSessions || []).filter((s) => {
    const status = s?.status || 'scheduled'
    if (DOCTOR_QUOTA_STATUSES.has(status)) return true
    return isDoctorApprovedNoShow(s)
  }).length
}

/** Tek seferlik paket tüketimi — yalnız completed + no_show */
export function countConsumedDoctorSessions(member) {
  return (member?.doctorSessions || []).filter((s) => {
    const status = s?.status || 'scheduled'
    if (DOCTOR_CONSUME_STATUSES.has(status)) return true
    return isDoctorApprovedNoShow(s)
  }).length
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
    merged.durationMonths = Math.max(merged.durationMonths || 0, getDurationMonths(c))
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
    provider,
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

export function shouldStackNewPackage(member, planId) {
  if (planId === 'free') return false
  return memberHasActivePaidPackages(member)
}

/**
 * Ücretli plan satın alma / değiştirme:
 * - Tek seferlik (doktor) veya addPackage → mevcut paketlere ekler
 * - Abonelik: yalnız aynı provider; diğer provider + one-time korunur
 */
export function resolvePackagePurchase(activePackages = [], planId, packageConfig, meta = {}, options = {}) {
  const { addPackage = false } = options
  const packages = activePackages || []
  const provider = KNOWN_PROVIDERS.has(String(meta.provider || '').trim())
    ? String(meta.provider).trim()
    : 'legacy'

  if (addPackage || isOneTimePlan(planId) || packageConfig?.billingType === 'one_time') {
    return addMemberPackage(packages, planId, packageConfig, { ...meta, provider })
  }

  const keep = packages.filter((p) => {
    if (!isPackageEntryActive(p)) return false
    if (isOneTimePackage(p)) return true
    const pProv = normalizePackageProvider(p)
    if (provider === 'stripe') return pProv !== 'stripe' && pProv !== 'legacy'
    if (provider === 'revenuecat') return pProv !== 'revenuecat'
    return pProv !== provider
  })
  return [...keep, createPackageEntry(planId, packageConfig, { ...meta, provider })]
}

/** Paket süreleri, tüketim ve birleşik config */
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
    // Provider expire / admin iptal: açık expired korunur
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

  // Ücretsiz: deneme alanı kullanılmaz; ücretli düşüşte premium tarihleri temizlenir
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
  if (before.assignedDoctorId !== after.assignedDoctorId) return true
  if ((before.freeTrialExpiresAt || null) !== (after.freeTrialExpiresAt || null)) return true
  if ((before.premiumExpiresAt || null) !== (after.premiumExpiresAt || null)) return true
  if ((before.premiumStartedAt || null) !== (after.premiumStartedAt || null)) return true
  if (JSON.stringify(before.activePackages || []) !== JSON.stringify(after.activePackages || [])) return true
  // Gelecek seans iptalleri (paket bitişi) de yazılsın
  for (const key of ['coachSessions', 'dietitianSessions', 'doctorSessions']) {
    if (JSON.stringify(before[key] || []) !== JSON.stringify(after[key] || [])) return true
  }
  return false
}

/** Doktor randevu limiti: tek seferlik kalan hak veya aylık limit */
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

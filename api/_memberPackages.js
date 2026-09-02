/**
 * Sunucu tarafı çoklu paket yardımcıları (stripe-webhook vb.)
 * src/utils/memberPackages.js ile uyumlu tutulmalı.
 */

const ONE_TIME_PLANS = new Set()
const PAID_PLANS = new Set([
  'eko', 'eko_diyet', 'eko_spor', 'diyet', 'spor', 'vip',
  'gumus', 'altin', 'platinum', 'premium', 'kurucu',
])

const PLAN_RANK = {
  free: 0,
  eko: 1,
  eko_diyet: 2,
  eko_spor: 3,
  diyet: 4,
  spor: 5,
  vip: 6,
}

const LEGACY_PLAN_RANK = { gumus: 1, altin: 6, kurucu: 6, platinum: 6, premium: 6 }

function planRank(planId) {
  if (PLAN_RANK[planId] != null) return PLAN_RANK[planId]
  return LEGACY_PLAN_RANK[planId] ?? 0
}

const today = () => new Date().toISOString().split('T')[0]

export const DEFAULT_PACKAGE = {
  coachMeetingsPerMonth: 0,
  dietitianMeetingsPerMonth: 0,
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
  const entry = {
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
 * - Tek seferlik, Stripe abonelik veya addPackage → mevcut paketlere ekler (bağımsız fatura)
 * - Aynı stripeSubscriptionId tekrar gelirse o satır güncellenir (checkout retry)
 * - Admin / RevenueCat aboneliği: aynı provider’ı değiştirir; one-time korunur
 */
export function resolvePackagePurchase(activePackages = [], planId, packageConfig, meta = {}, options = {}) {
  const { addPackage = false } = options
  const packages = activePackages || []
  const provider = KNOWN_PROVIDERS.has(String(meta.provider || '').trim())
    ? String(meta.provider).trim()
    : 'legacy'

  if (addPackage || isOneTimePlan(planId, packageConfig) || provider === 'stripe') {
    return upsertByStripeSubscriptionId(packages, planId, packageConfig, meta, provider)
  }

  const keep = packages.filter((p) => {
    if (!isPackageEntryActive(p)) return false
    if (isOneTimePackage(p)) return true
    const pProv = normalizePackageProvider(p)
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

/** Legacy: üye seviyesindeki tek id, etiketsiz tek Stripe abonelik paketine bağlanır. */
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
  return findPackageBySubscriptionId(
    migrateLegacyToPackages(member),
    member?.stripeSubscriptionId,
    member,
  )?.id === pkg?.id
    ? (String(member?.stripeSubscriptionId || '').trim() || null)
    : null
}

function clearMemberLevelSubIfMatch(member, subscriptionId) {
  if (String(member?.stripeSubscriptionId || '').trim() !== String(subscriptionId || '').trim()) {
    return member
  }
  return { ...member, stripeSubscriptionId: null }
}

/** Yalnız eşleşen Stripe aboneliğini expire et — diğer paketler durur. */
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

/** Yenileme: eşleşen paketin süresini uzat; yoksa ekle (orphan). */
export function extendPackageForSubscription(member, subscriptionId, {
  expiresAt,
  price,
  planId,
  packageConfig,
  startedAt,
} = {}) {
  if (!member) return member
  const sid = String(subscriptionId || '').trim()
  const packages = migrateLegacyToPackages(member)
  const target = sid ? findPackageBySubscriptionId(packages, sid, member) : null
  if (target) {
    const next = packages.map((pkg) => {
      if (pkg.id !== target.id) return pkg
      return {
        ...pkg,
        stripeSubscriptionId: sid || pkg.stripeSubscriptionId,
        provider: 'stripe',
        expiresAt: expiresAt || pkg.expiresAt,
        currentPeriodEnd: expiresAt || pkg.currentPeriodEnd,
        cancelAtPeriodEnd: false,
        status: 'active',
        ...(price != null ? { price } : {}),
      }
    })
    return syncMemberPackages({
      ...member,
      activePackages: next,
      stripeSubscriptionId: sid || member.stripeSubscriptionId,
    })
  }
  if (!planId || !packageConfig) return member
  return syncMemberPackages({
    ...member,
    activePackages: addMemberPackage(packages, planId, packageConfig, {
      provider: 'stripe',
      stripeSubscriptionId: sid || undefined,
      expiresAt,
      price,
      startedAt: startedAt || today(),
    }),
    stripeSubscriptionId: sid || member.stripeSubscriptionId,
  })
}

export function listCancelAtPeriodEndPackages(member) {
  return migrateLegacyToPackages(member).filter((p) => (
    isPackageEntryActive(p)
    && !isOneTimePackage(p)
    && Boolean(p.cancelAtPeriodEnd)
  ))
}

export function mergePackageConfigs(packages = [], member = null) {
  const active = packages.filter((p) => isPackageEntryActive(p))
  const merged = {
    coachMeetingsPerMonth: 0,
    dietitianMeetingsPerMonth: 0,
    coachMeetingsPerWeek: 0,
    durationMonths: 1,
    durationWeeks: 4,
    addOns: [],
  }

  active.forEach((pkg) => {
    const c = pkg.packageConfig || {}
    merged.coachMeetingsPerMonth = Math.max(merged.coachMeetingsPerMonth, Number(c.coachMeetingsPerMonth) || 0)
    merged.dietitianMeetingsPerMonth = Math.max(merged.dietitianMeetingsPerMonth, Number(c.dietitianMeetingsPerMonth) || 0)
    merged.coachMeetingsPerWeek = Math.max(merged.coachMeetingsPerWeek, Number(c.coachMeetingsPerWeek) || 0)
    merged.durationMonths = Math.max(merged.durationMonths || 0, Number(c.durationMonths) || 0)
  })

  const hasSubscription = active.some((p) => !isOneTimePackage(p))
  if (!hasSubscription && active.some(isOneTimePackage)) {
    merged.billingType = 'one_time'
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

  let packages = migrateLegacyToPackages(member)
  const now = today()

  packages = packages.map((pkg) => {
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
  if ((before.freeTrialExpiresAt || null) !== (after.freeTrialExpiresAt || null)) return true
  if ((before.premiumExpiresAt || null) !== (after.premiumExpiresAt || null)) return true
  if ((before.premiumStartedAt || null) !== (after.premiumStartedAt || null)) return true
  if (JSON.stringify(before.activePackages || []) !== JSON.stringify(after.activePackages || [])) return true
  // Gelecek seans iptalleri (paket bitişi) de yazılsın — client ile aynı
  for (const key of ['coachSessions', 'dietitianSessions']) {
    if (JSON.stringify(before[key] || []) !== JSON.stringify(after[key] || [])) return true
  }
  return false
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
  return {
    ...data,
    assignedCoachId: includeCoach ? (data.assignedCoachId ?? null) : null,
    assignedDietitianId: includeDiet ? (data.assignedDietitianId ?? null) : null,
    coachSessions: sanitizeSessionsForRole(data.coachSessions, includeCoach),
    dietitianSessions: sanitizeSessionsForRole(data.dietitianSessions, includeDiet),
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

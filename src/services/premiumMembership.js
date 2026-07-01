const today = () => new Date().toISOString().split('T')[0]

/** Takvim ayı bazında bitiş tarihi hesaplar */
export function computePremiumExpiresAt(startDate, durationMonths) {
  const start = startDate || today()
  const d = new Date(start)
  d.setMonth(d.getMonth() + (Number(durationMonths) || 1))
  return d.toISOString().split('T')[0]
}

/** Geriye dönük: hafta bazlı hesaplama (eski kayıtlar) */
export function computePremiumExpiresAtWeeks(startDate, durationWeeks) {
  const start = startDate || today()
  const d = new Date(start)
  d.setDate(d.getDate() + (Number(durationWeeks) || 4) * 7)
  return d.toISOString().split('T')[0]
}

export function getRemainingDays(expiresAt) {
  if (!expiresAt) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const exp = new Date(expiresAt)
  exp.setHours(0, 0, 0, 0)
  return Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
}

import { syncMemberPackages } from '../utils/memberPackages'

/**
 * Süresi dolan paketleri günceller; birleşik üyelik durumunu senkronlar.
 */
export function syncMembershipExpiryStatus(member) {
  return syncMemberPackages(member)
}

export function extendPremiumExpiry(currentExpiresAt, extraDays) {
  const base = currentExpiresAt && getRemainingDays(currentExpiresAt) > 0
    ? new Date(currentExpiresAt)
    : new Date()
  base.setHours(0, 0, 0, 0)
  base.setDate(base.getDate() + Number(extraDays || 0))
  return base.toISOString().split('T')[0]
}

export function durationWeeksFromDays(days) {
  return Math.max(1, Math.ceil(Number(days) / 7))
}

export function enrichMemberPremium(member) {
  const remaining = getRemainingDays(member.premiumExpiresAt)
  return {
    ...member,
    premiumRemainingDays: remaining,
    premiumExpired: remaining !== null && remaining <= 0,
    premiumExpiringSoon: remaining !== null && remaining > 0 && remaining <= 7,
  }
}

/** packageConfig'den süreyi ay olarak okur */
export function getDurationMonths(packageConfig = {}) {
  if (packageConfig.durationMonths) return Number(packageConfig.durationMonths)
  if (packageConfig.durationWeeks) return Math.max(1, Math.round(Number(packageConfig.durationWeeks) / 4))
  return 1
}

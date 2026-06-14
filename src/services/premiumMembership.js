const today = () => new Date().toISOString().split('T')[0]

export function computePremiumExpiresAt(startDate, durationWeeks) {
  const start = startDate || today()
  const d = new Date(start)
  d.setDate(d.getDate() + (Number(durationWeeks) || 12) * 7)
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

export function syncMembershipExpiryStatus(member) {
  if (member.membership !== 'premium') return member
  if (member.membershipStatus === 'paused' || member.membershipStatus === 'cancelled') return member

  const remaining = getRemainingDays(member.premiumExpiresAt)
  if (remaining === null) return member

  if (remaining <= 0) {
    return { ...member, membershipStatus: 'cancelled' }
  }
  if (remaining <= 7) {
    return { ...member, membershipStatus: 'expiring' }
  }
  if (member.membershipStatus === 'expiring') {
    return { ...member, membershipStatus: 'active' }
  }
  return member
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

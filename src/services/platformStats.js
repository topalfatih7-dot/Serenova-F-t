import { DEFAULT_PACKAGE, isPaidMembership } from '../data/membershipPlans'
import { calculatePackagePrice } from './packagePricing'
import { getRemainingDays } from './premiumMembership'

function today() {
  return new Date().toISOString().split('T')[0]
}

export function getCurrentMember(db) {
  if (db.session?.type !== 'member') return null
  return db.members.find((m) => m.id === db.session.memberId) || null
}

export function getCurrentStaff(db) {
  if (db.session?.type !== 'staff') return null
  return db.staff.find((s) => s.id === db.session.staffId) || null
}

const PLAN_LABELS = {
  free:     'Ücretsiz',
  gumus:    'Gümüş',
  altin:    'Altın',
  platinum: 'Platinum',
  premium:  'Premium',
}
const PLAN_COLORS = {
  free:     '#5f9270',
  gumus:    '#64748b',
  altin:    '#d97706',
  platinum: '#4a8aad',
  premium:  '#4a8aad',
}

export function computeAdminStats(db) {
  const members = db.members
  const paid = members.filter((m) => isPaidMembership(m.membership))
  const free = members.filter((m) => m.membership === 'free')
  const thisMonth = today().slice(0, 7)

  const activePaid = paid.filter((m) => m.membershipStatus === 'active')
  const mrr = activePaid.reduce((sum, m) => {
    // Ücretsiz plan üyeleri için ödeme hesaplanmaz
    if (!isPaidMembership(m.membership)) return sum
    // Aylık ödeme tutarı plan fiyatından alınır veya paket hesabından
    return sum + (m.planPrice || calculatePackagePrice(m.packageConfig || DEFAULT_PACKAGE).monthly)
  }, 0)

  const expiringSoon = paid.filter((m) => {
    const r = getRemainingDays(m.premiumExpiresAt)
    return r !== null && r > 0 && r <= 7 && m.membershipStatus !== 'cancelled'
  }).length

  return {
    totalMembers: members.length,
    premium: paid.length,
    free: free.length,
    active: members.filter((m) => m.membershipStatus === 'active').length,
    paused: members.filter((m) => m.membershipStatus === 'paused').length,
    cancelled: members.filter((m) => m.membershipStatus === 'cancelled').length,
    expiring: members.filter((m) => m.membershipStatus === 'expiring').length || expiringSoon,
    newThisMonth: members.filter((m) => m.joinedAt?.startsWith(thisMonth)).length,
    mrr,
    totalRevenue: db.payments.reduce((s, p) => s + (p.amount || 0), 0),
    openTickets: db.tickets.filter((t) => t.status !== 'closed').length,
    avgStreak: members.length
      ? Math.round(members.reduce((s, m) => s + (m.streak || 0), 0) / members.length)
      : 0,
    unassignedPremium: paid.filter(
      (m) => m.membershipStatus === 'active' && (!m.assignedCoachId || !m.assignedDietitianId)
    ).length,
  }
}

export function computeMembershipBreakdown(db) {
  const members = db.members
  const planIds = ['gumus', 'altin', 'platinum', 'premium']
  const breakdown = []

  planIds.forEach((planId) => {
    const count = members.filter((m) => m.membership === planId && m.membershipStatus === 'active').length
    if (count > 0) {
      breakdown.push({ name: `${PLAN_LABELS[planId] || planId} Aktif`, value: count, color: PLAN_COLORS[planId] || '#4a8aad' })
    }
  })

  breakdown.push({ name: 'Ücretsiz Aktif', value: members.filter((m) => m.membership === 'free' && m.membershipStatus === 'active').length, color: '#5f9270' })
  breakdown.push({ name: 'Duraklatılmış', value: members.filter((m) => m.membershipStatus === 'paused').length, color: '#b8924f' })
  breakdown.push({ name: 'Sona Eriyor', value: members.filter((m) => m.membershipStatus === 'expiring').length, color: '#e07b39' })
  breakdown.push({ name: 'İptal', value: members.filter((m) => m.membershipStatus === 'cancelled').length, color: '#9ca3af' })

  return breakdown.filter((x) => x.value > 0)
}

export function computeMonthlyGrowth(db) {
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz']
  const year = new Date().getFullYear()
  return months.map((month, i) => {
    const monthStr = `${year}-${String(i + 1).padStart(2, '0')}`
    const monthPayments = db.payments.filter((p) => p.createdAt?.startsWith(monthStr))
    const gelir = monthPayments.reduce((s, p) => s + (p.amount || 0), 0)
    return {
      month,
      uye: db.members.filter((m) => m.joinedAt <= `${monthStr}-31`).length,
      premium: db.members.filter((m) => isPaidMembership(m.membership) && m.joinedAt <= `${monthStr}-31`).length,
      gelir,
    }
  })
}

export function getSessionStats(db) {
  let coachCount = 0
  let dietitianCount = 0
  db.members.forEach((m) => {
    if (isPaidMembership(m.membership) && m.membershipStatus === 'active') {
      coachCount += m.packageConfig?.coachMeetingsPerWeek || 2
      dietitianCount += m.packageConfig?.dietitianMeetingsPerMonth || 1
    }
  })
  const scheduled = db.members.reduce((sum, m) => {
    return sum + (m.coachSessions?.length || 0) + (m.dietitianSessions?.length || 0)
  }, 0)
  const completed = db.members.reduce((sum, m) => {
    const done = [...(m.coachSessions || []), ...(m.dietitianSessions || [])].filter((s) => s.status === 'completed').length
    return sum + done
  }, 0)
  return {
    coachThisWeek: coachCount * 4,
    dietitianThisMonth: dietitianCount,
    completionRate: scheduled ? Math.round((completed / scheduled) * 100) : 0,
    noResponseAlerts: db.tickets.filter((t) => t.status === 'open').length,
  }
}

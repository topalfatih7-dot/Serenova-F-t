import { DEFAULT_PACKAGE, PAID_MEMBERSHIPS, getPlanLabel, isPaidMembership, memberNeedsStaffAssignment } from '../data/membershipPlans'
import { calculatePackagePrice } from './packagePricing'
import { getRemainingDays } from './premiumMembership'
import { memberIdSet, filterByMemberIds } from '../utils/memberScopedData'

function today() {
  return new Date().toISOString().split('T')[0]
}

export function getCurrentMember(db) {
  if (db.session?.type !== 'member') return null
  return db.members.find((m) => m.id === db.session.memberId) || null
}

export function getCurrentStaff(db) {
  if (db.session?.type !== 'staff') return null
  if (db.session.staffId) {
    const byId = db.staff.find((s) => s.id === db.session.staffId)
    if (byId) return byId
  }
  const email = (db.session.email || db.authUser?.email || '').toLowerCase()
  if (email) {
    const byEmail = db.staff.find((s) => (s.email || '').toLowerCase() === email)
    if (byEmail) return byEmail
  }
  if (db.authUser?.id) {
    return db.staff.find((s) => s.id === db.authUser.id) || null
  }
  return null
}

export function getCurrentInfluencer(db) {
  if (db.session?.type !== 'influencer') return null
  const list = db.influencers || []
  if (db.session.influencerId) {
    const byId = list.find((s) => s.id === db.session.influencerId)
    if (byId) return byId
  }
  const email = (db.session.email || db.authUser?.email || '').toLowerCase()
  if (email) {
    const byEmail = list.find((s) => (s.email || '').toLowerCase() === email)
    if (byEmail) return byEmail
  }
  if (db.authUser?.id) {
    return list.find((s) => s.id === db.authUser.id) || null
  }
  return list[0] || null
}

export function getPostLoginPath(db) {
  const type = db?.session?.type
  if (type === 'admin') return '/admin'
  if (type === 'staff') return '/staff'
  if (type === 'influencer') return '/influencer'
  return '/profile'
}

const PLAN_COLORS = {
  free: '#5f9270',
  eko: '#5f9270',
  eko_diyet: '#0d9488',
  eko_spor: '#0284c7',
  diyet: '#059669',
  spor: '#2563eb',
  doktor: '#d97706',
  vip: '#4a8aad',
  gumus: '#64748b',
  altin: '#d97706',
  platinum: '#4a8aad',
  premium: '#4a8aad',
}

import { isHealthTestComplete } from '../data/healthTest'

export function computeOnboardingFunnel(db) {
  const members = db.members || []
  const programs = db.programs || []
  const total = members.length
  const memberIdsWithProgram = new Set(
    programs.map((p) => p.memberId).filter(Boolean),
  )

  const withHealthTest = members.filter((m) =>
    isHealthTestComplete(m.healthTest, m.gender, m.packageConfig),
  ).length
  const premium = members.filter((m) => isPaidMembership(m.membership)).length
  const paidActive = members.filter(
    (m) => isPaidMembership(m.membership) && m.membershipStatus === 'active',
  ).length
  const withProgram = members.filter((m) => memberIdsWithProgram.has(m.id)).length
  const withSession = members.filter((m) => {
    const n = (m.coachSessions || []).length
      + (m.dietitianSessions || []).length
      + (m.doctorSessions || []).length
    return n > 0
  }).length

  const pct = (n) => (total ? Math.round((n / total) * 100) : 0)

  return [
    { step: 'Kayıtlı üye', count: total, pct: total ? 100 : 0 },
    { step: 'Sağlık testi tamam', count: withHealthTest, pct: pct(withHealthTest) },
    { step: 'Ücretli üye', count: premium, pct: pct(premium) },
    { step: 'Aktif ücretli', count: paidActive, pct: pct(paidActive) },
    { step: 'Programı olan', count: withProgram, pct: pct(withProgram) },
    { step: 'Randevu almış', count: withSession, pct: pct(withSession) },
  ]
}

export function computeAdminStats(db) {
  const members = db.members
  const memberIds = memberIdSet(members)
  const payments = filterByMemberIds(db.payments, memberIds)
  const tickets = filterByMemberIds(db.tickets, memberIds)
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
    return r !== null && r > 0 && r <= 7
  }).length

  return {
    totalMembers: members.length,
    premium: paid.length,
    free: free.length,
    active: members.filter((m) => m.membershipStatus === 'active').length,
    expiring: members.filter((m) => m.membershipStatus === 'expiring').length || expiringSoon,
    newThisMonth: members.filter((m) => m.joinedAt?.startsWith(thisMonth)).length,
    mrr,
    totalRevenue: payments.reduce((s, p) => s + (p.amount || 0), 0),
    openTickets: tickets.filter((t) => t.status !== 'closed').length,
    avgStreak: members.length
      ? Math.round(members.reduce((s, m) => s + (m.streak || 0), 0) / members.length)
      : 0,
    unassignedPremium: paid.filter(
      (m) => m.membershipStatus === 'active' && memberNeedsStaffAssignment(m)
    ).length,
  }
}

export function computeMembershipBreakdown(db) {
  const members = db.members
  const planIds = ['eko', 'eko_diyet', 'eko_spor', 'diyet', 'spor', 'doktor', 'vip', ...PAID_MEMBERSHIPS.filter((id) => !['eko', 'eko_diyet', 'eko_spor', 'diyet', 'spor', 'doktor', 'vip'].includes(id))]
  const breakdown = []

  planIds.forEach((planId) => {
    const count = members.filter((m) => m.membership === planId && m.membershipStatus === 'active').length
    if (count > 0) {
      breakdown.push({ name: `${getPlanLabel(planId)} Aktif`, value: count, color: PLAN_COLORS[planId] || '#4a8aad' })
    }
  })

  breakdown.push({ name: 'Ücretsiz Aktif', value: members.filter((m) => m.membership === 'free' && m.membershipStatus === 'active').length, color: '#5f9270' })
  breakdown.push({ name: 'Sona Eriyor', value: members.filter((m) => m.membershipStatus === 'expiring').length, color: '#e07b39' })

  return breakdown.filter((x) => x.value > 0)
}

export function computeMonthlyGrowth(db) {
  const memberIds = memberIdSet(db.members)
  const payments = filterByMemberIds(db.payments, memberIds)
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz']
  const year = new Date().getFullYear()
  return months.map((month, i) => {
    const monthStr = `${year}-${String(i + 1).padStart(2, '0')}`
    const monthPayments = payments.filter((p) => p.createdAt?.startsWith(monthStr))
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
      coachCount += m.packageConfig?.coachMeetingsPerMonth || (m.packageConfig?.coachMeetingsPerWeek || 0) * 4 || 0
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

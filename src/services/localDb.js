import { DEFAULT_PACKAGE } from '../data/membershipPlans'
import { calculatePackagePrice } from './packagePricing'
import {
  mockCoachSessions,
  mockDietitianSessions,
  mockNotifications,
  mockTasks,
} from '../data/mockData'

const DB_KEY = 'serenova-platform-v2'

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function nowISO() {
  return new Date().toISOString()
}

function createDefaultMemberData() {
  return {
    coachSessions: JSON.parse(JSON.stringify(mockCoachSessions)),
    dietitianSessions: JSON.parse(JSON.stringify(mockDietitianSessions)),
    notifications: JSON.parse(JSON.stringify(mockNotifications)),
    tasks: JSON.parse(JSON.stringify(mockTasks)),
    settings: {
      theme: 'light',
      language: 'tr',
      emailNotifs: true,
      pushNotifs: true,
      reminderNotifs: true,
    },
    streak: 0,
    pauseUntil: null,
  }
}

function emptyDb() {
  return {
    version: 2,
    members: [],
    tickets: [],
    activities: [],
    payments: [],
    session: null,
  }
}

export function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) return emptyDb()
    const parsed = JSON.parse(raw)
    return { ...emptyDb(), ...parsed }
  } catch {
    return emptyDb()
  }
}

export function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

function addActivity(db, type, text, memberId = null) {
  db.activities.unshift({
    id: uid('act'),
    type,
    text,
    memberId,
    time: 'Az önce',
    createdAt: nowISO(),
  })
  if (db.activities.length > 100) db.activities = db.activities.slice(0, 100)
}

export function registerPremiumWithPayment(db, profile, packageConfig, amount) {
  const email = profile.email?.toLowerCase().trim()
  if (db.members.some((m) => m.email === email)) {
    return { success: false, error: 'Bu e-posta adresi zaten kayıtlı.' }
  }

  const member = {
    id: uid('m'),
    name: profile.name,
    email,
    password: profile.password,
    age: profile.age,
    city: profile.city || '',
    goals: profile.goals || [],
    fitnessLevel: profile.fitnessLevel || 'beginner',
    nutritionPrefs: profile.nutritionPrefs || [],
    membership: 'premium',
    membershipStatus: 'active',
    packageConfig: packageConfig || { ...DEFAULT_PACKAGE },
    joinedAt: today(),
    lastActiveAt: today(),
    ...createDefaultMemberData(),
  }

  db.members.push(member)
  db.payments.unshift({
    id: uid('pay'),
    memberId: member.id,
    memberName: member.name,
    amount,
    packageConfig,
    status: 'completed',
    createdAt: nowISO(),
  })
  addActivity(db, 'signup', `${member.name} Premium kayıt oldu`, member.id)
  addActivity(db, 'payment', `${member.name} ödeme tamamladı (${amount.toLocaleString('tr-TR')}₺)`, member.id)
  db.session = { type: 'member', memberId: member.id }
  saveDb(db)
  return { success: true, member }
}

export function registerMember(db, profile, membership = 'free', packageConfig = null) {
  const email = profile.email?.toLowerCase().trim()
  if (db.members.some((m) => m.email === email)) {
    return { success: false, error: 'Bu e-posta adresi zaten kayıtlı.' }
  }

  const member = {
    id: uid('m'),
    name: profile.name,
    email,
    password: profile.password,
    age: profile.age,
    city: profile.city || '',
    goals: profile.goals || [],
    fitnessLevel: profile.fitnessLevel || 'beginner',
    nutritionPrefs: profile.nutritionPrefs || [],
    membership,
    membershipStatus: 'active',
    packageConfig: packageConfig || { ...DEFAULT_PACKAGE },
    joinedAt: today(),
    lastActiveAt: today(),
    ...createDefaultMemberData(),
  }

  db.members.push(member)
  addActivity(db, 'signup', `${member.name} yeni kayıt (${membership === 'premium' ? 'Premium' : 'Ücretsiz'})`, member.id)
  db.session = { type: 'member', memberId: member.id }
  saveDb(db)
  return { success: true, member }
}

export function loginMember(db, email, password) {
  const member = db.members.find(
    (m) => m.email === email.toLowerCase().trim() && m.password === password
  )
  if (!member) return { success: false, error: 'E-posta veya şifre hatalı.' }

  member.lastActiveAt = today()
  db.session = { type: 'member', memberId: member.id }
  addActivity(db, 'login', `${member.name} giriş yaptı`, member.id)
  saveDb(db)
  return { success: true, member }
}

export function loginAdmin(db) {
  db.session = { type: 'admin', memberId: null }
  saveDb(db)
  return { success: true }
}

export function logout(db) {
  db.session = null
  saveDb(db)
}

export function getCurrentMember(db) {
  if (db.session?.type !== 'member') return null
  return db.members.find((m) => m.id === db.session.memberId) || null
}

export function updateMember(db, memberId, patch) {
  const idx = db.members.findIndex((m) => m.id === memberId)
  if (idx === -1) return null
  db.members[idx] = { ...db.members[idx], ...patch, lastActiveAt: today() }
  saveDb(db)
  return db.members[idx]
}

export function upgradeMemberPremium(db, memberId, packageConfig, amount) {
  const member = updateMember(db, memberId, {
    membership: 'premium',
    membershipStatus: 'active',
    packageConfig,
  })
  if (!member) return null

  db.payments.unshift({
    id: uid('pay'),
    memberId,
    memberName: member.name,
    amount,
    packageConfig,
    status: 'completed',
    createdAt: nowISO(),
  })

  addActivity(db, 'upgrade', `${member.name} Premium üyeliğe geçti (${amount.toLocaleString('tr-TR')}₺)`, memberId)
  saveDb(db)
  return member
}

export function submitTicket(db, memberId, ticketData) {
  const member = db.members.find((m) => m.id === memberId)
  const ticket = {
    id: uid('t'),
    memberId,
    memberName: member?.name || 'Misafir',
    memberEmail: member?.email || '',
    category: ticketData.category,
    subject: ticketData.subject,
    message: ticketData.message,
    status: 'open',
    priority: ticketData.category === 'Teknik sorun' ? 'high' : ticketData.category === 'Üyelik / iptal' ? 'high' : 'normal',
    createdAt: today(),
  }
  db.tickets.unshift(ticket)
  addActivity(db, 'ticket', `Destek talebi: ${ticket.subject} — ${ticket.memberName}`, memberId)
  saveDb(db)
  return ticket
}

export function updateTicketStatus(db, ticketId, status) {
  const ticket = db.tickets.find((t) => t.id === ticketId)
  if (!ticket) return null
  ticket.status = status
  saveDb(db)
  return ticket
}

export function pauseMember(db, memberId, until) {
  const member = updateMember(db, memberId, { membershipStatus: 'paused', pauseUntil: until })
  if (member) {
    submitTicket(db, memberId, {
      category: 'Tatil dondurma',
      subject: 'Üyelik dondurma talebi',
      message: `Üyelik ${until} tarihine kadar dondurulmak isteniyor.`,
    })
    addActivity(db, 'pause', `${member.name} üyeliğini duraklattı`, memberId)
  }
  return member
}

export function cancelMember(db, memberId) {
  const member = updateMember(db, memberId, { membershipStatus: 'cancelled' })
  if (member) {
    submitTicket(db, memberId, {
      category: 'Üyelik / iptal',
      subject: 'Üyelik iptal talebi',
      message: 'Kullanıcı üyelik iptali talep etti.',
    })
    addActivity(db, 'cancel', `${member.name} üyeliğini iptal etti`, memberId)
  }
  return member
}

export function renewMember(db, memberId) {
  const member = updateMember(db, memberId, { membershipStatus: 'active', pauseUntil: null })
  if (member) addActivity(db, 'renew', `${member.name} üyeliğini yeniledi`, memberId)
  return member
}

export function resumeMember(db, memberId) {
  const member = updateMember(db, memberId, { membershipStatus: 'active', pauseUntil: null })
  if (member) addActivity(db, 'resume', `${member.name} üyeliğine devam etti`, memberId)
  return member
}

export function computeAdminStats(db) {
  const members = db.members
  const premium = members.filter((m) => m.membership === 'premium')
  const free = members.filter((m) => m.membership === 'free')
  const thisMonth = today().slice(0, 7)

  const activePremium = premium.filter((m) => m.membershipStatus === 'active')
  const mrr = activePremium.reduce((sum, m) => {
    return sum + calculatePackagePrice(m.packageConfig || DEFAULT_PACKAGE).monthly
  }, 0)

  return {
    totalMembers: members.length,
    premium: premium.length,
    free: free.length,
    active: members.filter((m) => m.membershipStatus === 'active').length,
    paused: members.filter((m) => m.membershipStatus === 'paused').length,
    cancelled: members.filter((m) => m.membershipStatus === 'cancelled').length,
    expiring: members.filter((m) => m.membershipStatus === 'expiring').length,
    newThisMonth: members.filter((m) => m.joinedAt?.startsWith(thisMonth)).length,
    mrr,
    totalRevenue: db.payments.reduce((s, p) => s + (p.amount || 0), 0),
    openTickets: db.tickets.filter((t) => t.status !== 'closed').length,
    avgStreak: members.length
      ? Math.round(members.reduce((s, m) => s + (m.streak || 0), 0) / members.length)
      : 0,
  }
}

export function computeMembershipBreakdown(db) {
  const members = db.members
  return [
    { name: 'Premium Aktif', value: members.filter((m) => m.membership === 'premium' && m.membershipStatus === 'active').length, color: '#4a8aad' },
    { name: 'Ücretsiz Aktif', value: members.filter((m) => m.membership === 'free' && m.membershipStatus === 'active').length, color: '#5f9270' },
    { name: 'Duraklatılmış', value: members.filter((m) => m.membershipStatus === 'paused').length, color: '#b8924f' },
    { name: 'İptal', value: members.filter((m) => m.membershipStatus === 'cancelled').length, color: '#9ca3af' },
  ].filter((x) => x.value > 0)
}

export function computeMonthlyGrowth(db) {
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz']
  const year = new Date().getFullYear()
  return months.map((month, i) => {
    const monthStr = `${year}-${String(i + 1).padStart(2, '0')}`
    const monthMembers = db.members.filter((m) => m.joinedAt?.startsWith(monthStr))
    const premium = monthMembers.filter((m) => m.membership === 'premium').length
    const monthPayments = db.payments.filter((p) => p.createdAt?.startsWith(monthStr))
    const gelir = monthPayments.reduce((s, p) => s + p.amount, 0)
    return {
      month,
      uye: db.members.filter((m) => m.joinedAt <= `${monthStr}-31`).length,
      premium: db.members.filter((m) => m.membership === 'premium' && m.joinedAt <= `${monthStr}-31`).length,
      gelir: gelir || premium * 8000,
    }
  })
}

export function getSessionStats(db) {
  let coachCount = 0
  let dietitianCount = 0
  db.members.forEach((m) => {
    if (m.membership === 'premium' && m.membershipStatus === 'active') {
      coachCount += m.packageConfig?.coachMeetingsPerWeek || 2
      dietitianCount += m.packageConfig?.dietitianMeetingsPerMonth || 1
    }
  })
  return {
    coachThisWeek: coachCount * 4,
    dietitianThisMonth: dietitianCount,
    completionRate: db.members.length ? 78 : 0,
    noResponseAlerts: db.tickets.filter((t) => t.status === 'open').length,
  }
}

export function resetPlatform() {
  localStorage.removeItem(DB_KEY)
}

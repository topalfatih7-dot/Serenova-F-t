import { DEFAULT_PACKAGE } from '../data/membershipPlans'
import { DEFAULT_POSTS } from '../data/blogPosts'
import { calculatePackagePrice } from './packagePricing'

const DB_KEY = 'serenova-platform-v2'
const SESSION_FLAG = 'serenova-active-session'
const WEEKDAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

function markSessionActive() {
  try {
    sessionStorage.setItem(SESSION_FLAG, '1')
  } catch {
    /* sessionStorage erişilemiyor */
  }
}

export function initSession() {
  const db = loadDb()
  let active = false
  try {
    active = !!sessionStorage.getItem(SESSION_FLAG)
  } catch {
    /* sessionStorage erişilemiyor */
  }
  if (db.session && db.session.remember === false && !active) {
    db.session = null
    saveDb(db)
  }
  markSessionActive()
}

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function nowISO() {
  return new Date().toISOString()
}

function nextWeekday(from, weekday) {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  const diff = (Number(weekday) - d.getDay() + 7) % 7
  d.setDate(d.getDate() + (diff === 0 ? 7 : diff))
  return d
}

export function generateSupportSessions(packageConfig = {}, schedule, startDate = new Date(), names = {}) {
  const coachSessions = []
  const dietitianSessions = []
  if (!schedule) return { coachSessions, dietitianSessions }

  const coachName = names.coachName || 'Koçunuz'
  const dietitianName = names.dietitianName || 'Diyetisyeniniz'
  const weeks = Number(packageConfig.durationWeeks) || 12
  const perWeek = Number(packageConfig.coachMeetingsPerWeek) || 0
  const perMonth = Number(packageConfig.dietitianMeetingsPerMonth) || 0

  if (perWeek > 0 && schedule.coachDay != null) {
    const [ch, cm] = String(schedule.coachTime || '10:00').split(':').map(Number)
    const spacing = Math.max(1, Math.floor(7 / perWeek))
    for (let w = 0; w < weeks; w++) {
      const weekStart = nextWeekday(startDate, schedule.coachDay)
      weekStart.setDate(weekStart.getDate() + w * 7)
      for (let c = 0; c < perWeek; c++) {
        const d = new Date(weekStart)
        d.setDate(d.getDate() + c * spacing)
        d.setHours(ch || 10, cm || 0, 0, 0)
        coachSessions.push({
          id: uid('cs'),
          type: 'coach',
          title: 'Koç Görüşmesi',
          date: d.toISOString(),
          duration: 30,
          status: 'scheduled',
          coach: coachName,
        })
      }
    }
  }

  if (perMonth > 0 && schedule.dietitianDay != null) {
    const [dh, dm] = String(schedule.dietitianTime || '14:00').split(':').map(Number)
    const months = Math.ceil(weeks / 4)
    const spacingWeeks = Math.max(1, Math.floor(4 / perMonth))
    for (let m = 0; m < months; m++) {
      for (let k = 0; k < perMonth; k++) {
        const d = nextWeekday(startDate, schedule.dietitianDay)
        d.setDate(d.getDate() + (m * 4 + k * spacingWeeks) * 7)
        d.setHours(dh || 14, dm || 0, 0, 0)
        dietitianSessions.push({
          id: uid('ds'),
          type: 'dietitian',
          title: 'Diyetisyen Görüşmesi',
          date: d.toISOString(),
          duration: 40,
          status: 'scheduled',
          coach: dietitianName,
        })
      }
    }
  }

  return { coachSessions, dietitianSessions }
}

const DEFAULT_SCHEDULE = { coachDay: 1, coachTime: '10:00', dietitianDay: 3, dietitianTime: '14:00' }

function timeToMinutes(t) {
  const [h, m] = String(t || '0:0').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function staffAvailableAt(staff, day, time) {
  if (!(staff.workDays || []).includes(Number(day))) return false
  if (!time) return true
  const t = timeToMinutes(time)
  return t >= timeToMinutes(staff.workStart || '09:00') && t < timeToMinutes(staff.workEnd || '17:00')
}

function findAvailableStaff(db, role, day, time) {
  const candidates = db.staff.filter(
    (s) => s.role === role && s.active !== false && staffAvailableAt(s, day, time)
  )
  if (!candidates.length) return null
  const key = role === 'coach' ? 'assignedCoachId' : 'assignedDietitianId'
  return candidates
    .map((s) => ({ s, load: db.members.filter((m) => m[key] === s.id).length }))
    .sort((a, b) => a.load - b.load)[0].s
}

function scheduleGaps(member, schedule) {
  const gaps = []
  if (!schedule) return gaps
  if ((Number(member.packageConfig?.coachMeetingsPerWeek) || 0) > 0 && schedule.coachDay != null && !member.assignedCoachId) {
    gaps.push({ role: 'coach', day: Number(schedule.coachDay), time: schedule.coachTime })
  }
  if ((Number(member.packageConfig?.dietitianMeetingsPerMonth) || 0) > 0 && schedule.dietitianDay != null && !member.assignedDietitianId) {
    gaps.push({ role: 'dietitian', day: Number(schedule.dietitianDay), time: schedule.dietitianTime })
  }
  return gaps
}

function assignSupport(db, member, schedule) {
  member.supportSchedule = schedule
  const needCoach = (Number(member.packageConfig?.coachMeetingsPerWeek) || 0) > 0 && schedule?.coachDay != null
  const needDiet = (Number(member.packageConfig?.dietitianMeetingsPerMonth) || 0) > 0 && schedule?.dietitianDay != null

  const coach = needCoach ? findAvailableStaff(db, 'coach', schedule.coachDay, schedule.coachTime) : null
  const dietitian = needDiet ? findAvailableStaff(db, 'dietitian', schedule.dietitianDay, schedule.dietitianTime) : null

  member.assignedCoachId = coach?.id || null
  member.assignedDietitianId = dietitian?.id || null

  const sessions = generateSupportSessions(member.packageConfig, schedule, new Date(), {
    coachName: coach?.name,
    dietitianName: dietitian?.name,
  })
  member.coachSessions = sessions.coachSessions
  member.dietitianSessions = sessions.dietitianSessions

  return scheduleGaps(member, schedule)
}

function seedStarterContent(member) {
  member.notifications = [
    {
      id: uid('n'),
      type: 'reminder',
      title: 'Serenova\u2019ya hoş geldiniz!',
      message: 'Profiliniz hazır. Günlük görevlerinizi tamamlayarak serinizi büyütmeye başlayın.',
      read: false,
      createdAt: nowISO(),
    },
    ...(member.notifications || []),
  ]
  member.tasks = [
    { id: uid('task'), type: 'water', title: 'Günlük 2L su hedefi', done: false, due: 'Bugün', progress: 0, target: 2 },
    { id: uid('task'), type: 'checkin', title: 'Günlük check-in', done: false, due: 'Bugün' },
    { id: uid('task'), type: 'workout', title: 'Genel hareket: 20 dk yürüyüş', done: false, due: 'Bugün' },
  ]
}

function seedStarterProgram(db, member) {
  db.programs.unshift({
    id: uid('prog'),
    type: 'workout',
    memberId: member.id,
    memberName: member.name,
    staffId: null,
    staffName: 'Serenova Ekibi',
    title: 'Başlangıç Haftalık Genel Plan',
    description: 'Tüm üyeler için hazırlanan genel hareket planı. Premium üyelikte koçunuz size özel program oluşturur.',
    items: [
      'Pazartesi: 20 dk tempolu yürüyüş',
      'Çarşamba: 15 dk esneme + temel kuvvet (şınav, squat)',
      'Cuma: 25 dk hafif kardiyo',
      'Hafta sonu: Aktif dinlenme, günde ~8.000 adım',
    ],
    createdAt: nowISO(),
  })
}

function createDefaultMemberData() {
  return {
    coachSessions: [],
    dietitianSessions: [],
    notifications: [],
    tasks: [],
    progress: { weight: [], workouts: [], mood: [] },
    supportSchedule: null,
    availability: {},
    assignedCoachId: null,
    assignedDietitianId: null,
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
    staff: [],
    programs: [],
    posts: JSON.parse(JSON.stringify(DEFAULT_POSTS)),
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
    gender: profile.gender || '',
    weight: profile.weight || '',
    height: profile.height || '',
    waist: profile.waist || '',
    photo: profile.photo || null,
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
    availability: profile.availability || {},
  }

  db.members.push(member)
  seedStarterContent(member)
  seedStarterProgram(db, member)

  let gaps = []
  if (profile.supportSchedule) {
    gaps = assignSupport(db, member, profile.supportSchedule)
  }

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

  if (gaps.length) createAvailabilityTicket(db, member, gaps)

  db.session = { type: 'member', memberId: member.id, remember: true }
  markSessionActive()
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
    gender: profile.gender || '',
    weight: profile.weight || '',
    height: profile.height || '',
    waist: profile.waist || '',
    photo: profile.photo || null,
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
    availability: profile.availability || {},
  }

  db.members.push(member)
  seedStarterContent(member)
  seedStarterProgram(db, member)

  let gaps = []
  if (profile.supportSchedule) {
    gaps = assignSupport(db, member, profile.supportSchedule)
  }

  addActivity(db, 'signup', `${member.name} yeni kayıt (${membership === 'premium' ? 'Premium' : 'Ücretsiz'})`, member.id)

  if (gaps.length) createAvailabilityTicket(db, member, gaps)

  db.session = { type: 'member', memberId: member.id, remember: true }
  markSessionActive()
  saveDb(db)
  return { success: true, member }
}

export function loginMember(db, email, password, remember = false) {
  const member = db.members.find(
    (m) => m.email === email.toLowerCase().trim() && m.password === password
  )
  if (!member) return { success: false, error: 'E-posta veya şifre hatalı.' }

  member.lastActiveAt = today()
  db.session = { type: 'member', memberId: member.id, remember: !!remember }
  markSessionActive()
  addActivity(db, 'login', `${member.name} giriş yaptı`, member.id)
  saveDb(db)
  return { success: true, member }
}

export function loginAdmin(db, remember = false) {
  db.session = { type: 'admin', memberId: null, remember: !!remember }
  markSessionActive()
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

export function updateSupportSchedule(db, memberId, schedule) {
  const member = db.members.find((m) => m.id === memberId)
  if (!member) return null
  const gaps = assignSupport(db, member, schedule)
  member.lastActiveAt = today()
  saveDb(db)
  if (gaps.length) createAvailabilityTicket(db, member, gaps)
  return member
}

export function upgradeMemberPremium(db, memberId, packageConfig, amount, schedule = DEFAULT_SCHEDULE) {
  const member = db.members.find((m) => m.id === memberId)
  if (!member) return null

  member.membership = 'premium'
  member.membershipStatus = 'active'
  member.packageConfig = packageConfig
  member.lastActiveAt = today()

  const gaps = assignSupport(db, member, schedule)

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
  if (gaps.length) createAvailabilityTicket(db, member, gaps)
  saveDb(db)
  return member
}

export function registerStaff(db, data) {
  const email = data.email?.toLowerCase().trim()
  if (!email) return { success: false, error: 'E-posta gerekli.' }
  if (db.staff.some((s) => s.email === email)) {
    return { success: false, error: 'Bu e-posta zaten kayıtlı.' }
  }
  if (db.members.some((m) => m.email === email)) {
    return { success: false, error: 'Bu e-posta bir üyeye ait.' }
  }

  const staff = {
    id: uid('st'),
    role: data.role === 'dietitian' ? 'dietitian' : 'coach',
    name: data.name,
    email,
    password: data.password,
    phone: data.phone || '',
    specialty: data.specialty || '',
    workDays: Array.isArray(data.workDays) ? data.workDays : [],
    workStart: data.workStart || '09:00',
    workEnd: data.workEnd || '17:00',
    active: true,
    createdAt: today(),
  }
  db.staff.push(staff)
  addActivity(db, 'staff', `${staff.name} ${staff.role === 'coach' ? 'koç' : 'diyetisyen'} olarak eklendi`)
  fillGapsForStaff(db, staff)
  saveDb(db)
  return { success: true, staff }
}

function fillGapsForStaff(db, staff) {
  db.members.forEach((m) => {
    if (m.membership !== 'premium' || !m.supportSchedule) return
    let changed = false

    if (
      staff.role === 'coach' && !m.assignedCoachId &&
      (Number(m.packageConfig?.coachMeetingsPerWeek) || 0) > 0 &&
      m.supportSchedule.coachDay != null &&
      staffAvailableAt(staff, m.supportSchedule.coachDay, m.supportSchedule.coachTime)
    ) {
      m.assignedCoachId = staff.id
      changed = true
    }

    if (
      staff.role === 'dietitian' && !m.assignedDietitianId &&
      (Number(m.packageConfig?.dietitianMeetingsPerMonth) || 0) > 0 &&
      m.supportSchedule.dietitianDay != null &&
      staffAvailableAt(staff, m.supportSchedule.dietitianDay, m.supportSchedule.dietitianTime)
    ) {
      m.assignedDietitianId = staff.id
      changed = true
    }

    if (!changed) return

    const coachName = db.staff.find((s) => s.id === m.assignedCoachId)?.name
    const dietitianName = db.staff.find((s) => s.id === m.assignedDietitianId)?.name
    const sessions = generateSupportSessions(m.packageConfig, m.supportSchedule, new Date(), { coachName, dietitianName })
    m.coachSessions = sessions.coachSessions
    m.dietitianSessions = sessions.dietitianSessions
    m.notifications = [
      {
        id: uid('n'),
        type: 'program',
        title: `${staff.role === 'coach' ? 'Koçunuz' : 'Diyetisyeniniz'} atandı`,
        message: `${staff.name}, size ${staff.role === 'coach' ? 'koç' : 'diyetisyen'} olarak atandı. Randevu takviminiz güncellendi.`,
        read: false,
        createdAt: nowISO(),
      },
      ...(m.notifications || []),
    ]
  })
}

export function updateStaff(db, staffId, patch) {
  const idx = db.staff.findIndex((s) => s.id === staffId)
  if (idx === -1) return null
  db.staff[idx] = { ...db.staff[idx], ...patch }
  saveDb(db)
  return db.staff[idx]
}

export function deleteStaff(db, staffId) {
  db.staff = db.staff.filter((s) => s.id !== staffId)
  saveDb(db)
}

export function loginStaff(db, email, password, remember = false) {
  const staff = db.staff.find(
    (s) => s.email === email.toLowerCase().trim() && s.password === password
  )
  if (!staff) return { success: false, error: 'E-posta veya şifre hatalı.' }
  db.session = { type: 'staff', staffId: staff.id, remember: !!remember }
  markSessionActive()
  addActivity(db, 'login', `${staff.name} (${staff.role === 'coach' ? 'koç' : 'diyetisyen'}) giriş yaptı`)
  saveDb(db)
  return { success: true, staff }
}

export function getCurrentStaff(db) {
  if (db.session?.type !== 'staff') return null
  return db.staff.find((s) => s.id === db.session.staffId) || null
}

export function createProgram(db, data) {
  const program = {
    id: uid('prog'),
    type: data.type === 'nutrition' ? 'nutrition' : 'workout',
    memberId: data.memberId,
    memberName: data.memberName || '',
    staffId: data.staffId,
    staffName: data.staffName || '',
    title: data.title,
    description: data.description || '',
    items: Array.isArray(data.items) ? data.items : [],
    createdAt: nowISO(),
  }
  db.programs.unshift(program)

  const member = db.members.find((m) => m.id === data.memberId)
  if (member) {
    const notif = {
      id: uid('n'),
      type: 'program',
      title: program.type === 'workout' ? 'Yeni antrenman programınız hazır' : 'Yeni beslenme programınız hazır',
      message: `${program.staffName} sizin için "${program.title}" programını oluşturdu. Profilinizdeki "Programlarım" bölümünden görüntüleyebilirsiniz.`,
      read: false,
      createdAt: nowISO(),
    }
    member.notifications = [notif, ...(member.notifications || [])]
  }
  addActivity(
    db,
    'program',
    `${program.staffName} ${program.type === 'workout' ? 'antrenman' : 'beslenme'} programı oluşturdu`,
    data.memberId
  )
  saveDb(db)
  return program
}

export function createPost(db, data) {
  const post = {
    id: uid('post'),
    title: data.title,
    category: data.category || 'Yaşam',
    excerpt: data.excerpt || '',
    content: data.content || '',
    author: data.author || 'Serenova Ekibi',
    readMinutes: data.readMinutes || Math.max(1, Math.round((data.content || '').split(/\s+/).length / 200)),
    accent: data.accent || 'brand',
    published: data.published !== false,
    createdAt: today(),
  }
  db.posts.unshift(post)
  addActivity(db, 'post', `Yeni blog yazısı: ${post.title}`)
  saveDb(db)
  return post
}

export function updatePost(db, postId, patch) {
  const idx = db.posts.findIndex((p) => p.id === postId)
  if (idx === -1) return null
  db.posts[idx] = { ...db.posts[idx], ...patch }
  saveDb(db)
  return db.posts[idx]
}

export function deletePost(db, postId) {
  db.posts = db.posts.filter((p) => p.id !== postId)
  saveDb(db)
}

export function submitTicket(db, memberId, ticketData) {
  const member = db.members.find((m) => m.id === memberId)
  const autoPriority =
    ticketData.category === 'Teknik sorun' || ticketData.category === 'Üyelik / iptal'
      ? 'high'
      : 'normal'
  const ticket = {
    id: uid('t'),
    memberId,
    memberName: member?.name || 'Misafir',
    memberEmail: member?.email || '',
    category: ticketData.category,
    subject: ticketData.subject,
    message: ticketData.message,
    status: 'open',
    priority: ticketData.priority || autoPriority,
    messages: [
      {
        id: uid('msg'),
        from: ticketData.system ? 'system' : 'member',
        text: ticketData.message,
        createdAt: nowISO(),
      },
    ],
    createdAt: today(),
    updatedAt: nowISO(),
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
  ticket.updatedAt = nowISO()
  saveDb(db)
  return ticket
}

export function replyTicket(db, ticketId, from, text) {
  const ticket = db.tickets.find((t) => t.id === ticketId)
  if (!ticket) return null
  const message = { id: uid('msg'), from, text, createdAt: nowISO() }
  ticket.messages = [...(ticket.messages || [{ id: uid('msg'), from: 'member', text: ticket.message, createdAt: ticket.createdAt }]), message]
  ticket.updatedAt = nowISO()

  if (from === 'admin') {
    if (ticket.status === 'open') ticket.status = 'in-progress'
    const member = db.members.find((m) => m.id === ticket.memberId)
    if (member) {
      member.notifications = [
        {
          id: uid('n'),
          type: 'support',
          title: 'Destek talebinize yanıt geldi',
          message: `"${ticket.subject}" talebinize destek ekibi yanıt verdi.`,
          read: false,
          createdAt: nowISO(),
        },
        ...(member.notifications || []),
      ]
    }
    addActivity(db, 'ticket', `Destek yanıtı gönderildi: ${ticket.subject}`, ticket.memberId)
  } else {
    if (ticket.status === 'closed') ticket.status = 'open'
    addActivity(db, 'ticket', `Üye yanıtladı: ${ticket.subject}`, ticket.memberId)
  }

  saveDb(db)
  return ticket
}

export function createAvailabilityTicket(db, member, gaps) {
  if (!gaps.length) return null
  const lines = gaps.map((g) => {
    const roleTr = g.role === 'coach' ? 'koç' : 'diyetisyen'
    return `• Seçilen gün ${WEEKDAY_NAMES[g.day]} ${g.time || ''} için uygun bir ${roleTr} bulunamadı.`
  })
  return submitTicket(db, member.id, {
    category: 'Randevu / uygunluk',
    subject: 'Seçilen güne uygun uzman bulunamadı',
    priority: 'high',
    system: true,
    message:
      `${member.name} adlı üyenin premium paketinde tercih ettiği gün(ler) için uygun uzman bulunmuyor:\n` +
      lines.join('\n') +
      '\nLütfen uygun bir koç/diyetisyen atayın veya üye ile alternatif gün için iletişime geçin.',
  })
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

// Supabase veri/auth katmanı.
// Tüm veriler Supabase üzerinden yönetilir.
import { supabase, syncAutoRefresh } from './supabaseClient'
import { setRememberMe, clearAllAuthTokens } from './authStorage'
import { normalizeEmailAddress, sanitizeEmailInput } from '../utils/emailAddress'
import { ADMIN_CREDENTIALS } from '../config/brand'
import {
  DEFAULT_PACKAGE, isPaidMembership, getDefaultPackageForPlan, ALL_PLANS, getPlanLabel,
  sanitizeStaffForPackage,
} from '../data/membershipPlans'
import { calculatePackagePrice } from './packagePricing'
import { applyStaffAssignments } from './staffAssignment'
import { computePremiumExpiresAt, syncMembershipExpiryStatus, getDurationMonths } from './premiumMembership'
import { notifyTelegram } from './telegramNotify'
import { notifyStaffApplicationTelegram, notifyCorporateApplicationTelegram } from './applicationNotify'
import { normalizeStaffRole, staffRoleLabel } from '../utils/staffRoles'
import { normalizeStaffProfile, staffProfileDataPayload } from '../data/staffProfile'
import { coverForCategory } from '../utils/blogImages.js'
import { estimateReadMinutes } from '../utils/blogContent'
import { buildStaffApplicationPayload, applicationToStaffPayload } from '../data/staffApplication'
import { getSiteUrl } from '../config/seo'
import { memberIdSet, filterByMemberIds, filterProgramsForMembers } from '../utils/memberScopedData'
import { displayNameFromAuthUser, memberNeedsProfileCompletion } from '../utils/memberProfile'

const ADMIN_EMAIL = ADMIN_CREDENTIALS.email.toLowerCase()

const today = () => new Date().toISOString().split('T')[0]
const nowISO = () => new Date().toISOString()

// --------------------------- map: row <-> object ---------------------------
const MEMBER_COLUMN_KEYS = ['id', 'email', 'name', 'phone', 'membership', 'membershipStatus', 'assignedCoachId', 'assignedDietitianId', 'role', 'password']

function memberData(member) {
  const data = {}
  Object.keys(member).forEach((k) => {
    if (!MEMBER_COLUMN_KEYS.includes(k)) data[k] = member[k]
  })
  return data
}

function memberToRow(member) {
  return {
    id: member.id,
    email: member.email,
    name: member.name || '',
    phone: member.phone || '',
    role: member.role === 'admin' ? 'admin' : 'member',
    membership: member.membership || 'free',
    membership_status: member.membershipStatus || 'active',
    assigned_coach_id: member.assignedCoachId || null,
    assigned_dietitian_id: member.assignedDietitianId || null,
    data: memberData(member),
    updated_at: nowISO(),
  }
}

function rowToMember(row) {
  const data = row.data || {}
  return {
    ...data,
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone || data.phone || '',
    membership: row.membership,
    membershipStatus: row.membership_status,
    // RLS koç/diyetisyen erişimi sütunlara bağlı; JSONB yedek değerini de oku
    assignedCoachId: row.assigned_coach_id || data.assignedCoachId || null,
    assignedDietitianId: row.assigned_dietitian_id || data.assignedDietitianId || null,
    role: row.role || data.role || 'member',
  }
}

function rowToStaff(row) {
  return normalizeStaffProfile({
    ...(row.data || {}),
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    active: row.active,
  })
}
function rowToProgram(row) {
  return { ...(row.data || {}), id: row.id, memberId: row.member_id, staffId: row.staff_id }
}
function rowToPost(row) {
  return { ...(row.data || {}), id: row.id, published: row.published }
}
function rowToTicket(row) {
  return { ...(row.data || {}), id: row.id, memberId: row.member_id, status: row.status }
}
export { rowToMember, rowToTicket }
function rowToActivity(row) {
  const data = row.data || {}
  return {
    ...data,
    id: row.id,
    memberId: row.member_id,
    createdAt: data.createdAt || row.created_at,
  }
}
function rowToPayment(row) {
  return { ...(row.data || {}), id: row.id, memberId: row.member_id }
}

// --------------------------- auth & hydrate ---------------------------
function roleForEmail(email, staffList) {
  const e = (email || '').toLowerCase()
  if (e === ADMIN_EMAIL) return 'admin'
  if (staffList.some((s) => (s.email || '').toLowerCase() === e)) return 'staff'
  return 'member'
}

function findStaffMatch(user, staffList) {
  if (!user) return null
  const email = (user.email || '').toLowerCase()
  return staffList.find((s) => (s.email || '').toLowerCase() === email)
    || staffList.find((s) => s.id === user.id)
    || null
}

function roleForUser(user, staffList) {
  if (!user) return 'member'
  const e = (user.email || '').toLowerCase()
  if (e === ADMIN_EMAIL) return 'admin'
  if (findStaffMatch(user, staffList)) return 'staff'
  return 'member'
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data?.session || null
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return null
  return data.user
}

/** Oturumu doğrular; geçersiz token varsa temizler. */
export async function resolveAuthUser() {
  const session = await getSession()
  if (!session?.user) return null

  const user = await getUser()
  if (!user) {
    await supabase.auth.signOut()
    clearAllAuthTokens()
    return null
  }
  return user
}

export function onAuthChange(cb) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => cb(event, session))
  return () => data?.subscription?.unsubscribe?.()
}

const EMPTY_DB = {
  version: 2, members: [], staff: [], programs: [], posts: [],
  tickets: [], activities: [], payments: [], exercises: [], staffApplications: [], corporateApplications: [], contactInquiries: [], session: null,
  content: { testimonials: [], faqs: [], successStories: [], exerciseTaxonomy: null },
}

function rowToExercise(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.body_part || row.category || 'Tüm Vücut',
    sportType: row.sport_type || 'Fitness',
    bodyPart: row.body_part || row.category || 'Tüm Vücut',
    videoUrl: row.video_url,
    createdAt: row.created_at,
  }
}
function rowToStaffApplication(row) {
  return {
    id: row.id,
    role: row.role,
    status: row.status,
    email: row.email,
    name: row.name,
    phone: row.phone || '',
    data: row.data || {},
    adminNote: row.admin_note || '',
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  }
}

function rowToCorporateApplication(row) {
  return {
    id: row.id,
    status: row.status,
    companyName: row.company_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone || '',
    data: row.data || {},
    adminNote: row.admin_note || '',
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  }
}

function rowToContactInquiry(row) {
  return {
    id: row.id,
    status: row.status,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    subject: row.subject,
    message: row.message,
    source: row.source,
    createdAt: row.created_at,
  }
}

function rowToPlan(row) {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    period: row.period,
    isActive: row.is_active,
    badge: row.badge || null,
    features: row.features || [],
    limits: row.limits || [],
    pricingTiers: row.pricing_tiers || [],
    color: row.color || 'sage',
    sortOrder: row.sort_order || 0,
  }
}

export async function getPlans() {
  const { data } = await supabase.from('plans').select('*').eq('is_active', true).order('sort_order', { ascending: true })
  if (!data || data.length === 0) return ALL_PLANS
  return data.map(rowToPlan)
}

export async function upsertPlan(plan) {
  const { error } = await supabase.from('plans').upsert({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    period: plan.period,
    is_active: plan.isActive !== false,
    badge: plan.badge || null,
    features: plan.features || [],
    limits: plan.limits || [],
    pricing_tiers: plan.pricingTiers || [],
    color: plan.color || 'sage',
    sort_order: plan.sortOrder || 0,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })
  if (error) throw error
}

export async function hydrate() {
  const user = await resolveAuthUser()

  const [staffRes, postsRes, contentRes, exercisesRes, plansRes] = await Promise.all([
    supabase.from('staff').select('*').order('created_at', { ascending: true }),
    supabase.from('posts').select('*').order('created_at', { ascending: false }),
    supabase.from('site_content').select('*').order('sort', { ascending: true }),
    supabase.from('exercises').select('*').order('name', { ascending: true }),
    supabase.from('plans').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
  ])

  const staff = (staffRes.data || []).map(rowToStaff)
  const posts = (postsRes.data || []).map(rowToPost)
  const exercises = (exercisesRes.data || []).map(rowToExercise)
  const plans = plansRes.data?.length ? plansRes.data.map(rowToPlan) : ALL_PLANS
  const content = { testimonials: [], faqs: [], successStories: [], exerciseTaxonomy: null }
  ;(contentRes.data || []).forEach((r) => {
    const item = { id: r.id, ...(r.data || {}) }
    if (r.kind === 'testimonial') content.testimonials.push(item)
    else if (r.kind === 'faq') content.faqs.push(item)
    else if (r.kind === 'success_story') content.successStories.push(item)
    else if (r.kind === 'exercise_taxonomy') content.exerciseTaxonomy = { id: r.id, ...item }
  })

  if (!user) {
    return { ...EMPTY_DB, staff, posts, content, exercises, plans, authUser: null }
  }

  const authUser = {
    id: user.id,
    email: (user.email || '').toLowerCase(),
    name: displayNameFromAuthUser(user),
    identities: user.identities || [],
    app_metadata: user.app_metadata || {},
  }

  const [membersRes, programsRes, ticketsRes, activitiesRes, paymentsRes] = await Promise.all([
    supabase.from('members').select('*'),
    supabase.from('programs').select('*').order('created_at', { ascending: false }),
    supabase.from('tickets').select('*').order('created_at', { ascending: false }),
    supabase.from('activities').select('*').order('created_at', { ascending: false }),
    supabase.from('payments').select('*').order('created_at', { ascending: false }),
  ])

  let members = (membersRes.data || []).map(rowToMember)
  const memberIds = memberIdSet(members)
  const role = roleForUser(user, staff)
  const staffMatch = findStaffMatch(user, staff)
  let staffAppsRes = { data: [] }
  let corporateAppsRes = { data: [] }
  let contactInqRes = { data: [] }
  if (role === 'admin') {
    const [sa, ca, ci] = await Promise.all([
      supabase.from('staff_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('corporate_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_inquiries').select('*').order('created_at', { ascending: false }),
    ])
    staffAppsRes = sa
    corporateAppsRes = ca
    contactInqRes = ci
  }
  let session
  if (role === 'admin') session = { type: 'admin', memberId: null, email: authUser.email }
  else if (role === 'staff') {
    session = { type: 'staff', staffId: staffMatch?.id || null, email: authUser.email }
  } else {
    session = { type: 'member', memberId: user.id, email: authUser.email }
    // Süresi dolmuş üyeliği otomatik free plana düşür
    const meIdx = members.findIndex((m) => m.id === user.id)
    if (meIdx >= 0) {
      const synced = syncMembershipExpiryStatus(members[meIdx])
      if (synced.membership !== members[meIdx].membership) {
        await upsertMember(synced)
        members = members.map((m, i) => (i === meIdx ? synced : m))
      } else if (synced.membershipStatus !== members[meIdx].membershipStatus) {
        await upsertMember(synced)
        members = members.map((m, i) => (i === meIdx ? synced : m))
      }
    }
  }

  return {
    version: 2,
    members,
    staff,
    programs: filterProgramsForMembers((programsRes.data || []).map(rowToProgram), memberIds),
    posts,
    tickets: filterByMemberIds((ticketsRes.data || []).map(rowToTicket), memberIds),
    activities: filterByMemberIds((activitiesRes.data || []).map(rowToActivity), memberIds),
    payments: filterByMemberIds((paymentsRes.data || []).map(rowToPayment), memberIds),
    exercises,
    plans,
    staffApplications: (staffAppsRes.data || []).map(rowToStaffApplication),
    corporateApplications: (corporateAppsRes.data || []).map(rowToCorporateApplication),
    contactInquiries: (contactInqRes.data || []).map(rowToContactInquiry),
    session,
    authUser,
    content,
  }
}

// --------------------------- persistence helpers ---------------------------
async function upsertMember(member) {
  const { error } = await supabase.from('members').upsert(memberToRow(member), { onConflict: 'id' })
  if (error) throw error
}

async function resolveActorName(user, role, staffList) {
  if (!user) return 'Kullanıcı'
  if (role === 'admin') return user.user_metadata?.name || 'Admin'
  if (role === 'staff') {
    const s = findStaffMatch(user, staffList) || staffList.find((x) => (x.email || '').toLowerCase() === (user.email || '').toLowerCase())
    return s?.name || user.user_metadata?.name || 'Personel'
  }
  const { data } = await supabase.from('members').select('name').eq('id', user.id).maybeSingle()
  return data?.name || displayNameFromAuthUser(user) || 'Üye'
}

async function addActivity(type, text, memberId = null) {
  await supabase.from('activities').insert({
    member_id: memberId,
    data: { type, text, createdAt: nowISO() },
  })
}

// --------------------------- auth flows ---------------------------
export async function login(email, password, remember = false) {
  setRememberMe(remember)
  if (!remember) {
    clearAllAuthTokens()
  }
  syncAutoRefresh(remember)

  const { data, error } = await supabase.auth.signInWithPassword({
    email: sanitizeEmailInput(email), password,
  })
  if (error) return { success: false, error: 'E-posta veya şifre hatalı.' }

  const { data: staffRows } = await supabase.from('staff').select('*')
  const staffList = (staffRows || []).map(rowToStaff)
  const role = roleForUser(data.user, staffList)
  const displayName = await resolveActorName(data.user, role, staffList)
  const staffMember = findStaffMatch(data.user, staffList)

  const loginText = role === 'admin'
    ? `${displayName} (Admin) giriş yaptı`
    : role === 'staff'
      ? `${displayName} (${staffRoleLabel(staffMember?.role)}) giriş yaptı`
      : `${displayName} giriş yaptı`

  await addActivity('login', loginText, role === 'member' ? data.user.id : null)

  if (role === 'admin') {
    notifyTelegram('admin_login', { name: displayName, email: data.user.email })
  } else if (role === 'staff') {
    notifyTelegram('staff_login', {
      name: displayName,
      email: data.user.email,
      role: staffRoleLabel(staffMember?.role),
    })
  } else {
    notifyTelegram('member_login', { name: displayName, email: data.user.email })
  }

  return { success: true, role, remember }
}

export async function logout() {
  const user = await getUser()
  if (user) {
    const { data: staffRows } = await supabase.from('staff').select('*')
    const staffList = (staffRows || []).map(rowToStaff)
    const role = roleForUser(user, staffList)
    const displayName = await resolveActorName(user, role, staffList)
    const staffMember = findStaffMatch(user, staffList)

    if (role === 'staff') {
      await addActivity('logout', `${displayName} (${staffRoleLabel(staffMember?.role)}) çıkış yaptı`)
      notifyTelegram('staff_logout', { name: displayName, role: staffRoleLabel(staffMember?.role) })
    } else if (role === 'admin') {
      await addActivity('logout', `${displayName} (Admin) çıkış yaptı`)
    } else {
      await addActivity('logout', `${displayName} çıkış yaptı`, user.id)
      notifyTelegram('member_logout', { name: displayName })
    }
  }

  await supabase.auth.signOut()
  clearAllAuthTokens()
  syncAutoRefresh(false)
}

function withPremiumDates(member, packageConfig, isNewPremium = false) {
  if (!isPaidMembership(member.membership)) return member
  const pkg = packageConfig || member.packageConfig || getDefaultPackageForPlan(member.membership)
  const started = isNewPremium ? today() : (member.premiumStartedAt || member.joinedAt || today())
  const months = getDurationMonths(pkg)
  const expires = isNewPremium || !member.premiumExpiresAt
    ? computePremiumExpiresAt(started, months)
    : member.premiumExpiresAt
  return syncMembershipExpiryStatus({
    ...member,
    premiumStartedAt: started,
    premiumExpiresAt: expires,
    packageConfig: { ...DEFAULT_PACKAGE, ...pkg, durationMonths: months, durationWeeks: months * 4 },
  })
}

async function buildAndPersistMember(profile, membership, packageConfig, opts = {}) {
  const user = await getUser()
  if (!user) return { success: false, error: 'Oturum oluşturulamadı.' }

  const schedule = profile.supportSchedule || null
  const assignedCoachId = null
  const assignedDietitianId = null
  const assignedDoctorId = null
  const coachSessions = []
  const dietitianSessions = []
  const doctorSessions = []

  // Koç/diyetisyen ve randevular admin panelinden elle atanır

  const member = withPremiumDates({
    id: user.id,
    email: normalizeEmailAddress(user.email) || normalizeEmailAddress(profile.email) || sanitizeEmailInput(user.email),
    name: profile.name,
    phone: profile.phone || '',
    age: profile.age,
    gender: profile.gender || '',
    weight: profile.weight || '',
    height: profile.height || '',
    waist: profile.waist || '',
    photo: profile.photo || null,
    city: profile.city || '',
    district: profile.district || '',
    phoneCountry: profile.phoneCountry || '',
    goals: profile.goals || [],
    fitnessLevel: profile.fitnessLevel || 'beginner',
    nutritionPrefs: profile.nutritionPrefs || [],
    healthTest: profile.healthTest || null,
    healthAnalysis: profile.healthAnalysis || null,
    membership,
    membershipStatus: 'active',
    freeTrialExpiresAt: membership === 'free'
      ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      : null,
    packageConfig: packageConfig || getDefaultPackageForPlan(membership),
    joinedAt: today(),
    lastActiveAt: today(),
    coachSessions,
    dietitianSessions,
    doctorSessions,
    notifications: [{
      id: `n-${Date.now()}`, type: 'reminder', title: 'Yeni Form’a hoş geldiniz!',
      message: 'Profiliniz hazır. Günlük görevlerinizi tamamlayarak serinizi büyütmeye başlayın.',
      read: false, createdAt: nowISO(),
    }],
    tasks: [
      { id: `t1-${Date.now()}`, type: 'checkin', title: 'Günlük check-in', done: false, due: 'Bugün' },
      { id: `t2-${Date.now()}`, type: 'workout', title: 'Program takviminden bugünkü hareketi tamamla', done: false, due: 'Bugün' },
    ],
    progress: { weight: [], workouts: [], mood: [] },
    supportSchedule: schedule,
    availability: profile.availability || {},
    assignedCoachId,
    assignedDietitianId,
    assignedDoctorId,
    settings: { theme: 'light', language: 'tr', emailNotifs: true, pushNotifs: true, reminderNotifs: true },
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    streak: 0,
    profileComplete: true,
  }, packageConfig, isPaidMembership(membership))

  await upsertMember(member)
  const planLabel = membership === 'free' ? 'Ücretsiz' : getPlanLabel(membership)
  await addActivity('signup', `${member.name} yeni kayıt (${planLabel})`, member.id)
  notifyTelegram('member_signup', {
    name: member.name,
    email: member.email,
    membership,
  })

  if (opts.payment) {
    await supabase.from('payments').insert({
      member_id: member.id,
      data: { memberName: member.name, amount: opts.payment, packageConfig, status: 'completed', createdAt: nowISO() },
    })
    await addActivity('payment', `${member.name} ödeme tamamladı (${opts.payment.toLocaleString('tr-TR')}₺)`, member.id)
  }

  return { success: true, member }
}

async function unlockSignupSession(email, password) {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unlock-signup', email, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.ok) return { success: true }
    if (res.status === 503) {
      return { success: false, error: data.error, unlockUnavailable: true }
    }
  } catch {
    /* ağ hatası — aşağıda doğrudan giriş denenecek */
  }
  return { success: false }
}

async function signInAfterSignup(email, password) {
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (!signInError) return { success: true }

  if (/not confirmed|confirm/i.test(signInError.message)) {
    const unlocked = await unlockSignupSession(email, password)
    if (unlocked.success) {
      const retry = await supabase.auth.signInWithPassword({ email, password })
      if (!retry.error) return { success: true }
      return { success: false, error: retry.error.message }
    }
    if (unlocked.unlockUnavailable) {
      return { success: false, error: unlocked.error }
    }
    return {
      success: false,
      error: 'Kayıt oluşturuldu ancak oturum açılamadı. Lütfen giriş yapmayı deneyin veya destek ile iletişime geçin.',
    }
  }

  return { success: false, error: signInError.message }
}

// Kayıt için auth kullanıcısını hazırlar ve oturumu açar.
// E-posta doğrulaması kayıtta zorunlu değildir; profilden isteğe bağlı yapılır.
// İdempotent: yarım kalmış (auth var ama profil yok) kayıtları kurtarır.
async function ensureAuthForSignup(profile) {
  const email = normalizeEmailAddress(profile.email)
  if (!email) {
    return { success: false, error: 'Geçerli bir e-posta adresi girin (ör. ad@site.com). Boşluk veya geçersiz karakter olmamalı.' }
  }
  const password = profile.password
  const emailRedirectTo = `${getSiteUrl()}/auth/callback?verify=email`

  if (profile.phone) {
    const { data: phoneTaken, error: phoneErr } = await supabase.rpc('phone_in_use', { p_phone: profile.phone })
    if (!phoneErr && phoneTaken) {
      return { success: false, error: 'Bu telefon numarası zaten kayıtlı. Lütfen farklı bir numara kullanın.' }
    }
  }

  try { await supabase.auth.signOut() } catch { /* oturum yoksa yoksay */ }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: profile.name },
      emailRedirectTo,
    },
  })

  if (signUpError) {
    if (/validate email|invalid format|invalid email/i.test(signUpError.message)) {
      return { success: false, error: 'Geçerli bir e-posta adresi girin (ör. ad@site.com). Boşluk veya geçersiz karakter olmamalı.' }
    }
    if (/registered|already|exists/i.test(signUpError.message)) {
      const signIn = await signInAfterSignup(email, password)
      if (signIn.success) return { success: true }
      return { success: false, error: signIn.error || 'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.' }
    }
    return { success: false, error: signUpError.message }
  }

  if (!signUpData?.session) {
    const signIn = await signInAfterSignup(email, password)
    if (!signIn.success) return signIn
  }

  return { success: true }
}

export async function register(profile, membership = 'free', packageConfig = null) {
  const auth = await ensureAuthForSignup(profile)
  if (!auth.success) return auth
  return buildAndPersistMember(profile, membership, packageConfig)
}

/** OAuth ile oturum açıkken eksik profil alanlarını tamamlar (telefon, plan vb.). */
export async function completeOAuthMember(profile, membership = 'free', packageConfig = null, opts = {}) {
  const user = await getUser()
  if (!user) return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }

  const email = normalizeEmailAddress(user.email) || normalizeEmailAddress(profile.email)
  if (!email) {
    return { success: false, error: 'E-posta adresi alınamadı. Lütfen farklı bir giriş yöntemi deneyin.' }
  }

  const name = (profile.name || displayNameFromAuthUser(user) || '').trim()
  if (!name) {
    return { success: false, error: 'Ad soyad bilgisi gerekli.' }
  }

  const phone = profile.phone || ''
  if (phone) {
    const { data: phoneTaken, error: phoneErr } = await supabase.rpc('phone_in_use', { p_phone: phone })
    if (!phoneErr && phoneTaken) {
      const { data: existing } = await supabase.from('members').select('id').eq('phone', phone).maybeSingle()
      if (existing?.id && existing.id !== user.id) {
        return { success: false, error: 'Bu telefon numarası zaten kayıtlı. Lütfen farklı bir numara kullanın.' }
      }
      if (!existing?.id) {
        return { success: false, error: 'Bu telefon numarası zaten kayıtlı. Lütfen farklı bir numara kullanın.' }
      }
    }
  } else {
    return { success: false, error: 'Telefon numarası gerekli — randevu hatırlatmaları için kullanılır.' }
  }

  if (name !== displayNameFromAuthUser(user)) {
    await supabase.auth.updateUser({ data: { name, full_name: name } })
  }

  const mergedProfile = {
    ...profile,
    name,
    email,
    phone,
  }

  return buildAndPersistMember(mergedProfile, membership, packageConfig, opts)
}

/** OAuth callback — tam hydrate beklemeden yönlendirme rotası (3–4 hafif sorgu). */
export async function resolveQuickPostLoginPath(session, { plan = 'free' } = {}) {
  if (!session?.user) return '/login'
  const user = session.user
  const { data: memberRow } = await supabase.from('members').select('*').eq('id', user.id).maybeSingle()
  const member = memberRow ? rowToMember(memberRow) : null
  const authUser = {
    id: user.id,
    email: (user.email || '').toLowerCase(),
    name: displayNameFromAuthUser(user),
    identities: user.identities || [],
    app_metadata: user.app_metadata || {},
  }
  if (memberNeedsProfileCompletion(member, authUser)) {
    return `/onboarding?oauth=1&plan=${encodeURIComponent(plan)}`
  }
  const { data: staffRows } = await supabase.from('staff').select('*')
  const staff = (staffRows || []).map(rowToStaff)
  const role = roleForUser(user, staff)
  if (role === 'admin') return '/admin'
  if (role === 'staff') return '/staff'
  return '/profile'
}

/** Sosyal giriş sonrası aktivite / bildirim kaydı (şifresiz). */
export async function recordSocialLogin() {
  const user = await getUser()
  if (!user) return { success: false }

  const { data: staffRows } = await supabase.from('staff').select('*')
  const staffList = (staffRows || []).map(rowToStaff)
  const role = roleForUser(user, staffList)
  const displayName = await resolveActorName(user, role, staffList)
  const staffMember = findStaffMatch(user, staffList)

  const loginText = role === 'admin'
    ? `${displayName} (Admin) giriş yaptı`
    : role === 'staff'
      ? `${displayName} (${staffRoleLabel(staffMember?.role)}) giriş yaptı`
      : `${displayName} giriş yaptı`

  await addActivity('login', loginText, role === 'member' ? user.id : null)

  if (role === 'admin') {
    notifyTelegram('admin_login', { name: displayName, email: user.email })
  } else if (role === 'staff') {
    notifyTelegram('staff_login', {
      name: displayName,
      email: user.email,
      role: staffRoleLabel(staffMember?.role),
    })
  } else {
    notifyTelegram('member_login', { name: displayName, email: user.email })
  }

  return { success: true, role }
}

export async function registerWithPayment(profile, packageConfig) {
  const pricing = calculatePackagePrice(packageConfig)
  const auth = await ensureAuthForSignup(profile)
  if (!auth.success) return auth
  const res = await buildAndPersistMember(profile, 'premium', packageConfig, { payment: pricing.total })
  return res.success ? { success: true, member: res.member, pricing } : res
}

// Sabit fiyatlı plan ile kayıt (süre ay cinsinden)
export async function registerWithPlan(profile, planId, planPrice, durationMonths = 1) {
  const auth = await ensureAuthForSignup(profile)
  if (!auth.success) return auth
  const months = Number(durationMonths) || 1
  const packageConfig = getDefaultPackageForPlan(planId, months)
  const res = await buildAndPersistMember(profile, planId, packageConfig, { payment: planPrice })
  return res.success ? { success: true, member: res.member, amount: planPrice } : res
}

// --------------------------- member mutations ---------------------------
// Çoğu mutasyon: bellekteki member nesnesini düzenle + upsert et.
export async function saveMemberPatch(member, patch) {
  let updated = { ...member, ...patch, lastActiveAt: today() }

  if (patch.calorieHistory) {
    const prev = member.calorieHistory || []
    const next = patch.calorieHistory || []
    const prevIds = new Set(prev.map((e) => e.id))
    const merged = [...prev]
    for (const e of next) {
      if (e?.id && !prevIds.has(e.id)) {
        merged.push(e)
        prevIds.add(e.id)
      }
    }
    updated.calorieHistory = merged.slice(-100)
  }

  if (patch.weight != null && String(patch.weight) !== String(member.weight)) {
    const w = parseFloat(patch.weight)
    if (!Number.isNaN(w) && w > 0) {
      const progress = { ...(member.progress || {}), weight: [...(member.progress?.weight || [])] }
      const todayStr = today()
      const last = progress.weight[progress.weight.length - 1]
      if (!last || last.date !== todayStr || last.value !== w) {
        progress.weight.push({ date: todayStr, value: w })
        if (progress.weight.length > 120) progress.weight = progress.weight.slice(-120)
      }
      updated.progress = progress
    }
  }

  if (isPaidMembership(updated.membership)) {
    updated = syncMembershipExpiryStatus(updated)
  }
  await upsertMember(updated)
  return updated
}

/** Oturum açmış üyenin doğrulama alanlarını günceller (tam üye nesnesi gerekmez). */
export async function patchMemberVerification(userId, patch) {
  const { data, error } = await supabase.from('members').select('*').eq('id', userId).maybeSingle()
  if (error || !data) return { success: false, error: 'Üye kaydı bulunamadı' }
  const member = rowToMember(data)
  await saveMemberPatch(member, patch)
  return { success: true }
}

export async function saveSupportSchedule(member, schedule) {
  const updated = syncMembershipExpiryStatus({
    ...member,
    supportSchedule: schedule,
    lastActiveAt: today(),
  })
  await upsertMember(updated)
  return updated
}

export async function processPremiumPayment(member, packageConfig, schedule) {
  const pricing = calculatePackagePrice(packageConfig)
  const draft = {
    ...member,
    membership: 'premium',
    membershipStatus: 'active',
    packageConfig,
    supportSchedule: schedule,
  }

  const sanitized = sanitizeStaffForPackage(packageConfig, draft)

  const updated = withPremiumDates({
    ...sanitized,
    lastActiveAt: today(),
  }, packageConfig, true)
  await upsertMember(updated)
  await supabase.from('payments').insert({
    member_id: member.id,
    data: { memberName: member.name, amount: pricing.total, packageConfig, status: 'completed', createdAt: nowISO() },
  })
  await addActivity('upgrade', `${member.name} Premium üyeliğe geçti (${pricing.total.toLocaleString('tr-TR')}₺)`, member.id)
  return { success: true, pricing }
}

// Mevcut üyenin planını değiştirir (yeni kayıt OLUŞTURMAZ).
// Ücretli plan → premium tarihleri sıfırlanır + ödeme kaydı eklenir.
// Ücretsiz plan → premium bilgileri temizlenir.
export async function changeMemberPlan(member, planId, planPrice = 0, durationMonths = 1) {
  if (!member) return { success: false, error: 'Üye bulunamadı.' }
  const paid = isPaidMembership(planId)
  const months = Number(durationMonths) || 1
  const packageConfig = getDefaultPackageForPlan(planId, months)

  let draft = {
    ...member,
    membership: planId,
    membershipStatus: 'active',
    packageConfig,
    lastActiveAt: today(),
  }

  draft = sanitizeStaffForPackage(packageConfig, draft)

  if (paid) {
    // Yeni plan için süreyi bugünden başlat
    draft.premiumStartedAt = null
    draft.premiumExpiresAt = null
    draft.freeTrialExpiresAt = null
    draft = withPremiumDates(draft, packageConfig, true)
  } else {
    draft.premiumStartedAt = null
    draft.premiumExpiresAt = null
    draft.freeTrialExpiresAt = null
  }

  await upsertMember(draft)

  if (paid && planPrice > 0) {
    await supabase.from('payments').insert({
      member_id: member.id,
      data: { memberName: member.name, amount: planPrice, packageConfig, status: 'completed', createdAt: nowISO() },
    })
    await addActivity('upgrade', `${member.name} planını ${planId} olarak değiştirdi (${planPrice.toLocaleString('tr-TR')}₺)`, member.id)
  } else {
    await addActivity('plan_change', `${member.name} planını ${planId} olarak değiştirdi`, member.id)
  }

  return { success: true, member: draft }
}

// --------------------------- staff (admin) ---------------------------
function staffDataPayload(data) {
  return staffProfileDataPayload(data)
}

export async function addStaff(data) {
  const email = data.email?.toLowerCase().trim()
  if (!email) return { success: false, error: 'E-posta gerekli.' }
  if (!data.password) return { success: false, error: 'Şifre gerekli.' }
  const { data: staffId, error } = await supabase.rpc('admin_upsert_staff', {
    p_id: null,
    p_email: email,
    p_password: data.password,
    p_name: data.name,
    p_role: normalizeStaffRole(data.role),
    p_active: true,
    p_data: staffDataPayload(data),
  })
  if (error) return { success: false, error: error.message }
  return { success: true, id: staffId }
}

export async function editStaff(id, patch) {
  const { data: rows } = await supabase.from('staff').select('*').eq('id', id).limit(1)
  const current = rows?.[0]
  if (!current) return { success: false, error: 'Bulunamadı.' }
  const merged = { ...rowToStaff(current), ...patch }
  const { error } = await supabase.rpc('admin_upsert_staff', {
    p_id: id,
    p_email: (merged.email || '').toLowerCase(),
    p_password: patch.password || '',
    p_name: merged.name,
    p_role: normalizeStaffRole(merged.role),
    p_active: merged.active !== false,
    p_data: staffDataPayload(merged),
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

/** Personelin kendi profilini güncellemesi — RPC staff_update_self_profile + RLS */
export async function updateStaffSelfProfile(id, patch) {
  const user = await getUser()
  if (!user?.email) return { success: false, error: 'Oturum gerekli.' }

  const merged = normalizeStaffProfile(patch)
  const { data: staffId, error } = await supabase.rpc('staff_update_self_profile', {
    p_name: merged.name?.trim() || '',
    p_data: staffProfileDataPayload(merged),
  })

  if (error) return { success: false, error: error.message }
  if (id && staffId && id !== staffId) {
    return { success: false, error: 'Yetkisiz profil güncellemesi.' }
  }
  return { success: true, id: staffId }
}

export async function removeStaff(id) {
  await supabase.rpc('admin_delete_staff', { p_id: id })
}

export async function removeMember(id) {
  const { error } = await supabase.rpc('admin_delete_member', { p_id: id })
  if (error) throw error
}

// --------------------------- posts (admin) ---------------------------
export async function addPost(data) {
  const content = data.content || ''
  const readMinutes = data.readMinutes || estimateReadMinutes(content)
  const category = data.category || 'Yaşam'
  const cover = data.coverImage
    ? { coverImage: data.coverImage, coverImageAlt: data.coverImageAlt || '' }
    : coverForCategory(category)
  const { data: row, error } = await supabase.from('posts').insert({
    published: data.published !== false,
    data: {
      title: data.title,
      category,
      excerpt: data.excerpt || '',
      author: data.author || 'Yeni Form Ekibi',
      readMinutes,
      accent: data.accent || 'brand',
      content,
      coverImage: cover.coverImage,
      coverImageAlt: cover.coverImageAlt,
      createdAt: data.createdAt || today(),
      updatedAt: today(),
    },
  }).select().single()
  if (error) return null
  return rowToPost(row)
}

export async function editPost(id, patch) {
  const { data: rows } = await supabase.from('posts').select('*').eq('id', id).limit(1)
  const current = rows?.[0]
  if (!current) return
  const merged = { ...rowToPost(current), ...patch }
  const content = merged.content || ''
  const category = merged.category || 'Yaşam'
  const cover = merged.coverImage
    ? { coverImage: merged.coverImage, coverImageAlt: merged.coverImageAlt || merged.title || '' }
    : coverForCategory(category)
  await supabase.from('posts').update({
    published: merged.published !== false,
    data: {
      title: merged.title,
      category,
      excerpt: merged.excerpt,
      author: merged.author,
      readMinutes: merged.readMinutes || estimateReadMinutes(content),
      accent: merged.accent,
      content,
      coverImage: cover.coverImage,
      coverImageAlt: cover.coverImageAlt,
      createdAt: merged.createdAt,
      updatedAt: today(),
    },
  }).eq('id', id)
}

export async function removePost(id) {
  await supabase.from('posts').delete().eq('id', id)
}

// --------------------------- site content (yorum / SSS / başarı hikâyesi) ---------------------------
export async function addContent(kind, data) {
  const { error } = await supabase.from('site_content').insert({ kind, sort: data.sort || 0, data })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function editContent(id, data) {
  const { error } = await supabase.from('site_content').update({ data, sort: data.sort || 0 }).eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function removeContent(id) {
  await supabase.from('site_content').delete().eq('id', id)
}

export async function submitSuccessStory(member, data) {
  const { error } = await supabase.from('site_content').insert({
    kind: 'success_story', sort: 0,
    data: {
      name: member?.name || data.name || 'Üye',
      duration: data.duration || '',
      highlight: data.highlight || '',
      story: data.story || '',
      consent: true,
      approved: false,
    },
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// --------------------------- exercises (library) ---------------------------
export async function uploadExerciseVideo(file) {
  const ext = (file.name?.split('.').pop() || 'mp4').toLowerCase()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('exercise-videos').upload(path, file, {
    cacheControl: '3600', upsert: false, contentType: file.type || 'video/mp4',
  })
  if (error) return { success: false, error: error.message }
  const { data } = supabase.storage.from('exercise-videos').getPublicUrl(path)
  return { success: true, url: data.publicUrl }
}

export async function upsertExerciseTaxonomy(taxonomy) {
  const payload = {
    sportTypes: taxonomy.sportTypes || [],
    bodyParts: taxonomy.bodyParts || [],
  }
  if (taxonomy.id) {
    const { error } = await supabase.from('site_content').update({ data: payload }).eq('id', taxonomy.id)
    if (error) return { success: false, error: error.message }
    return { success: true, id: taxonomy.id }
  }
  const { data, error } = await supabase.from('site_content').insert({ kind: 'exercise_taxonomy', sort: 0, data: payload }).select('id').single()
  if (error) return { success: false, error: error.message }
  return { success: true, id: data.id }
}

// Bazı eski veritabanlarında exercises tablosunda sport_type / body_part
// sütunları bulunmayabilir. Bu durumda PostgREST "schema cache" hatası döner;
// payload'ı opsiyonel sütunlar olmadan tekrar deneriz (category değeri korunur).
const isMissingExerciseColumnError = (error) =>
  !!error && (error.code === 'PGRST204' || error.code === '42703' ||
    /body_part|sport_type/.test(error.message || ''))

const stripOptionalExerciseColumns = ({ sport_type, body_part, ...rest }) => rest

export async function addExercise(data) {
  const payload = {
    name: data.name,
    description: data.description || '',
    category: data.bodyPart || data.category || 'Tüm Vücut',
    sport_type: data.sportType || 'Fitness',
    body_part: data.bodyPart || data.category || 'Tüm Vücut',
    video_url: data.videoUrl || '',
  }
  let { error } = await supabase.from('exercises').insert(payload)
  if (isMissingExerciseColumnError(error)) {
    ;({ error } = await supabase.from('exercises').insert(stripOptionalExerciseColumns(payload)))
  }
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function editExercise(id, patch) {
  const payload = {
    name: patch.name,
    description: patch.description || '',
    category: patch.bodyPart || patch.category || 'Tüm Vücut',
    sport_type: patch.sportType || 'Fitness',
    body_part: patch.bodyPart || patch.category || 'Tüm Vücut',
    video_url: patch.videoUrl || '',
  }
  let { error } = await supabase.from('exercises').update(payload).eq('id', id)
  if (isMissingExerciseColumnError(error)) {
    ;({ error } = await supabase.from('exercises').update(stripOptionalExerciseColumns(payload)).eq('id', id))
  }
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function removeExercise(id) {
  await supabase.from('exercises').delete().eq('id', id)
}

// --------------------------- staff applications ---------------------------
export async function uploadStaffApplicationDoc(file) {
  if (!file) return { success: false, error: 'Dosya seçilmedi' }
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const allowed = ['pdf', 'jpg', 'jpeg', 'png', 'webp']
  if (!allowed.includes(ext)) return { success: false, error: 'Yalnızca PDF veya görsel yükleyebilirsiniz' }
  if (file.size > 8 * 1024 * 1024) return { success: false, error: 'Dosya en fazla 8 MB olabilir' }

  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`
  const { error } = await supabase.storage.from('staff-application-docs').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) return { success: false, error: error.message }
  const { data } = supabase.storage.from('staff-application-docs').getPublicUrl(path)
  return { success: true, url: data.publicUrl, path }
}

export async function submitStaffApplication(form) {
  const payload = buildStaffApplicationPayload(form)

  const { data, error } = await supabase.rpc('submit_staff_application', {
    p_role: form.role,
    p_email: form.email?.trim().toLowerCase(),
    p_name: form.name?.trim(),
    p_phone: form.phone?.trim() || '',
    p_data: payload,
  })

  if (error) return { success: false, error: error.message }
  await addActivity('staff_apply', `${form.name} (${staffRoleLabel(form.role)}) kadro başvurusu gönderdi`)
  notifyStaffApplicationTelegram({
    name: form.name?.trim(),
    email: form.email?.trim().toLowerCase(),
    phone: form.phone?.trim() || '',
    role: form.role,
    roleLabel: staffRoleLabel(form.role),
  })
  return { success: true, id: data }
}

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
  let pwd = ''
  for (let i = 0; i < 14; i += 1) pwd += chars[Math.floor(Math.random() * chars.length)]
  return pwd
}

export async function resolveStaffApplication(application, approve, adminNote = '') {
  if (!approve) {
    const { error } = await supabase.from('staff_applications').update({
      status: 'rejected',
      admin_note: adminNote || '',
      reviewed_at: nowISO(),
    }).eq('id', application.id)
    if (error) return { success: false, error: error.message }
    await addActivity('staff_apply', `${application.name} kadro başvurusu reddedildi`)
    return { success: true }
  }

  const tempPassword = generateTempPassword()
  const staffPayload = applicationToStaffPayload(application, tempPassword)

  const created = await addStaff(staffPayload)
  if (!created.success) return created

  const { error } = await supabase.from('staff_applications').update({
    status: 'approved',
    admin_note: adminNote || '',
    reviewed_at: nowISO(),
    data: { ...application.data, staffId: created.id, tempPasswordIssued: true },
  }).eq('id', application.id)
  if (error) return { success: false, error: error.message }

  await addActivity('staff_apply', `${application.name} kadro başvurusu onaylandı — personel hesabı açıldı`)
  return { success: true, staffId: created.id, tempPassword }
}

export async function submitCorporateApplication(form) {
  const payload = {
    city: form.city || '',
    industry: form.industry || '',
    employeeRange: form.employeeRange || '',
    services: form.services || [],
    message: form.message || '',
    preferredStart: form.preferredStart || '',
  }
  const { data, error } = await supabase.rpc('submit_corporate_application', {
    p_company_name: form.companyName?.trim(),
    p_contact_name: form.contactName?.trim(),
    p_email: form.email?.trim().toLowerCase(),
    p_phone: form.phone?.trim() || '',
    p_data: payload,
  })
  if (error) return { success: false, error: error.message }
  await addActivity('corporate_apply', `${form.companyName} kurumsal başvuru gönderdi`)
  notifyCorporateApplicationTelegram({
    companyName: form.companyName?.trim(),
    contactName: form.contactName?.trim(),
    email: form.email?.trim().toLowerCase(),
    phone: form.phone?.trim() || '',
  })
  return { success: true, id: data }
}

export async function submitContactInquiry(form) {
  const { data, error } = await supabase.rpc('submit_contact_inquiry', {
    p_name: form.name?.trim(),
    p_email: form.email?.trim().toLowerCase(),
    p_phone: form.phone?.trim() || '',
    p_subject: form.subject || 'general',
    p_message: form.message?.trim(),
    p_source: form.source || 'landing',
  })
  if (error) return { success: false, error: error.message }
  return { success: true, id: data }
}

export async function resolveCorporateApplication(application, status, adminNote = '') {
  const { error } = await supabase.from('corporate_applications').update({
    status,
    admin_note: adminNote || '',
    reviewed_at: nowISO(),
  }).eq('id', application.id)
  if (error) return { success: false, error: error.message }
  await addActivity('corporate_apply', `${application.companyName} kurumsal başvuru: ${status}`)
  return { success: true }
}

export async function updateContactInquiryStatus(inquiry, status) {
  const { error } = await supabase.from('contact_inquiries').update({ status }).eq('id', inquiry.id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// --------------------------- programs (staff/admin) ---------------------------
export async function createProgram(data) {
  const staffId = data.staffId && data.staffId !== 'system' ? data.staffId : null
  const { data: row, error } = await supabase.from('programs').insert({
    member_id: data.memberId,
    staff_id: staffId,
    data: {
      type: data.type === 'nutrition' ? 'nutrition' : 'workout',
      memberName: data.memberName || '', staffName: data.staffName || '',
      title: data.title, description: data.description || '',
      items: Array.isArray(data.items) ? data.items : [],
      entries: Array.isArray(data.entries) ? data.entries : [],
      createdAt: nowISO(),
    },
  }).select().single()
  if (error) return null

  // Danışana bildirim gönder
  if (data.memberId) {
    const { data: memberRows } = await supabase.from('members').select('*').eq('id', data.memberId).limit(1)
    const member = memberRows?.[0] ? rowToMember(memberRows[0]) : null
    if (member) {
      const typeLabel = data.type === 'nutrition' ? 'Beslenme' : 'Antrenman'
      const notifications = [
        {
          id: `n-${Date.now()}-prog`,
          type: 'program',
          title: `Yeni ${typeLabel} Programı`,
          message: `${data.staffName || 'Uzmanınız'} size "${data.title}" programını hazırladı. Programlarım bölümünden inceleyebilirsiniz.`,
          read: false,
          createdAt: nowISO(),
        },
        ...(member.notifications || []),
      ]
      await upsertMember({ ...member, notifications })
    }
  }

  return rowToProgram(row)
}

// --------------------------- tickets ---------------------------
export async function createTicket(member, ticketData) {
  const msg = { id: `m-${Date.now()}`, from: 'member', text: ticketData.message || ticketData.text || '', createdAt: nowISO() }
  const { data: row, error } = await supabase.from('tickets').insert({
    member_id: member?.id || null,
    status: 'open',
    data: {
      subject: ticketData.subject || 'Destek Talebi',
      category: ticketData.category || 'Genel',
      memberName: member?.name || 'Ziyaretçi',
      messages: [msg], createdAt: nowISO(),
    },
  }).select().single()
  if (error) return null
  return rowToTicket(row)
}

export async function setTicketStatus(id, status) {
  await supabase.from('tickets').update({ status }).eq('id', id)
}

export async function sendTicketReply(id, from, text) {
  const { data: rows } = await supabase.from('tickets').select('*').eq('id', id).limit(1)
  const current = rows?.[0]
  if (!current) return null
  const ticket = rowToTicket(current)
  const messages = [...(ticket.messages || []), { id: `m-${Date.now()}`, from, text, createdAt: nowISO() }]
  const status = from === 'admin' && ticket.status === 'open' ? 'in-progress' : ticket.status
  await supabase.from('tickets').update({ status, data: { ...current.data, messages } }).eq('id', id)

  if (from === 'admin' && current.member_id) {
    const { data: memberRow } = await supabase.from('members').select('*').eq('id', current.member_id).maybeSingle()
    if (memberRow) {
      const data = memberRow.data || {}
      const notifications = [
        {
          id: `n-${Date.now()}`,
          type: 'support-reply',
          title: 'Destek yanıtı',
          message: `"${ticket.subject}" talebinize yanıt geldi.`,
          read: false,
          createdAt: nowISO(),
          ticketId: id,
        },
        ...(data.notifications || []),
      ]
      await supabase.from('members').update({
        data: { ...data, notifications },
        updated_at: nowISO(),
      }).eq('id', current.member_id)
    }
  }

  return { ...ticket, messages, status }
}

/** Admin: koç/diyetisyen ataması ve seans yönetimi (süre salt okunur) */
export async function adminUpdatePremiumMembership(memberId, options = {}) {
  const { data: memberRows } = await supabase.from('members').select('*').eq('id', memberId).limit(1)
  const member = memberRows?.[0] ? rowToMember(memberRows[0]) : null
  if (!member) return { success: false, error: 'Üye bulunamadı.' }

  const { data: staffRows } = await supabase.from('staff').select('*')
  const staffList = (staffRows || []).map(rowToStaff)
  const { data: allMemberRows } = await supabase.from('members').select('*')
  const members = (allMemberRows || []).map(rowToMember)

  const prevCoachId = member.assignedCoachId
  const prevDietitianId = member.assignedDietitianId
  const schedule = options.supportSchedule ?? member.supportSchedule

  const draft = {
    ...member,
    membership: member.membership,
    membershipStatus: member.membershipStatus || 'active',
    packageConfig: member.packageConfig || DEFAULT_PACKAGE,
    supportSchedule: schedule,
    premiumExpiresAt: member.premiumExpiresAt,
    premiumStartedAt: member.premiumStartedAt || member.joinedAt || today(),
    assignedCoachId: options.assignedCoachId !== undefined ? options.assignedCoachId : member.assignedCoachId,
    assignedDietitianId: options.assignedDietitianId !== undefined ? options.assignedDietitianId : member.assignedDietitianId,
    coachSessions: options.coachSessions !== undefined ? options.coachSessions : (member.coachSessions || []),
    dietitianSessions: options.dietitianSessions !== undefined ? options.dietitianSessions : (member.dietitianSessions || []),
  }

  const assignments = applyStaffAssignments(draft, staffList, members, {
    autoAssign: Boolean(options.autoAssign),
    manualCoachId: draft.assignedCoachId,
    manualDietitianId: draft.assignedDietitianId,
    coachSessions: draft.coachSessions,
    dietitianSessions: draft.dietitianSessions,
  })

  let updated = {
    ...draft,
    assignedCoachId: assignments.assignedCoachId,
    assignedDietitianId: assignments.assignedDietitianId,
    coachSessions: assignments.coachSessions,
    dietitianSessions: assignments.dietitianSessions,
    lastActiveAt: today(),
  }
  updated = syncMembershipExpiryStatus(updated)

  const notifications = [...(updated.notifications || [])]
  if (updated.assignedCoachId && updated.assignedCoachId !== prevCoachId) {
    const coach = staffList.find((s) => s.id === updated.assignedCoachId)
    notifications.unshift({
      id: `n-${Date.now()}-coach`,
      type: 'assignment',
      title: 'Koçunuz atandı',
      message: `${coach?.name || 'Koçunuz'} artık sizinle çalışacak. Profilinizden detayları görebilirsiniz.`,
      read: false,
      createdAt: nowISO(),
    })
  }
  if (updated.assignedDietitianId && updated.assignedDietitianId !== prevDietitianId) {
    const dietitian = staffList.find((s) => s.id === updated.assignedDietitianId)
    notifications.unshift({
      id: `n-${Date.now()}-diet`,
      type: 'assignment',
      title: 'Diyetisyeniniz atandı',
      message: `${dietitian?.name || 'Diyetisyeniniz'} artık sizinle çalışacak.`,
      read: false,
      createdAt: nowISO(),
    })
  }
  updated.notifications = notifications

  await upsertMember(updated)
  await addActivity(
    'admin_premium',
    `${updated.name} için koç/diyetisyen ataması güncellendi`,
    updated.id
  )

  return { success: true, member: updated }
}

export async function deleteRowGeneric() { /* reserved */ }

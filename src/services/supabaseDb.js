// Supabase veri/auth katmanı.
// Tüm veriler Supabase üzerinden yönetilir.
import { supabase, syncAutoRefresh } from './supabaseClient'
import { setRememberMe, clearAllAuthTokens } from './authStorage'
import { ADMIN_CREDENTIALS } from '../config/brand'
import { DEFAULT_PACKAGE, isPaidMembership, getDefaultPackageForPlan, ALL_PLANS } from '../data/membershipPlans'
import { calculatePackagePrice } from './packagePricing'
import { applyStaffAssignments } from './staffAssignment'
import { computePremiumExpiresAt, syncMembershipExpiryStatus } from './premiumMembership'
import { notifyTelegram } from './telegramNotify'
import { normalizeStaffRole, staffRoleLabel } from '../utils/staffRoles'

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
    role: 'member',
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
  }
}

function rowToStaff(row) {
  return { ...(row.data || {}), id: row.id, email: row.email, name: row.name, role: row.role, active: row.active }
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
  tickets: [], activities: [], payments: [], exercises: [], requests: [], session: null,
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
function rowToRequest(row) {
  return { id: row.id, memberId: row.member_id, memberName: row.member_name, type: row.type, status: row.status, requestedUntil: row.requested_until, note: row.note, createdAt: row.created_at }
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
    color: row.color || 'sage',
    sortOrder: row.sort_order || 0,
  }
}

export async function getPlans() {
  const { data } = await supabase.from('plans').select('*').order('sort_order', { ascending: true })
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
    supabase.from('plans').select('*').order('sort_order', { ascending: true }),
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
    return { ...EMPTY_DB, staff, posts, content, exercises, plans }
  }

  const [membersRes, programsRes, ticketsRes, activitiesRes, paymentsRes, requestsRes] = await Promise.all([
    supabase.from('members').select('*'),
    supabase.from('programs').select('*').order('created_at', { ascending: false }),
    supabase.from('tickets').select('*').order('created_at', { ascending: false }),
    supabase.from('activities').select('*').order('created_at', { ascending: false }),
    supabase.from('payments').select('*').order('created_at', { ascending: false }),
    supabase.from('membership_requests').select('*').order('created_at', { ascending: false }),
  ])

  const members = (membersRes.data || []).map(rowToMember)
  const role = roleForEmail(user.email, staff)
  let session
  if (role === 'admin') session = { type: 'admin', memberId: null }
  else if (role === 'staff') {
    const me = staff.find((s) => (s.email || '').toLowerCase() === user.email.toLowerCase())
    session = { type: 'staff', staffId: me?.id || null }
  } else {
    session = { type: 'member', memberId: user.id }
  }

  return {
    version: 2,
    members,
    staff,
    programs: (programsRes.data || []).map(rowToProgram),
    posts,
    tickets: (ticketsRes.data || []).map(rowToTicket),
    activities: (activitiesRes.data || []).map(rowToActivity),
    payments: (paymentsRes.data || []).map(rowToPayment),
    exercises,
    plans,
    requests: (requestsRes.data || []).map(rowToRequest),
    session,
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
    const s = staffList.find((x) => (x.email || '').toLowerCase() === (user.email || '').toLowerCase())
    return s?.name || user.user_metadata?.name || 'Personel'
  }
  const { data } = await supabase.from('members').select('name').eq('id', user.id).maybeSingle()
  return data?.name || user.user_metadata?.name || 'Üye'
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
    email: email.trim(), password,
  })
  if (error) return { success: false, error: 'E-posta veya şifre hatalı.' }

  const { data: staffRows } = await supabase.from('staff').select('*')
  const staffList = (staffRows || []).map(rowToStaff)
  const role = roleForEmail(data.user.email, staffList)
  const displayName = await resolveActorName(data.user, role, staffList)
  const staffMember = staffList.find((s) => (s.email || '').toLowerCase() === data.user.email.toLowerCase())

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
    const role = roleForEmail(user.email, staffList)
    const displayName = await resolveActorName(user, role, staffList)
    const staffMember = staffList.find((s) => (s.email || '').toLowerCase() === user.email.toLowerCase())

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
  const expires = member.premiumExpiresAt || computePremiumExpiresAt(started, pkg.durationWeeks)
  return syncMembershipExpiryStatus({
    ...member,
    premiumStartedAt: started,
    premiumExpiresAt: expires,
    packageConfig: { ...DEFAULT_PACKAGE, ...pkg },
  })
}

async function buildAndPersistMember(profile, membership, packageConfig, opts = {}) {
  const user = await getUser()
  if (!user) return { success: false, error: 'Oturum oluşturulamadı.' }

  const schedule = profile.supportSchedule || null
  const assignedCoachId = null
  const assignedDietitianId = null
  const coachSessions = []
  const dietitianSessions = []

  // Koç/diyetisyen ve randevular admin panelinden elle atanır

  const member = withPremiumDates({
    id: user.id,
    email: user.email,
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
    notifications: [{
      id: `n-${Date.now()}`, type: 'reminder', title: 'Yeni Form’a hoş geldiniz!',
      message: 'Profiliniz hazır. Günlük görevlerinizi tamamlayarak serinizi büyütmeye başlayın.',
      read: false, createdAt: nowISO(),
    }],
    tasks: [
      { id: `t1-${Date.now()}`, type: 'water', title: 'Günlük 2L su hedefi', done: false, due: 'Bugün', progress: 0, target: 2 },
      { id: `t2-${Date.now()}`, type: 'checkin', title: 'Günlük check-in', done: false, due: 'Bugün' },
      { id: `t3-${Date.now()}`, type: 'workout', title: 'Genel hareket: 20 dk yürüyüş', done: false, due: 'Bugün' },
    ],
    progress: { weight: [], workouts: [], mood: [] },
    supportSchedule: schedule,
    availability: profile.availability || {},
    assignedCoachId,
    assignedDietitianId,
    settings: { theme: 'light', language: 'tr', emailNotifs: true, pushNotifs: true, reminderNotifs: true },
    streak: 0,
    pauseUntil: null,
  }, packageConfig, isPaidMembership(membership))

  await upsertMember(member)
  const planLabel = membership === 'free' ? 'Ücretsiz' : membership === 'gumus' ? 'Gümüş' : membership === 'altin' ? 'Altın' : membership === 'platinum' ? 'Platinum' : 'Premium'
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

// Kayıt için auth kullanıcısını hazırlar ve oturumu açar.
// İdempotent: yarım kalmış (auth var ama profil yok) kayıtları kurtarır,
// böylece "Bu e-posta zaten kayıtlı" hatasında kullanıcı kilitlenmez.
async function ensureAuthForSignup(profile) {
  const email = (profile.email || '').trim().toLowerCase()
  const password = profile.password

  // Telefon numarası zaten kullanımda mı? (aynı numarayla ikinci kayıt engellenir)
  if (profile.phone) {
    const { data: phoneTaken, error: phoneErr } = await supabase.rpc('phone_in_use', { p_phone: profile.phone })
    if (!phoneErr && phoneTaken) {
      return { success: false, error: 'Bu telefon numarası zaten kayıtlı. Lütfen farklı bir numara kullanın.' }
    }
  }

  // Mevcut (ör. admin veya önceki üye) oturumunu temizle ki signUp temiz çalışsın.
  try { await supabase.auth.signOut() } catch { /* oturum yoksa yoksay */ }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: profile.name } },
  })

  if (signUpError) {
    // E-posta zaten kayıtlı: kullanıcının kendi (yarım kalmış) hesabı olabilir → aynı şifreyle giriş dene.
    if (/registered|already|exists/i.test(signUpError.message)) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (!signInError) return { success: true }
      if (/not confirmed|confirm/i.test(signInError.message)) {
        return { success: false, error: 'Bu e-posta zaten kayıtlı ancak doğrulanmamış. Lütfen e-postanıza gelen doğrulama bağlantısına tıklayın.' }
      }
      return { success: false, error: 'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın veya farklı bir e-posta kullanın.' }
    }
    return { success: false, error: signUpError.message }
  }

  // signUp başarılı ama oturum açılmadıysa (e-posta doğrulaması açık) → giriş dene.
  if (!signUpData?.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      if (/not confirmed|confirm/i.test(signInError.message)) {
        return { success: false, error: 'Kaydınız oluşturuldu. Giriş yapmadan önce e-postanıza gelen doğrulama bağlantısına tıklayın.' }
      }
      return { success: false, error: signInError.message }
    }
  }

  return { success: true }
}

export async function register(profile, membership = 'free', packageConfig = null) {
  const auth = await ensureAuthForSignup(profile)
  if (!auth.success) return auth
  return buildAndPersistMember(profile, membership, packageConfig)
}

export async function registerWithPayment(profile, packageConfig) {
  const pricing = calculatePackagePrice(packageConfig)
  const auth = await ensureAuthForSignup(profile)
  if (!auth.success) return auth
  const res = await buildAndPersistMember(profile, 'premium', packageConfig, { payment: pricing.total })
  return res.success ? { success: true, member: res.member, pricing } : res
}

// Sabit fiyatlı yeni plan ile kayıt (Gümüş / Altın / Platinum)
export async function registerWithPlan(profile, planId, planPrice) {
  const auth = await ensureAuthForSignup(profile)
  if (!auth.success) return auth
  const packageConfig = getDefaultPackageForPlan(planId)
  const res = await buildAndPersistMember(profile, planId, packageConfig, { payment: planPrice })
  return res.success ? { success: true, member: res.member, amount: planPrice } : res
}

// --------------------------- member mutations ---------------------------
// Çoğu mutasyon: bellekteki member nesnesini düzenle + upsert et.
export async function saveMemberPatch(member, patch) {
  let updated = { ...member, ...patch, lastActiveAt: today() }
  if (isPaidMembership(updated.membership)) {
    updated = syncMembershipExpiryStatus(updated)
  }
  await upsertMember(updated)
  return updated
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

  const updated = withPremiumDates({
    ...draft,
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
export async function changeMemberPlan(member, planId, planPrice = 0) {
  if (!member) return { success: false, error: 'Üye bulunamadı.' }
  const paid = isPaidMembership(planId)
  const packageConfig = getDefaultPackageForPlan(planId)

  let draft = {
    ...member,
    membership: planId,
    membershipStatus: 'active',
    packageConfig,
    pauseUntil: null,
    lastActiveAt: today(),
  }

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
  return {
    phone: data.phone || '', specialty: data.specialty || '', bio: data.bio || '',
    photo: data.photo || null,
    workDays: data.workDays || [], workStart: data.workStart || '09:00', workEnd: data.workEnd || '17:00',
  }
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

export async function removeStaff(id) {
  await supabase.rpc('admin_delete_staff', { p_id: id })
}

// --------------------------- posts (admin) ---------------------------
export async function addPost(data) {
  const { data: row, error } = await supabase.from('posts').insert({
    published: data.published !== false,
    data: {
      title: data.title, category: data.category || 'Yaşam', excerpt: data.excerpt || '',
      author: data.author || 'Yeni Form Ekibi', readMinutes: data.readMinutes || 3,
      accent: data.accent || 'brand', content: data.content || '', createdAt: today(),
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
  await supabase.from('posts').update({
    published: merged.published !== false,
    data: { title: merged.title, category: merged.category, excerpt: merged.excerpt, author: merged.author, readMinutes: merged.readMinutes, accent: merged.accent, content: merged.content, createdAt: merged.createdAt },
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

export async function addExercise(data) {
  const { error } = await supabase.from('exercises').insert({
    name: data.name,
    description: data.description || '',
    category: data.bodyPart || data.category || 'Tüm Vücut',
    sport_type: data.sportType || 'Fitness',
    body_part: data.bodyPart || data.category || 'Tüm Vücut',
    video_url: data.videoUrl || '',
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function editExercise(id, patch) {
  const { error } = await supabase.from('exercises').update({
    name: patch.name,
    description: patch.description || '',
    category: patch.bodyPart || patch.category || 'Tüm Vücut',
    sport_type: patch.sportType || 'Fitness',
    body_part: patch.bodyPart || patch.category || 'Tüm Vücut',
    video_url: patch.videoUrl || '',
  }).eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function removeExercise(id) {
  await supabase.from('exercises').delete().eq('id', id)
}

// --------------------------- membership requests ---------------------------
export async function createMembershipRequest(member, type, requestedUntil = null, note = '') {
  const { error } = await supabase.from('membership_requests').insert({
    member_id: member.id, member_name: member.name, type, requested_until: requestedUntil || null, note,
  })
  if (error) return { success: false, error: error.message }
  await addActivity('request', `${member.name} ${type} talebi oluşturdu`, member.id)
  return { success: true }
}

export async function resolveMembershipRequest(request, approve) {
  await supabase.from('membership_requests').update({ status: approve ? 'approved' : 'rejected' }).eq('id', request.id)
  if (approve) {
    const { data: rows } = await supabase.from('members').select('*').eq('id', request.memberId).limit(1)
    const member = rows?.[0] ? rowToMember(rows[0]) : null
    if (member) {
      let patch = {}
      if (request.type === 'freeze') patch = { membershipStatus: 'paused', pauseUntil: request.requestedUntil }
      else if (request.type === 'cancel') patch = { membershipStatus: 'cancelled' }
      else if (request.type === 'resume') patch = { membershipStatus: 'active', pauseUntil: null }
      else if (request.type === 'renew') patch = { membershipStatus: 'active' }
      await upsertMember({ ...member, ...patch, lastActiveAt: today() })
    }
  }
  return { success: true }
}

// --------------------------- programs (staff/admin) ---------------------------
export async function createProgram(data) {
  const { data: row, error } = await supabase.from('programs').insert({
    member_id: data.memberId,
    staff_id: data.staffId || null,
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
          text: `"${ticket.subject}" talebinize yanıt geldi.`,
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

// --------------------------- custom_foods (topluluk besin havuzu) ---------------------------
// Türkçe metni arama/tekilleştirme için normalize eder.
function normalizeFoodName(name) {
  return String(name || '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function rowToFood(row) {
  return {
    id: row.id,
    name: row.name,
    nameNormalized: row.name_normalized,
    category: row.category || 'Diğer',
    cal100: row.cal100,
    unit: row.unit || 'porsiyon',
    unitG: row.unit_g || 100,
    source: row.source || 'ai',
    usageCount: row.usage_count || 0,
    custom: true,
  }
}

// Tüm topluluk besinlerini getirir (popülerlik sırası).
export async function getCustomFoods() {
  const { data, error } = await supabase
    .from('custom_foods')
    .select('*')
    .order('usage_count', { ascending: false })
  if (error) { console.warn('getCustomFoods:', error.message); return [] }
  return (data || []).map(rowToFood)
}

// Yeni besin ekler. Aynı isim varsa onu döndürür (tekilleştirme).
export async function addCustomFood(food) {
  const nameNormalized = normalizeFoodName(food.name)
  if (!nameNormalized) return { success: false, error: 'Geçersiz besin adı' }

  // Önce var mı diye bak (yarış koşulunda da unique index korur)
  const { data: existing } = await supabase
    .from('custom_foods')
    .select('*')
    .eq('name_normalized', nameNormalized)
    .maybeSingle()
  if (existing) return { success: true, food: rowToFood(existing), existed: true }

  const user = await getUser()
  const payload = {
    name: String(food.name).trim().slice(0, 60),
    name_normalized: nameNormalized,
    category: food.category || 'Diğer',
    cal100: Math.max(0, Math.round(Number(food.cal100) || 0)),
    unit: food.unit || 'porsiyon',
    unit_g: Math.max(1, Math.round(Number(food.unitG) || 100)),
    source: food.source || 'ai',
    created_by: user?.id || null,
  }
  const { data, error } = await supabase
    .from('custom_foods')
    .insert(payload)
    .select()
    .single()
  if (error) {
    // Unique ihlali → eşzamanlı eklenmiş olabilir, tekrar oku
    const { data: again } = await supabase
      .from('custom_foods').select('*').eq('name_normalized', nameNormalized).maybeSingle()
    if (again) return { success: true, food: rowToFood(again), existed: true }
    return { success: false, error: error.message }
  }
  return { success: true, food: rowToFood(data), existed: false }
}

// Bir besinin kullanım sayacını artırır (popülerlik).
export async function incrementFoodUsage(id) {
  if (!id) return
  await supabase.rpc('increment_food_usage', { p_id: id }).catch(() => {})
}

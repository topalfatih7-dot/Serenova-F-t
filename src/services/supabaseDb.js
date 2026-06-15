// Supabase veri/auth katmanı.
// Tüm veriler Supabase üzerinden yönetilir.
import { supabase, syncAutoRefresh } from './supabaseClient'
import { setRememberMe, clearAllAuthTokens } from './authStorage'
import { ADMIN_CREDENTIALS } from '../config/brand'
import { DEFAULT_PACKAGE } from '../data/membershipPlans'
import { calculatePackagePrice } from './packagePricing'
import { applyStaffAssignments } from './staffAssignment'
import { computePremiumExpiresAt, syncMembershipExpiryStatus } from './premiumMembership'
import { notifyTelegram } from './telegramNotify'
import { normalizeStaffRole, staffRoleLabel } from '../utils/staffRoles'

const ADMIN_EMAIL = ADMIN_CREDENTIALS.email.toLowerCase()

const today = () => new Date().toISOString().split('T')[0]
const nowISO = () => new Date().toISOString()

// --------------------------- map: row <-> object ---------------------------
const MEMBER_COLUMN_KEYS = ['id', 'email', 'name', 'membership', 'membershipStatus', 'assignedCoachId', 'assignedDietitianId', 'role', 'password']

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
  content: { testimonials: [], faqs: [], successStories: [] },
}

function rowToExercise(row) {
  return { id: row.id, name: row.name, description: row.description, category: row.category, videoUrl: row.video_url, createdAt: row.created_at }
}
function rowToRequest(row) {
  return { id: row.id, memberId: row.member_id, memberName: row.member_name, type: row.type, status: row.status, requestedUntil: row.requested_until, note: row.note, createdAt: row.created_at }
}

export async function hydrate() {
  const user = await resolveAuthUser()

  const [staffRes, postsRes, contentRes, exercisesRes] = await Promise.all([
    supabase.from('staff').select('*').order('created_at', { ascending: true }),
    supabase.from('posts').select('*').order('created_at', { ascending: false }),
    supabase.from('site_content').select('*').order('sort', { ascending: true }),
    supabase.from('exercises').select('*').order('name', { ascending: true }),
  ])

  const staff = (staffRes.data || []).map(rowToStaff)
  const posts = (postsRes.data || []).map(rowToPost)
  const exercises = (exercisesRes.data || []).map(rowToExercise)
  const content = { testimonials: [], faqs: [], successStories: [] }
  ;(contentRes.data || []).forEach((r) => {
    const item = { id: r.id, ...(r.data || {}) }
    if (r.kind === 'testimonial') content.testimonials.push(item)
    else if (r.kind === 'faq') content.faqs.push(item)
    else if (r.kind === 'success_story') content.successStories.push(item)
  })

  if (!user) {
    return { ...EMPTY_DB, staff, posts, content, exercises }
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
  if (member.membership !== 'premium') return member
  const pkg = packageConfig || member.packageConfig || DEFAULT_PACKAGE
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

  // Kadroyu çek (atama için)
  const { data: staffRows } = await supabase.from('staff').select('*')
  const staffList = (staffRows || []).map(rowToStaff)

  const schedule = profile.supportSchedule || null
  let assignedCoachId = null
  let assignedDietitianId = null
  let coachSessions = []
  let dietitianSessions = []

  let memberDraft = {
    id: user.id,
    membership,
    packageConfig: packageConfig || { ...DEFAULT_PACKAGE },
    supportSchedule: schedule,
  }

  if (membership === 'premium' && schedule) {
    const assignments = applyStaffAssignments(memberDraft, staffList, [], { autoAssign: true })
    assignedCoachId = assignments.assignedCoachId
    assignedDietitianId = assignments.assignedDietitianId
    coachSessions = assignments.coachSessions
    dietitianSessions = assignments.dietitianSessions
  }

  const member = withPremiumDates({
    id: user.id,
    email: user.email,
    name: profile.name,
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
    membership,
    membershipStatus: 'active',
    packageConfig: packageConfig || { ...DEFAULT_PACKAGE },
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
  }, packageConfig, membership === 'premium')

  await upsertMember(member)
  await addActivity('signup', `${member.name} yeni kayıt (${membership === 'premium' ? 'Premium' : 'Ücretsiz'})`, member.id)
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

// --------------------------- member mutations ---------------------------
// Çoğu mutasyon: bellekteki member nesnesini düzenle + upsert et.
export async function saveMemberPatch(member, patch) {
  let updated = { ...member, ...patch, lastActiveAt: today() }
  if (updated.membership === 'premium') {
    updated = syncMembershipExpiryStatus(updated)
  }
  await upsertMember(updated)
  return updated
}

export async function saveSupportSchedule(member, schedule) {
  const { data: staffRows } = await supabase.from('staff').select('*')
  const staffList = (staffRows || []).map(rowToStaff)
  const { data: memberRows } = await supabase.from('members').select('*')
  const members = (memberRows || []).map(rowToMember)
  const draft = { ...member, supportSchedule: schedule }
  const assignments = applyStaffAssignments(draft, staffList, members, { autoAssign: true })
  const updated = syncMembershipExpiryStatus({
    ...member,
    supportSchedule: schedule,
    ...assignments,
    lastActiveAt: today(),
  })
  await upsertMember(updated)
  return updated
}

export async function processPremiumPayment(member, packageConfig, schedule) {
  const pricing = calculatePackagePrice(packageConfig)
  const { data: staffRows } = await supabase.from('staff').select('*')
  const staffList = (staffRows || []).map(rowToStaff)
  const { data: memberRows } = await supabase.from('members').select('*')
  const members = (memberRows || []).map(rowToMember)

  const draft = {
    ...member,
    membership: 'premium',
    membershipStatus: 'active',
    packageConfig,
    supportSchedule: schedule,
  }
  const assignments = applyStaffAssignments(draft, staffList, members, { autoAssign: true })

  const updated = withPremiumDates({
    ...draft,
    ...assignments,
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

export async function addExercise(data) {
  const { error } = await supabase.from('exercises').insert({
    name: data.name, description: data.description || '', category: data.category || 'Genel', video_url: data.videoUrl || '',
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function editExercise(id, patch) {
  const { error } = await supabase.from('exercises').update({
    name: patch.name, description: patch.description || '', category: patch.category || 'Genel', video_url: patch.videoUrl || '',
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
    membership: 'premium',
    membershipStatus: member.membershipStatus || 'active',
    packageConfig: member.packageConfig || DEFAULT_PACKAGE,
    supportSchedule: schedule,
    premiumExpiresAt: member.premiumExpiresAt,
    premiumStartedAt: member.premiumStartedAt || member.joinedAt || today(),
    assignedCoachId: options.assignedCoachId !== undefined ? options.assignedCoachId : member.assignedCoachId,
    assignedDietitianId: options.assignedDietitianId !== undefined ? options.assignedDietitianId : member.assignedDietitianId,
  }

  const assignments = applyStaffAssignments(draft, staffList, members, {
    autoAssign: Boolean(options.autoAssign),
    manualCoachId: draft.assignedCoachId,
    manualDietitianId: draft.assignedDietitianId,
  })

  let updated = {
    ...draft,
    ...assignments,
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

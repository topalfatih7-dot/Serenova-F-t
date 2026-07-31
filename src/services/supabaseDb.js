// Supabase veri/auth katmanı.
// Tüm veriler Supabase üzerinden yönetilir.
import { supabase, syncAutoRefresh } from './supabaseClient'
import { setRememberMe, clearAllAuthTokens } from './authStorage'
import { normalizeEmailAddress, sanitizeEmailInput } from '../utils/emailAddress'
import { ADMIN_CREDENTIALS } from '../config/brand'
import {
  DEFAULT_PACKAGE, isPaidMembership, getDefaultPackageForPlan, ALL_PLANS, getPlanLabel,
  normalizeEntitlements, isValidPlanId, setPlanCatalog,
  sanitizeStaffForPackage,
  packageIncludesCoach, packageIncludesDietitian,
} from '../data/membershipPlans'
import { assignStaffOnly } from './staffAssignment'
import { computePremiumExpiresAt, syncMembershipExpiryStatus, getDurationMonths } from './premiumMembership'
import { notifyTelegram } from './telegramNotify'
import { notifyMemberProgram, pushMemberNotification, buildMemberNotification } from './memberNotifications'
import { buildInitialMemberNotifications } from '../data/memberNotificationTemplates'
import { normalizeStaffRole, staffRoleLabel } from '../utils/staffRoles'
import { normalizeStaffProfile, staffProfileDataPayload } from '../data/staffProfile'
import { coverForCategory } from '../utils/blogImages.js'
import { ensureUniqueBlogSlug } from '../utils/blogSlug.js'
import { getApiAuthHeaders } from './apiAuth'
import { runWithVideoUrlSlot } from '../utils/exerciseVideoLoadQueue'
import {
  dedupeExerciseVideoUrlFetch,
  readExerciseVideoUrlCache,
  writeExerciseVideoUrlCache,
} from './exerciseVideoUrlCache'
import { estimateReadMinutes } from '../utils/blogContent'
import { buildStaffApplicationPayload, applicationToStaffPayload } from '../data/staffApplication'
import { normalizeE164 } from '../data/countryCodes'
import { ageFromBirthDate } from '../utils/birthDate'
import { stripEmbeddedInstructionBlock } from '../data/exerciseTurkish'
import { getSiteUrl } from '../config/seo'
import { memberIdSet, filterByMemberIds, filterProgramsForMembers } from '../utils/memberScopedData'
import { shouldSkipExpiryPersistDuringPayment } from '../utils/stripePaymentGrace'
import { displayNameFromAuthUser, memberNeedsProfileCompletion, isSocialAuthUser, hasRegisteredMember } from '../utils/memberProfile'
import {
  syncMemberPackages,
  resolvePackagePurchase,
  migrateLegacyToPackages,
  isOneTimePlan,
  isPackageEntryActive,
  memberExpirySyncNeedsPersist,
  removeMemberPackage,
  updatePackageDuration,
  patchPackageExpiry,
  resolveTargetSubscriptionPackageId,
} from '../utils/memberPackages'
import {
  compactMembersForRole,
  extractSessionsFromMemberData,
} from '../utils/memberSessions'
import { detectExternalContactInfo, CONTACT_INFO_BLOCK_MESSAGE } from '../utils/contactInfoGuard'

const ADMIN_EMAIL = ADMIN_CREDENTIALS.email.toLowerCase()

const today = () => new Date().toISOString().split('T')[0]
const nowISO = () => new Date().toISOString()

// --------------------------- map: row <-> object ---------------------------
const MEMBER_COLUMN_KEYS = ['id', 'email', 'name', 'phone', 'membership', 'membershipStatus', 'assignedCoachId', 'assignedDietitianId', 'assignedDoctorId', 'role', 'password', '_contactHidden']

function memberData(member) {
  const data = {}
  Object.keys(member).forEach((k) => {
    if (!MEMBER_COLUMN_KEYS.includes(k)) data[k] = member[k]
  })
  // Personel görünümünde iletişim alanları zaten boş; JSONB'ye yazma
  if (member._contactHidden) {
    delete data.phone
    delete data.phoneCountry
    delete data.email
  }
  return data
}

function memberToRow(member) {
  const row = {
    id: member.id,
    name: member.name || '',
    role: member.role === 'admin' ? 'admin' : 'member',
    membership: member.membership || 'free',
    membership_status: member.membershipStatus || 'active',
    assigned_coach_id: member.assignedCoachId || null,
    assigned_dietitian_id: member.assignedDietitianId || null,
    assigned_doctor_id: member.assignedDoctorId || null,
    data: memberData(member),
    updated_at: nowISO(),
  }
  if (!member._contactHidden) {
    row.email = member.email
    row.phone = member.phone || ''
  }
  return row
}

function rowToMember(row, { contactHidden = false } = {}) {
  const data = row.data || {}
  const {
    assignedCoachId: _c,
    assignedDietitianId: _d,
    assignedDoctorId: _doc,
    ...dataRest
  } = data
  const hideContact = contactHidden || !Object.prototype.hasOwnProperty.call(row, 'email')
  const raw = {
    ...dataRest,
    id: row.id,
    email: hideContact ? '' : (row.email || ''),
    name: row.name,
    phone: hideContact ? '' : (row.phone || dataRest.phone || ''),
    membership: row.membership,
    membershipStatus: row.membership_status,
    assignedCoachId: row.assigned_coach_id ?? null,
    assignedDietitianId: row.assigned_dietitian_id ?? null,
    assignedDoctorId: row.assigned_doctor_id ?? null,
    role: row.role || dataRest.role || 'member',
  }
  if (hideContact) {
    raw.phoneCountry = ''
    raw._contactHidden = true
  }
  return syncMemberPackages(raw)
}

function rowToStaff(row) {
  const data = row.data || {}
  return normalizeStaffProfile({
    ...data,
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role || data.role || 'coach',
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
export { rowToMember, rowToStaff, rowToTicket, rowToProgram, rowToStaffApplication, rowToCorporateApplication, rowToContactInquiry }
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

/** Tam veri yenilemesi gerektiren auth olayları (TOKEN_REFRESHED hariç) */
export const AUTH_EVENTS_REQUIRING_HYDRATE = new Set([
  'INITIAL_SESSION',
  'SIGNED_IN',
  'SIGNED_OUT',
  'USER_UPDATED',
])

let hydrateInFlight = null
/** Kısa ömürlü cache — SIGNED_IN hydrate ile login reloadRemote çift turunu önler. */
let hydrateCache = null
const HYDRATE_CACHE_TTL_MS = 2500
const MEMBER_ACTIVITIES_HYDRATE_LIMIT = 50

export function invalidateHydrateCache() {
  hydrateCache = null
}

async function fetchAuthenticatedBundle(user, staff) {
  const role = roleForUser(user, staff)
  const staffMatch = findStaffMatch(user, staff)

  let members
  let programs
  let tickets
  let activities
  let payments
  let staffAppsRes = { data: [] }
  let corporateAppsRes = { data: [] }
  let contactInqRes = { data: [] }

  if (role === 'member') {
    const memberId = user.id
    const [membersRes, programsRes, ticketsRes, activitiesRes, paymentsRes] = await Promise.all([
      supabase.from('members').select('*').eq('id', memberId).maybeSingle(),
      supabase.from('programs').select('*').eq('member_id', memberId).order('created_at', { ascending: false }),
      supabase.from('tickets').select('*').eq('member_id', memberId).order('created_at', { ascending: false }),
      supabase.from('activities').select('*').eq('member_id', memberId).order('created_at', { ascending: false }).limit(MEMBER_ACTIVITIES_HYDRATE_LIMIT),
      supabase.from('payments').select('*').eq('member_id', memberId).order('created_at', { ascending: false }),
    ])
    members = membersRes.data ? [rowToMember(membersRes.data)] : []
    programs = (programsRes.data || []).map(rowToProgram)
    tickets = (ticketsRes.data || []).map(rowToTicket)
    activities = (activitiesRes.data || []).map(rowToActivity)
    payments = (paymentsRes.data || []).map(rowToPayment)
  } else {
    const membersTable = role === 'staff' ? 'members_staff_safe' : 'members'
    const [membersRes, programsRes, ticketsRes, activitiesRes, paymentsRes] = await Promise.all([
      supabase.from(membersTable).select('*'),
      supabase.from('programs').select('*').order('created_at', { ascending: false }),
      supabase.from('tickets').select('*').order('created_at', { ascending: false }),
      supabase.from('activities').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
    ])
    members = (membersRes.data || []).map((row) => rowToMember(row, { contactHidden: role === 'staff' }))
    const memberIds = memberIdSet(members)
    programs = filterProgramsForMembers((programsRes.data || []).map(rowToProgram), memberIds)
    tickets = filterByMemberIds((ticketsRes.data || []).map(rowToTicket), memberIds)
    activities = filterByMemberIds((activitiesRes.data || []).map(rowToActivity), memberIds)
    payments = filterByMemberIds((paymentsRes.data || []).map(rowToPayment), memberIds)

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
  }

  members = compactMembersForRole(members, role, staffMatch)

  return {
    members,
    programs,
    tickets,
    activities,
    payments,
    role,
    staffMatch,
    staffAppsRes,
    corporateAppsRes,
    contactInqRes,
  }
}

async function hydrateOnce() {
  const user = await resolveAuthUser()

  const [staffRes, staffDirectoryRes, postsRes, contentRes, exercisesRes, plansRes] = await Promise.all([
    // staff tablosunun ham SELECT'i artık RLS ile admin/kendi kaydına daraltılmış
    // (bkz. 20260715_staff_contact_field_hardening.sql) — email/telefon/sosyal
    // medya sızıntısını önler. Herkese güvenli alanlar staff_directory'den gelir.
    supabase.from('staff').select('*').order('created_at', { ascending: true }),
    supabase.from('staff_directory').select('*').order('created_at', { ascending: true }),
    supabase.from('posts').select('*').order('created_at', { ascending: false }),
    supabase.from('site_content').select('*').order('sort', { ascending: true }),
    supabase.from('exercises').select('id', { count: 'exact', head: true }),
    supabase.from('plans').select('*').order('sort_order', { ascending: true }),
  ])

  // Güvenli temel liste (herkes) + erişimi olanlarda (admin/kendi kaydı) tam veriyle üzerine yaz.
  const staffById = new Map()
  ;(staffDirectoryRes.data || []).forEach((row) => staffById.set(row.id, rowToStaff(row)))
  ;(staffRes.data || []).forEach((row) => staffById.set(row.id, rowToStaff(row)))
  const staff = Array.from(staffById.values())
  const posts = (postsRes.data || []).map(rowToPost)
  const exerciseCount = exercisesRes.count ?? 0
  const exercises = []
  const allPlansFromDb = plansRes.data?.length ? plansRes.data.map(rowToPlan) : null
  setPlanCatalog(allPlansFromDb || ALL_PLANS)
  const content = { testimonials: [], faqs: [], successStories: [], exerciseTaxonomy: null }
  ;(contentRes.data || []).forEach((r) => {
    const item = { id: r.id, ...(r.data || {}) }
    if (r.kind === 'testimonial') content.testimonials.push(item)
    else if (r.kind === 'faq') content.faqs.push(item)
    else if (r.kind === 'success_story') content.successStories.push(item)
    else if (r.kind === 'exercise_taxonomy') content.exerciseTaxonomy = { id: r.id, ...item }
  })

  if (!user) {
    const publicPlans = allPlansFromDb
      ? allPlansFromDb.filter((p) => p.isActive !== false)
      : ALL_PLANS
    return { ...EMPTY_DB, staff, posts, content, exercises, exerciseCount, plans: publicPlans, authUser: null }
  }

  const authUser = {
    id: user.id,
    email: (user.email || '').toLowerCase(),
    name: displayNameFromAuthUser(user),
    identities: user.identities || [],
    app_metadata: user.app_metadata || {},
  }

  const {
    members: initialMembers,
    programs,
    tickets,
    activities,
    payments,
    role,
    staffMatch,
    staffAppsRes,
    corporateAppsRes,
    contactInqRes,
  } = await fetchAuthenticatedBundle(user, staff)

  let members = initialMembers
  let session
  if (role === 'admin') session = { type: 'admin', memberId: null, email: authUser.email }
  else if (role === 'staff') {
    session = { type: 'staff', staffId: staffMatch?.id || null, email: authUser.email }
  } else {
    session = { type: 'member', memberId: user.id, email: authUser.email }
    const meIdx = members.findIndex((m) => m.id === user.id)
    if (meIdx >= 0 && !shouldSkipExpiryPersistDuringPayment()) {
      const before = members[meIdx]
      const synced = syncMembershipExpiryStatus(before)
      if (memberExpirySyncNeedsPersist(before, synced)) {
        await upsertMember(synced)
        members = members.map((m, i) => (i === meIdx ? synced : m))
      }
    }
  }

  // Admin: tüm planlar (pasif dahil); diğerleri yalnızca aktif
  const plans = allPlansFromDb
    ? (role === 'admin' ? allPlansFromDb : allPlansFromDb.filter((p) => p.isActive !== false))
    : ALL_PLANS

  return {
    version: 2,
    members,
    staff,
    programs,
    posts,
    tickets,
    activities,
    payments,
    exercises,
    exerciseCount,
    plans,
    staffApplications: (staffAppsRes.data || []).map(rowToStaffApplication),
    corporateApplications: (corporateAppsRes.data || []).map(rowToCorporateApplication),
    contactInquiries: (contactInqRes.data || []).map(rowToContactInquiry),
    session,
    authUser,
    content,
  }
}

/**
 * @param {{ force?: boolean }} [opts]
 * force=true: cache atlanır (mutasyon / logout sonrası).
 * force=false: uçuştaki hydrate’e katılır veya kısa TTL cache döner.
 */
export async function hydrate({ force = false } = {}) {
  if (hydrateInFlight) {
    const shared = await hydrateInFlight
    if (!force) return shared
  } else if (!force && hydrateCache && (Date.now() - hydrateCache.at) < HYDRATE_CACHE_TTL_MS) {
    return hydrateCache.data
  }

  if (force) invalidateHydrateCache()

  if (hydrateInFlight) return hydrateInFlight

  hydrateInFlight = hydrateOnce()
    .then((data) => {
      hydrateCache = { data, at: Date.now(), userId: data?.authUser?.id || null }
      return data
    })
    .finally(() => { hydrateInFlight = null })

  return hydrateInFlight
}

/** Tek üyenin randevu dizileri — admin/staff listede strip edilmişse lazy load için. */
export async function fetchMemberSessions(memberId) {
  let { data, error } = await supabase.from('members').select('data').eq('id', memberId).maybeSingle()
  if (error || !data) {
    ;({ data, error } = await supabase.from('members_staff_safe').select('data').eq('id', memberId).maybeSingle())
  }
  if (error || !data) {
    return { coachSessions: [], dietitianSessions: [], doctorSessions: [] }
  }
  return extractSessionsFromMemberData(data.data || {})
}

/** Admin seans sayfası — yalnızca randevu alanları (tüm üye blob'u context'e alınmaz). */
export async function fetchAdminSessionSummaries() {
  const { data, error } = await supabase
    .from('members')
    .select('id, name, membership, membership_status, data')
  if (error) return []
  return (data || []).flatMap((row) => {
    if (!isPaidMembership(row.membership) || row.membership_status !== 'active') return []
    const sessions = extractSessionsFromMemberData(row.data || {})
    const name = row.name || ''
    return [
      ...(sessions.coachSessions || []).map((s) => ({ ...s, memberName: name, sessionType: 'Koç' })),
      ...(sessions.dietitianSessions || []).map((s) => ({ ...s, memberName: name, sessionType: 'Diyetisyen' })),
      ...(sessions.doctorSessions || []).map((s) => ({ ...s, memberName: name, sessionType: 'Doktor' })),
    ]
  })
}

const EMPTY_DB = {
  version: 2, members: [], staff: [], programs: [], posts: [],
  tickets: [], activities: [], payments: [], exercises: [], exerciseCount: 0, staffApplications: [], corporateApplications: [], contactInquiries: [], session: null,
  content: { testimonials: [], faqs: [], successStories: [], exerciseTaxonomy: null },
}

export function rowToExercise(row) {
  return {
    id: row.id,
    name: row.name,
    description: stripEmbeddedInstructionBlock(row.description),
    category: row.body_part || row.category || 'Tüm Vücut',
    sportType: row.sport_type || 'Fitness',
    bodyPart: row.body_part || row.category || 'Tüm Vücut',
    videoUrl: normalizeExerciseVideoRef(row.video_url),
    videoPending: row.video_pending === true,
    sourcePack: row.source_pack || '',
    sourceId: row.source_id || '',
    equipment: row.equipment || '',
    targetMuscle: row.target_muscle || '',
    secondaryMuscles: row.secondary_muscles || [],
    difficulty: row.difficulty || 'beginner',
    movementCategory: row.movement_category || '',
    instructions: Array.isArray(row.instructions) ? row.instructions : [],
    locations: Array.isArray(row.locations) ? row.locations : [],
    requiresMachine: row.requires_machine === true,
    metadata: row.metadata || {},
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
  const knownSellable = ['eko_diyet', 'diyet', 'eko_spor', 'spor', 'doktor', 'vip']
  // Kolon yoksa: bilinen satılanlar veya fiyatı olan dinamik paketler satılabilir
  const isSellable = row.is_sellable == null
    ? (knownSellable.includes(row.id) || (row.id !== 'free' && Number(row.price) > 0))
    : row.is_sellable === true
  const entRaw = row.entitlements
  const hasEnt = entRaw && typeof entRaw === 'object' && Object.keys(entRaw).length > 0
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
    icon: row.icon || null,
    emoji: row.emoji || null,
    isSellable,
    billingType: row.billing_type === 'one_time'
      ? 'one_time'
      : (row.id === 'doktor' ? 'one_time' : 'recurring'),
    entitlements: hasEnt ? normalizeEntitlements(entRaw) : normalizeEntitlements({}),
    sortOrder: row.sort_order || 0,
  }
}

export async function getPlans({ includeInactive = false } = {}) {
  let q = supabase.from('plans').select('*').order('sort_order', { ascending: true })
  if (!includeInactive) q = q.eq('is_active', true)
  const { data } = await q
  if (!data || data.length === 0) return ALL_PLANS
  const plans = data.map(rowToPlan)
  setPlanCatalog(plans)
  return plans
}

export async function upsertPlan(plan) {
  if (!isValidPlanId(plan.id) && plan.id !== 'free') {
    throw new Error('Geçersiz plan ID. Küçük harf, rakam ve alt çizgi kullanın.')
  }
  const billingType = plan.billingType === 'one_time' ? 'one_time' : 'recurring'
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
    icon: plan.icon || null,
    emoji: plan.emoji || null,
    is_sellable: plan.isSellable === true,
    billing_type: billingType,
    entitlements: normalizeEntitlements(plan.entitlements || {}),
    sort_order: Number(plan.sortOrder) || 0,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })
  if (error) throw error
}

/** Soft-delete: is_active=false, is_sellable=false. Hard delete yalnızca üye yoksa. */
export async function deletePlan(planId, { hard = false } = {}) {
  if (!planId || planId === 'free') throw new Error('Bu plan silinemez.')

  if (hard) {
    const { count: memCount, error: memErr } = await supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('membership', planId)
    if (memErr) throw memErr
    if ((memCount || 0) > 0) {
      throw new Error('Bu pakete sahip üyeler var — yalnızca pasife alınabilir.')
    }
    const { error } = await supabase.from('plans').delete().eq('id', planId)
    if (error) throw error
    return { hard: true }
  }

  const { error } = await supabase.from('plans').update({
    is_active: false,
    is_sellable: false,
    updated_at: new Date().toISOString(),
  }).eq('id', planId)
  if (error) throw error
  return { hard: false }
}

// --------------------------- persistence helpers ---------------------------
async function upsertMember(member) {
  const { error } = await supabase.from('members').upsert(memberToRow(member), { onConflict: 'id' })
  if (error) throw error
}

// Var olan üyeyi GÜNCELLER (upsert değil) — staff/diyetisyen yamaları
// members_update RLS politikasını kullanır (members_insert WITH CHECK'e takılmaz).
async function updateMemberRow(member) {
  const row = memberToRow(member)
  const { data, error } = await supabase
    .from('members')
    .update(row)
    .eq('id', member.id)
    .select('id')
  if (error) throw error
  if (!data || data.length === 0) {
    // RLS satırı gizlediyse veya id yoksa 0 satır döner — sessiz başarısızlığı yakala
    throw new Error('Üye güncellenemedi (yetki veya kayıt yok).')
  }
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
export async function login(email, password, remember = false, turnstileToken = '') {
  setRememberMe(remember)
  if (!remember) {
    clearAllAuthTokens()
  }
  syncAutoRefresh(remember)

  const cleanEmail = sanitizeEmailInput(email)
  const user = await authenticatePasswordUser(cleanEmail, password, turnstileToken)
  if (!user.ok) return { success: false, error: user.error }

  /* Role için hafif sorgu; activity/telegram UI dönüşünü bloklamaz */
  const role = await resolveLoginRole(user.user)
  void recordLoginSideEffects(user.user, role)

  return { success: true, role, remember }
}

async function authenticatePasswordUser(cleanEmail, password, turnstileToken) {
  try {
    const loginRes = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'password-login',
        email: cleanEmail,
        password,
        turnstileToken: turnstileToken || '',
      }),
    })
    const loginData = await loginRes.json().catch(() => ({}))
    if (!loginRes.ok || !loginData.ok || !loginData.session?.access_token) {
      if (loginRes.status === 429) {
        return { ok: false, error: loginData.error || 'Çok fazla deneme. Lütfen sonra tekrar deneyin.' }
      }
      if (loginData.error && /bot|doğrulama|turnstile/i.test(loginData.error)) {
        return { ok: false, error: loginData.error }
      }
      return { ok: false, error: loginData.error || 'E-posta veya şifre hatalı.' }
    }
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: loginData.session.access_token,
      refresh_token: loginData.session.refresh_token,
    })
    if (sessionError || !sessionData?.user) {
      return { ok: false, error: 'Oturum açılamadı. Lütfen tekrar deneyin.' }
    }
    return { ok: true, user: sessionData.user }
  } catch {
    /* API yoksa (yalnızca Vite) klasik girişe düş — production’da /api/auth zorunlu */
    if (import.meta.env.PROD) {
      return { ok: false, error: 'Giriş servisine ulaşılamadı. Sayfayı yenileyip tekrar deneyin.' }
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
      options: turnstileToken ? { captchaToken: turnstileToken } : undefined,
    })
    if (error || !data?.user) return { ok: false, error: 'E-posta veya şifre hatalı.' }
    return { ok: true, user: data.user }
  }
}

/** Admin e-posta veya kendi staff satırı — tam staff tablosu çekmez. */
async function resolveLoginRole(user) {
  if (!user) return 'member'
  const e = (user.email || '').toLowerCase()
  if (e === ADMIN_EMAIL) return 'admin'
  const [byIdRes, byEmailRes] = await Promise.all([
    supabase.from('staff').select('id').eq('id', user.id).maybeSingle(),
    e
      ? supabase.from('staff').select('id').eq('email', e).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  if (byIdRes.data || byEmailRes.data) return 'staff'
  return 'member'
}

async function recordLoginSideEffects(user, role) {
  try {
    const { data: staffRows } = await supabase.from('staff').select('*')
    const staffList = (staffRows || []).map(rowToStaff)
    const resolvedRole = role || roleForUser(user, staffList)
    const displayName = await resolveActorName(user, resolvedRole, staffList)
    const staffMember = findStaffMatch(user, staffList)

    const loginText = resolvedRole === 'admin'
      ? `${displayName} (Admin) giriş yaptı`
      : resolvedRole === 'staff'
        ? `${displayName} (${staffRoleLabel(staffMember?.role)}) giriş yaptı`
        : `${displayName} giriş yaptı`

    await addActivity('login', loginText, resolvedRole === 'member' ? user.id : null)

    if (resolvedRole === 'admin') {
      notifyTelegram('admin_login', { name: displayName, email: user.email })
    } else if (resolvedRole === 'staff') {
      notifyTelegram('staff_login', {
        name: displayName,
        email: user.email,
        role: staffRoleLabel(staffMember?.role),
      })
    } else {
      notifyTelegram('member_login', { name: displayName, email: user.email })
    }
  } catch {
    /* yan etki — giriş başarısını etkilemez */
  }
}

export async function logout() {
  invalidateHydrateCache()
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
  // Ücretli üyelik satırı yalnızca Stripe webhook / admin (service_role) ile oluşur.
  if (isPaidMembership(membership)) {
    return {
      success: false,
      error: 'Ücretli paketler yalnızca güvenli ödeme (Stripe) ile açılır.',
    }
  }

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
    phone: profile.phone ? normalizeE164(profile.phone) : '',
    birthDate: profile.birthDate || '',
    age: profile.birthDate ? ageFromBirthDate(profile.birthDate) : profile.age,
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
    freeTrialExpiresAt: null,
    packageConfig: packageConfig || getDefaultPackageForPlan(membership),
    joinedAt: today(),
    lastActiveAt: today(),
    coachSessions,
    dietitianSessions,
    doctorSessions,
    notifications: buildInitialMemberNotifications(),
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
    settings: { theme: 'light', language: 'tr', emailNotifs: true, pushNotifs: true, soundNotifs: true, reminderNotifs: true, whatsappNotifs: true },
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

  await clearPendingRegistrationMetadata()

  return { success: true, member }
}

async function unlockSignupSession(email, password, { turnstileToken = '', authSessionToken = '', userId = '' } = {}) {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'unlock-signup',
        email,
        password,
        turnstileToken: turnstileToken || '',
        authSessionToken: authSessionToken || '',
        userId: userId || '',
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.ok) return { success: true }
    if (res.status === 503) {
      return { success: false, error: data.error, unlockUnavailable: true }
    }
    if (data.error && /bot|doğrulama/i.test(data.error)) {
      return { success: false, error: data.error, unlockUnavailable: true }
    }
  } catch {
    /* ağ hatası — aşağıda doğrudan giriş denenecek */
  }
  return { success: false }
}

async function setSessionFromApiLogin(email, password, { turnstileToken = '', authSessionToken = '' } = {}) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'password-login',
      email,
      password,
      turnstileToken: turnstileToken || '',
      authSessionToken: authSessionToken || '',
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.session?.access_token) {
    return { ok: false, status: res.status, error: data.error || '' }
  }
  const { error } = await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
  if (error) return { ok: false, status: 500, error: error.message }
  return { ok: true }
}

async function signInAfterSignup(email, password, { turnstileToken = '', authSessionToken = '', userId = '' } = {}) {
  const creds = { turnstileToken, authSessionToken, userId }
  const mapErr = (msg) => {
    const m = String(msg || '')
    if (/captcha/i.test(m)) {
      return 'Bot doğrulaması gerekli. Kutuyu yenileyip tekrar deneyin.'
    }
    return m
  }

  try {
    /* E-posta onayı + CAPTCHA’sız oturum: önce unlock, sonra auth-session login */
    if (authSessionToken) {
      await unlockSignupSession(email, password, creds)
      const viaSession = await setSessionFromApiLogin(email, password, creds)
      if (viaSession.ok) return { success: true }
    }

    const viaApi = await setSessionFromApiLogin(email, password, creds)
    if (viaApi.ok) return { success: true }

    if (/bot|doğrulama|captcha/i.test(viaApi.error || '') && !authSessionToken) {
      return { success: false, error: mapErr(viaApi.error) }
    }

    const unlocked = await unlockSignupSession(email, password, creds)
    if (unlocked.success) {
      const retry = await setSessionFromApiLogin(email, password, {
        ...creds,
        /* Unlock sonrası Turnstile tüketilmiş olabilir; auth-session yeterli */
        turnstileToken: '',
      })
      if (retry.ok) return { success: true }
      return { success: false, error: mapErr(retry.error) || 'Oturum açılamadı.' }
    }
    if (unlocked.unlockUnavailable) {
      return { success: false, error: mapErr(unlocked.error) }
    }

    if (!import.meta.env.PROD) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: turnstileToken ? { captchaToken: turnstileToken } : undefined,
      })
      if (!signInError) return { success: true }
      if (/not confirmed|confirm/i.test(signInError.message)) {
        return {
          success: false,
          error: 'Kayıt oluşturuldu ancak oturum açılamadı. Lütfen giriş yapmayı deneyin veya destek ile iletişime geçin.',
        }
      }
      return { success: false, error: mapErr(signInError.message) }
    }

    return {
      success: false,
      error: mapErr(viaApi.error) || 'Kayıt oluşturuldu ancak oturum açılamadı. Lütfen giriş yapmayı deneyin.',
    }
  } catch {
    if (!import.meta.env.PROD) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: turnstileToken ? { captchaToken: turnstileToken } : undefined,
      })
      if (!signInError) return { success: true }
      return { success: false, error: mapErr(signInError.message) }
    }
    return { success: false, error: 'Giriş servisine ulaşılamadı.' }
  }
}

// Kayıt için auth kullanıcısını hazırlar ve oturumu açar (members kaydı oluşturmaz).
export async function ensureAuthForRegistration(profile) {
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

  const turnstileToken = profile.turnstileToken || ''

  // GoTrue HIBP (sızmış şifre) kaydı engellemesin diye service-role RPC ile oluştur
  try {
    const signupRes = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'signup',
        email,
        password,
        name: profile.name || '',
        turnstileToken,
      }),
    })
    const signupData = await signupRes.json().catch(() => ({}))
    if (signupRes.ok && signupData.ok) {
      /* Signup siteverify token’ı yaktı — oturum authSessionToken / dönen session ile açılır */
      if (signupData.session?.access_token && signupData.session?.refresh_token) {
        const { error: sessErr } = await supabase.auth.setSession({
          access_token: signupData.session.access_token,
          refresh_token: signupData.session.refresh_token,
        })
        if (!sessErr) return { success: true, alreadyRegistered: Boolean(signupData.alreadyRegistered) }
      }
      const signIn = await signInAfterSignup(email, password, {
        turnstileToken: '',
        authSessionToken: signupData.authSessionToken || '',
        userId: signupData.userId || '',
      })
      if (signIn.success) return { success: true, alreadyRegistered: Boolean(signupData.alreadyRegistered) }
      return { success: false, error: signIn.error || 'Kayıt oluştu ancak giriş yapılamadı. Lütfen giriş sayfasından deneyin.' }
    }
    if (signupData.error === 'already_registered' || signupRes.status === 409) {
      /* Yanık Turnstile ile otomatik giriş deneme — captcha döngüsü yaratır */
      return {
        success: false,
        code: 'ALREADY_REGISTERED',
        error: signupData.message
          || 'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın veya şifrenizi sıfırlayın.',
      }
    }
    if (signupData.error) {
      return { success: false, error: signupData.error }
    }
    if (import.meta.env.PROD) {
      return { success: false, error: 'Kayıt servisine ulaşılamadı. Sayfayı yenileyip tekrar deneyin.' }
    }
  } catch {
    if (import.meta.env.PROD) {
      return { success: false, error: 'Kayıt servisine ulaşılamadı. Sayfayı yenileyip tekrar deneyin.' }
    }
    /* API yoksa (yalnızca Vite) klasik signUp’a düş */
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: profile.name },
      emailRedirectTo,
      ...(turnstileToken ? { captchaToken: turnstileToken } : {}),
    },
  })

  if (signUpError) {
    if (/captcha/i.test(signUpError.message)) {
      return {
        success: false,
        error: 'Bot doğrulaması gerekli. Kutuyu yenileyip tekrar deneyin.',
      }
    }
    if (/validate email|invalid format|invalid email/i.test(signUpError.message)) {
      return { success: false, error: 'Geçerli bir e-posta adresi girin (ör. ad@site.com). Boşluk veya geçersiz karakter olmamalı.' }
    }
    if (/registered|already|exists/i.test(signUpError.message)) {
      return {
        success: false,
        code: 'ALREADY_REGISTERED',
        error: 'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın veya şifrenizi sıfırlayın.',
      }
    }
    if (/known to be weak|easy to guess|pwned|leaked|hibp|weak.?password/i.test(signUpError.message)) {
      return {
        success: false,
        error: 'Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter içermelidir.',
      }
    }
    return { success: false, error: signUpError.message }
  }

  if (!signUpData?.session) {
    const signIn = await signInAfterSignup(email, password, { turnstileToken })
    if (!signIn.success) return signIn
  }

  return { success: true }
}

/** Stripe öncesi profil + plan bilgisini auth metadata'da saklar (webhook üye oluşturur). */
export async function savePendingRegistrationMetadata(profile, membership, durationMonths = 1) {
  const user = await getUser()
  if (!user) return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }

  const { error } = await supabase.auth.updateUser({
    data: {
      pending_registration: {
        name: (profile.name || '').trim(),
        phone: profile.phone || '',
        phoneCountry: profile.phoneCountry || '',
        gender: profile.gender || '',
        membership: membership || 'free',
        durationMonths: Number(durationMonths) || 1,
        fitnessLevel: profile.fitnessLevel || 'beginner',
        savedAt: new Date().toISOString(),
      },
    },
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

async function clearPendingRegistrationMetadata() {
  try {
    await supabase.auth.updateUser({ data: { pending_registration: null } })
  } catch {
    /* yoksay */
  }
}

export async function register(profile, membership = 'free', packageConfig = null) {
  const auth = await ensureAuthForRegistration(profile)
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
    return { success: false, error: 'Telefon numarası gerekli.' }
  }

  if (!profile.gender || !['female', 'male'].includes(profile.gender)) {
    return { success: false, error: 'Cinsiyet seçimi zorunludur — Kadın veya Erkek seçin.' }
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
  if (!member && isSocialAuthUser(authUser)) {
    return `/onboarding?oauth=1&plan=${encodeURIComponent(plan)}`
  }
  if (!hasRegisteredMember(member) && isSocialAuthUser(authUser)) {
    return `/onboarding?oauth=1&plan=${encodeURIComponent(plan)}`
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

export async function registerWithPayment() {
  return {
    success: false,
    error: 'Ücretli kayıt yalnızca Stripe Checkout ile yapılır. Bu istemci yolu kapatıldı.',
  }
}

// Sabit fiyatlı plan ile kayıt (süre ay cinsinden)
export async function registerWithPlan(profile, planId, planPrice, durationMonths = 1) {
  // Ücretli üyelik yalnızca Stripe webhook / admin (service_role). İstemci yolu kapalı.
  if (isPaidMembership(planId)) {
    return {
      success: false,
      error: 'Ücretli paketler yalnızca güvenli ödeme (Stripe) ile açılır. Lütfen ödeme adımını kullanın.',
    }
  }
  const auth = await ensureAuthForRegistration(profile)
  if (!auth.success) return auth
  const months = Number(durationMonths) || 1
  const packageConfig = getDefaultPackageForPlan(planId, months)
  const res = await buildAndPersistMember(profile, planId, packageConfig, { payment: planPrice })
  return res.success ? { success: true, member: res.member, amount: planPrice } : res
}

// --------------------------- member mutations ---------------------------
// Çoğu mutasyon: bellekteki member nesnesini düzenle + upsert et.
// E-posta / telefon / cinsiyet kayıt sonrası istemciden değiştirilemez.
export async function saveMemberPatch(member, patch) {
  let updated = { ...member, ...patch, lastActiveAt: today() }

  // Kimlik alanları kilitli (personel görünümünde iletişim gizli — boş yazma)
  if (member._contactHidden) {
    delete updated.email
    delete updated.phone
    delete updated.phoneCountry
    updated._contactHidden = true
  } else {
    updated.email = member.email
    if (member.phone) {
      updated.phone = member.phone
      if (member.phoneCountry) updated.phoneCountry = member.phoneCountry
    } else if (patch.phone != null && patch.phone !== '') {
      updated.phone = normalizeE164(patch.phone)
    }
  }
  if (member.gender) {
    updated.gender = member.gender
  }

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
  await updateMemberRow(updated)
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

export async function processPremiumPayment() {
  return {
    success: false,
    error: 'Premium yükseltme yalnızca Stripe Checkout ile yapılır. Bu istemci yolu kapatıldı.',
  }
}

// Mevcut üyenin planını değiştirir (yeni kayıt OLUŞTURMAZ).
// Ücretli plan → yalnızca Stripe webhook / admin (istemci engelli).
// Ücretsiz plan → premium bilgileri temizlenir.
export async function changeMemberPlan(member, planId, planPrice = 0, durationMonths = 1) {
  if (!member) return { success: false, error: 'Üye bulunamadı.' }
  if (isPaidMembership(planId)) {
    return {
      success: false,
      error: 'Ücretli paket değişikliği yalnızca Stripe ödeme ile yapılır.',
    }
  }
  void planPrice
  void durationMonths

  let draft = syncMemberPackages({ ...member })
  draft = {
    ...draft,
    activePackages: [],
    membership: 'free',
    membershipStatus: 'active',
    packageConfig: DEFAULT_PACKAGE,
    premiumStartedAt: null,
    premiumExpiresAt: null,
    freeTrialExpiresAt: null,
  }

  draft = sanitizeStaffForPackage(draft.packageConfig, draft)
  draft.lastActiveAt = today()
  await upsertMember(draft)
  await addActivity('plan_change', `${member.name} planını free olarak değiştirdi`, member.id)

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

/** Stripe webhook idempotency — ödeme tamamlandı mı */
export async function findStripePaymentBySession(sessionId) {
  if (!sessionId || !supabase) return null
  const { data, error } = await supabase
    .from('payments')
    .select('id, member_id, data')
    .filter('data->>stripeSessionId', 'eq', sessionId)
    .maybeSingle()
  if (error) return null
  return data
}

/** Self-servis randevu: bir personelin dolu başlangıç saatleri (ISO) */
export async function getStaffBookedSlots(staffId, type, fromISO, toISO) {
  if (!staffId) return []
  const { data, error } = await supabase.rpc('staff_booked_slots', {
    p_staff_id: staffId,
    p_type: type,
    p_from: fromISO,
    p_to: toISO,
  })
  if (error) return []
  return (data || []).map((d) => new Date(d).toISOString())
}

/** Self-servis randevu: çakışmasız talep oluşturur (pending; personel onayı gerekir) */
export async function bookStaffSession(type, startsAtISO, duration = 30) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return { success: false, error: 'Oturum gerekli.' }

  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'book-session',
        type,
        startsAt: startsAtISO,
        duration,
      }),
    })
    const json = await res.json()
    if (!json.ok) return { success: false, error: json.error || 'Randevu oluşturulamadı.' }
    return { success: true, session: json.session }
  } catch (e) {
    return { success: false, error: String(e.message || e) }
  }
}

/** Personel: pending randevu onay / red */
export async function respondStaffSession({ memberId, sessionId, sessionType, decision }) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return { success: false, error: 'Oturum gerekli.' }

  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'respond-session',
        memberId,
        sessionId,
        sessionType,
        decision,
      }),
    })
    const json = await res.json()
    if (!json.ok) return { success: false, error: json.error || 'İşlem başarısız.' }
    return { success: true, session: json.session }
  } catch (e) {
    return { success: false, error: String(e.message || e) }
  }
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
  const { data: existingRows } = await supabase.from('posts').select('id, data')
  const existingPosts = (existingRows || []).map(rowToPost)
  const slug = data.slug || ensureUniqueBlogSlug(data.title, existingPosts)
  const { data: row, error } = await supabase.from('posts').insert({
    published: data.published !== false,
    data: {
      title: data.title,
      slug,
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
  const { data: existingRows } = await supabase.from('posts').select('id, data')
  const existingPosts = (existingRows || []).map(rowToPost)
  const slug = merged.slug || ensureUniqueBlogSlug(merged.title, existingPosts, id)
  const cover = merged.coverImage
    ? { coverImage: merged.coverImage, coverImageAlt: merged.coverImageAlt || merged.title || '' }
    : coverForCategory(category)
  await supabase.from('posts').update({
    published: merged.published !== false,
    data: {
      title: merged.title,
      slug,
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
      memberId: member?.id || null,
      duration: data.duration || '',
      highlight: data.highlight || '',
      story: String(data.story || '').slice(0, 2000),
      consent: true,
      approved: false,
    },
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// --------------------------- exercises (library) ---------------------------
// exercise-videos bucket'i private: yukleme sadece storage path'i doner,
// gercek dosya asla kalici public URL olarak saklanmaz. Oynatma anlik
// imzali URL uzerinden yapilir (bkz. getExerciseVideoUrl).
export async function uploadExerciseVideo(file) {
  const ext = (file.name?.split('.').pop() || 'mp4').toLowerCase()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('exercise-videos').upload(path, file, {
    cacheControl: '3600', upsert: false, contentType: file.type || 'video/mp4',
  })
  if (error) return { success: false, error: error.message }
  return { success: true, url: path }
}

/** Storage path veya eski tam URL'den exercise-videos dosya adini cikarir. */
export function normalizeExerciseVideoRef(value) {
  if (!value) return ''
  const trimmed = String(value).trim()
  if (!/^https?:\/\//.test(trimmed)) return trimmed.split('?')[0]
  const markers = [
    '/object/public/exercise-videos/',
    '/object/sign/exercise-videos/',
    '/object/authenticated/exercise-videos/',
  ]
  for (const marker of markers) {
    const idx = trimmed.indexOf(marker)
    if (idx !== -1) return trimmed.slice(idx + marker.length).split('?')[0]
  }
  if (trimmed.includes('/exercise-videos/')) {
    return trimmed.split('/exercise-videos/').pop().split('?')[0]
  }
  return trimmed
}

/** exercise-videos bucket'indaki gecerli dosya adi mi? */
export function isExerciseVideoStoragePath(value) {
  const path = normalizeExerciseVideoRef(value)
  return Boolean(path && /^[\w.-]+$/.test(path) && !path.includes('..'))
}

/** exercise-thumbs public bucket'ından statik kapak URL'i (imzalama yok). */
export function getExerciseThumbUrl(videoRef) {
  const path = normalizeExerciseVideoRef(videoRef)
  if (!isExerciseVideoStoragePath(path) || !supabase) return null
  const thumbPath = path.replace(/\.\w+$/, '.webp')
  const { data } = supabase.storage.from('exercise-thumbs').getPublicUrl(thumbPath)
  return data?.publicUrl || null
}

async function signExerciseVideoPathViaApi(storagePath) {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({ action: 'exercise-video-url', path: storagePath }),
    })
    const json = await res.json().catch(() => ({}))
    if (json.ok && json.url) {
      writeExerciseVideoUrlCache(storagePath, json.url, json.expiresAt)
      return json.url
    }
    return null
  } catch {
    return null
  }
}

async function signExerciseVideoPathViaClient(storagePath) {
  let { data } = await supabase.auth.getSession()
  if (!data?.session) {
    await supabase.auth.getUser()
    ;({ data } = await supabase.auth.getSession())
  }
  if (!data?.session) return null

  const { data: signData, error } = await supabase.storage
    .from('exercise-videos')
    .createSignedUrl(storagePath, 900)
  if (!error && signData?.signedUrl) {
    writeExerciseVideoUrlCache(storagePath, signData.signedUrl, Date.now() + 900 * 1000)
    return signData.signedUrl
  }
  return null
}

async function signExerciseVideoPathRaw(storagePath) {
  // Client-first: RLS authenticated read var → Vercel /api/auth hop'unu atla.
  // API fallback: client imza başarısızsa (policy/session) service-role yolu.
  return (await signExerciseVideoPathViaClient(storagePath))
    || (await signExerciseVideoPathViaApi(storagePath))
}

/** Sayfa/thumbnail için toplu imzalı URL — tek HTTP turu, önbelleğe yazar. */
export async function prefetchExerciseVideoUrls(paths = []) {
  if (!supabase || !Array.isArray(paths) || paths.length === 0) return

  const unique = [...new Set(
    paths
      .map((path) => normalizeExerciseVideoRef(path))
      .filter((path) => isExerciseVideoStoragePath(path)),
  )]
  const missing = unique.filter((path) => !readExerciseVideoUrlCache(path))
  if (!missing.length) return

  const CHUNK = 24
  const expiresAt = Date.now() + 900 * 1000

  for (let i = 0; i < missing.length; i += CHUNK) {
    const chunk = missing.slice(i, i + CHUNK)
    await runWithVideoUrlSlot(async () => {
      // Client-first batch (RLS); API yalnızca kalan path'ler için.
      try {
        let { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData?.session) {
          await supabase.auth.getUser()
          ;({ data: sessionData } = await supabase.auth.getSession())
        }
        if (sessionData?.session) {
          const { data: signed, error } = await supabase.storage
            .from('exercise-videos')
            .createSignedUrls(chunk, 900)
          if (!error && Array.isArray(signed)) {
            signed.forEach((entry) => {
              if (entry?.path && entry?.signedUrl && !entry.error) {
                writeExerciseVideoUrlCache(entry.path, entry.signedUrl, expiresAt)
              }
            })
          }
        }
      } catch {
        /* client batch başarısız — API'ye düş */
      }

      const stillAfterClient = chunk.filter((path) => !readExerciseVideoUrlCache(path))
      if (!stillAfterClient.length) return

      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: await getApiAuthHeaders(),
          body: JSON.stringify({ action: 'exercise-video-urls', paths: stillAfterClient }),
        })
        const json = await res.json().catch(() => ({}))
        if (json.ok && json.urls && typeof json.urls === 'object') {
          Object.entries(json.urls).forEach(([path, entry]) => {
            if (entry?.url) writeExerciseVideoUrlCache(path, entry.url, entry.expiresAt)
          })
        }
      } catch {
        /* batch başarısız — tekil imzaya düş */
      }
    })

    const stillMissing = chunk.filter((path) => !readExerciseVideoUrlCache(path))
    if (stillMissing.length) {
      await Promise.all(stillMissing.map((path) => getExerciseVideoUrl(path)))
    }
  }
}

/** 15 dk gecerli imzali oynatma URL'i uretir (path bazli, private bucket). */
export async function getExerciseVideoUrl(path) {
  const storagePath = normalizeExerciseVideoRef(path)
  if (!storagePath || !supabase || !isExerciseVideoStoragePath(storagePath)) return null

  return dedupeExerciseVideoUrlFetch(storagePath, async () => {
    const cached = readExerciseVideoUrlCache(storagePath)
    if (cached) return cached
    return runWithVideoUrlSlot(() => signExerciseVideoPathRaw(storagePath))
  })
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
    /body_part|sport_type|source_pack|source_id|equipment|target_muscle|secondary_muscles|difficulty|movement_category|instructions|metadata|video_pending|locations|requires_machine/.test(error.message || ''))

const stripOptionalExerciseColumns = ({
  sport_type, body_part, source_pack, source_id, equipment, target_muscle,
  secondary_muscles, difficulty, movement_category, instructions, metadata, video_pending,
  locations, requires_machine,
  ...rest
}) => rest

function buildExercisePayload(data) {
  return {
    name: data.name,
    description: data.description || '',
    category: data.bodyPart || data.category || 'Tüm Vücut',
    sport_type: data.sportType || 'Fitness',
    body_part: data.bodyPart || data.category || 'Tüm Vücut',
    video_url: normalizeExerciseVideoRef(data.videoUrl) || '',
    source_pack: data.sourcePack || null,
    source_id: data.sourceId || null,
    equipment: data.equipment || '',
    target_muscle: data.targetMuscle || '',
    secondary_muscles: data.secondaryMuscles || [],
    difficulty: data.difficulty || 'beginner',
    movement_category: data.movementCategory || 'strength',
    instructions: data.instructions || [],
    locations: Array.isArray(data.locations) ? data.locations : [],
    requires_machine: data.requiresMachine === true,
    metadata: data.metadata || {},
    video_pending: data.videoPending === true,
  }
}

export async function addExercise(data) {
  const payload = buildExercisePayload(data)
  let { error } = await supabase.from('exercises').insert(payload)
  if (isMissingExerciseColumnError(error)) {
    ;({ error } = await supabase.from('exercises').insert(stripOptionalExerciseColumns(payload)))
  }
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function editExercise(id, patch) {
  const payload = buildExercisePayload(patch)
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

export async function reassignExerciseCategory(fromCategory, toCategory) {
  const payload = { category: toCategory, body_part: toCategory }
  let { error } = await supabase.from('exercises').update(payload).eq('category', fromCategory)
  if (isMissingExerciseColumnError(error)) {
    ;({ error } = await supabase.from('exercises').update({ category: toCategory }).eq('category', fromCategory))
  }
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// --------------------------- staff applications ---------------------------
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Dosya okunamadı'))
    reader.readAsDataURL(file)
  })
}

/** Üye kan tahlili / lab sonucu — private bucket, path: {userId}/{timestamp}-{rand}.ext */
export async function uploadHealthLabResult(file, userId) {
  if (!file) return { success: false, error: 'Dosya seçilmedi' }
  if (!userId) return { success: false, error: 'Oturum gerekli' }
  if (!supabase) return { success: false, error: 'Depolama kullanılamıyor' }
  const ext = (file.name?.split('.').pop() || 'bin').toLowerCase()
  const allowed = ['pdf', 'jpg', 'jpeg', 'png', 'webp']
  if (!allowed.includes(ext)) return { success: false, error: 'Yalnızca PDF veya görsel yükleyebilirsiniz' }
  if (file.size > 8 * 1024 * 1024) return { success: false, error: 'Dosya en fazla 8 MB olabilir' }
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('health-lab-results').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  })
  if (error) return { success: false, error: error.message }
  return { success: true, path }
}

export async function uploadStaffApplicationDoc(file, { turnstileToken = '', formSessionToken = '' } = {}) {
  if (!file) return { success: false, error: 'Dosya seçilmedi' }
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const allowed = ['pdf', 'jpg', 'jpeg', 'png', 'webp']
  if (!allowed.includes(ext)) return { success: false, error: 'Yalnızca PDF veya görsel yükleyebilirsiniz' }
  if (file.size > 8 * 1024 * 1024) return { success: false, error: 'Dosya en fazla 8 MB olabilir' }

  try {
    const dataBase64 = await fileToBase64(file)
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'staff_doc_upload',
        fileName: file.name,
        contentType: file.type || '',
        dataBase64,
        turnstileToken: turnstileToken || '',
        formSessionToken: formSessionToken || '',
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
      return { success: false, error: data.error || 'Yükleme başarısız' }
    }
    return { success: true, url: data.url, path: data.path, formSessionToken: data.formSessionToken || formSessionToken }
  } catch (e) {
    return { success: false, error: e.message || 'Yükleme başarısız' }
  }
}

/** Base64 data URL → File (profil fotoğrafını storage'a almak için) */
function dataUrlToFile(dataUrl, filename = 'profile.jpg') {
  const [header, data] = String(dataUrl || '').split(',')
  if (!data) throw new Error('Geçersiz görsel')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(data)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) arr[i] = binary.charCodeAt(i)
  return new File([arr], filename, { type: mime })
}

/**
 * Başvuru payload'ına base64 koyma — storage URL'e çevir.
 * @returns {{ ok: true, photo: string|null, formSessionToken: string } | { ok: false, error: string }}
 */
async function resolveStaffApplicationPhoto(photo, { turnstileToken = '', formSessionToken = '' } = {}) {
  if (!photo || typeof photo !== 'string') {
    return { ok: true, photo: null, formSessionToken }
  }
  if (!photo.startsWith('data:')) {
    return { ok: true, photo, formSessionToken }
  }
  try {
    const file = dataUrlToFile(photo, 'profile.jpg')
    const up = await uploadStaffApplicationDoc(file, {
      turnstileToken: formSessionToken ? '' : turnstileToken,
      formSessionToken,
    })
    if (!up.success || !up.url) {
      return { ok: false, error: up.error || 'Profil fotoğrafı yüklenemedi' }
    }
    return {
      ok: true,
      photo: up.url,
      formSessionToken: up.formSessionToken || formSessionToken,
    }
  } catch (e) {
    return { ok: false, error: e.message || 'Profil fotoğrafı yüklenemedi' }
  }
}

export async function submitStaffApplication(form, { turnstileToken = '', formSessionToken = '' } = {}) {
  const photoResolved = await resolveStaffApplicationPhoto(form.photo, { turnstileToken, formSessionToken })
  if (!photoResolved.ok) {
    return { success: false, error: photoResolved.error }
  }
  const session = photoResolved.formSessionToken || formSessionToken
  const payload = buildStaffApplicationPayload({ ...form, photo: photoResolved.photo })

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'staff_application',
        role: form.role,
        email: form.email?.trim().toLowerCase(),
        name: form.name?.trim(),
        phone: form.phone?.trim() || '',
        roleLabel: staffRoleLabel(form.role),
        data: payload,
        turnstileToken: session ? '' : (turnstileToken || ''),
        formSessionToken: session || '',
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
      return { success: false, error: data.error || 'Başvuru gönderilemedi' }
    }
    return {
      success: true,
      id: data.id,
      formSessionToken: data.formSessionToken || session,
      photo: photoResolved.photo,
    }
  } catch (e) {
    return { success: false, error: e.message || 'Başvuru gönderilemedi' }
  }
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

export async function submitCorporateApplication(form, turnstileToken = '') {
  const payload = {
    city: form.city || '',
    industry: form.industry || '',
    employeeRange: form.employeeRange || '',
    services: form.services || [],
    message: form.message || '',
    preferredStart: form.preferredStart || '',
  }
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'corporate_application',
        companyName: form.companyName?.trim(),
        contactName: form.contactName?.trim(),
        email: form.email?.trim().toLowerCase(),
        phone: form.phone?.trim() || '',
        data: payload,
        turnstileToken: turnstileToken || '',
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
      return { success: false, error: data.error || 'Başvuru gönderilemedi' }
    }
    return { success: true, id: data.id }
  } catch (e) {
    return { success: false, error: e.message || 'Başvuru gönderilemedi' }
  }
}

export async function submitContactInquiry(form, turnstileToken = '') {
  const { submitContactForm } = await import('./contactForm')
  const r = await submitContactForm({ ...form, turnstileToken })
  return r.ok ? { success: true, id: r.id } : { success: false, error: r.error }
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
      scheduleType: data.scheduleType || null,
      cycleStartDate: data.cycleStartDate || null,
      cycleLength: data.cycleLength || null,
      cycleLoop: data.cycleLoop !== undefined ? data.cycleLoop : null,
      cycleSameDaily: data.cycleSameDaily !== undefined ? data.cycleSameDaily : null,
      sessionDuration: data.sessionDuration || null,
      source: data.source || null,
      createdAt: nowISO(),
    },
  }).select().single()
  if (error) return null

  const program = rowToProgram(row)

  if (data.memberId) {
    await notifyMemberProgram({
      memberId: data.memberId,
      staffName: data.staffName,
      title: data.title,
      programType: data.type,
      programId: program.id,
    })
  }

  return program
}

export async function deleteProgram(id) {
  if (!id) return { success: false, error: 'Program id gerekli' }
  const { error } = await supabase.from('programs').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

/** Mevcut programs.data alanlarını günceller; member_id / staff_id korunur. */
export async function updateProgram(id, patch = {}) {
  if (!id) return null
  const { data: existing, error: fetchErr } = await supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchErr || !existing) return null

  const prev = existing.data && typeof existing.data === 'object' ? existing.data : {}
  const nextType = patch.type != null
    ? (patch.type === 'nutrition' ? 'nutrition' : 'workout')
    : (prev.type === 'nutrition' ? 'nutrition' : 'workout')

  const nextData = {
    ...prev,
    type: nextType,
    memberName: patch.memberName !== undefined ? patch.memberName : (prev.memberName || ''),
    staffName: patch.staffName !== undefined ? patch.staffName : (prev.staffName || ''),
    title: patch.title !== undefined ? patch.title : prev.title,
    description: patch.description !== undefined ? patch.description : (prev.description || ''),
    items: patch.items !== undefined
      ? (Array.isArray(patch.items) ? patch.items : [])
      : (Array.isArray(prev.items) ? prev.items : []),
    entries: patch.entries !== undefined
      ? (Array.isArray(patch.entries) ? patch.entries : [])
      : (Array.isArray(prev.entries) ? prev.entries : []),
    scheduleType: patch.scheduleType !== undefined ? patch.scheduleType : (prev.scheduleType || null),
    cycleStartDate: patch.cycleStartDate !== undefined ? patch.cycleStartDate : (prev.cycleStartDate || null),
    cycleLength: patch.cycleLength !== undefined ? patch.cycleLength : (prev.cycleLength || null),
    cycleLoop: patch.cycleLoop !== undefined ? patch.cycleLoop : (prev.cycleLoop ?? null),
    cycleSameDaily: patch.cycleSameDaily !== undefined ? patch.cycleSameDaily : (prev.cycleSameDaily ?? null),
    sessionDuration: patch.sessionDuration !== undefined ? patch.sessionDuration : (prev.sessionDuration || null),
    source: patch.source !== undefined ? patch.source : (prev.source || null),
    createdAt: prev.createdAt || nowISO(),
    updatedAt: nowISO(),
  }

  const { data: row, error } = await supabase
    .from('programs')
    .update({ data: nextData })
    .eq('id', id)
    .select()
    .single()
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
  const guard = detectExternalContactInfo(text)
  if (guard.blocked) return { success: false, error: CONTACT_INFO_BLOCK_MESSAGE, blockedReason: guard.reason }

  const { data: rows } = await supabase.from('tickets').select('*').eq('id', id).limit(1)
  const current = rows?.[0]
  if (!current) return null
  const ticket = rowToTicket(current)
  const messages = [...(ticket.messages || []), { id: `m-${Date.now()}`, from, text, createdAt: nowISO() }]
  const status = from === 'admin' && ticket.status === 'open' ? 'in-progress' : ticket.status
  await supabase.from('tickets').update({ status, data: { ...current.data, messages } }).eq('id', id)

  if (from === 'admin' && current.member_id) {
    await pushMemberNotification(current.member_id, buildMemberNotification({
      type: 'support-reply',
      title: 'Destek yanıtı',
      message: `"${ticket.subject}" talebinize yanıt geldi.`,
      ticketId: id,
    }))
  }

  return { ...ticket, messages, status, success: true }
}

async function resolveAdminAssignPrice(planId, durationMonths, amountOverride) {
  if (amountOverride !== undefined && amountOverride !== null && amountOverride !== '') {
    const n = Number(amountOverride)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }
  const months = Number(durationMonths) || 1
  const { data: planRow } = await supabase.from('plans').select('price, pricing_tiers').eq('id', planId).maybeSingle()
  if (planRow) {
    const tiers = planRow.pricing_tiers
    if (Array.isArray(tiers)) {
      const tier = tiers.find((t) => Number(t.months) === months)
      if (tier?.price != null) return Number(tier.price) || 0
    }
    if (typeof planRow.price === 'number' && planRow.price >= 0) return planRow.price
  }
  return 0
}

/** Admin: koç/diyetisyen ataması, paket değiştirme ve süre yönetimi */
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
  const prevDoctorId = member.assignedDoctorId
  const prevMembership = member.membership
  const schedule = options.supportSchedule ?? member.supportSchedule

  let activePackages = migrateLegacyToPackages(member)
  const targetingFree = Boolean(options.membership && !isPaidMembership(options.membership))
  const removingPackage = Boolean(options.removePackageId)
  let assignedPaidPlan = null
  let assignedCfg = null
  let assignedMonths = 0
  let assignedAmount = null

  if (removingPackage) {
    activePackages = removeMemberPackage(activePackages, options.removePackageId)
  } else if (options.membership) {
    const planId = options.membership
    const months = isOneTimePlan(planId)
      ? 0
      : (Number(options.durationMonths) || getDurationMonths(member.packageConfig) || 1)
    const cfg = getDefaultPackageForPlan(planId, months)

    if (targetingFree) {
      // Abonelik paketlerini kaldır; aktif tek seferlik (doktor) korunur
      activePackages = activePackages.filter((p) => isOneTimePlan(p.planId) && isPackageEntryActive(p))
    } else {
      const amount = await resolveAdminAssignPrice(planId, months || 1, options.amount)
      assignedAmount = amount
      assignedPaidPlan = planId
      assignedCfg = cfg
      assignedMonths = months
      activePackages = resolvePackagePurchase(
        activePackages,
        planId,
        cfg,
        { price: amount },
        { addPackage: options.addPackage },
      )
    }
  } else if (options.durationMonths != null) {
    // Süre-only: membership değişmeden abonelik süresini yenile
    const targetId = resolveTargetSubscriptionPackageId(activePackages, options.targetPackageId)
    if (targetId) {
      activePackages = updatePackageDuration(activePackages, targetId, options.durationMonths)
    }
  }

  // Free / tek paket çıkarma hedefinde süre uzatma uygulanmaz (çıkarma sonrası kalanlara uygulanabilir)
  if (!targetingFree) {
    const hasExpiryPatch = (
      (options.extendDays != null && Number(options.extendDays) !== 0)
      || (options.setRemainingDays != null && Number(options.setRemainingDays) >= 0)
      || options.premiumExpiresAt
    )
    if (hasExpiryPatch) {
      activePackages = patchPackageExpiry(activePackages, {
        targetPackageId: options.targetPackageId || null,
        extendDays: options.extendDays != null && Number(options.extendDays) !== 0
          ? options.extendDays
          : null,
        setRemainingDays: options.extendDays != null && Number(options.extendDays) !== 0
          ? null
          : options.setRemainingDays,
        premiumExpiresAt: (
          options.extendDays != null && Number(options.extendDays) !== 0
        ) || (options.setRemainingDays != null && Number(options.setRemainingDays) >= 0)
          ? null
          : options.premiumExpiresAt,
        extendAll: Boolean(options.extendAll),
      })
    }
  }

  let draft = {
    ...member,
    activePackages,
    supportSchedule: schedule,
    assignedCoachId: options.assignedCoachId !== undefined ? options.assignedCoachId : member.assignedCoachId,
    assignedDietitianId: options.assignedDietitianId !== undefined ? options.assignedDietitianId : member.assignedDietitianId,
    assignedDoctorId: options.assignedDoctorId !== undefined ? options.assignedDoctorId : member.assignedDoctorId,
    coachSessions: options.coachSessions !== undefined ? options.coachSessions : (member.coachSessions || []),
    dietitianSessions: options.dietitianSessions !== undefined ? options.dietitianSessions : (member.dietitianSessions || []),
    doctorSessions: options.doctorSessions !== undefined ? options.doctorSessions : (member.doctorSessions || []),
  }

  const activeAfter = activePackages.filter((p) => isPackageEntryActive(p))
  const clearedToFree = targetingFree || (removingPackage && !activeAfter.length)

  // Free indirme / son paket çıkarma: sync'ten önce membership + premium alanlarını temizle
  if (clearedToFree && !activeAfter.length) {
    draft = {
      ...draft,
      membership: 'free',
      membershipStatus: 'active',
      packageConfig: DEFAULT_PACKAGE,
      premiumExpiresAt: null,
      premiumStartedAt: null,
      freeTrialExpiresAt: null,
    }
  } else if (targetingFree && activeAfter.length) {
    draft = {
      ...draft,
      membershipStatus: 'active',
      premiumExpiresAt: null,
      freeTrialExpiresAt: null,
    }
  }

  draft = syncMemberPackages(draft)

  if (isPaidMembership(draft.membership)) {
    draft.freeTrialExpiresAt = null
  }

  if (
    (options.membership && options.membership !== prevMembership)
    || removingPackage
    || clearedToFree
  ) {
    draft = sanitizeStaffForPackage(draft.packageConfig, draft)
  }

  const staffOnly = assignStaffOnly(draft, staffList, members, {
    autoAssign: Boolean(options.autoAssign),
    manualCoachId: draft.assignedCoachId,
    manualDietitianId: draft.assignedDietitianId,
  })
  const needCoach = packageIncludesCoach(draft.packageConfig || {})
  const needDiet = packageIncludesDietitian(draft.packageConfig || {})

  let updated = {
    ...draft,
    assignedCoachId: staffOnly.assignedCoachId,
    assignedDietitianId: staffOnly.assignedDietitianId,
    coachSessions: needCoach ? (draft.coachSessions ?? []) : [],
    dietitianSessions: needDiet ? (draft.dietitianSessions ?? []) : [],
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
  if (updated.assignedDoctorId && updated.assignedDoctorId !== prevDoctorId) {
    const doctor = staffList.find((s) => s.id === updated.assignedDoctorId)
    notifications.unshift({
      id: `n-${Date.now()}-doc`,
      type: 'assignment',
      title: 'Doktorunuz atandı',
      message: `${doctor?.name || 'Doktorunuz'} ile görüşme planlayabilirsiniz.`,
      read: false,
      createdAt: nowISO(),
    })
  }
  updated.notifications = notifications

  await upsertMember(updated)

  // Ücretli admin paket ataması → payments (Stripe webhook şekliyle uyumlu)
  if (assignedPaidPlan && assignedCfg) {
    const amount = assignedAmount ?? 0
    const note = String(options.paymentNote || '').trim()
      || (amount <= 0 ? 'Ücretsiz admin ataması' : '')
    await supabase.from('payments').insert({
      member_id: updated.id,
      data: {
        memberName: updated.name || '',
        amount,
        packageConfig: assignedCfg,
        planId: assignedPaidPlan,
        durationMonths: assignedMonths,
        status: 'completed',
        provider: 'admin',
        note: note || null,
        createdAt: nowISO(),
      },
    })
    await addActivity(
      'payment',
      `${updated.name} admin paket ataması (${getPlanLabel(assignedPaidPlan)}, ${Number(amount).toLocaleString('tr-TR')}₺)`,
      updated.id,
    )
  }

  const activityParts = []
  if (removingPackage) {
    activityParts.push('paket çıkarıldı')
  } else if (options.addPackage && options.membership) {
    activityParts.push(`paket eklendi: ${getPlanLabel(options.membership)}`)
  } else if (options.membership && options.membership !== prevMembership) {
    activityParts.push(`paket → ${getPlanLabel(options.membership)}`)
  } else if (options.durationMonths != null) {
    activityParts.push('süre ayı güncellendi')
  }
  if (options.extendDays || options.setRemainingDays != null || options.premiumExpiresAt) {
    activityParts.push('süre güncellendi')
  }
  const activityDetail = activityParts.length ? ` (${activityParts.join(', ')})` : ''

  await addActivity(
    'admin_premium',
    `${updated.name} için premium yönetimi güncellendi${activityDetail}`,
    updated.id
  )

  return { success: true, member: updated }
}

const MEMBERSHIP_STATUS_ACTIONS = new Set(['active', 'paused', 'cancelled'])

/**
 * Admin-only: üyelik durumunu dondur / iptal / yeniden aktifleştir.
 * Üye paneline talep UI’si yok — yalnızca operasyon.
 */
export async function adminSetMembershipStatus(memberId, { status, note = '', pauseUntil = null } = {}) {
  if (!MEMBERSHIP_STATUS_ACTIONS.has(status)) {
    return { success: false, error: 'Geçersiz üyelik durumu.' }
  }

  const { data: memberRows } = await supabase.from('members').select('*').eq('id', memberId).limit(1)
  const member = memberRows?.[0] ? rowToMember(memberRows[0]) : null
  if (!member) return { success: false, error: 'Üye bulunamadı.' }

  const prev = member.membershipStatus || 'active'
  if (prev === status && !note && status !== 'paused') {
    return { success: true, member, unchanged: true }
  }

  let draft = {
    ...member,
    membershipStatusNote: String(note || '').trim() || null,
    membershipStatusChangedAt: nowISO(),
    pauseUntil: status === 'paused' && pauseUntil ? String(pauseUntil) : null,
  }

  if (status === 'paused' || status === 'cancelled') {
    draft.membershipStatus = status
    draft = syncMembershipExpiryStatus(draft)
    draft.membershipStatus = status
  } else {
    draft.membershipStatus = 'active'
    draft.pauseUntil = null
    draft = syncMembershipExpiryStatus(draft)
  }

  await upsertMember(draft)

  const labels = {
    active: 'yeniden aktifleştirildi',
    paused: 'donduruldu',
    cancelled: 'iptal edildi',
  }
  const noteSuffix = draft.membershipStatusNote ? ` — ${draft.membershipStatusNote}` : ''
  await addActivity(
    'admin_membership_status',
    `${draft.name} üyeliği ${labels[status]}${noteSuffix}`,
    draft.id,
  )

  return { success: true, member: draft }
}

export async function deleteRowGeneric() { /* reserved */ }

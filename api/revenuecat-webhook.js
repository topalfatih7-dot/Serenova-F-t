/**
 * POST /api/revenuecat-webhook
 * RevenueCat → Supabase members (Stripe webhook parity).
 * Auth: Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>
 *
 * Provider izolasyonu: expire yalnız revenuecat paketlerini etkiler;
 * aktif Stripe paketi varsa üye free olmaz.
 */
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'
import {
  resolvePackagePurchase,
  isOneTimePlan,
  migrateLegacyToPackages,
  sanitizeStaffForPackage,
  syncMemberPackages,
  expirePackagesByProvider,
} from './_memberPackages.js'
import {
  loadPlansById,
  defaultPackageForPlan as packageFromPlanEntitlements,
  isOneTimePlanId,
} from './_planEntitlements.js'

const today = () => new Date().toISOString().split('T')[0]
const nowISO = () => new Date().toISOString()

const ACTIVATE_TYPES = new Set([
  'INITIAL_PURCHASE',
  'NON_RENEWING_PURCHASE',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
])
const RENEWAL_TYPES = new Set(['RENEWAL'])
const EXPIRE_TYPES = new Set(['EXPIRATION', 'SUBSCRIPTION_PAUSED'])

function computeExpiry(startDate, durationMonths) {
  const d = new Date(startDate || today())
  d.setMonth(d.getMonth() + (Number(durationMonths) || 1))
  return d.toISOString().split('T')[0]
}

async function resolveDefaultPackage(admin, planId, durationMonths = 1) {
  const byId = await loadPlansById(admin)
  const plan = byId.get(planId) || null
  return packageFromPlanEntitlements(planId, durationMonths, plan)
}

/** `yf_eko_diyet_1m` | `yf_doktor_once` */
export function parseRevenueCatProductId(productId) {
  const id = String(productId || '').trim()
  if (id === 'yf_doktor_once') return { planId: 'doktor', durationMonths: 0 }
  const m = /^yf_(eko_diyet|eko_spor|diyet|spor|vip)_(1|3|6)m$/.exec(id)
  if (!m) return null
  return { planId: m[1], durationMonths: Number(m[2]) }
}

function verifySecret(req) {
  const secret = String(process.env.REVENUECAT_WEBHOOK_SECRET || '').trim()
  if (!secret) return { ok: false, status: 503, error: 'REVENUECAT_WEBHOOK_SECRET eksik.' }
  const auth = String(req.headers.authorization || req.headers.Authorization || '')
  const bearer = auth.replace(/^Bearer\s+/i, '').trim()
  const alt = String(req.headers['x-revenuecat-secret'] || '').trim()
  if (bearer === secret || alt === secret) return { ok: true }
  return { ok: false, status: 401, error: 'Yetkisiz.' }
}

function memberFromRow(row) {
  const data = row.data || {}
  const {
    assignedCoachId: _c,
    assignedDietitianId: _d,
    assignedDoctorId: _doc,
    ...rest
  } = data
  return syncMemberPackages({
    id: row.id,
    name: row.name,
    email: row.email,
    membership: row.membership,
    membershipStatus: row.membership_status,
    assignedCoachId: row.assigned_coach_id ?? null,
    assignedDietitianId: row.assigned_dietitian_id ?? null,
    assignedDoctorId: row.assigned_doctor_id ?? null,
    ...rest,
  })
}

function memberDataPayload(member, data) {
  const {
    id: _id,
    name: _name,
    email: _email,
    membership: _m,
    membershipStatus: _ms,
    assignedCoachId: _c,
    assignedDietitianId: _d,
    assignedDoctorId: _doc,
    ...rest
  } = member
  return { ...data, ...rest }
}

async function alreadyProcessed(admin, eventId) {
  if (!eventId) return false
  const { data } = await admin
    .from('payments')
    .select('id')
    .filter('data->>revenueCatEventId', 'eq', eventId)
    .maybeSingle()
  return Boolean(data)
}

async function insertPaymentSafe(admin, row) {
  const { error } = await admin.from('payments').insert(row)
  if (error && !/duplicate|unique/i.test(error.message || '')) {
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

async function activateOrChange(admin, { memberId, planId, durationMonths, eventId, price, eventType }) {
  const { data: row, error: fetchErr } = await admin.from('members').select('*').eq('id', memberId).maybeSingle()
  if (fetchErr) return { ok: false, error: fetchErr.message }
  if (!row) return { ok: false, error: 'Üye bulunamadı' }

  const plansById = await loadPlansById(admin)
  const plan = plansById.get(planId) || null
  const oneTime = isOneTimePlanId(planId, plan) || isOneTimePlan(planId)
  const months = oneTime ? 0 : (Number(durationMonths) || 1)
  const packageConfig = await resolveDefaultPackage(admin, planId, months || 1)
  const started = today()
  const data = row.data || {}
  const member = memberFromRow(row)
  const amount = Number(price) || 0

  let activePackages = resolvePackagePurchase(
    migrateLegacyToPackages(member),
    planId,
    packageConfig,
    { price: amount, startedAt: started, provider: 'revenuecat' },
  )

  let draft = syncMemberPackages({
    ...member,
    activePackages,
    premiumStartedAt: member.premiumStartedAt || started,
    premiumExpiresAt: oneTime ? member.premiumExpiresAt : computeExpiry(started, months),
    lastActiveAt: started,
    revenueCatAppUserId: memberId,
  })

  draft = sanitizeStaffForPackage(draft.packageConfig, draft)
  const newData = memberDataPayload(draft, data)

  const { error: updErr } = await admin
    .from('members')
    .update({
      membership: draft.membership,
      membership_status: draft.membershipStatus || 'active',
      assigned_coach_id: draft.assignedCoachId || null,
      assigned_dietitian_id: draft.assignedDietitianId || null,
      assigned_doctor_id: draft.assignedDoctorId || null,
      data: newData,
      updated_at: nowISO(),
    })
    .eq('id', memberId)
  if (updErr) return { ok: false, error: updErr.message }

  const durationLabel = oneTime ? 'tek seferlik' : `${months} ay`
  await insertPaymentSafe(admin, {
    member_id: memberId,
    data: {
      memberName: row.name || '',
      amount,
      packageConfig,
      planId,
      durationMonths: months,
      status: 'completed',
      provider: 'revenuecat',
      revenueCatEventId: eventId,
      revenueCatEventType: eventType,
      createdAt: nowISO(),
    },
  })

  await admin.from('activities').insert({
    member_id: memberId,
    data: {
      type: 'payment',
      text: `${row.name || 'Üye'} ${planId} planı (${durationLabel}) — RevenueCat ${eventType}`,
      createdAt: nowISO(),
    },
  })

  return { ok: true }
}

async function renew(admin, { memberId, planId, durationMonths, eventId, price, eventType }) {
  const { data: row, error: fetchErr } = await admin.from('members').select('*').eq('id', memberId).maybeSingle()
  if (fetchErr) return { ok: false, error: fetchErr.message }
  if (!row) return { ok: false, error: 'Üye bulunamadı' }

  const plansById = await loadPlansById(admin)
  const plan = plansById.get(planId) || null
  const oneTime = isOneTimePlanId(planId, plan) || isOneTimePlan(planId)
  if (oneTime) return { ok: true, skipped: true }

  const months = Number(durationMonths) || 1
  const packageConfig = await resolveDefaultPackage(admin, planId, months)
  const started = today()
  const data = row.data || {}
  const member = memberFromRow(row)
  const baseExpiry = member.premiumExpiresAt && member.premiumExpiresAt > started
    ? member.premiumExpiresAt
    : started
  const newExpiry = computeExpiry(baseExpiry, months)
  const amount = Number(price) || 0

  let activePackages = resolvePackagePurchase(
    migrateLegacyToPackages(member),
    planId,
    packageConfig,
    { price: amount, startedAt: started, expiresAt: newExpiry, provider: 'revenuecat' },
  )

  let draft = syncMemberPackages({
    ...member,
    activePackages,
    premiumStartedAt: member.premiumStartedAt || started,
    premiumExpiresAt: newExpiry,
    lastActiveAt: started,
  })

  draft = sanitizeStaffForPackage(draft.packageConfig, draft)
  const newData = memberDataPayload(draft, data)

  const { error: updErr } = await admin
    .from('members')
    .update({
      membership: draft.membership,
      membership_status: draft.membershipStatus || 'active',
      assigned_coach_id: draft.assignedCoachId || null,
      assigned_dietitian_id: draft.assignedDietitianId || null,
      assigned_doctor_id: draft.assignedDoctorId || null,
      data: newData,
      updated_at: nowISO(),
    })
    .eq('id', memberId)
  if (updErr) return { ok: false, error: updErr.message }

  await insertPaymentSafe(admin, {
    member_id: memberId,
    data: {
      memberName: row.name || '',
      amount,
      packageConfig,
      planId,
      durationMonths: months,
      status: 'completed',
      provider: 'revenuecat',
      revenueCatEventId: eventId,
      revenueCatEventType: eventType,
      kind: 'subscription_renewal',
      createdAt: nowISO(),
    },
  })

  return { ok: true }
}

async function expireProviderPackages(admin, { memberId, eventId, eventType }) {
  const { data: row, error: fetchErr } = await admin.from('members').select('*').eq('id', memberId).maybeSingle()
  if (fetchErr) return { ok: false, error: fetchErr.message }
  if (!row) return { ok: false, error: 'Üye bulunamadı' }

  const data = row.data || {}
  const member = memberFromRow(row)
  let draft = expirePackagesByProvider(member, 'revenuecat')
  draft = sanitizeStaffForPackage(draft.packageConfig || {}, draft)
  // stripeSubscriptionId / stripe_customer_id korunur
  const newData = memberDataPayload(draft, data)

  const { error: updErr } = await admin
    .from('members')
    .update({
      membership: draft.membership || 'free',
      membership_status: draft.membershipStatus || 'active',
      assigned_coach_id: draft.assignedCoachId || null,
      assigned_dietitian_id: draft.assignedDietitianId || null,
      assigned_doctor_id: draft.assignedDoctorId || null,
      data: newData,
      updated_at: nowISO(),
    })
    .eq('id', memberId)
  if (updErr) return { ok: false, error: updErr.message }

  await insertPaymentSafe(admin, {
    member_id: memberId,
    data: {
      memberName: row.name || '',
      amount: 0,
      planId: draft.membership || 'free',
      durationMonths: 0,
      status: 'completed',
      provider: 'revenuecat',
      revenueCatEventId: eventId,
      revenueCatEventType: eventType,
      kind: 'expiration_downgrade',
      createdAt: nowISO(),
    },
  })

  return { ok: true }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Yalnızca POST' })
  }

  const auth = verifySecret(req)
  if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error })

  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ ok: false, error: 'Supabase admin yapılandırması eksik.' })
  }

  const admin = getSupabaseAdmin()
  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  } catch {
    return res.status(400).json({ ok: false, error: 'Geçersiz JSON body.' })
  }

  const event = body.event || body
  const eventType = String(event.type || event.event_type || '').toUpperCase()
  const eventId = String(event.id || event.event_id || '').trim()
  const memberId = String(event.app_user_id || event.appUserId || '').trim()
  const productId = String(
    event.product_id || event.productId || event.new_product_id || '',
  ).trim()
  const price = event.price ?? event.price_in_purchased_currency ?? 0

  if (!memberId) {
    return res.status(400).json({ ok: false, error: 'app_user_id gerekli.' })
  }

  if (eventId && (await alreadyProcessed(admin, eventId))) {
    return res.status(200).json({ ok: true, duplicate: true })
  }

  /* İptal: süre bitene kadar erişim — downgrade yok */
  if (eventType === 'CANCELLATION') {
    return res.status(200).json({ ok: true, ignored: true, reason: 'cancellation_until_expiry' })
  }

  if (EXPIRE_TYPES.has(eventType)) {
    const result = await expireProviderPackages(admin, { memberId, eventId, eventType })
    if (!result.ok) return res.status(500).json(result)
    return res.status(200).json({ ok: true })
  }

  if (ACTIVATE_TYPES.has(eventType) || RENEWAL_TYPES.has(eventType)) {
    const parsed = parseRevenueCatProductId(productId)
    if (!parsed) {
      // RC retry storm önlemi — üyelik yazılmaz
      return res.status(200).json({
        ok: true,
        ignored: true,
        reason: 'unknown_product_id',
        productId: productId || null,
      })
    }

    const payload = {
      memberId,
      planId: parsed.planId,
      durationMonths: parsed.durationMonths,
      eventId,
      price,
      eventType,
    }

    const result = RENEWAL_TYPES.has(eventType)
      ? await renew(admin, payload)
      : await activateOrChange(admin, payload)

    if (!result.ok) return res.status(500).json(result)
    return res.status(200).json({ ok: true, skipped: result.skipped || false })
  }

  return res.status(200).json({ ok: true, ignored: true, type: eventType || 'unknown' })
}

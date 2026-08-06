/**
 * POST /api/stripe-webhook
 */
import { getStripe, isStripeConfigured } from './_stripe.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'
import { sendTelegramMessage } from './_telegramSend.js'
import {
  resolvePackagePurchase,
  isOneTimePlan,
  migrateLegacyToPackages,
  sanitizeStaffForPackage,
  syncMemberPackages,
  expirePackagesByProvider,
} from './_memberPackages.js'
import { createMemberFromPendingRegistration } from './_createMemberFromPending.js'
import {
  loadPlansById,
  defaultPackageForPlan as packageFromPlanEntitlements,
  isOneTimePlanId,
} from './_planEntitlements.js'

export const config = { api: { bodyParser: false } }

const today = () => new Date().toISOString().split('T')[0]
const nowISO = () => new Date().toISOString()

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

const TG_TIME = () => new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })

/** Yeni Form checkout metadata imzası — `api/stripe-checkout.js` ile uyumlu. */
function isYeniFormCheckoutMetadata(meta = {}) {
  return Boolean(meta.memberId && meta.planId)
}

function formatTry(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n) || n <= 0) return '—'
  return `${n.toLocaleString('tr-TR')}₺`
}

/** Ödeme bildirimini (başarılı/başarısız) Telegram'a gönderir. Hata sessizce yutulur. */
async function notifyPaymentTelegram({ ok, meta = {}, amount, email, reason, sessionId }) {
  const chatId = process.env.TELEGRAM_PAYMENT_CHAT_ID || process.env.TELEGRAM_CHAT_ID
  if (!chatId) return

  const name = meta.memberName || 'Üye'
  const planName = meta.planName || meta.planId || '—'
  const durationLabel = meta.durationLabel || (meta.durationMonths ? `${meta.durationMonths} ay` : '')
  const planLine = durationLabel ? `${planName} (${durationLabel})` : planName
  const mail = email || meta.email || '—'

  const lines = ok
    ? [
        '✅ <b>Ödeme başarılı</b>',
        `👤 ${name}`,
        `📧 ${mail}`,
        `📦 ${planLine}`,
        `💰 ${formatTry(amount)}`,
        sessionId ? `🧾 <code>${sessionId}</code>` : null,
        `🕐 ${TG_TIME()}`,
      ]
    : [
        '❌ <b>Ödeme başarısız</b>',
        `👤 ${name}`,
        `📧 ${mail}`,
        `📦 ${planLine}`,
        `💰 ${formatTry(amount)}`,
        reason ? `⚠️ ${reason}` : null,
        `🕐 ${TG_TIME()}`,
      ]

  try {
    await sendTelegramMessage({ chatId, text: lines.filter(Boolean).join('\n') })
  } catch {
    /* Telegram hatası ödeme akışını etkilemesin */
  }
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
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

async function activateMembership(admin, meta, session) {
  const memberId = meta.memberId
  const planId = meta.planId
  if (!memberId || !planId) return { ok: false, error: 'Eksik metadata' }

  const amount = Number(meta.planPrice) || (session.amount_total ? session.amount_total / 100 : 0)
  const plansById = await loadPlansById(admin)
  const plan = plansById.get(planId) || null
  const oneTime = isOneTimePlanId(planId, plan) || isOneTimePlan(planId)
  const durationMonths = oneTime ? 0 : (Number(meta.durationMonths) || Number(meta.durationWeeks) / 4 || 1)
  const sessionId = session.id

  const { data: existing } = await admin
    .from('payments')
    .select('id')
    .eq('member_id', memberId)
    .filter('data->>stripeSessionId', 'eq', sessionId)
    .maybeSingle()
  if (existing) return { ok: true, duplicate: true }

  const { data: row, error: fetchErr } = await admin.from('members').select('*').eq('id', memberId).maybeSingle()
  if (fetchErr) return { ok: false, error: fetchErr.message }

  let memberRow = row
  if (!memberRow) {
    if (meta.flow !== 'register') return { ok: false, error: 'Üye bulunamadı' }
    const created = await createMemberFromPendingRegistration(admin, memberId)
    if (!created.ok) return { ok: false, error: created.error }
    const { data: refetched } = await admin.from('members').select('*').eq('id', memberId).maybeSingle()
    memberRow = refetched
    if (!memberRow) return { ok: false, error: 'Üye oluşturulamadı' }
  }

  const data = memberRow.data || {}
  const member = memberFromRow(memberRow)
  const packageConfig = await resolveDefaultPackage(admin, planId, durationMonths || 1)
  const started = today()

  let activePackages = resolvePackagePurchase(
    migrateLegacyToPackages(member),
    planId,
    packageConfig,
    { price: amount, startedAt: started, provider: 'stripe' },
  )

  let draft = syncMemberPackages({
    ...member,
    activePackages,
    premiumStartedAt: member.premiumStartedAt || started,
    premiumExpiresAt: oneTime ? member.premiumExpiresAt : computeExpiry(started, durationMonths),
    lastActiveAt: started,
    ...(session.subscription
      ? { stripeSubscriptionId: String(session.subscription) }
      : {}),
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
      ...(session.customer ? { stripe_customer_id: String(session.customer) } : {}),
      data: newData,
      updated_at: nowISO(),
    })
    .eq('id', memberId)
  if (updErr) return { ok: false, error: updErr.message }

  const durationLabel = oneTime ? 'tek seferlik' : `${durationMonths} ay`

  await admin.from('payments').insert({
    member_id: memberId,
    data: {
      memberName: memberRow.name || '',
      amount,
      packageConfig,
      planId,
      durationMonths,
      status: 'completed',
      provider: 'stripe',
      stripeSessionId: sessionId,
      stripePaymentIntent: session.payment_intent || null,
      stripeSubscriptionId: session.subscription ? String(session.subscription) : null,
      createdAt: nowISO(),
    },
  })

  await admin.from('activities').insert({
    member_id: memberId,
    data: {
      type: 'payment',
      text: `${memberRow.name || 'Üye'} ${planId} planı (${durationLabel}) için ödeme tamamladı (${amount.toLocaleString('tr-TR')}₺)`,
      createdAt: nowISO(),
    },
  })

  return { ok: true }
}

/**
 * Abonelik yenileme (invoice.paid · billing_reason=subscription_cycle).
 * İlk dönem checkout.session.completed ile işlenir.
 */
async function renewMembership(admin, meta, invoice, subscription) {
  const memberId = meta.memberId
  const planId = meta.planId
  if (!memberId || !planId) return { ok: false, error: 'Eksik metadata' }

  const invoiceId = invoice.id
  const { data: existing } = await admin
    .from('payments')
    .select('id')
    .eq('member_id', memberId)
    .filter('data->>stripeInvoiceId', 'eq', invoiceId)
    .maybeSingle()
  if (existing) return { ok: true, duplicate: true }

  const { data: row, error: fetchErr } = await admin.from('members').select('*').eq('id', memberId).maybeSingle()
  if (fetchErr) return { ok: false, error: fetchErr.message }
  if (!row) return { ok: false, error: 'Üye bulunamadı' }

  const amount = Number(meta.planPrice)
    || (invoice.amount_paid ? invoice.amount_paid / 100 : 0)
  const plansById = await loadPlansById(admin)
  const plan = plansById.get(planId) || null
  const oneTime = isOneTimePlanId(planId, plan) || isOneTimePlan(planId)
  if (oneTime) return { ok: true, skipped: true }

  const durationMonths = Number(meta.durationMonths) || 1
  const data = row.data || {}
  const member = memberFromRow(row)
  const packageConfig = await resolveDefaultPackage(admin, planId, durationMonths)
  const started = today()
  const baseExpiry = member.premiumExpiresAt && member.premiumExpiresAt > started
    ? member.premiumExpiresAt
    : started
  const newExpiry = computeExpiry(baseExpiry, durationMonths)

  let activePackages = resolvePackagePurchase(
    migrateLegacyToPackages(member),
    planId,
    packageConfig,
    { price: amount, startedAt: started, expiresAt: newExpiry, provider: 'stripe' },
  )

  let draft = syncMemberPackages({
    ...member,
    activePackages,
    premiumStartedAt: member.premiumStartedAt || started,
    premiumExpiresAt: newExpiry,
    lastActiveAt: started,
    stripeSubscriptionId: subscription?.id
      || member.stripeSubscriptionId
      || data.stripeSubscriptionId
      || null,
  })

  draft = sanitizeStaffForPackage(draft.packageConfig, draft)
  const newData = memberDataPayload(draft, data)

  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : (invoice.customer?.id || null)

  const { error: updErr } = await admin
    .from('members')
    .update({
      membership: draft.membership,
      membership_status: draft.membershipStatus || 'active',
      assigned_coach_id: draft.assignedCoachId || null,
      assigned_dietitian_id: draft.assignedDietitianId || null,
      assigned_doctor_id: draft.assignedDoctorId || null,
      ...(customerId ? { stripe_customer_id: customerId } : {}),
      data: newData,
      updated_at: nowISO(),
    })
    .eq('id', memberId)
  if (updErr) return { ok: false, error: updErr.message }

  await admin.from('payments').insert({
    member_id: memberId,
    data: {
      memberName: row.name || '',
      amount,
      packageConfig,
      planId,
      durationMonths,
      status: 'completed',
      provider: 'stripe',
      stripeInvoiceId: invoiceId,
      stripeSubscriptionId: subscription?.id || null,
      createdAt: nowISO(),
      kind: 'subscription_renewal',
    },
  })

  await admin.from('activities').insert({
    member_id: memberId,
    data: {
      type: 'payment',
      text: `${row.name || 'Üye'} ${planId} aboneliği yenilendi (${durationMonths} ay, ${amount.toLocaleString('tr-TR')}₺)`,
      createdAt: nowISO(),
    },
  })

  return { ok: true }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Yalnızca POST' })

  if (!isStripeConfigured() || !isSupabaseAdminConfigured()) {
    return res.status(503).json({ ok: false, error: 'Webhook yapılandırması eksik.' })
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return res.status(503).json({ ok: false, error: 'STRIPE_WEBHOOK_SECRET eksik.' })
  }

  const stripe = getStripe()
  const sig = req.headers['stripe-signature']

  let event
  try {
    if (typeof req.on === 'function' && !req.readableEnded) {
      const raw = await readRawBody(req)
      event = stripe.webhooks.constructEvent(raw, sig, webhookSecret)
    } else {
      if (process.env.STRIPE_WEBHOOK_DEV_BYPASS !== 'true') {
        return res.status(400).json({ ok: false, error: 'Ham gövde yok; imza doğrulanamıyor.' })
      }
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    }
  } catch (e) {
    return res.status(400).json({ ok: false, error: `İmza doğrulanamıyor: ${e.message}` })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const meta = session.metadata || {}
        if (!isYeniFormCheckoutMetadata(meta)) break
        if (session.payment_status === 'paid' || session.status === 'complete') {
          const admin = getSupabaseAdmin()
          const result = await activateMembership(admin, meta, session)
          if (!result.ok) return res.status(500).json({ ok: false, error: result.error })
          // Aynı ödeme daha önce işlenmişse tekrar bildirim gönderme.
          if (!result.duplicate) {
            await notifyPaymentTelegram({
              ok: true,
              meta,
              amount: Number(meta.planPrice) || (session.amount_total ? session.amount_total / 100 : 0),
              email: session.customer_details?.email || session.customer_email,
              sessionId: session.id,
            })
          }
        }
        break
      }
      case 'checkout.session.expired': {
        const session = event.data.object
        const meta = session.metadata || {}
        if (!isYeniFormCheckoutMetadata(meta)) break
        await notifyPaymentTelegram({
          ok: false,
          meta,
          amount: session.amount_total ? session.amount_total / 100 : Number(meta.planPrice) || 0,
          email: session.customer_details?.email || session.customer_email,
          reason: 'Ödeme oturumu tamamlanmadan süresi doldu.',
          sessionId: session.id,
        })
        break
      }
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object
        const meta = session.metadata || {}
        if (!isYeniFormCheckoutMetadata(meta)) break
        await notifyPaymentTelegram({
          ok: false,
          meta,
          amount: session.amount_total ? session.amount_total / 100 : Number(meta.planPrice) || 0,
          email: session.customer_details?.email || session.customer_email,
          reason: 'Gecikmeli ödeme yöntemi başarısız oldu.',
          sessionId: session.id,
        })
        break
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object
        const meta = pi.metadata || {}
        if (!isYeniFormCheckoutMetadata(meta)) break
        await notifyPaymentTelegram({
          ok: false,
          meta,
          amount: pi.amount ? pi.amount / 100 : Number(meta.planPrice) || 0,
          email: meta.email || pi.receipt_email,
          reason: pi.last_payment_error?.message || 'Kart reddedildi veya ödeme tamamlanamadı.',
        })
        break
      }
      case 'invoice.paid': {
        const invoice = event.data.object
        // İlk fatura checkout.session.completed ile işlenir — çift aktivasyon yok
        if (invoice.billing_reason === 'subscription_create') break
        if (
          invoice.billing_reason !== 'subscription_cycle'
          && invoice.billing_reason !== 'subscription_update'
        ) break

        const stripeSubId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id
        if (!stripeSubId) break

        const subscription = await stripe.subscriptions.retrieve(stripeSubId)
        const meta = {
          ...(subscription.metadata || {}),
          ...(invoice.metadata || {}),
        }
        if (!isYeniFormCheckoutMetadata(meta)) break

        const admin = getSupabaseAdmin()
        const result = await renewMembership(admin, meta, invoice, subscription)
        if (!result.ok) return res.status(500).json({ ok: false, error: result.error })
        if (!result.duplicate && !result.skipped) {
          await notifyPaymentTelegram({
            ok: true,
            meta: { ...meta, durationLabel: `${meta.durationMonths || 1} ay · yenileme` },
            amount: Number(meta.planPrice) || (invoice.amount_paid ? invoice.amount_paid / 100 : 0),
            email: invoice.customer_email,
            sessionId: invoice.id,
          })
        }
        break
      }
      case 'customer.subscription.deleted': {
        // Abonelik silindi → hemen free + atama/randevu temizliği
        const subscription = event.data.object
        const meta = subscription.metadata || {}
        if (!isYeniFormCheckoutMetadata(meta)) break
        const admin = getSupabaseAdmin()
        const { data: row } = await admin
          .from('members')
          .select('id, name, email, membership, membership_status, assigned_coach_id, assigned_dietitian_id, assigned_doctor_id, data')
          .eq('id', meta.memberId)
          .maybeSingle()
        if (!row) break

        const data = { ...(row.data || {}) }
        const clearedThisSub = data.stripeSubscriptionId === subscription.id
        // Legacy paket eşlemesi için expire öncesi id’yi koru
        const before = {
          id: row.id,
          name: row.name,
          email: row.email,
          membership: row.membership,
          membershipStatus: row.membership_status,
          assignedCoachId: row.assigned_coach_id ?? null,
          assignedDietitianId: row.assigned_dietitian_id ?? null,
          assignedDoctorId: row.assigned_doctor_id ?? null,
          ...data,
          stripeSubscriptionId: data.stripeSubscriptionId || subscription.id,
        }
        // Yalnız Stripe paketlerini expire et — aktif RC varsa üye free olmaz
        const after = expirePackagesByProvider(before, 'stripe')
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
        } = after
        const newData = { ...data, ...rest }
        if (clearedThisSub) delete newData.stripeSubscriptionId
        await admin
          .from('members')
          .update({
            membership: after.membership || 'free',
            membership_status: after.membershipStatus || 'active',
            assigned_coach_id: after.assignedCoachId || null,
            assigned_dietitian_id: after.assignedDietitianId || null,
            assigned_doctor_id: after.assignedDoctorId || null,
            data: newData,
            updated_at: nowISO(),
          })
          .eq('id', row.id)
        break
      }
      default:
        break
    }
    return res.status(200).json({ received: true })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) })
  }
}

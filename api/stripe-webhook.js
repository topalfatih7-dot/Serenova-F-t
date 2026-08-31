/**
 * POST /api/stripe-webhook
 */
import {
  getStripe,
  isStripeConfigured,
  stripeObjectId,
  invoiceSubscriptionId,
  invoiceSubscriptionMetadata,
} from './_stripe.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'
import { sendTelegramMessage } from './_telegramSend.js'
import {
  resolvePackagePurchase,
  isOneTimePlan,
  migrateLegacyToPackages,
  sanitizeStaffForPackage,
  syncMemberPackages,
  expirePackageBySubscriptionId,
  applyStripeSubscriptionState,
  extendPackageForSubscription,
  findPackageBySubscriptionId,
  unixSecondsToIsoDate,
} from './_memberPackages.js'
import { createMemberFromPendingRegistration } from './_createMemberFromPending.js'
import {
  loadPlansById,
  defaultPackageForPlan as packageFromPlanEntitlements,
  isOneTimePlanId,
} from './_planEntitlements.js'
import {
  INFLUENCER_COMMISSION_RATE,
  influencerPayoutPeriodKey,
} from '../src/data/influencerPayouts.js'

export const config = { api: { bodyParser: false } }

const today = () => new Date().toISOString().split('T')[0]
const nowISO = () => new Date().toISOString()

function paidAmountFromSession(session, meta = {}) {
  if (session?.amount_total != null) return session.amount_total / 100
  return Number(meta.planPrice) || 0
}

async function recordInfluencerEarning(admin, {
  meta,
  session,
  memberRow,
  paymentId,
  amountPaid,
  listPrice,
}) {
  const influencerId = String(meta?.influencerId || '').trim()
  const code = String(meta?.influencerCode || '').trim().toUpperCase()
  if (!influencerId || !code) return { ok: true, skipped: true }

  const sessionId = session?.id || ''
  const amountMinor = session?.amount_total != null
    ? Number(session.amount_total)
    : Math.round(Number(amountPaid || 0) * 100)
  const commissionTry = Math.round(amountMinor * INFLUENCER_COMMISSION_RATE) / 100
  const periodKey = influencerPayoutPeriodKey(new Date())

  const row = {
    influencer_id: influencerId,
    member_id: memberRow?.id || meta.memberId || null,
    payment_id: paymentId || null,
    stripe_session_id: sessionId || null,
    stripe_payment_intent: stripeObjectId(session?.payment_intent) || null,
    code,
    plan_id: String(meta.planId || ''),
    duration_months: Number(meta.durationMonths) || 1,
    list_price_try: Number(listPrice) || 0,
    amount_paid_try: Number(amountPaid) || 0,
    commission_rate: INFLUENCER_COMMISSION_RATE,
    commission_try: commissionTry,
    period_key: periodKey,
    status: 'pending',
    member_display_name: String(memberRow?.name || meta.memberName || '').trim(),
  }

  if (sessionId) {
    const { data: existingE } = await admin
      .from('influencer_earnings')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle()
    if (existingE) return { ok: true, duplicate: true }
  }

  const { error } = await admin.from('influencer_earnings').insert(row)
  if (error) {
    console.warn('[stripe-webhook] influencer earning', error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

async function reverseInfluencerEarningsForCharge(admin, charge) {
  const pi = stripeObjectId(charge?.payment_intent)
  const chargeId = stripeObjectId(charge?.id)
  if (!pi && !chargeId) return
  const amount = Number(charge?.amount || 0)
  const refunded = Number(charge?.amount_refunded || 0)
  if (amount > 0 && refunded < amount) return

  let q = admin.from('influencer_earnings').select('id, status, stripe_payment_intent, stripe_session_id')
  if (pi) q = q.eq('stripe_payment_intent', pi)
  else return

  const { data: rows, error } = await q
  if (error) {
    console.warn('[stripe-webhook] influencer refund lookup', error.message)
    return
  }
  for (const row of rows || []) {
    if (row.status === 'reversed' || row.status === 'rejected') continue
    const { error: updErr } = await admin
      .from('influencer_earnings')
      .update({
        status: 'reversed',
        reject_reason: row.status === 'paid' ? 'İade — ödenmiş hakediş geri alınmalı' : 'İade',
        updated_at: nowISO(),
      })
      .eq('id', row.id)
    if (updErr) console.warn('[stripe-webhook] influencer reverse', updErr.message)
  }
}

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

const MEMBER_LOOKUP_COLUMNS = 'id, name, email, membership, membership_status, assigned_coach_id, assigned_dietitian_id, assigned_doctor_id, stripe_customer_id, data'

async function findMemberForStripeEvent(admin, { memberId, subscriptionId, customerId }) {
  if (memberId) {
    const { data } = await admin.from('members').select(MEMBER_LOOKUP_COLUMNS).eq('id', memberId).maybeSingle()
    if (data) return data
  }
  if (subscriptionId) {
    const { data } = await admin
      .from('members')
      .select(MEMBER_LOOKUP_COLUMNS)
      .filter('data->>stripeSubscriptionId', 'eq', subscriptionId)
      .maybeSingle()
    if (data) return data
  }
  if (customerId) {
    const { data } = await admin
      .from('members')
      .select(MEMBER_LOOKUP_COLUMNS)
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    if (data) return data
  }
  return null
}

function metaFromMemberRow(row, subscriptionId = null) {
  if (!row) return {}
  const data = row.data || {}
  const pkgs = Array.isArray(data.activePackages) ? data.activePackages : []
  const stripePkg = (subscriptionId
    ? pkgs.find((p) => String(p?.stripeSubscriptionId || '') === String(subscriptionId))
    : null)
    || pkgs.find((p) => (
      p?.status === 'active'
      && (p.provider === 'stripe' || !p.provider)
      && p.planId
    ))
  const planId = stripePkg?.planId
    || (row.membership && row.membership !== 'free' ? row.membership : null)
  if (!planId) return { memberId: row.id, memberName: row.name || '', email: row.email || '' }
  return {
    memberId: row.id,
    memberName: row.name || '',
    email: row.email || '',
    planId,
    planPrice: stripePkg?.price != null ? String(stripePkg.price) : '',
    durationMonths: String(
      stripePkg?.packageConfig?.durationMonths
      || data.packageConfig?.durationMonths
      || 1,
    ),
  }
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
  const newData = { ...data, ...rest }
  if (!newData.stripeSubscriptionId) delete newData.stripeSubscriptionId
  return newData
}

async function persistMemberDraft(admin, row, draft, { stripeCustomerId = null } = {}) {
  const newData = memberDataPayload(draft, { ...(row.data || {}) })
  const { error } = await admin
    .from('members')
    .update({
      membership: draft.membership || 'free',
      membership_status: draft.membershipStatus || 'active',
      assigned_coach_id: draft.assignedCoachId || null,
      assigned_dietitian_id: draft.assignedDietitianId || null,
      assigned_doctor_id: draft.assignedDoctorId || null,
      data: newData,
      updated_at: nowISO(),
      ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
    })
    .eq('id', row.id)
  return error
}

async function activateMembership(admin, meta, session) {
  const memberId = meta.memberId
  const planId = meta.planId
  if (!memberId || !planId) return { ok: false, error: 'Eksik metadata' }

  const listPrice = Number(meta.planPrice) || 0
  const amount = session.amount_total != null
    ? session.amount_total / 100
    : listPrice
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
  if (existing) {
    const { data: memberHint } = await admin.from('members').select('id, name').eq('id', memberId).maybeSingle()
    await recordInfluencerEarning(admin, {
      meta,
      session,
      memberRow: memberHint || { id: memberId, name: meta.memberName },
      paymentId: existing.id,
      amountPaid: paidAmountFromSession(session, meta),
      listPrice: Number(meta.planPrice) || paidAmountFromSession(session, meta),
    })
    return { ok: true, duplicate: true }
  }

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
  const subscriptionId = stripeObjectId(session.subscription)
  const customerId = stripeObjectId(session.customer)

  let activePackages = resolvePackagePurchase(
    migrateLegacyToPackages(member),
    planId,
    packageConfig,
    {
      price: amount,
      startedAt: started,
      provider: 'stripe',
      ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
    },
  )

  let draft = syncMemberPackages({
    ...member,
    activePackages,
    premiumStartedAt: member.premiumStartedAt || started,
    premiumExpiresAt: oneTime ? member.premiumExpiresAt : computeExpiry(started, durationMonths),
    lastActiveAt: started,
    ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
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
      ...(customerId ? { stripe_customer_id: customerId } : {}),
      data: newData,
      updated_at: nowISO(),
    })
    .eq('id', memberId)
  if (updErr) return { ok: false, error: updErr.message }

  const durationLabel = oneTime ? 'tek seferlik' : `${durationMonths} ay`

  const { data: payRow } = await admin.from('payments').insert({
    member_id: memberId,
    data: {
      memberName: memberRow.name || '',
      amount,
      listPrice: listPrice || amount,
      influencerCode: meta.influencerCode || '',
      influencerId: meta.influencerId || '',
      packageConfig,
      planId,
      durationMonths,
      status: 'completed',
      provider: 'stripe',
      stripeSessionId: sessionId,
      stripePaymentIntent: stripeObjectId(session.payment_intent),
      stripeSubscriptionId: subscriptionId,
      createdAt: nowISO(),
    },
  }).select('id').maybeSingle()

  await recordInfluencerEarning(admin, {
    meta,
    session,
    memberRow,
    paymentId: payRow?.id || null,
    amountPaid: amount,
    listPrice: listPrice || amount,
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

  const amount = invoice.amount_paid
    ? invoice.amount_paid / 100
    : (Number(meta.planPrice) || 0)
  const plansById = await loadPlansById(admin)
  const plan = plansById.get(planId) || null
  const oneTime = isOneTimePlanId(planId, plan) || isOneTimePlan(planId)
  if (oneTime) return { ok: true, skipped: true }

  const durationMonths = Number(meta.durationMonths) || 1
  const member = memberFromRow(row)
  const packageConfig = await resolveDefaultPackage(admin, planId, durationMonths)
  const started = today()
  const subscriptionId = subscription?.id || null
  const packages = migrateLegacyToPackages(member)
  const target = subscriptionId
    ? findPackageBySubscriptionId(packages, subscriptionId, member)
    : null
  const baseExpiry = target?.expiresAt && target.expiresAt > started
    ? target.expiresAt
    : started
  const stripePeriodEnd = unixSecondsToIsoDate(subscription?.current_period_end)
  const newExpiry = stripePeriodEnd || computeExpiry(baseExpiry, durationMonths)

  let draft = extendPackageForSubscription(member, subscriptionId, {
    expiresAt: newExpiry,
    price: amount,
    planId,
    packageConfig,
    startedAt: started,
  })

  draft = sanitizeStaffForPackage(draft.packageConfig, {
    ...draft,
    premiumStartedAt: member.premiumStartedAt || started,
    lastActiveAt: started,
  })
  const customerId = stripeObjectId(invoice.customer)
  const updErr = await persistMemberDraft(admin, row, draft, { stripeCustomerId: customerId })
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
              amount: paidAmountFromSession(session, meta),
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

        const stripeSubId = invoiceSubscriptionId(invoice)
        if (!stripeSubId) {
          console.warn('[stripe-webhook] invoice.paid: abonelik id yok', invoice.id)
          break
        }

        let subscription = null
        try {
          subscription = await stripe.subscriptions.retrieve(stripeSubId)
        } catch (e) {
          console.warn('[stripe-webhook] invoice.paid: subscription retrieve', stripeSubId, e.message)
        }

        const admin = getSupabaseAdmin()
        let meta = invoiceSubscriptionMetadata(invoice, subscription)
        if (!isYeniFormCheckoutMetadata(meta)) {
          const row = await findMemberForStripeEvent(admin, {
            memberId: meta.memberId,
            subscriptionId: stripeSubId,
            customerId: stripeObjectId(invoice.customer),
          })
          meta = { ...metaFromMemberRow(row, stripeSubId), ...meta }
        }
        if (!isYeniFormCheckoutMetadata(meta)) {
          if (!subscription) {
            return res.status(500).json({ ok: false, error: 'Abonelik okunamadı; Stripe yeniden deneyecek.' })
          }
          console.warn('[stripe-webhook] invoice.paid: Yeni Form metadata yok', invoice.id)
          break
        }

        const result = await renewMembership(admin, meta, invoice, subscription || { id: stripeSubId })
        if (!result.ok) return res.status(500).json({ ok: false, error: result.error })
        if (!result.duplicate && !result.skipped) {
          await notifyPaymentTelegram({
            ok: true,
            meta: { ...meta, durationLabel: `${meta.durationMonths || 1} ay · yenileme` },
            amount: invoice.amount_paid
              ? invoice.amount_paid / 100
              : (Number(meta.planPrice) || 0),
            email: invoice.customer_email || meta.email,
            sessionId: invoice.id,
          })
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const admin = getSupabaseAdmin()
        const meta = subscription.metadata || {}
        const row = await findMemberForStripeEvent(admin, {
          memberId: meta.memberId,
          subscriptionId: subscription.id,
          customerId: stripeObjectId(subscription.customer),
        })
        if (!row) break

        const data = { ...(row.data || {}) }
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
        const after = event.type === 'customer.subscription.deleted'
          ? expirePackageBySubscriptionId(before, subscription.id)
          : applyStripeSubscriptionState(before, subscription)
        const updErr = await persistMemberDraft(admin, row, after)
        if (updErr) return res.status(500).json({ ok: false, error: updErr.message })
        break
      }
      case 'charge.refunded':
      case 'charge.refund.updated': {
        const charge = event.data.object
        const admin = getSupabaseAdmin()
        await reverseInfluencerEarningsForCharge(admin, charge)
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

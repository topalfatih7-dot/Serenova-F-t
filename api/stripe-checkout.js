/**
 * POST /api/stripe-checkout
 * Body (checkout): { planId, durationMonths?: 1|3|6, flow?: 'register'|'change' }
 * Body (portal):   { action: 'create-portal-session' }
 */
import {
  getStripe,
  isStripeConfigured,
  CURRENCY,
  PLAN_FALLBACK,
  toMinorUnits,
  getTierPrice,
  assertStripeMinAmountTry,
  mapStripeCheckoutError,
} from './_stripe.js'
import {
  loadPlansById,
  isCheckoutEligiblePlan,
  isOneTimePlanId,
  tierPriceFromPlan,
} from './_planEntitlements.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'
import { normalizeEmailAddress } from './_email.js'
import { enforceRateLimit, applyRateLimitHeaders } from './_rateLimit.js'

function getOrigin(req) {
  return (
    req.headers.origin ||
    process.env.APP_URL ||
    (req.headers.host ? `https://${req.headers.host}` : '')
  )
}

async function resolveAuthUser(admin, req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return { error: 'Oturum bulunamadı.', status: 401 }
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return { error: 'Oturum doğrulanamadı.', status: 401 }
  }
  return { user: userData.user, token }
}

async function ensureStripeCustomer(stripe, admin, user, checkoutEmail, memberName) {
  const { data: memberRow } = await admin
    .from('members')
    .select('id, email, name, stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  let customerId = memberRow?.stripe_customer_id || null
  if (customerId) {
    try {
      await stripe.customers.retrieve(customerId)
      return customerId
    } catch {
      customerId = null
    }
  }

  const email = checkoutEmail
    || normalizeEmailAddress(memberRow?.email)
    || normalizeEmailAddress(user.email)
    || normalizeEmailAddress(user.user_metadata?.email)

  if (email) {
    const existing = await stripe.customers.list({ email, limit: 1 })
    if (existing.data?.[0]?.id) {
      customerId = existing.data[0].id
    }
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: email || undefined,
      name: memberName || memberRow?.name || user.user_metadata?.name || undefined,
      metadata: { memberId: user.id },
    })
    customerId = customer.id
  }

  if (memberRow?.id && customerId) {
    await admin
      .from('members')
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq('id', user.id)
  }

  return customerId
}

async function handlePortalSession(req, res, admin) {
  const auth = await resolveAuthUser(admin, req)
  if (auth.error) return res.status(auth.status).json({ ok: false, error: auth.error })

  const stripe = getStripe()
  const { data: memberRow } = await admin
    .from('members')
    .select('id, email, name, stripe_customer_id')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (!memberRow) {
    return res.status(404).json({ ok: false, error: 'Üye kaydı bulunamadı.' })
  }

  let customerId = memberRow.stripe_customer_id
  if (!customerId) {
    const email = normalizeEmailAddress(memberRow.email)
      || normalizeEmailAddress(auth.user.email)
    customerId = await ensureStripeCustomer(
      stripe,
      admin,
      auth.user,
      email,
      memberRow.name,
    )
  }

  if (!customerId) {
    return res.status(400).json({
      ok: false,
      error: 'Stripe müşteri kaydı bulunamadı. Önce bir ödeme tamamlayın.',
    })
  }

  const origin = getOrigin(req)
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/profile/payments`,
  })

  return res.status(200).json({ ok: true, url: portal.url })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Yalnızca POST desteklenir' })

  if (!isStripeConfigured()) {
    return res.status(503).json({ ok: false, error: 'Ödeme yapılandırması eksik (STRIPE_SECRET_KEY).' })
  }
  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ ok: false, error: 'Sunucu yapılandırması eksik (SUPABASE_SERVICE_ROLE_KEY).' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    const admin = getSupabaseAdmin()

    const rl = await enforceRateLimit({
      req,
      prefix: 'stripe-checkout',
      limit: 30,
      windowMs: 60 * 60 * 1000,
    })
    applyRateLimitHeaders(res, rl)
    if (!rl.ok) {
      return res.status(429).json({ ok: false, error: 'Çok fazla istek. Lütfen sonra tekrar deneyin.' })
    }

    if (body.action === 'create-portal-session') {
      return await handlePortalSession(req, res, admin)
    }

    const planId = String(body.planId || '')
    const flow = body.flow === 'change' ? 'change' : 'register'

    // Checkout için her zaman taze satır oku (yeni admin paketleri cache'e takılmasın)
    const { data: planRow, error: planErr } = await admin
      .from('plans')
      .select('*')
      .eq('id', planId)
      .maybeSingle()
    if (planErr) {
      return res.status(500).json({ ok: false, error: 'Plan bilgisi okunamadı.' })
    }

    let plan = null
    if (planRow) {
      const sellableRaw = planRow.is_sellable
      plan = {
        id: planRow.id,
        name: planRow.name,
        price: Number(planRow.price) || 0,
        period: planRow.period || 'Aylık',
        isActive: planRow.is_active !== false,
        isSellable: sellableRaw == null
          ? (Number(planRow.price) > 0 && planRow.id !== 'free')
          : sellableRaw === true,
        billingType: planRow.billing_type === 'one_time' ? 'one_time' : 'recurring',
        entitlements: planRow.entitlements || {},
        pricingTiers: planRow.pricing_tiers || [],
      }
    } else {
      // Cache / legacy fallback
      const plansById = await loadPlansById(admin)
      plan = plansById.get(planId) || null
    }

    let eligible = false
    if (!plan) {
      eligible = Boolean(PLAN_FALLBACK[planId])
    } else if (plan.isActive === false) {
      eligible = false
    } else if (plan.isSellable === true) {
      eligible = Number(plan.price) > 0 || isOneTimePlanId(planId, plan) || isCheckoutEligiblePlan(plan)
    } else if (plan.isSellable === false) {
      eligible = false
    } else {
      eligible = plan.isActive !== false && (Number(plan.price) > 0 || Boolean(PLAN_FALLBACK[planId]))
    }

    if (!eligible) {
      return res.status(400).json({
        ok: false,
        error: 'Geçersiz veya satışa kapalı plan. Admin panelinden paketinin aktif ve satışa açık olduğundan emin olun.',
      })
    }

    const oneTime = isOneTimePlanId(planId, plan)
    const durationMonths = oneTime
      ? 1
      : ([1, 3, 6].includes(Number(body.durationMonths))
        ? Number(body.durationMonths)
        : 1)

    const auth = await resolveAuthUser(admin, req)
    if (auth.error) return res.status(auth.status).json({ ok: false, error: auth.error })
    const user = auth.user

    let checkoutEmail = normalizeEmailAddress(body.email)
      || normalizeEmailAddress(user.email)
      || normalizeEmailAddress(user.user_metadata?.email)

    let memberName = user.user_metadata?.name || user.user_metadata?.full_name || ''
    if (!checkoutEmail || !memberName) {
      const { data: memberRow } = await admin.from('members').select('email, name').eq('id', user.id).maybeSingle()
      if (!checkoutEmail) checkoutEmail = normalizeEmailAddress(memberRow?.email)
      if (!memberName) memberName = memberRow?.name || ''
    }

    let planName = plan?.name || PLAN_FALLBACK[planId]?.name || planId
    let planPrice = plan
      ? tierPriceFromPlan(plan, durationMonths)
      : getTierPrice(planId, durationMonths)

    if (!planPrice || planPrice <= 0) {
      return res.status(400).json({ ok: false, error: 'Plan fiyatı bulunamadı.' })
    }

    const minCheck = assertStripeMinAmountTry(planPrice)
    if (!minCheck.ok) {
      return res.status(400).json({ ok: false, error: minCheck.error })
    }

    const durationLabel = oneTime
      ? 'Tek Seferlik'
      : (durationMonths === 1 ? '1 ay' : `${durationMonths} ay`)
    const origin = getOrigin(req)
    const successPath = flow === 'change' ? '/profile' : '/dashboard'
    const cancelPath = flow === 'change' ? '/plans' : '/onboarding'

    const stripe = getStripe()
    const customerId = await ensureStripeCustomer(stripe, admin, user, checkoutEmail, memberName)

    const metadata = {
      memberId: user.id,
      memberName: memberName || '',
      planId,
      planName,
      planPrice: String(planPrice),
      durationMonths: String(durationMonths),
      durationLabel,
      flow,
    }
    if (checkoutEmail) metadata.email = checkoutEmail

    // recurring plan → Stripe Subscription (otomatik yenileme); doktor → tek seferlik payment
    const useSubscription = !oneTime
    const productName = oneTime ? planName : `${planName} (${durationLabel})`
    const productDescription = oneTime
      ? `${planName} — 1 online doktor görüşmesi`
      : `${planName} — ${durationLabel} üyelik · süre sonunda otomatik yenilenir`

    const priceData = {
      currency: CURRENCY,
      unit_amount: toMinorUnits(planPrice),
      product_data: {
        name: productName,
        description: productDescription,
      },
    }
    if (useSubscription) {
      priceData.recurring = {
        interval: 'month',
        interval_count: durationMonths,
      }
    }

    const sessionParams = {
      mode: useSubscription ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      client_reference_id: user.id,
      customer: customerId,
      line_items: [{ quantity: 1, price_data: priceData }],
      metadata,
      success_url: `${origin}${successPath}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}?payment=cancelled`,
    }

    if (useSubscription) {
      sessionParams.subscription_data = { metadata }
    } else {
      sessionParams.payment_intent_data = { metadata }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return res.status(200).json({ ok: true, url: session.url, id: session.id })
  } catch (e) {
    return res.status(500).json({ ok: false, error: mapStripeCheckoutError(e) })
  }
}

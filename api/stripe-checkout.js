/**
 * POST /api/stripe-checkout
 * Body: { planId, durationMonths?: 1|3|6, flow?: 'register'|'change' }
 */
import { getStripe, isStripeConfigured, CURRENCY, PLAN_FALLBACK, isPaidPlanId, toMinorUnits, getTierPrice } from './_stripe.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'

function getOrigin(req) {
  return (
    req.headers.origin ||
    process.env.APP_URL ||
    (req.headers.host ? `https://${req.headers.host}` : '')
  )
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
    const planId = String(body.planId || '')
    const flow = body.flow === 'change' ? 'change' : 'register'
    const durationMonths = [1, 3, 6].includes(Number(body.durationMonths))
      ? Number(body.durationMonths)
      : 1

    if (!isPaidPlanId(planId)) {
      return res.status(400).json({ ok: false, error: 'Geçersiz plan.' })
    }

    const authHeader = req.headers.authorization || req.headers.Authorization || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) return res.status(401).json({ ok: false, error: 'Oturum bulunamadı.' })

    const admin = getSupabaseAdmin()
    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) {
      return res.status(401).json({ ok: false, error: 'Oturum doğrulanamadı.' })
    }
    const user = userData.user

    let planName = PLAN_FALLBACK[planId]?.name || planId
    let planPrice = getTierPrice(planId, durationMonths)

    const { data: planRow } = await admin.from('plans').select('*').eq('id', planId).maybeSingle()
    if (planRow) {
      if (planRow.name) planName = planRow.name
      const tiers = planRow.pricing_tiers || planRow.data?.pricingTiers
      if (Array.isArray(tiers)) {
        const tier = tiers.find((t) => Number(t.months) === durationMonths)
        if (tier?.price) planPrice = tier.price
      } else if (durationMonths === 1 && typeof planRow.price === 'number' && planRow.price > 0) {
        planPrice = planRow.price
      }
    }

    if (!planPrice || planPrice <= 0) {
      return res.status(400).json({ ok: false, error: 'Plan fiyatı bulunamadı.' })
    }

    const durationLabel = durationMonths === 1 ? '1 ay' : `${durationMonths} ay`
    const origin = getOrigin(req)
    const successPath = flow === 'change' ? '/profile' : '/dashboard'
    const cancelPath = flow === 'change' ? '/onboarding' : '/onboarding'

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: toMinorUnits(planPrice),
            product_data: {
              name: `${planName} (${durationLabel})`,
              description: `${planName} — ${durationLabel} üyelik`,
            },
          },
        },
      ],
      metadata: {
        memberId: user.id,
        planId,
        planPrice: String(planPrice),
        durationMonths: String(durationMonths),
        flow,
      },
      success_url: `${origin}${successPath}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}?payment=cancelled`,
    })

    return res.status(200).json({ ok: true, url: session.url, id: session.id })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) })
  }
}

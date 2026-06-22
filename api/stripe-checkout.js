/**
 * POST /api/stripe-checkout
 * Seçilen plan için bir Stripe Checkout oturumu oluşturur ve ödeme sayfası URL'sini döndürür.
 *
 * Body:  { planId: 'gumus'|'altin'|'platinum'|'premium', flow?: 'register'|'change' }
 * Header: Authorization: Bearer <supabase access token>   (kullanıcıyı doğrulamak için)
 *
 * Üyelik, ödeme onaylanınca `api/stripe-webhook.js` tarafından aktifleştirilir.
 */
import { getStripe, isStripeConfigured, CURRENCY, PLAN_FALLBACK, isPaidPlanId, toMinorUnits } from './_stripe.js'
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

    if (!isPaidPlanId(planId)) {
      return res.status(400).json({ ok: false, error: 'Geçersiz plan.' })
    }

    // Kullanıcıyı access token ile doğrula (memberId istemciden GÜVENİLMEZ)
    const authHeader = req.headers.authorization || req.headers.Authorization || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) return res.status(401).json({ ok: false, error: 'Oturum bulunamadı.' })

    const admin = getSupabaseAdmin()
    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) {
      return res.status(401).json({ ok: false, error: 'Oturum doğrulanamadı.' })
    }
    const user = userData.user

    // Fiyatı SUNUCUDA belirle (istemci tutarına güvenme): önce plans tablosu, sonra yedek.
    let planName = PLAN_FALLBACK[planId]?.name || planId
    let planPrice = PLAN_FALLBACK[planId]?.price || 0
    let durationWeeks = PLAN_FALLBACK[planId]?.durationWeeks || 4

    const { data: planRow } = await admin.from('plans').select('*').eq('id', planId).maybeSingle()
    if (planRow) {
      const pdata = planRow.data || planRow
      if (typeof pdata.price === 'number' && pdata.price > 0) planPrice = pdata.price
      if (pdata.name) planName = pdata.name
    }

    if (!planPrice || planPrice <= 0) {
      return res.status(400).json({ ok: false, error: 'Plan fiyatı bulunamadı.' })
    }

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
              name: planName,
              description: `${planName} — ${durationWeeks} haftalık üyelik`,
            },
          },
        },
      ],
      metadata: {
        memberId: user.id,
        planId,
        planPrice: String(planPrice),
        durationWeeks: String(durationWeeks),
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

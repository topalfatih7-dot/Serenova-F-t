/**
 * POST /api/stripe-webhook
 * Stripe ödeme olaylarını dinler. `checkout.session.completed` gelince üyeliği
 * SUNUCU tarafında (service-role) aktifleştirir ve `payments` kaydı oluşturur.
 *
 * Gerekli env:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET        (Stripe Dashboard → Developers → Webhooks → Signing secret)
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * NOT: İmza doğrulaması için HAM gövde gerekir → bodyParser kapalı.
 */
import { getStripe, isStripeConfigured } from './_stripe.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'

// Vercel: gövdeyi ayrıştırma, ham byte'ları biz okuyacağız (imza doğrulaması için)
export const config = { api: { bodyParser: false } }

const today = () => new Date().toISOString().split('T')[0]
const nowISO = () => new Date().toISOString()

function computeExpiry(startDate, durationWeeks) {
  const d = new Date(startDate || today())
  d.setDate(d.getDate() + (Number(durationWeeks) || 4) * 7)
  return d.toISOString().split('T')[0]
}

function defaultPackageForPlan(planId) {
  switch (planId) {
    case 'gumus': return { coachMeetingsPerWeek: 1, dietitianMeetingsPerMonth: 1, durationWeeks: 4, addOns: [] }
    case 'altin': return { coachMeetingsPerWeek: 2, dietitianMeetingsPerMonth: 2, durationWeeks: 4, addOns: [] }
    case 'platinum': return { coachMeetingsPerWeek: 3, dietitianMeetingsPerMonth: 4, durationWeeks: 4, addOns: [] }
    default: return { coachMeetingsPerWeek: 2, dietitianMeetingsPerMonth: 1, durationWeeks: 4, addOns: [] }
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

async function activateMembership(admin, meta, session) {
  const memberId = meta.memberId
  const planId = meta.planId
  if (!memberId || !planId) return { ok: false, error: 'Eksik metadata' }

  const amount = Number(meta.planPrice) || (session.amount_total ? session.amount_total / 100 : 0)
  const durationWeeks = Number(meta.durationWeeks) || 4
  const sessionId = session.id

  // Idempotency: bu oturum için ödeme zaten kaydedildiyse tekrar işleme.
  const { data: existing } = await admin
    .from('payments')
    .select('id')
    .eq('member_id', memberId)
    .filter('data->>stripeSessionId', 'eq', sessionId)
    .maybeSingle()
  if (existing) return { ok: true, duplicate: true }

  const { data: row, error: fetchErr } = await admin.from('members').select('*').eq('id', memberId).maybeSingle()
  if (fetchErr || !row) return { ok: false, error: 'Üye bulunamadı' }

  const data = row.data || {}
  const packageConfig = defaultPackageForPlan(planId)
  const started = today()
  const expires = computeExpiry(started, durationWeeks)

  const newData = {
    ...data,
    packageConfig,
    premiumStartedAt: started,
    premiumExpiresAt: expires,
    pauseUntil: null,
    lastActiveAt: started,
  }

  const { error: updErr } = await admin
    .from('members')
    .update({ membership: planId, membership_status: 'active', data: newData, updated_at: nowISO() })
    .eq('id', memberId)
  if (updErr) return { ok: false, error: updErr.message }

  await admin.from('payments').insert({
    member_id: memberId,
    data: {
      memberName: row.name || '',
      amount,
      packageConfig,
      status: 'completed',
      provider: 'stripe',
      stripeSessionId: sessionId,
      stripePaymentIntent: session.payment_intent || null,
      createdAt: nowISO(),
    },
  })

  await admin.from('activities').insert({
    member_id: memberId,
    data: { type: 'payment', text: `${row.name || 'Üye'} ${planId} planı için ödeme tamamladı (${amount.toLocaleString('tr-TR')}₺)`, createdAt: nowISO() },
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
    // Ham gövde okunabiliyorsa (Vercel/production) imzayı doğrula.
    if (typeof req.on === 'function' && !req.readableEnded) {
      const raw = await readRawBody(req)
      event = stripe.webhooks.constructEvent(raw, sig, webhookSecret)
    } else {
      // Yerel geliştirme: ham gövde yok → güvenli değil. Sadece bypass açıkken.
      if (process.env.STRIPE_WEBHOOK_DEV_BYPASS !== 'true') {
        return res.status(400).json({ ok: false, error: 'Ham gövde yok; imza doğrulanamıyor.' })
      }
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    }
  } catch (e) {
    return res.status(400).json({ ok: false, error: `İmza doğrulanamadı: ${e.message}` })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      if (session.payment_status === 'paid' || session.status === 'complete') {
        const admin = getSupabaseAdmin()
        const result = await activateMembership(admin, session.metadata || {}, session)
        if (!result.ok) return res.status(500).json({ ok: false, error: result.error })
      }
    }
    return res.status(200).json({ received: true })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) })
  }
}

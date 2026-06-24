/**
 * POST /api/stripe-webhook
 */
import { getStripe, isStripeConfigured } from './_stripe.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'

export const config = { api: { bodyParser: false } }

const today = () => new Date().toISOString().split('T')[0]
const nowISO = () => new Date().toISOString()

function computeExpiry(startDate, durationMonths) {
  const d = new Date(startDate || today())
  d.setMonth(d.getMonth() + (Number(durationMonths) || 1))
  return d.toISOString().split('T')[0]
}

function defaultPackageForPlan(planId, durationMonths = 1) {
  const months = Number(durationMonths) || 1
  const configs = {
    eko: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 0 },
    diyet: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 2 },
    spor: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 0 },
    kurucu: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2 },
    vip: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2 },
    gumus: { coachMeetingsPerMonth: 1, dietitianMeetingsPerMonth: 1, coachMeetingsPerWeek: 1 },
    altin: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2, coachMeetingsPerWeek: 2 },
    platinum: { coachMeetingsPerMonth: 4, dietitianMeetingsPerMonth: 4, coachMeetingsPerWeek: 3 },
    premium: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2, coachMeetingsPerWeek: 2 },
  }
  const base = configs[planId] || { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 0 }
  return {
    coachMeetingsPerWeek: 0,
    addOns: [],
    ...base,
    durationMonths: months,
    durationWeeks: months * 4,
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
  const durationMonths = Number(meta.durationMonths) || Number(meta.durationWeeks) / 4 || 1
  const sessionId = session.id

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
  const packageConfig = defaultPackageForPlan(planId, durationMonths)
  const started = today()
  const expires = computeExpiry(started, durationMonths)

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
      durationMonths,
      status: 'completed',
      provider: 'stripe',
      stripeSessionId: sessionId,
      stripePaymentIntent: session.payment_intent || null,
      createdAt: nowISO(),
    },
  })

  await admin.from('activities').insert({
    member_id: memberId,
    data: { type: 'payment', text: `${row.name || 'Üye'} ${planId} planı (${durationMonths} ay) için ödeme tamamladı (${amount.toLocaleString('tr-TR')}₺)`, createdAt: nowISO() },
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

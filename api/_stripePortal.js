/**
 * Stripe Customer Portal configuration — iptal modu Dashboard varsayılanına bırakılmaz.
 * Env varsa o id kullanılır; yoksa metadata ile bulunur veya oluşturulur.
 */

const META_KEY = 'yeniform_portal'
const CACHE = { manage: null, period_end: null, immediately: null }

const KIND_META = {
  manage: 'manage',
  period_end: 'cancel_period_end',
  immediately: 'cancel_immediately',
}

function envConfigId(kind) {
  if (kind === 'manage') return String(process.env.STRIPE_PORTAL_CONFIG_MANAGE || '').trim()
  if (kind === 'period_end') return String(process.env.STRIPE_PORTAL_CONFIG_PERIOD_END || '').trim()
  if (kind === 'immediately') return String(process.env.STRIPE_PORTAL_CONFIG_IMMEDIATE || '').trim()
  return ''
}

function legalBase() {
  return String(process.env.APP_URL || 'https://www.yeniform.com').replace(/\/$/, '')
}

function configurationParams(kind) {
  const origin = legalBase()
  const cancelEnabled = kind !== 'manage'
  const features = {
    customer_update: {
      enabled: true,
      allowed_updates: ['email', 'address', 'name'],
    },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: cancelEnabled
      ? {
          enabled: true,
          mode: kind === 'immediately' ? 'immediately' : 'at_period_end',
          proration_behavior: 'none',
        }
      : { enabled: false },
  }
  return {
    business_profile: {
      headline: 'Yeni Form',
      privacy_policy_url: `${origin}/legal/gizlilik-politikasi`,
      terms_of_service_url: `${origin}/legal/uyelik-ve-abonelik-sozlesmesi`,
    },
    features,
    metadata: { [META_KEY]: KIND_META[kind] },
  }
}

async function findConfigByMeta(stripe, kind) {
  const marker = KIND_META[kind]
  const listed = await stripe.billingPortal.configurations.list({ limit: 100, active: true })
  return listed.data.find((c) => String(c.metadata?.[META_KEY] || '') === marker)?.id || null
}

export async function resolvePortalConfigurationId(stripe, kind) {
  if (CACHE[kind]) return CACHE[kind]
  const fromEnv = envConfigId(kind)
  if (fromEnv) {
    CACHE[kind] = fromEnv
    return fromEnv
  }
  const existing = await findConfigByMeta(stripe, kind)
  if (existing) {
    CACHE[kind] = existing
    return existing
  }
  const created = await stripe.billingPortal.configurations.create(configurationParams(kind))
  CACHE[kind] = created.id
  return created.id
}

export async function assertSubscriptionBelongsToCustomer(stripe, subscriptionId, customerId) {
  const sid = String(subscriptionId || '').trim()
  const cid = String(customerId || '').trim()
  if (!sid || !cid) return { ok: false, error: 'Abonelik bulunamadı.' }
  let sub
  try {
    sub = await stripe.subscriptions.retrieve(sid)
  } catch {
    return { ok: false, error: 'Abonelik okunamadı.' }
  }
  const subCustomer = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
  if (subCustomer !== cid) {
    return { ok: false, error: 'Bu abonelik hesabınıza ait değil.', status: 403 }
  }
  return { ok: true, subscription: sub }
}

export async function createBillingPortalSession(stripe, {
  customerId,
  returnUrl,
  intent = 'manage',
  mode = null,
  subscriptionId = null,
}) {
  const safeReturn = returnUrl || `${legalBase()}/profile/payments`

  if (intent === 'manage') {
    const configuration = await resolvePortalConfigurationId(stripe, 'manage')
    return stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: safeReturn,
      configuration,
    })
  }

  if (intent === 'cancel') {
    const cancelMode = mode === 'immediately' ? 'immediately' : 'at_period_end'
    const owned = await assertSubscriptionBelongsToCustomer(stripe, subscriptionId, customerId)
    if (!owned.ok) {
      const err = new Error(owned.error)
      err.status = owned.status || 400
      throw err
    }
    const configuration = await resolvePortalConfigurationId(
      stripe,
      cancelMode === 'immediately' ? 'immediately' : 'period_end',
    )
    return stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: safeReturn,
      configuration,
      flow_data: {
        type: 'subscription_cancel',
        subscription_cancel: { subscription: subscriptionId },
        after_completion: {
          type: 'redirect',
          redirect: { return_url: safeReturn },
        },
      },
    })
  }

  const err = new Error('Geçersiz portal isteği.')
  err.status = 400
  throw err
}

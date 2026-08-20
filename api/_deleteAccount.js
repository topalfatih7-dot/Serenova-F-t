/**
 * Üye self-serve hesap silme (Play / KVKK).
 * Stripe abonelikleri hemen kapanır (proration none, iade yok); ardından members + auth user.
 */
import { getStripe, isStripeConfigured } from './_stripe.js'
import { getSupabaseUrl } from './_supabaseAdmin.js'

export const CANCELABLE_SUB_STATUSES = new Set([
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'paused',
  'incomplete',
])

export function userHasPasswordProvider(user) {
  const providers = user?.app_metadata?.providers
  if (Array.isArray(providers) && providers.includes('email')) return true
  const identities = user?.identities
  if (Array.isArray(identities) && identities.some((i) => i?.provider === 'email')) return true
  /* Çoğu e-posta/şifre hesabında identities boş kalabilir — varsayılan şifre iste. */
  if (!Array.isArray(identities) || identities.length === 0) return true
  return false
}

export function emailsMatch(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase()
}

export async function verifyAccountPassword(email, password) {
  const url = getSupabaseUrl()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return { ok: false, error: 'Sunucu yapılandırması eksik.' }
  }
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ email, password }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json?.access_token) {
    return { ok: false, error: 'Şifre hatalı.' }
  }
  const uid = json.user?.id || json.user_id || null
  return { ok: true, userId: uid }
}

export async function cancelStripeSubscriptionsForCustomer(customerId) {
  if (!customerId || !isStripeConfigured()) return { cancelled: 0, skipped: !customerId }
  const stripe = getStripe()
  if (!stripe) return { cancelled: 0, skipped: true }

  let cancelled = 0
  const listed = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 100,
  })
  for (const sub of listed.data || []) {
    if (!CANCELABLE_SUB_STATUSES.has(sub.status)) continue
    await stripe.subscriptions.cancel(sub.id, { prorate: false, invoice_now: false })
    cancelled += 1
  }
  return { cancelled }
}

async function removeHealthLabFiles(admin, userId) {
  const { data: files, error } = await admin.storage.from('health-lab-results').list(userId, {
    limit: 1000,
  })
  if (error || !files?.length) return
  const paths = files
    .map((f) => f?.name)
    .filter(Boolean)
    .map((name) => `${userId}/${name}`)
  if (paths.length) {
    await admin.storage.from('health-lab-results').remove(paths)
  }
}

export async function purgeMemberAccount(admin, userId) {
  await removeHealthLabFiles(admin, userId).catch(() => {})
  await admin.from('user_presence').delete().eq('user_id', userId)
  await admin.from('device_push_tokens').delete().eq('user_id', userId)

  const { error: memberErr } = await admin.from('members').delete().eq('id', userId)
  if (memberErr) {
    const { data: threads } = await admin.from('chat_threads').select('id').eq('member_id', userId)
    const ids = (threads || []).map((t) => t.id).filter(Boolean)
    if (ids.length) {
      await admin.from('chat_messages').delete().in('thread_id', ids)
      await admin.from('chat_threads').delete().eq('member_id', userId)
    }
    const retry = await admin.from('members').delete().eq('id', userId)
    if (retry.error) {
      throw new Error(retry.error.message || 'Üye kaydı silinemedi.')
    }
  }

  const { error: authErr } = await admin.auth.admin.deleteUser(userId)
  if (authErr) {
    throw new Error(authErr.message || 'Giriş kaydı silinemedi.')
  }
}

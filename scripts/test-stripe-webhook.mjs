/**
 * Stripe webhook YAPISI entegrasyon testi (Stripe hesabı GEREKMEZ).
 *
 * Ne yapar:
 *  1) .env.local'i yükler (service role + Telegram).
 *  2) Geçici bir test auth kullanıcısı + üye kaydı oluşturur.
 *  3) Sahte bir `checkout.session.completed` (başarılı) event'i üretip GERÇEK
 *     `api/stripe-webhook.js` handler'ını dev-bypass modunda çalıştırır.
 *     → Üyelik aktivasyonu + payments + activities + Telegram ✅ doğrulanır.
 *  4) Sahte bir `payment_intent.payment_failed` (başarısız) event'i çalıştırır.
 *     → Telegram ❌ doğrulanır.
 *  5) Test üyesini ve tüm kayıtlarını siler (temizlik).
 *
 * Canlı Stripe anahtarına DOKUNMAZ: dummy sk_test kullanılır, imza atlanır,
 * hiçbir Stripe API çağrısı yapılmaz.
 *
 * Çalıştır:  node scripts/test-stripe-webhook.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnv() {
  const path = join(root, '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const key = t.slice(0, i).trim()
    let val = t.slice(i + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnv()

// --- Canlı anahtarı testte KULLANMA: dummy test anahtarı + imza atlama ---
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_local_structure_test'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_dummy_local'
process.env.STRIPE_WEBHOOK_DEV_BYPASS = 'true'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY eksik (.env.local)')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function mockRes() {
  return {
    statusCode: null,
    body: null,
    setHeader() {},
    status(code) { this.statusCode = code; return this },
    json(obj) { this.body = obj; return this },
    end() { return this },
  }
}

async function callWebhook(handler, event) {
  const req = {
    method: 'POST',
    headers: { 'stripe-signature': 'test', 'content-type': 'application/json' },
    body: JSON.stringify(event),
  }
  const res = mockRes()
  await handler(req, res)
  return res
}

async function main() {
  const stamp = Date.now()
  const email = `stripe-test-${stamp}@example.com`
  const name = 'Stripe Test Üyesi'
  let userId = null
  const results = []
  const pass = (m) => { results.push(['✅', m]); console.log('✅', m) }
  const fail = (m) => { results.push(['❌', m]); console.log('❌', m) }

  console.log('\n=== Stripe webhook yapı testi başlıyor ===\n')
  console.log('Telegram chat:', process.env.TELEGRAM_PAYMENT_CHAT_ID || process.env.TELEGRAM_CHAT_ID || '(yok)')

  try {
    // 1) Test kullanıcısı
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password: `Test!${stamp}`,
      email_confirm: true,
      user_metadata: { name },
    })
    if (cErr || !created?.user) throw new Error('Kullanıcı oluşturulamadı: ' + (cErr?.message || '?'))
    userId = created.user.id
    pass(`Test kullanıcısı oluşturuldu (${email})`)

    // 2) Üye kaydı (handle_new_user artık otomatik members oluşturmaz — plan değişimi testi için manuel)
    const joined = new Date().toISOString().split('T')[0]
    const { error: mErr } = await admin.from('members').insert({
      id: userId,
      email,
      name,
      phone: '5550000000',
      role: 'member',
      membership: 'free',
      membership_status: 'active',
      data: {
        phone: '5550000000',
        gender: 'female',
        joinedAt: joined,
        lastActiveAt: joined,
        packageConfig: {
          coachMeetingsPerMonth: 0,
          dietitianMeetingsPerMonth: 0,
          doctorMeetingsPerMonth: 0,
          coachMeetingsPerWeek: 0,
          durationMonths: 0,
          durationWeeks: 0,
          addOns: [],
        },
        profileComplete: true,
      },
      updated_at: new Date().toISOString(),
    })
    if (mErr) throw new Error('members kaydı oluşturulamadı: ' + mErr.message)
    pass(`members kaydı oluşturuldu (membership=free, status=active)`)

    // 3) Handler'ı yükle
    const mod = await import('../api/stripe-webhook.js')
    const handler = mod.default
    if (typeof handler !== 'function') throw new Error('Webhook handler import edilemedi')

    // 4) BAŞARILI event
    const sessionId = `cs_test_${stamp}`
    const successEvent = {
      type: 'checkout.session.completed',
      data: { object: {
        id: sessionId,
        payment_status: 'paid',
        status: 'complete',
        amount_total: 499900,
        payment_intent: `pi_test_${stamp}`,
        customer_email: email,
        customer_details: { email },
        metadata: {
          memberId: userId,
          memberName: name,
          planId: 'vip',
          planName: 'Vip Paket',
          planPrice: '4999',
          durationMonths: '1',
          durationLabel: '1 ay',
          flow: 'change',
          email,
        },
      } },
    }
    const r1 = await callWebhook(handler, successEvent)
    if (r1.statusCode === 200) pass(`Başarılı event işlendi (HTTP 200) → Telegram ✅ gönderildi`)
    else fail(`Başarılı event HTTP ${r1.statusCode}: ${JSON.stringify(r1.body)}`)

    // 4a) Üyelik aktivasyonu doğrula
    const { data: afterRow } = await admin.from('members').select('*').eq('id', userId).maybeSingle()
    if (afterRow?.membership === 'vip') pass(`Üyelik güncellendi → membership=vip`)
    else fail(`Üyelik güncellenmedi (membership=${afterRow?.membership})`)
    if (afterRow?.membership_status === 'active') pass(`membership_status=active`)
    else fail(`membership_status beklenen 'active' değil (${afterRow?.membership_status})`)
    if (afterRow?.data?.premiumExpiresAt) pass(`premiumExpiresAt set: ${afterRow.data.premiumExpiresAt}`)
    else fail(`premiumExpiresAt boş`)

    // 4b) payments kaydı doğrula
    const { data: pays } = await admin.from('payments').select('*').eq('member_id', userId)
    const stripePay = (pays || []).find((p) => p.data?.stripeSessionId === sessionId)
    if (stripePay) pass(`payments kaydı oluştu (amount=${stripePay.data.amount}, provider=${stripePay.data.provider}, status=${stripePay.data.status})`)
    else fail(`payments kaydı bulunamadı`)

    // 4c) idempotency: aynı event tekrar → mükerrer kayıt olmamalı
    await callWebhook(handler, successEvent)
    const { data: pays2 } = await admin.from('payments').select('id, data').eq('member_id', userId)
    const dupCount = (pays2 || []).filter((p) => p.data?.stripeSessionId === sessionId).length
    if (dupCount === 1) pass(`Idempotent: aynı session tekrar işlenmedi (1 kayıt)`)
    else fail(`Idempotency HATASI: ${dupCount} kayıt (Telegram tekrar gitmemeli)`)

    // 4d) activities kaydı
    const { data: acts } = await admin.from('activities').select('*').eq('member_id', userId)
    const payAct = (acts || []).find((a) => a.data?.type === 'payment')
    if (payAct) pass(`activities kaydı oluştu (${payAct.data.text?.slice(0, 60)}...)`)
    else fail(`activities 'payment' kaydı bulunamadı`)

    // 5) BAŞARISIZ event → sadece Telegram ❌
    const failEvent = {
      type: 'payment_intent.payment_failed',
      data: { object: {
        id: `pi_test_fail_${stamp}`,
        amount: 649900,
        receipt_email: email,
        last_payment_error: { message: 'Your card was declined.' },
        metadata: {
          memberId: userId,
          memberName: name,
          planId: 'diyet',
          planName: 'Diyet Paketi',
          planPrice: '6499',
          durationMonths: '3',
          durationLabel: '3 ay',
          email,
        },
      } },
    }
    const r2 = await callWebhook(handler, failEvent)
    if (r2.statusCode === 200) pass(`Başarısız event işlendi (HTTP 200) → Telegram ❌ gönderildi`)
    else fail(`Başarısız event HTTP ${r2.statusCode}: ${JSON.stringify(r2.body)}`)

    // 6) checkout.session.expired → Telegram ❌
    const expiredEvent = {
      type: 'checkout.session.expired',
      data: { object: {
        id: `cs_test_expired_${stamp}`,
        amount_total: 129900,
        customer_email: email,
        customer_details: { email },
        metadata: {
          memberId: userId, memberName: name, planId: 'eko', planName: 'Eko Paket',
          planPrice: '1299', durationMonths: '1', durationLabel: '1 ay', email,
        },
      } },
    }
    const r3 = await callWebhook(handler, expiredEvent)
    if (r3.statusCode === 200) pass(`Süresi dolmuş oturum işlendi (HTTP 200) → Telegram ❌`)
    else fail(`Expired event HTTP ${r3.statusCode}`)
  } catch (e) {
    fail(`İSTİSNA: ${e.message}`)
  } finally {
    // 7) Temizlik
    if (userId) {
      try {
        await admin.from('payments').delete().eq('member_id', userId)
        await admin.from('activities').delete().eq('member_id', userId)
        await admin.from('members').delete().eq('id', userId)
        await admin.auth.admin.deleteUser(userId)
        console.log('\n🧹 Test üyesi ve kayıtları silindi.')
      } catch (e) {
        console.log('\n⚠️ Temizlik hatası (manuel silmen gerekebilir):', e.message, '\n   userId:', userId)
      }
    }
  }

  const failed = results.filter((r) => r[0] === '❌').length
  console.log(`\n=== Sonuç: ${results.length - failed}/${results.length} geçti, ${failed} hata ===\n`)
  process.exit(failed ? 1 : 0)
}

main()

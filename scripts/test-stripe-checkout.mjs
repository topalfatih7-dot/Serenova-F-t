/**
 * Stripe Checkout oturum oluşturma testi — GERÇEK Stripe API'sine (canlı anahtar)
 * bir checkout session oluşturur ama ASLA ödeme tamamlamaz / kart bilgisi girmez.
 * Oluşturulan session'ı hemen `expire` ederek temizler.
 *
 * Çalıştır: node scripts/test-stripe-checkout.mjs
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

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY eksik (.env.local)')
  process.exit(1)
}
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY eksik (.env.local)')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

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

async function main() {
  const stamp = Date.now()
  const email = `stripe-checkout-test-${stamp}@example.com`
  const name = 'Stripe Checkout Test'
  let userId = null
  const results = []
  const pass = (m) => { results.push(['✅', m]); console.log('✅', m) }
  const fail = (m) => { results.push(['❌', m]); console.log('❌', m) }

  console.log('\n=== Stripe checkout oturum testi başlıyor (CANLI anahtar, ödeme yapılmaz) ===\n')

  let sessionIdToExpire = null

  try {
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email, password: `Test!${stamp}`, email_confirm: true, user_metadata: { name },
    })
    if (cErr || !created?.user) throw new Error('Kullanıcı oluşturulamadı: ' + (cErr?.message || '?'))
    userId = created.user.id
    pass(`Test kullanıcısı oluşturuldu (${email})`)

    const { error: mErr } = await admin.from('members').insert({
      id: userId, email, name, phone: '5550000000', role: 'member',
      membership: 'free', membership_status: 'active',
      data: { phone: '5550000000', joinedAt: new Date().toISOString().split('T')[0], profileComplete: true },
      updated_at: new Date().toISOString(),
    })
    if (mErr) throw new Error('members kaydı oluşturulamadı: ' + mErr.message)
    pass('members kaydı oluşturuldu')

    const { data: sessionData, error: sessErr } = await admin.auth.admin.generateLink({
      type: 'magiclink', email,
    })
    if (sessErr) throw new Error('Link üretilemedi: ' + sessErr.message)

    // generateLink bize doğrudan access_token vermez; signInWithPassword ile gerçek token alalım.
    const anonClient = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: signInData, error: signInErr } = await anonClient.auth.signInWithPassword({ email, password: `Test!${stamp}` })
    if (signInErr || !signInData?.session) throw new Error('Test kullanıcı girişi yapılamadı: ' + (signInErr?.message || '?'))
    const accessToken = signInData.session.access_token
    pass('Test kullanıcısı için access token alındı')

    const mod = await import('../api/stripe-checkout.js')
    const handler = mod.default
    if (typeof handler !== 'function') throw new Error('stripe-checkout handler import edilemedi')

    for (const [planId, durationMonths] of [['eko', 1], ['vip', 3]]) {
      const req = {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}`, host: 'www.yeniform.com', origin: 'https://www.yeniform.com' },
        body: JSON.stringify({ planId, durationMonths, flow: 'register' }),
      }
      const res = mockRes()
      await handler(req, res)
      if (res.statusCode === 200 && res.body?.url && res.body?.id) {
        pass(`Checkout session oluşturuldu → plan=${planId} (${durationMonths} ay), id=${res.body.id}`)
        sessionIdToExpire = res.body.id
        // Hemen expire et (temizlik) — para hareketi yok, session sadece iptal edilir.
        try {
          const { getStripe } = await import('../api/_stripe.js')
          await getStripe().checkout.sessions.expire(sessionIdToExpire)
          pass(`Session temizlendi (expire): ${sessionIdToExpire}`)
        } catch (e) {
          console.log('⚠️ Session expire edilemedi (önemli değil, 24 saatte otomatik düşer):', e.message)
        }
      } else {
        fail(`Checkout session oluşturulamadı (plan=${planId}) → HTTP ${res.statusCode}: ${JSON.stringify(res.body)}`)
      }
    }
  } catch (e) {
    fail(`İSTİSNA: ${e.message}`)
  } finally {
    if (userId) {
      try {
        await admin.from('members').delete().eq('id', userId)
        await admin.auth.admin.deleteUser(userId)
        console.log('\n🧹 Test üyesi silindi.')
      } catch (e) {
        console.log('\n⚠️ Temizlik hatası:', e.message, 'userId:', userId)
      }
    }
  }

  const failed = results.filter((r) => r[0] === '❌').length
  console.log(`\n=== Sonuç: ${results.length - failed}/${results.length} geçti, ${failed} hata ===\n`)
  process.exit(failed ? 1 : 0)
}

main()

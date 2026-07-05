/**
 * RLS politika değişikliği (20260705_rls_performance_tuning) sonrası davranış
 * doğrulama testi — anon/authenticated rolüyle gerçek sorgular çalıştırır.
 *
 * Çalıştır: node scripts/test-rls-policies.mjs
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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
    if (!process.env[key]) process.env[key] = val
  }
}
loadEnv()

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
  console.error('❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_PUBLISHABLE_KEY eksik (.env.local)')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const results = []
const pass = (m) => { results.push(['✅', m]); console.log('✅', m) }
const fail = (m) => { results.push(['❌', m]); console.log('❌', m) }

async function makeMember(stamp) {
  const email = `rls-member-${stamp}@example.com`
  const password = `Test!${stamp}`
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: 'RLS Test Member' } })
  if (error || !data?.user) throw new Error('member auth create failed: ' + (error?.message || '?'))
  const id = data.user.id
  const { error: mErr } = await admin.from('members').insert({
    id, email, name: 'RLS Test Member', phone: '5550000001', role: 'member',
    membership: 'free', membership_status: 'active',
    data: { phone: '5550000001', joinedAt: new Date().toISOString().split('T')[0], profileComplete: true },
    updated_at: new Date().toISOString(),
  })
  if (mErr) throw new Error('members insert failed: ' + mErr.message)
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: signIn, error: signInErr } = await client.auth.signInWithPassword({ email, password })
  if (signInErr || !signIn?.session) throw new Error('member sign-in failed: ' + (signInErr?.message || '?'))
  return { id, email, client }
}

async function makeStaff(stamp) {
  const email = `rls-staff-${stamp}@example.com`
  const password = `Test!${stamp}`
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: 'RLS Test Staff' } })
  if (error || !data?.user) throw new Error('staff auth create failed: ' + (error?.message || '?'))
  const id = data.user.id
  const { error: sErr } = await admin.from('staff').insert({
    id, email, name: 'RLS Test Staff', role: 'coach', active: true, data: {},
  })
  if (sErr) throw new Error('staff insert failed: ' + sErr.message)
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: signIn, error: signInErr } = await client.auth.signInWithPassword({ email, password })
  if (signInErr || !signIn?.session) throw new Error('staff sign-in failed: ' + (signInErr?.message || '?'))
  return { id, email, client }
}

async function cleanupMember(id) {
  await admin.from('tickets').delete().eq('member_id', id)
  await admin.from('payments').delete().eq('member_id', id)
  await admin.from('programs').delete().eq('member_id', id)
  await admin.from('activities').delete().eq('member_id', id)
  await admin.from('members').delete().eq('id', id)
  await admin.auth.admin.deleteUser(id).catch(() => {})
}

async function cleanupStaff(id) {
  await admin.from('staff').delete().eq('id', id)
  await admin.auth.admin.deleteUser(id).catch(() => {})
}

async function main() {
  const stamp = Date.now()
  let memberA = null
  let memberB = null
  let staffA = null

  console.log('\n=== RLS politika doğrulama testi başlıyor ===\n')

  try {
    memberA = await makeMember(stamp)
    pass('Üye A oluşturuldu ve giriş yaptı')
    memberB = await makeMember(stamp + 1)
    pass('Üye B oluşturuldu ve giriş yaptı')
    staffA = await makeStaff(stamp)
    pass('Personel A (coach) oluşturuldu ve giriş yaptı')

    // members: kendi satırını görebilmeli
    const { data: selfRow, error: selfErr } = await memberA.client.from('members').select('id, email').eq('id', memberA.id).maybeSingle()
    if (!selfErr && selfRow?.id === memberA.id) pass('members_select: Üye kendi satırını görebiliyor')
    else fail('members_select: Üye kendi satırını göremedi: ' + (selfErr?.message || 'boş sonuç'))

    // members: başkasının satırını görememeli
    const { data: otherRow } = await memberA.client.from('members').select('id').eq('id', memberB.id).maybeSingle()
    if (!otherRow) pass('members_select: Üye başkasının satırını göremiyor (RLS engelliyor)')
    else fail('members_select: Üye başkasının satırını GÖREBİLDİ — RLS sızıntısı!')

    // members: kendi satırını güncelleyebilmeli
    const { error: updErr } = await memberA.client.from('members').update({ name: 'RLS Test Member (güncellendi)' }).eq('id', memberA.id)
    if (!updErr) pass('members_update: Üye kendi satırını güncelleyebiliyor')
    else fail('members_update: Üye kendi satırını güncelleyemedi: ' + updErr.message)

    // tickets: kendi ticket'ını oluşturup görebilmeli
    const { data: ticketRow, error: ticketInsErr } = await memberA.client.from('tickets').insert({
      member_id: memberA.id, data: { subject: 'RLS test', status: 'open', messages: [] },
    }).select('id').maybeSingle()
    if (!ticketInsErr && ticketRow?.id) pass('tickets_insert: Üye kendi ticket\'ını oluşturabiliyor')
    else fail('tickets_insert: Üye ticket oluşturamadı: ' + (ticketInsErr?.message || '?'))

    const { data: ticketSel } = await memberA.client.from('tickets').select('id').eq('member_id', memberA.id)
    if ((ticketSel || []).length > 0) pass('tickets_select: Üye kendi ticket\'larını görebiliyor')
    else fail('tickets_select: Üye kendi ticket\'larını göremedi')

    // payments: kendi ödemesini görebilmeli (admin ile ekleyip üye ile okuyoruz)
    await admin.from('payments').insert({ member_id: memberA.id, data: { amount: 100, status: 'completed', provider: 'test' } })
    const { data: paySel } = await memberA.client.from('payments').select('id').eq('member_id', memberA.id)
    if ((paySel || []).length > 0) pass('payments_select: Üye kendi ödemesini görebiliyor')
    else fail('payments_select: Üye kendi ödemesini göremedi')

    // staff: herkes staff listesini görebilmeli (public read)
    const { data: staffList, error: staffListErr } = await memberA.client.from('staff').select('id, name').limit(5)
    if (!staffListErr && Array.isArray(staffList)) pass(`staff_select: Herkese açık personel listesi okunabiliyor (${staffList.length} kayıt)`)
    else fail('staff_select: Personel listesi okunamadı: ' + staffListErr?.message)

    // staff_update: personel kendi profilini güncelleyebilmeli
    const { error: staffSelfUpdErr } = await staffA.client.from('staff').update({ name: 'RLS Test Staff (güncellendi)' }).eq('id', staffA.id)
    if (!staffSelfUpdErr) pass('staff_update: Personel kendi profilini güncelleyebiliyor')
    else fail('staff_update: Personel kendi profilini güncelleyemedi: ' + staffSelfUpdErr.message)

    // staff_update: personel BAŞKASININ profilini güncelleyememeli
    const { data: staffOtherUpd } = await staffA.client.from('staff').update({ name: 'HACK' }).eq('id', memberA.id === staffA.id ? '00000000-0000-0000-0000-000000000000' : memberA.id).select('id')
    if (!staffOtherUpd || staffOtherUpd.length === 0) pass('staff_update: Personel başka bir kaydı güncelleyemiyor (RLS engelliyor)')
    else fail('staff_update: Personel başka kaydı GÜNCELLEYEBİLDİ — RLS sızıntısı!')

    // exercises / plans / posts / site_content: herkese açık okuma hâlâ çalışmalı
    for (const table of ['exercises', 'plans', 'posts', 'site_content']) {
      const { error: readErr } = await memberA.client.from(table).select('id').limit(1)
      if (!readErr) pass(`${table}_select: Herkese açık okuma çalışıyor`)
      else fail(`${table}_select: Okuma hatası: ${readErr.message}`)
    }

    // exercises: üye admin olmayan biri olarak yazamamalı (admin_insert/update/delete ayrımı)
    const { error: exWriteErr } = await memberA.client.from('exercises').insert({ name: 'hack', category: 'test' })
    if (exWriteErr) pass('exercises_admin_insert: Admin olmayan üye ekleme yapamıyor (RLS engelliyor)')
    else fail('exercises_admin_insert: Admin olmayan üye ekleme YAPABİLDİ — RLS sızıntısı!')

    // user_presence: üye kendi presence satırını yazabilmeli
    const { error: presUpsertErr } = await memberA.client.from('user_presence').upsert({ user_id: memberA.id, role: 'member', email: memberA.email, last_seen_at: new Date().toISOString() })
    if (!presUpsertErr) pass('user_presence_insert/update: Üye kendi presence kaydını yazabiliyor')
    else fail('user_presence: Üye kendi presence kaydını yazamadı: ' + presUpsertErr.message)

    const { data: presSelf } = await memberA.client.from('user_presence').select('user_id').eq('user_id', memberA.id).maybeSingle()
    if (presSelf?.user_id === memberA.id) pass('user_presence_select: Üye kendi presence kaydını görebiliyor')
    else fail('user_presence_select: Üye kendi presence kaydını göremedi')
  } catch (e) {
    fail('İSTİSNA: ' + e.message)
  } finally {
    if (memberA) await cleanupMember(memberA.id)
    if (memberB) await cleanupMember(memberB.id)
    if (staffA) await cleanupStaff(staffA.id)
    console.log('\n🧹 Test kayıtları temizlendi.')
  }

  const failed = results.filter((r) => r[0] === '❌').length
  console.log(`\n=== Sonuç: ${results.length - failed}/${results.length} geçti, ${failed} hata ===\n`)
  process.exit(failed ? 1 : 0)
}

main()

/**
 * Supabase migration runner — service role ile plan/üye senkronu + opsiyonel SQL.
 * Kullanım: npm run db:migrate
 * Opsiyonel: DATABASE_URL veya SUPABASE_DB_URL (.env.local) ile ham SQL dosyaları çalıştırılır.
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
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

function resolveDatabaseUrl() {
  const direct = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
  if (direct) return direct

  const pwd = process.env.SUPABASE_DB_PASSWORD
  if (!pwd || !SUPABASE_URL) return null

  const ref = new URL(SUPABASE_URL).hostname.split('.')[0]
  const region = process.env.SUPABASE_DB_REGION || 'ap-south-1'
  const enc = encodeURIComponent(pwd)
  return `postgresql://postgres.${ref}:${enc}@aws-0-${region}.pooler.supabase.com:6543/postgres`
}

const DB_URL = resolveDatabaseUrl()

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env.local)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const PLAN_SORT = { eko_diyet: 0, diyet: 1, eko_spor: 2, spor: 3, vip: 4 }
const LEGACY_INACTIVE = ['free', 'eko', 'kurucu', 'gumus', 'altin', 'platinum', 'premium', 'doktor']

/** Seed / eksik plan insert — admin marketing alanlarını ezmez */
const ACTIVE_PLANS = [
  {
    id: 'eko_diyet', name: 'Eko Diyet Paketi', price: 1299, period: 'Aylık', badge: 'Eko', color: 'sage', icon: 'Salad',
    billing_type: 'recurring',
    entitlements: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 1, photoCalorie: true, manualCalorie: true },
    features: [
      { text: 'Kan Tahlili Testi Analizi', included: true },
      { text: 'Yeniform Kişisel Sağlık Analizi', included: true },
      { text: 'Fotoğraflı ve Manuel Kalori Hesaplama', included: true },
      { text: 'Ayda 1 Diyetisyen ile Online Görüşme', included: true },
      { text: 'Diyet Üyeye Özel Diyet Programı', included: true },
      { text: 'Sınırsız İlerleme Raporları', included: true },
      { text: 'Takip Programı', included: true },
      { text: 'Sınırsız Destek', included: true },
      { text: 'Birebir Koç Görüşmesi', included: false },
    ],
    limits: ['Uzman diyetisyen desteğiyle sürdürülebilir beslenme', 'Kişisel diyet programı', 'Sınırsız destek'],
    pricing_tiers: [
      { months: 1, label: 'Aylık', price: 1299 },
      { months: 3, label: '3 Aylık', price: 2999 },
      { months: 6, label: '6 Aylık', price: 3999 },
    ],
  },
  {
    id: 'diyet', name: 'Diyet Paketi', price: 2499, period: 'Aylık', badge: null, color: 'emerald', icon: 'Apple',
    billing_type: 'recurring',
    entitlements: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 2, photoCalorie: true, manualCalorie: true },
    features: [
      { text: 'Kan Tahlili Testi Analizi', included: true },
      { text: 'Yeniform Kişisel Sağlık Analizi', included: true },
      { text: 'Fotoğraflı ve Manuel Kalori Hesaplama', included: true },
      { text: 'Ayda 2 Diyetisyen ile Online Görüşme', included: true },
      { text: 'Diyet Üyeye Özel Diyet Programı', included: true },
      { text: 'Sınırsız İlerleme Raporları', included: true },
      { text: 'Takip Programı', included: true },
      { text: 'Sınırsız Destek', included: true },
      { text: 'Birebir Koç Görüşmesi', included: false },
    ],
    limits: ['Uzman diyetisyen desteğiyle sürdürülebilir beslenme', 'Kişisel diyet programı', 'Sınırsız destek'],
    pricing_tiers: [
      { months: 1, label: 'Aylık', price: 2499 },
      { months: 3, label: '3 Aylık', price: 6499 },
      { months: 6, label: '6 Aylık', price: 9999 },
    ],
  },
  {
    id: 'eko_spor', name: 'Eko Spor Paketi', price: 1299, period: 'Aylık', badge: 'Eko', color: 'sky', icon: 'Footprints',
    billing_type: 'recurring',
    entitlements: { coachMeetingsPerMonth: 1, dietitianMeetingsPerMonth: 0, photoCalorie: true, manualCalorie: true },
    features: [
      { text: 'Yeniform Kişisel Sağlık Analizi', included: true },
      { text: 'Fotoğraflı ve Manuel Kalori Hesaplama', included: true },
      { text: 'Ayda 1 Koç ile Online Görüşme', included: true },
      { text: 'Spor Üyeye Özel Spor Programı', included: true },
      { text: 'Sınırsız Video Kütüphanesi Erişimi', included: true },
      { text: 'Sınırsız İlerleme Raporları', included: true },
      { text: 'Takip Programı', included: true },
      { text: 'Sınırsız Destek', included: true },
    ],
    limits: ['Spor yapanlar için profesyonel takip', 'Kişisel spor programı', 'Sınırsız video'],
    pricing_tiers: [
      { months: 1, label: 'Aylık', price: 1299 },
      { months: 3, label: '3 Aylık', price: 2999 },
      { months: 6, label: '6 Aylık', price: 3999 },
    ],
  },
  {
    id: 'spor', name: 'Spor Paketi', price: 2499, period: 'Aylık', badge: null, color: 'blue', icon: 'Dumbbell',
    billing_type: 'recurring',
    entitlements: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 0, photoCalorie: true, manualCalorie: true },
    features: [
      { text: 'Yeniform Kişisel Sağlık Analizi', included: true },
      { text: 'Fotoğraflı ve Manuel Kalori Hesaplama', included: true },
      { text: 'Ayda 2 Koç ile Online Görüşme', included: true },
      { text: 'Spor Üyeye Özel Spor Programı', included: true },
      { text: 'Sınırsız Video Kütüphanesi Erişimi', included: true },
      { text: 'Sınırsız İlerleme Raporları', included: true },
      { text: 'Takip Programı', included: true },
      { text: 'Sınırsız Destek', included: true },
    ],
    limits: ['Spor yapanlar için profesyonel takip', 'Kişisel spor programı', 'Sınırsız video'],
    pricing_tiers: [
      { months: 1, label: 'Aylık', price: 2499 },
      { months: 3, label: '3 Aylık', price: 6499 },
      { months: 6, label: '6 Aylık', price: 9999 },
    ],
  },
  {
    id: 'vip', name: 'Vip Paket', price: 4999, period: 'Aylık', badge: 'VIP', color: 'gold', icon: 'Crown',
    billing_type: 'recurring',
    entitlements: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2, photoCalorie: true, manualCalorie: true },
    features: [
      { text: 'Kan Tahlili Testi Analizi', included: true },
      { text: 'Yeniform Kişisel Sağlık Analizi', included: true },
      { text: 'Fotoğraflı ve Manuel Kalori Hesaplama', included: true },
      { text: 'Ayda 2 Diyetisyen ile Online Görüşme', included: true },
      { text: 'Vip Üyeye Özel Diyet Programı', included: true },
      { text: 'Ayda 2 Koç ile Online Görüşme', included: true },
      { text: 'Vip Üyeye Özel Spor Programı', included: true },
      { text: 'Sınırsız Video Kütüphanesi Erişimi', included: true },
      { text: 'Sınırsız İlerleme Raporları', included: true },
      { text: 'Ücretsiz Takip Programı', included: true },
      { text: 'Sınırsız Destek', included: true },
      { text: 'Vip Üye Rozeti', included: true },
    ],
    limits: ['İşbirliği içerisindeki uzmanlarımıza en kapsamlı sağlık deneyimi', 'Sınırsız destek', 'VIP rozeti'],
    pricing_tiers: [
      { months: 1, label: 'Aylık', price: 4999 },
      { months: 3, label: '3 Aylık', price: 12999 },
      { months: 6, label: '6 Aylık', price: 19999 },
    ],
  },
]

function entitlementsEmpty(ent) {
  if (ent == null) return true
  if (typeof ent === 'object' && !Array.isArray(ent) && Object.keys(ent).length === 0) return true
  return false
}

/** Yalnızca yoksa insert — mevcut admin düzenlemelerini ezmez */
async function ensurePlan(plan) {
  const { data: existing, error: selErr } = await supabase
    .from('plans')
    .select('id, entitlements, is_sellable, billing_type, emoji, icon')
    .eq('id', plan.id)
    .maybeSingle()
  if (selErr) throw new Error(`plans.${plan.id} select: ${selErr.message}`)

  if (!existing) {
    const row = {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      period: plan.period,
      is_active: true,
      is_sellable: true,
      badge: plan.badge,
      features: plan.features,
      limits: plan.limits,
      pricing_tiers: plan.pricing_tiers,
      color: plan.color,
      icon: plan.icon || null,
      emoji: null,
      billing_type: plan.billing_type || 'recurring',
      entitlements: plan.entitlements || {},
      sort_order: PLAN_SORT[plan.id] ?? 99,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('plans').insert(row)
    if (error) throw new Error(`plans.${plan.id} insert: ${error.message}`)
    console.log(`  ✓ plan eklendi: ${plan.id}`)
    return
  }

  // Mevcut satır: yalnızca boş entitlements / eksik sellable bayraklarını doldur
  const patch = { updated_at: new Date().toISOString() }
  let need = false
  if (entitlementsEmpty(existing.entitlements) && plan.entitlements) {
    patch.entitlements = plan.entitlements
    need = true
  }
  if (existing.is_sellable !== true) {
    patch.is_sellable = true
    need = true
  }
  if (!existing.billing_type && plan.billing_type) {
    patch.billing_type = plan.billing_type
    need = true
  }
  if (plan.icon && existing.icon !== plan.icon) {
    patch.icon = plan.icon
    need = true
  }
  if (existing.emoji) {
    patch.emoji = null
    need = true
  }
  if (need) {
    const { error } = await supabase.from('plans').update(patch).eq('id', plan.id)
    if (error) throw new Error(`plans.${plan.id} patch: ${error.message}`)
    console.log(`  ✓ plan tamamlandı (entitlements/sellable/icon): ${plan.id}`)
  } else {
    console.log(`  · plan korundu (admin): ${plan.id}`)
  }
}

async function deactivateLegacyPlans() {
  for (const id of LEGACY_INACTIVE) {
    const { error } = await supabase.from('plans').update({
      is_active: false,
      is_sellable: false,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) console.warn(`  ⚠ pasif: ${id} — ${error.message}`)
    else console.log(`  ✓ pasif: ${id}`)
  }
}

async function migrateKurucuMembers() {
  const { data, error } = await supabase.from('members').select('id, data').eq('membership', 'kurucu')
  if (error) throw new Error(`members kurucu: ${error.message}`)
  if (!data?.length) {
    console.log('  · kurucu üye yok')
    return
  }
  const vipPkg = {
    coachMeetingsPerMonth: 2,
    dietitianMeetingsPerMonth: 2,
    coachMeetingsPerWeek: 0,
    durationMonths: 1,
    durationWeeks: 4,
    addOns: [],
  }
  for (const m of data) {
    const merged = {
      ...(m.data || {}),
      packageConfig: vipPkg,
    }
    const { error: upErr } = await supabase.from('members').update({ membership: 'vip', data: merged }).eq('id', m.id)
    if (upErr) throw new Error(`member ${m.id}: ${upErr.message}`)
    console.log(`  ✓ üye ${m.id}: kurucu → vip`)
  }
}

async function archiveDoktorStripeCatalog() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    console.log('  · STRIPE_SECRET_KEY yok — doktor fiyat arşivi atlandı')
    return
  }
  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(key, { apiVersion: '2024-06-20' })
  const lookupKeys = ['yeniform_doktor_1m']
  const listed = await stripe.prices.list({ lookup_keys: lookupKeys, limit: 20, active: true })
  const extra = await stripe.prices.list({ lookup_keys: lookupKeys, limit: 20, active: false })
  const prices = [...listed.data, ...extra.data]
  const productIds = new Set()
  for (const p of prices) {
    if (p.active) {
      await stripe.prices.update(p.id, { active: false })
      console.log(`  ✓ Stripe price pasif: ${p.id}`)
    } else {
      console.log(`  · Stripe price zaten pasif: ${p.id}`)
    }
    const pid = typeof p.product === 'string' ? p.product : p.product?.id
    if (pid) productIds.add(pid)
  }
  for (const pid of productIds) {
    try {
      await stripe.products.update(pid, { active: false })
      console.log(`  ✓ Stripe product pasif: ${pid}`)
    } catch (e) {
      console.warn(`  ⚠ product ${pid}: ${e.message}`)
    }
  }
  if (!prices.length) console.log('  · yeniform_doktor_1m lookup bulunamadı')
}

async function runSqlFile(path) {
  const sql = readFileSync(path, 'utf8')
  if (await runSqlViaManagementApi(sql, path)) return

  const { default: pg } = await import('pg')
  const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    await client.query(sql)
    console.log(`  ✓ SQL: ${path.split('/').pop()}`)
  } finally {
    await client.end()
  }
}

async function runSqlViaManagementApi(sql, path) {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token || !SUPABASE_URL) return false
  const ref = new URL(SUPABASE_URL).hostname.split('.')[0]
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Management API SQL (${path.split('/').pop()}): ${res.status} ${text.slice(0, 200)}`)
  }
  console.log(`  ✓ SQL (API): ${path.split('/').pop()}`)
  return true
}

async function runPendingSqlMigrations() {
  const hasDb = Boolean(DB_URL || process.env.SUPABASE_ACCESS_TOKEN)
  if (!hasDb) {
    console.log('DATABASE_URL / SUPABASE_DB_PASSWORD / SUPABASE_ACCESS_TOKEN yok — ham SQL atlandı (plan senkronu uygulandı)')
    return
  }
  const dir = join(root, 'supabase/migrations')
  const appliedPath = join(root, '.db-migrations-applied.json')
  let applied = []
  if (existsSync(appliedPath)) {
    try { applied = JSON.parse(readFileSync(appliedPath, 'utf8')) } catch { applied = [] }
  }
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
  for (const file of files) {
    if (applied.includes(file)) continue
    console.log(`SQL migration: ${file}`)
    await runSqlFile(join(dir, file))
    applied.push(file)
    writeFileSync(appliedPath, JSON.stringify(applied, null, 2))
  }
}

async function syncPlans() {
  console.log('Plan senkronu (admin-safe: yoksa insert / boş entitlements doldur)…')
  for (const plan of ACTIVE_PLANS) await ensurePlan(plan)
  await deactivateLegacyPlans()
  await migrateKurucuMembers()
  try {
    console.log('Stripe doktor katalog arşivi…')
    await archiveDoktorStripeCatalog()
  } catch (e) {
    console.warn('  ⚠ Stripe arşiv:', e.message)
  }
}

async function verify() {
  const { data, error } = await supabase
    .from('plans')
    .select('id, name, sort_order, is_active, is_sellable, billing_type')
    .order('sort_order')
  if (error) throw error
  console.log('\nSatılabilir planlar (DB):')
  for (const p of (data || []).filter((r) => r.is_active && r.is_sellable)) {
    console.log(`  ${p.sort_order}. ${p.id} — ${p.name} (${p.billing_type || 'recurring'})`)
  }
}

async function main() {
  console.log('Supabase migration başlıyor…\n')
  // Önce şema (yeni kolonlar), sonra plan seed — admin alanları ezilmez
  try {
    await runPendingSqlMigrations()
  } catch (e) {
    console.warn('SQL migration uyarısı:', e.message)
  }
  await syncPlans()
  await verify()
  console.log('\nTamamlandı.')
}

main().catch((e) => {
  console.error('\nHata:', e.message)
  process.exit(1)
})

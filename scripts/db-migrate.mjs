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

const PLAN_SORT = { eko_diyet: 0, diyet: 1, eko_spor: 2, spor: 3, doktor: 4, vip: 5 }
const LEGACY_INACTIVE = ['free', 'eko', 'kurucu', 'gumus', 'altin', 'platinum', 'premium']

const DOKTOR_PACKAGE_CONFIG = {
  coachMeetingsPerMonth: 0,
  dietitianMeetingsPerMonth: 0,
  doctorMeetingsPerMonth: 0,
  doctorSessionsTotal: 1,
  billingType: 'one_time',
  coachMeetingsPerWeek: 0,
  durationMonths: 0,
  durationWeeks: 0,
  addOns: [],
}

/** Kod tabanındaki paket tanımları (membershipPlans.js ile uyumlu) — satılan paketler */
const ACTIVE_PLANS = [
  {
    id: 'eko_diyet', name: 'Eko Diyet Paketi', price: 1299, period: 'Aylık', badge: 'Eko', color: 'sage',
    features: [
      { text: 'Doktor Tarafından Kan Tahlili Testi Analizi', included: true },
      { text: 'Yeniform Kişisel Sağlık Analizi', included: true },
      { text: 'Fotoğraflı ve Manuel Kalori Hesaplama', included: true },
      { text: 'Ayda 1 Diyetisyen ile Online Görüşme', included: true },
      { text: 'Diyet Üyeye Özel Diyet Programı', included: true },
      { text: 'Sınırsız İlerleme Raporları', included: true },
      { text: 'Takip Programı', included: true },
      { text: 'Sınırsız Destek', included: true },
      { text: 'Birebir Koç Görüşmesi', included: false },
    ],
    limits: ['Ayda 1 diyetisyen görüşmesi', 'Kişisel diyet programı', 'Sınırsız destek'],
    pricing_tiers: [
      { months: 1, label: 'Aylık', price: 1299 },
      { months: 3, label: '3 Aylık', price: 2999 },
      { months: 6, label: '6 Aylık', price: 3999 },
    ],
  },
  {
    id: 'diyet', name: 'Diyet Paketi', price: 2499, period: 'Aylık', badge: null, color: 'emerald',
    features: [
      { text: 'Doktor Tarafından Kan Tahlili Testi Analizi', included: true },
      { text: 'Yeniform Kişisel Sağlık Analizi', included: true },
      { text: 'Fotoğraflı ve Manuel Kalori Hesaplama', included: true },
      { text: 'Ayda 2 Diyetisyen ile Online Görüşme', included: true },
      { text: 'Diyet Üyeye Özel Diyet Programı', included: true },
      { text: 'Sınırsız İlerleme Raporları', included: true },
      { text: 'Takip Programı', included: true },
      { text: 'Sınırsız Destek', included: true },
      { text: 'Birebir Koç Görüşmesi', included: false },
    ],
    limits: ['Ayda 2 diyetisyen görüşmesi', 'Kişisel diyet programı', 'Sınırsız destek'],
    pricing_tiers: [
      { months: 1, label: 'Aylık', price: 2499 },
      { months: 3, label: '3 Aylık', price: 6499 },
      { months: 6, label: '6 Aylık', price: 9999 },
    ],
  },
  {
    id: 'eko_spor', name: 'Eko Spor Paketi', price: 1299, period: 'Aylık', badge: 'Eko', color: 'sage',
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
    limits: ['Ayda 1 koç görüşmesi', 'Kişisel spor programı', 'Sınırsız video'],
    pricing_tiers: [
      { months: 1, label: 'Aylık', price: 1299 },
      { months: 3, label: '3 Aylık', price: 2999 },
      { months: 6, label: '6 Aylık', price: 3999 },
    ],
  },
  {
    id: 'spor', name: 'Spor Paketi', price: 2499, period: 'Aylık', badge: null, color: 'blue',
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
    limits: ['Ayda 2 koç görüşmesi', 'Kişisel spor programı', 'Sınırsız video'],
    pricing_tiers: [
      { months: 1, label: 'Aylık', price: 2499 },
      { months: 3, label: '3 Aylık', price: 6499 },
      { months: 6, label: '6 Aylık', price: 9999 },
    ],
  },
  {
    id: 'doktor', name: 'Doktor Paketi', price: 1500, period: 'Tek Seferlik', badge: 'Tek Seferlik', color: 'teal',
    features: [
      { text: '1 Online Doktor Görüşmesi', included: true },
      { text: 'Görüntülü Görüşme', included: true },
      { text: 'Mevcut üyeliğe ek paket olarak eklenebilir', included: true },
    ],
    limits: ['Tek seferlik doktor görüşmesi'],
    pricing_tiers: [{ months: 1, label: 'Tek Seferlik', price: 1500 }],
  },
  {
    id: 'vip', name: 'Vip Paket', price: 4999, period: 'Aylık', badge: 'VIP', color: 'brand',
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
    limits: ['Ayda 2 koç + 2 diyetisyen', 'Sınırsız destek', 'VIP rozeti'],
    pricing_tiers: [
      { months: 1, label: 'Aylık', price: 4999 },
      { months: 3, label: '3 Aylık', price: 12999 },
      { months: 6, label: '6 Aylık', price: 19999 },
    ],
  },
]

async function upsertPlan(plan) {
  const row = {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    period: plan.period,
    is_active: true,
    badge: plan.badge,
    features: plan.features,
    limits: plan.limits,
    pricing_tiers: plan.pricing_tiers,
    color: plan.color,
    sort_order: PLAN_SORT[plan.id] ?? 99,
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('plans').upsert(row, { onConflict: 'id' })
  if (error) throw new Error(`plans.${plan.id}: ${error.message}`)
  console.log(`  ✓ plan: ${plan.id} (sort ${row.sort_order})`)
}

async function deactivateLegacyPlans() {
  for (const id of LEGACY_INACTIVE) {
    const { error } = await supabase.from('plans').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id)
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
  for (const m of data) {
    const merged = {
      ...(m.data || {}),
      packageConfig: DOKTOR_PACKAGE_CONFIG,
    }
    const { error: upErr } = await supabase.from('members').update({ membership: 'doktor', data: merged }).eq('id', m.id)
    if (upErr) throw new Error(`member ${m.id}: ${upErr.message}`)
    console.log(`  ✓ üye ${m.id}: kurucu → doktor`)
  }
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
  console.log('Plan senkronu…')
  for (const plan of ACTIVE_PLANS) await upsertPlan(plan)
  await deactivateLegacyPlans()
  await migrateKurucuMembers()
}

async function verify() {
  const { data, error } = await supabase.from('plans').select('id, name, sort_order, is_active').order('sort_order')
  if (error) throw error
  console.log('\nAktif planlar (DB):')
  for (const p of data.filter((r) => r.is_active)) {
    console.log(`  ${p.sort_order}. ${p.id} — ${p.name}`)
  }
}

async function main() {
  console.log('Supabase migration başlıyor…\n')
  await syncPlans()
  try {
    await runPendingSqlMigrations()
  } catch (e) {
    console.warn('SQL migration uyarısı:', e.message)
  }
  await verify()
  console.log('\nTamamlandı.')
}

main().catch((e) => {
  console.error('\nHata:', e.message)
  process.exit(1)
})

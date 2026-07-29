/**
 * den@den.com — rastgele HT doldur + production AI çağır + sonucu DB'ye yaz.
 * Kullanım: npx vite-node scripts/seed-den-health-ai.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvFile(name) {
  const path = resolve(root, name)
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (val === '[SENSITIVE]' || val === '') continue
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env.production.local')

const EMAIL = 'den@den.com'
const MEMBER_ID = '2b8d9e32-825a-46ea-a99b-10185c7ac60b'
const FREE_TRIAL_MS = 48 * 60 * 60 * 1000
const API_BASE = process.env.APP_URL || process.env.VITE_SITE_URL || 'https://www.yeniform.com'

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomAnswer(q) {
  if (!q) return null
  if (q.type === 'file') return []
  if (q.type === 'text') {
    return pick([
      'Düzenli takip ediyorum, ara sıra değişiklik oluyor.',
      'Son dönemde genel olarak dengeli hissediyorum.',
      'Bazen dalgalanma oluyor ama yönetilebilir seviyede.',
      'Hedeflerime adım adım ilerliyorum.',
    ])
  }
  if (q.type === 'time') {
    const h = 6 + Math.floor(Math.random() * 4)
    const m = pick(['00', '15', '30', '45'])
    return `${String(h).padStart(2, '0')}:${m}`
  }
  if (q.type === 'scale') {
    const min = Number(q.min ?? 1)
    const max = Number(q.max ?? 10)
    return String(min + Math.floor(Math.random() * (max - min + 1)))
  }
  if (q.type === 'multi') {
    const opts = (q.options || []).map((o) => o.value).filter(Boolean)
    if (!opts.length) return []
    const none = opts.find((v) => /none|yok|no_|never|hic/.test(String(v)))
    if (none && Math.random() < 0.25) return [none]
    const pool = none ? opts.filter((v) => v !== none) : opts
    const count = Math.min(pool.length, 1 + Math.floor(Math.random() * Math.min(3, pool.length)))
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }
  const opts = (q.options || []).map((o) => o.value).filter((v) => v != null && v !== '')
  if (!opts.length) return 'ok'
  return pick(opts)
}

function fillQuestionTree(ht, q) {
  if (!q?.key) return
  ht[q.key] = randomAnswer(q)
  const parentVal = ht[q.key]
  if (q.detail?.key) {
    const when = q.detail.when
    let visible = true
    if (when != null) {
      if (Array.isArray(parentVal)) {
        visible = Array.isArray(when)
          ? when.some((w) => parentVal.includes(w))
          : parentVal.includes(when)
      } else if (Array.isArray(when)) {
        visible = when.includes(parentVal)
      } else {
        visible = parentVal === when
      }
    }
    if (visible) ht[q.detail.key] = randomAnswer({ type: 'text', key: q.detail.key })
  }
  for (const fu of q.followUps || []) {
    const when = fu.when
    let visible = true
    if (when != null) {
      if (Array.isArray(parentVal)) {
        visible = Array.isArray(when)
          ? when.some((w) => parentVal.includes(w))
          : parentVal.includes(when)
      } else if (Array.isArray(when)) {
        visible = when.includes(parentVal)
      } else {
        visible = parentVal === when
      }
    }
    if (visible) fillQuestionTree(ht, fu)
  }
}

async function getMemberAccessToken(admin) {
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: EMAIL,
  })
  if (linkErr) throw new Error(`magiclink: ${linkErr.message}`)
  const tokenHash = linkData?.properties?.hashed_token
  if (!tokenHash) throw new Error('magiclink hashed_token yok')

  const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const client = createClient(url, anon, { auth: { persistSession: false } })
  const { data: otp, error: otpErr } = await client.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'email',
  })
  if (otpErr) throw new Error(`verifyOtp: ${otpErr.message}`)
  const access = otp?.session?.access_token
  if (!access) throw new Error('access_token alınamadı')
  return access
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('SUPABASE URL / SERVICE_ROLE_KEY eksik (.env.local)')

  const {
    EMPTY_HEALTH_TEST,
    getApplicableSections,
    isHealthTestComplete,
    isQuestionFullyAnswered,
    describeHealthTest,
  } = await import('../src/data/healthTest.js')

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
  const { data: row, error } = await admin
    .from('members')
    .select('id, email, name, membership, data')
    .eq('id', MEMBER_ID)
    .maybeSingle()

  if (error || !row) throw new Error(error?.message || `${EMAIL} bulunamadı`)

  const data = row.data && typeof row.data === 'object' ? { ...row.data } : {}
  const prevMembership = row.membership || 'free'
  const gender = data.gender || 'female'
  data.gender = gender
  data.age = data.age || 28
  data.height = data.height || 165
  data.weight = data.weight || 68
  data.fitnessLevel = data.fitnessLevel || 'beginner'
  data.goals = Array.isArray(data.goals) && data.goals.length ? data.goals : ['weight_loss', 'energy']
  data.healthAck = true
  data.disclaimer = true
  data.freeTrialExpiresAt = new Date(Date.now() + FREE_TRIAL_MS).toISOString()
  // Eski analizi temizle ki yeni üretim olsun
  data.healthAnalysis = null

  const ht = { ...EMPTY_HEALTH_TEST }
  const sections = getApplicableSections(gender, data.packageConfig)
  for (let pass = 0; pass < 8; pass += 1) {
    for (const section of sections) {
      for (const q of section.questions) {
        if (!isQuestionFullyAnswered(q, ht)) fillQuestionTree(ht, q)
      }
    }
    if (isHealthTestComplete(ht, gender, data.packageConfig)) break
  }

  if (!isHealthTestComplete(ht, gender, data.packageConfig)) {
    throw new Error('HT tamamlanamadı — şema / koşullu soru kontrolü gerekli')
  }
  data.healthTest = ht

  const answered = Object.values(ht).filter((v) => {
    if (Array.isArray(v)) return v.length > 0
    return v !== '' && v != null
  }).length
  console.log(`✓ HT dolduruldu (${answered} alan), gender=${gender}`)

  // Production API hâlâ ücretli-only olabilir → geçici diyet, sonra free+trial
  const { error: up1 } = await admin
    .from('members')
    .update({
      membership: 'diyet',
      data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', MEMBER_ID)
  if (up1) throw new Error(up1.message)
  console.log('✓ HT + geçici membership=diyet kaydedildi')

  const sectionsDesc = describeHealthTest(ht, gender, data.packageConfig)
  const buckets = {
    general: [], medical: [], nutrition: [], physical: [], lifestyle: [], special: [],
  }
  for (const sec of sectionsDesc) {
    const lines = (sec.items || []).map((it) => `${it.label}: ${it.value}`)
    if (sec.id === 'general') buckets.general.push(...lines)
    else if (sec.id === 'medical') buckets.medical.push(...lines)
    else if (sec.id === 'nutrition') buckets.nutrition.push(...lines)
    else if (sec.id === 'physical') buckets.physical.push(...lines)
    else if (sec.id === 'lifestyle') buckets.lifestyle.push(...lines)
    else if (sec.id === 'women' || sec.id === 'men') buckets.special.push(...lines)
  }
  const join = (arr) => (arr.length ? arr.slice(0, 24).join('\n') : '—')
  const categorySummaries = {
    general: join(buckets.general),
    medical: join(buckets.medical),
    nutrition: join(buckets.nutrition),
    physical: join(buckets.physical),
    lifestyle: join(buckets.lifestyle),
    special: join(buckets.special),
  }

  console.log('→ Oturum alınıyor…')
  const accessToken = await getMemberAccessToken(admin)
  console.log(`→ AI çağrısı: ${API_BASE}/api/ai-health-analysis`)

  const res = await fetch(`${API_BASE.replace(/\/$/, '')}/api/ai-health-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      profile: {
        age: data.age,
        gender: data.gender,
        height: data.height,
        weight: data.weight,
        goals: data.goals,
        fitnessLevel: data.fitnessLevel,
      },
      categorySummaries,
      force: false,
    }),
  })
  const ai = await res.json().catch(() => ({}))
  if (!res.ok || !ai.ok) {
    // free'ye geri dönmeden önce hatayı yaz
    await admin.from('members').update({
      membership: 'free',
      data: { ...data, freeTrialExpiresAt: data.freeTrialExpiresAt },
      updated_at: new Date().toISOString(),
    }).eq('id', MEMBER_ID)
    throw new Error(`AI ${res.status}: ${ai.error || JSON.stringify(ai)}`)
  }

  const healthAnalysis = {
    version: 1,
    scores: ai.scores,
    overallScore: ai.overallScore,
    summary: ai.summary || '',
    staffBrief: ai.staffBrief,
    sourceFingerprint: ai.sourceFingerprint,
    aiGenerated: ai.aiGenerated !== false,
    aiAttemptedAt: new Date().toISOString(),
    model: ai.model || null,
    costUsd: Number(ai.costUsd) || 0,
  }

  const day = healthAnalysis.aiAttemptedAt.slice(0, 10)
  const prevHistory = Array.isArray(data.healthScoreHistory) ? data.healthScoreHistory : []
  const entry = {
    at: healthAnalysis.aiAttemptedAt,
    overallScore: healthAnalysis.overallScore,
    scores: healthAnalysis.scores,
  }
  data.healthAnalysis = healthAnalysis
  data.healthScoreHistory = [
    ...prevHistory.filter((h) => String(h?.at || '').slice(0, 10) !== day),
    entry,
  ].slice(-24)

  const { error: up2 } = await admin
    .from('members')
    .update({
      membership: 'free',
      data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', MEMBER_ID)
  if (up2) throw new Error(up2.message)

  console.log('\n═══ AI SONUÇ ═══')
  console.log(`Üye: ${row.name} <${row.email}>`)
  console.log(`membership: free (önceki: ${prevMembership}) · trial: ${data.freeTrialExpiresAt}`)
  console.log(`Genel skor: ${healthAnalysis.overallScore}/100`)
  console.log('Boyutlar:', JSON.stringify(healthAnalysis.scores, null, 2))
  console.log('Özet:', healthAnalysis.summary)
  console.log('\n— staffBrief.general —\n', healthAnalysis.staffBrief?.general)
  console.log('\n— staffBrief.nutrition —\n', healthAnalysis.staffBrief?.nutrition)
  console.log('\n— staffBrief.movement —\n', healthAnalysis.staffBrief?.movement)
  console.log('\n— staffBrief.risks —\n', healthAnalysis.staffBrief?.risks)
  console.log('\n— staffBrief.actions —\n', healthAnalysis.staffBrief?.actions)
  console.log(`\n✓ DB kaydedildi · model=${healthAnalysis.model || '—'} · cost≈$${healthAnalysis.costUsd}`)
  console.log('Panelde görmek için den@den.com ile giriş → /dashboard')
}

main().catch((e) => {
  console.error('❌', e?.message || e)
  process.exit(1)
})

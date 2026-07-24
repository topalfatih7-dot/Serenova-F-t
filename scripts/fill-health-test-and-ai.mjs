/**
 * test3@test.com (veya --email=) için sağlık testini rastgele doldur + AI Basic program üret.
 * Kullanım: node scripts/fill-health-test-and-ai.mjs
 *          node scripts/fill-health-test-and-ai.mjs --email=test3@test.com --force
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { HEALTH_SECTIONS } from '../src/data/healthTestSections.js'
import { generateBasicPrograms, generateEkoPrograms } from '../api/_aiEkoPrograms.js'
import { AI_BASIC_SOURCE, AI_EKO_SOURCE } from '../api/_aiBasicPrograms.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnv() {
  for (const name of ['.env.local', '.env.production.local']) {
    const path = join(root, name)
    if (!existsSync(path)) continue
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
}

loadEnv()

const args = process.argv.slice(2)
const emailArg = args.find((a) => a.startsWith('--email='))
const EMAIL = (emailArg ? emailArg.slice('--email='.length) : 'test3@test.com').toLowerCase()

function rnd(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function isDetailVisible(detail, parentValue) {
  if (!detail) return false
  const when = detail.when
  if (when == null) return true
  if (Array.isArray(parentValue)) {
    if (Array.isArray(when)) return when.some((w) => parentValue.includes(w))
    return parentValue.includes(when)
  }
  if (Array.isArray(when)) return when.includes(parentValue)
  return parentValue === when
}

function hasStoredAnswer(q, ht) {
  if (!q) return false
  const val = ht?.[q.key]
  if (q.type === 'multi' || q.type === 'file') {
    if (typeof val === 'string' && val.trim()) return true
    return Array.isArray(val) && val.length > 0
  }
  if (q.type === 'scale') {
    if (val === '' || val == null) return false
    return Number.isFinite(Number(val))
  }
  if (q.type === 'text' || q.type === 'time') return typeof val === 'string' && val.trim().length > 0
  return val !== '' && val != null
}

function isDetailFilled(detail, ht) {
  if (!detail) return true
  const val = ht?.[detail.key]
  return typeof val === 'string' && val.trim().length > 0
}

function isQuestionFullyAnswered(q, ht) {
  if (!q) return false
  const parentVal = ht?.[q.key]
  const detailVisible = q.detail && isDetailVisible(q.detail, parentVal)
  const visibleFollowUps = (q.followUps || []).filter((fu) => isDetailVisible(fu, parentVal))

  const dependentsOk = () => {
    if (detailVisible && !isDetailFilled(q.detail, ht)) return false
    for (const fu of visibleFollowUps) {
      if (fu.required === false) {
        if (hasStoredAnswer(fu, ht) && !isQuestionFullyAnswered(fu, ht)) return false
        continue
      }
      if (!isQuestionFullyAnswered(fu, ht)) return false
    }
    return true
  }

  if (!q.required) {
    if (!hasStoredAnswer(q, ht)) return true
    return dependentsOk()
  }
  if (!hasStoredAnswer(q, ht)) return false
  return dependentsOk()
}

function getApplicableSections(gender) {
  return HEALTH_SECTIONS.filter((s) => !s.genderOnly || s.genderOnly === gender)
}

function isSectionComplete(section, ht) {
  if (!section?.questions?.length) return false
  const required = section.questions.filter((q) => q.required)
  if (required.length === 0) {
    return section.questions.every((q) => hasStoredAnswer(q, ht) && isQuestionFullyAnswered(q, ht))
  }
  return section.questions.every((q) => isQuestionFullyAnswered(q, ht))
}

function isHealthTestComplete(ht, gender) {
  return getApplicableSections(gender).every((s) => isSectionComplete(s, ht))
}

function pickSingle(options = [], { preferSafe = true } = {}) {
  if (!options.length) return ''
  const safeVals = new Set(['none', 'no', 'never', 'not_applicable', 'na', 'good', 'fair', 'moderate', 'ready', 'started', 'often', 'believe', 'partial', 'low', 'sometimes'])
  if (preferSafe && Math.random() < 0.6) {
    const safe = options.filter((o) => safeVals.has(o.value) || o.exclusive)
    if (safe.length) return rnd(safe).value
  }
  const pool = options.filter((o) => o.value !== 'other' || Math.random() < 0.05)
  return rnd(pool.length ? pool : options).value
}

function pickMulti(options = [], { preferSafe = true } = {}) {
  const exclusive = options.find((o) => o.exclusive)
  if (preferSafe && exclusive && Math.random() < 0.7) return [exclusive.value]
  const nonEx = options.filter((o) => !o.exclusive && o.value !== 'other')
  const n = Math.min(nonEx.length, 1 + Math.floor(Math.random() * 3))
  const shuffled = [...nonEx].sort(() => Math.random() - 0.5)
  const picked = shuffled.slice(0, Math.max(1, n)).map((o) => o.value)
  return picked.length ? picked : (exclusive ? [exclusive.value] : [options[0]?.value].filter(Boolean))
}

function fillDetail(ht, detail) {
  if (!detail?.key) return
  ht[detail.key] = rnd([
    'Kısa not: günlük yaşamda ara sıra hissediyorum.',
    'Detay: düzenli takipteyim, egzersizi etkilemiyor.',
    'Açıklama: hafif seviye.',
  ])
}

function answerQuestion(ht, q, preferSafe = true) {
  if (!q?.key) return
  const type = q.type

  if (type === 'file') {
    ht[q.key] = []
  } else if (type === 'multi') {
    ht[q.key] = pickMulti(q.options || [], { preferSafe })
  } else if (type === 'scale') {
    const min = Number(q.min) || 0
    const max = Number(q.max) || 10
    const mid = Math.round((min + max) / 2)
    ht[q.key] = String(Math.max(min, Math.min(max, mid + Math.floor(Math.random() * 3) - 1)))
  } else if (type === 'text' || type === 'time') {
    if (/performance|goal|hedef/i.test(q.key + (q.label || ''))) {
      ht[q.key] = rnd([
        '8 haftada 4-5 kg vermek ve düzenli antrenman alışkanlığı kazanmak',
        'Kas tonusu artırmak ve enerjimi yükseltmek',
        'Haftada 3 gün antrenman yapıp beslenmeyi düzenlemek',
      ])
    } else if (type === 'time') {
      ht[q.key] = rnd(['07:30', '08:00', '22:30', '23:00'])
    } else {
      ht[q.key] = rnd([
        'Özel bir ek notum yok.',
        'Evde pratik menüler tercih ederim.',
        'Genel olarak sağlıklı beslenmeye çalışıyorum.',
      ])
    }
  } else if (q.options?.length) {
    ht[q.key] = pickSingle(q.options, { preferSafe })
  } else {
    ht[q.key] = 'ok'
  }

  // AI-friendly overrides
  if (q.key === 'pregnancy') {
    const no = (q.options || []).find((o) => o.value === 'no' || o.value === 'none')
    ht[q.key] = no?.value || 'no'
  }
  if (q.key === 'exerciseContraindications') {
    const no = (q.options || []).find((o) => o.value === 'no')
    if (no) ht[q.key] = 'no'
  }
  if (q.key === 'injuries' && Math.random() < 0.75) {
    const no = (q.options || []).find((o) => o.value === 'no')
    if (no) ht[q.key] = 'no'
  }
  if (q.key === 'chronicConditions' && Math.random() < 0.75) {
    const none = (q.options || []).find((o) => o.value === 'none')
    if (none) ht[q.key] = ['none']
  }
  if (q.key === 'foodAllergies' && Math.random() < 0.7) {
    const none = (q.options || []).find((o) => o.value === 'none')
    if (none) ht[q.key] = ['none']
  }

  const parentVal = ht[q.key]
  if (q.detail && isDetailVisible(q.detail, parentVal)) fillDetail(ht, q.detail)
  for (const fu of q.followUps || []) {
    if (isDetailVisible(fu, parentVal)) answerQuestion(ht, fu, preferSafe)
  }
}

function buildRandomHealthTest(gender) {
  const ht = {}
  const sections = getApplicableSections(gender)
  for (let pass = 0; pass < 5; pass++) {
    for (const section of sections) {
      for (const q of section.questions) {
        if (pass === 0 || !isQuestionFullyAnswered(q, ht)) {
          answerQuestion(ht, q, pass < 3)
        }
      }
    }
    if (isHealthTestComplete(ht, gender)) break
  }
  return ht
}

async function main() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY eksik')
    process.exit(1)
  }
  const admin = createClient(url, key, { auth: { persistSession: false } })
  const { data: member, error } = await admin
    .from('members')
    .select('id, name, email, membership, data')
    .ilike('email', EMAIL)
    .maybeSingle()

  if (error || !member) {
    console.error('Üye bulunamadı:', EMAIL, error?.message)
    process.exit(1)
  }

  const data = member.data || {}
  const gender = data.gender === 'male' || data.gender === 'female' ? data.gender : 'female'
  console.log(`Üye: ${member.name} <${member.email}> id=${member.id}`)
  console.log(`Paket: ${member.membership} · cinsiyet: ${gender}`)

  const healthTest = buildRandomHealthTest(gender)
  const complete = isHealthTestComplete(healthTest, gender)
  console.log(`Sağlık testi tamam mı? ${complete}`)
  if (!complete) {
    for (const s of getApplicableSections(gender)) {
      const bad = s.questions.filter((q) => !isQuestionFullyAnswered(q, healthTest)).map((q) => q.key)
      if (bad.length) console.log(`  eksik ${s.id}:`, bad.slice(0, 15).join(', '))
    }
    process.exit(1)
  }

  const answeredKeys = Object.keys(healthTest).filter((k) => {
    const v = healthTest[k]
    if (Array.isArray(v)) return v.length > 0
    return v !== '' && v != null
  })
  console.log(`Cevaplanan alan sayısı: ${answeredKeys.length}`)

  const nextData = {
    ...data,
    gender,
    healthTest,
    healthAck: true,
    disclaimer: true,
    weight: data.weight || 68,
    height: data.height || 165,
    age: data.age || 28,
    goals: Array.isArray(data.goals) && data.goals.length ? data.goals : ['weight', 'tone'],
    fitnessLevel: data.fitnessLevel || 'beginner',
    availability: data.availability && Object.keys(data.availability).length
      ? data.availability
      : { 1: ['09:00'], 3: ['09:00'], 5: ['18:00'] },
    healthAnalysis: null,
  }

  if (member.membership === 'free') {
    const exp = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    nextData.freeTrialExpiresAt = exp
    console.log('freeTrialExpiresAt →', exp)
  }

  const { error: upErr } = await admin
    .from('members')
    .update({ data: nextData })
    .eq('id', member.id)
  if (upErr) {
    console.error('Üye güncellenemedi:', upErr.message)
    process.exit(1)
  }
  console.log('✓ healthTest kaydedildi')

  const memberRow = {
    id: member.id,
    name: member.name,
    membership: member.membership,
    data: nextData,
  }

  const sources = member.membership === 'eko' ? [AI_EKO_SOURCE, AI_BASIC_SOURCE] : [AI_BASIC_SOURCE]
  const { data: existing } = await admin.from('programs').select('id, data').eq('member_id', member.id)
  const toDelete = (existing || [])
    .filter((p) => sources.includes(p.data?.source))
    .map((p) => p.id)
  if (toDelete.length) {
    await admin.from('programs').delete().in('id', toDelete)
    console.log(`✓ eski AI program silindi: ${toDelete.length}`)
  }

  console.log('AI program üretiliyor…')
  let result

  if (process.env.OPENAI_API_KEY) {
    if (member.membership === 'eko') {
      result = await generateEkoPrograms(admin, memberRow, { force: true })
    } else if (member.membership === 'free') {
      result = await generateBasicPrograms(admin, memberRow)
    } else {
      console.log('Bu paket AI Basic/Eko üretmiyor:', member.membership)
      process.exit(0)
    }
  } else {
    // Yerelde OpenAI yoksa production API + magiclink oturumu
    const base = (process.env.APP_URL || process.env.VITE_SITE_URL || 'https://www.yeniform.com').replace(/\/$/, '')
    const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    if (!base || !anon) {
      console.error('OPENAI_API_KEY yok; APP_URL + anon key ile production çağrısı da yapılamadı')
      process.exit(1)
    }
    console.log(`Yerel OpenAI yok → production: ${base}/api/ai-nutrition-tips`)

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: member.email,
    })
    const hashed = linkData?.properties?.hashed_token
      || linkData?.properties?.email_otp
      || null
    if (linkErr || !hashed) {
      console.error('Magic link üretilemedi:', linkErr?.message || JSON.stringify(linkData))
      process.exit(1)
    }

    const anonClient = createClient(url, anon, { auth: { persistSession: false } })
    let otpData = null
    let otpErr = null
    ;({ data: otpData, error: otpErr } = await anonClient.auth.verifyOtp({
      token_hash: hashed,
      type: 'email',
    }))
    if (otpErr || !otpData?.session?.access_token) {
      // fallback: token_hash magiclink type
      ;({ data: otpData, error: otpErr } = await anonClient.auth.verifyOtp({
        token_hash: hashed,
        type: 'magiclink',
      }))
    }
    if (otpErr || !otpData?.session?.access_token) {
      console.error('Oturum açılamadı:', otpErr?.message)
      process.exit(1)
    }
    console.log('✓ geçici oturum açıldı')

    const task = member.membership === 'eko' ? 'eko-programs' : 'basic-programs'
    const res = await fetch(`${base}/api/ai-nutrition-tips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otpData.session.access_token}`,
      },
      body: JSON.stringify({ task, force: true }),
    })
    const text = await res.text()
    try {
      result = JSON.parse(text)
    } catch {
      result = { ok: false, error: text.slice(0, 400) }
    }
    if (!result.ok && res.status >= 400) {
      result.ok = false
      result.error = result.error || `HTTP ${res.status}`
    }
  }

  console.log(JSON.stringify({
    ok: result.ok,
    synced: result.synced,
    skipped: result.skipped,
    error: result.error,
    cycleStartDate: result.cycleStartDate,
    cycleEndDate: result.cycleEndDate,
    dailyCalories: result.dailyCalories,
    programs: (result.programs || []).map((p) => ({
      id: p.id,
      type: p.type,
      title: p.title,
      source: p.source,
      cycleSameDaily: p.cycleSameDaily,
      entries: Array.isArray(p.entries) ? p.entries.length : 0,
    })),
    coaching: result.coaching || null,
  }, null, 2))

  if (!result.ok) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

/**
 * AI endpoint testleri — yerel veya production.
 *
 * Kullanım:
 *   node scripts/test-ai.mjs              # blog + metin kalori (GEMINI_API_KEY gerekli)
 *   node scripts/test-ai.mjs --blog-only  # yalnızca blog üretimi
 *   node scripts/test-ai.mjs --text-only  # yalnızca metin kalori
 *
 * Ortam: .env.local veya .env.production.local (vercel env pull)
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

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
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env.production.local')

const args = process.argv.slice(2)
const blogOnly = args.includes('--blog-only')
const textOnly = args.includes('--text-only')

const BASE = process.env.APP_URL || process.env.VITE_SITE_URL || 'http://localhost:3000'

async function testBlogGenerate() {
  const secret = process.env.CRON_SECRET
  console.log('\n── Blog üretimi (POST /api/ai-blog-generate) ──')

  if (!process.env.GEMINI_API_KEY) {
    console.log('⏭ GEMINI_API_KEY yok — atlanıyor')
    return false
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('⏭ SUPABASE_SERVICE_ROLE_KEY yok — atlanıyor')
    return false
  }

  const headers = { 'Content-Type': 'application/json' }
  if (secret) headers.Authorization = `Bearer ${secret}`

  const url = `${BASE}/api/ai-blog-generate?force=true`
  console.log(`→ ${url}`)

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ force: true }),
  })
  const data = await res.json().catch(() => ({}))

  if (res.ok && data.ok) {
    console.log(`✅ Blog oluşturuldu: "${data.title}"`)
    console.log(`   Kategori: ${data.category} | ${data.charCount} karakter | ~${data.readMinutes} dk`)
    return true
  }
  if (data.skipped) {
    console.log(`ℹ️ Atlandı: ${data.reason}`)
    return true
  }
  console.log(`❌ Hata (${res.status}):`, data.error || data)
  return false
}

async function testFoodTextDirect() {
  console.log('\n── Metin kalori (doğrudan Gemini) ──')

  if (!process.env.GEMINI_API_KEY) {
    console.log('⏭ GEMINI_API_KEY yok — atlanıyor')
    return false
  }

  const { callGemini, parseJsonResponse } = await import('../api/_gemini.js')
  const { FOOD_TEXT_SYSTEM, FOOD_TEXT_INSTRUCTION, FOOD_TEXT_CONFIG } = await import('../api/_ai-prompts.js')

  const sample = '2 haşlanmış yumurta, 1 dilim tam buğday ekmeği, 1 kase süzme yoğurt, 1 bardak çay'
  const instruction = FOOD_TEXT_INSTRUCTION.replace('{{TEXT}}', sample)

  try {
    const raw = await callGemini([{ text: instruction }], FOOD_TEXT_SYSTEM, FOOD_TEXT_CONFIG)
    const result = parseJsonResponse(raw)
    const total = (result.items || []).reduce((s, i) => s + (Number(i.cal) || 0), 0)
    console.log(`✅ Analiz: ${result.label}`)
    for (const item of result.items || []) {
      console.log(`   • ${item.name} — ${item.amount} ${item.unit} · ~${item.cal} kcal`)
    }
    console.log(`   Toplam: ~${total} kcal (güven: ${result.confidence})`)
    return (result.items || []).length > 0
  } catch (e) {
    console.log('❌ Hata:', e.message || e)
    return false
  }
}

async function main() {
  console.log('AI Test — Yeni Form')
  console.log(`Ortam: GEMINI=${process.env.GEMINI_API_KEY ? '✓' : '✗'} CRON=${process.env.CRON_SECRET ? '✓' : '✗'}`)

  let ok = true
  if (!textOnly) {
    const blogOk = await testBlogGenerate()
    if (!blogOk && process.env.GEMINI_API_KEY) ok = false
  }
  if (!blogOnly) {
    const textOk = await testFoodTextDirect()
    if (!textOk && process.env.GEMINI_API_KEY) ok = false
  }

  console.log(ok ? '\n✅ Testler tamamlandı' : '\n❌ Bazı testler başarısız')
  process.exit(ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

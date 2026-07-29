/**
 * Geçmiş AI sağlık analizlerini ai_usage_logs'a tahmini maliyetle yazar.
 *
 * Kullanım:
 *   node scripts/backfill-ai-health-usage.mjs
 *   node scripts/backfill-ai-health-usage.mjs --dry-run
 *
 * Ortam: .env.local (SUPABASE_URL / VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
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
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env.production.local')

const dryRun = process.argv.includes('--dry-run')

/** GPT-5.4 tahmini token (tipik health score + staffBrief yanıtı) */
const GPT54_PROMPT = 2800
const GPT54_COMPLETION = 900
/** Eski Gemini health score tahmini */
const GEMINI_PROMPT = 2200
const GEMINI_COMPLETION = 700

const GPT54_INPUT_PER_M = 2.5
const GPT54_OUTPUT_PER_M = 15.0
/** gemini-2.5-flash-lite yaklaşık (USD / 1M) */
const GEMINI_FLASH_LITE_INPUT_PER_M = 0.1
const GEMINI_FLASH_LITE_OUTPUT_PER_M = 0.4

function roundMoney(n) {
  return Math.round((Number(n) || 0) * 1_000_000) / 1_000_000
}

function estimateCost(promptTokens, completionTokens, inputPerM, outputPerM) {
  const input = (Number(promptTokens) || 0) / 1_000_000 * inputPerM
  const output = (Number(completionTokens) || 0) / 1_000_000 * outputPerM
  return roundMoney(input + output)
}

function dayKey(iso) {
  return String(iso || '').slice(0, 10)
}

function isAiGenerated(analysis) {
  if (!analysis || typeof analysis !== 'object') return false
  return analysis.aiGenerated === true || analysis.aiGenerated === 'true'
}

function classify(analysis) {
  const model = String(analysis?.model || '').toLowerCase()
  const version = Number(analysis?.version) || 0
  if (model.includes('gpt-5') || version >= 11) {
    return {
      provider: 'openai',
      model: analysis.model || 'gpt-5.4',
      promptTokens: Number(analysis.promptTokens) || GPT54_PROMPT,
      completionTokens: Number(analysis.completionTokens) || GPT54_COMPLETION,
      costUsd: Number(analysis.costUsd) > 0
        ? Number(analysis.costUsd)
        : estimateCost(
          Number(analysis.promptTokens) || GPT54_PROMPT,
          Number(analysis.completionTokens) || GPT54_COMPLETION,
          GPT54_INPUT_PER_M,
          GPT54_OUTPUT_PER_M,
        ),
    }
  }
  return {
    provider: 'gemini',
    model: 'gemini-2.5-flash-lite',
    promptTokens: GEMINI_PROMPT,
    completionTokens: GEMINI_COMPLETION,
    costUsd: estimateCost(GEMINI_PROMPT, GEMINI_COMPLETION, GEMINI_FLASH_LITE_INPUT_PER_M, GEMINI_FLASH_LITE_OUTPUT_PER_M),
  }
}

function supabaseAdmin() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!url || !key) {
    throw new Error('SUPABASE_URL (veya VITE_SUPABASE_URL) ve SUPABASE_SERVICE_ROLE_KEY gerekli')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function main() {
  const admin = supabaseAdmin()

  const { data: members, error } = await admin
    .from('members')
    .select('id, data')
    .not('data->healthAnalysis', 'is', null)

  if (error) throw new Error(error.message)

  const candidates = []
  for (const row of members || []) {
    const analysis = row.data?.healthAnalysis
    if (!isAiGenerated(analysis)) continue
    const at = analysis.aiAttemptedAt
      || (analysis.generatedAt ? `${analysis.generatedAt}T12:00:00.000Z` : null)
      || null
    if (!at) continue
    candidates.push({
      memberId: row.id,
      createdAt: at,
      ...classify(analysis),
      source: 'healthAnalysis',
    })
  }

  const { data: existing, error: existErr } = await admin
    .from('ai_usage_logs')
    .select('id, user_id, created_at, meta')
    .eq('endpoint', 'ai-health-analysis')
    .eq('success', true)

  if (existErr) throw new Error(existErr.message)

  const existingKeys = new Set()
  for (const row of existing || []) {
    const mid = row.meta?.memberId || row.user_id
    if (mid) existingKeys.add(`${mid}|${dayKey(row.created_at)}`)
  }

  const toInsert = []
  for (const c of candidates) {
    const key = `${c.memberId}|${dayKey(c.createdAt)}`
    if (existingKeys.has(key)) {
      console.log(`skip (exists) ${key}`)
      continue
    }
    existingKeys.add(key)
    toInsert.push({
      created_at: c.createdAt,
      provider: c.provider,
      model: c.model,
      endpoint: 'ai-health-analysis',
      user_id: c.memberId,
      prompt_tokens: c.promptTokens,
      completion_tokens: c.completionTokens,
      total_tokens: c.promptTokens + c.completionTokens,
      cost_usd: c.costUsd,
      success: true,
      error_code: null,
      meta: {
        backfilled: true,
        estimated: true,
        memberId: c.memberId,
        source: c.source,
      },
    })
  }

  console.log(`Aday: ${candidates.length}, eklenecek: ${toInsert.length}, dry-run: ${dryRun}`)
  for (const row of toInsert) {
    console.log(
      `  ${dayKey(row.created_at)} ${row.provider}/${row.model} $${row.cost_usd} member=${row.user_id.slice(0, 8)}…`,
    )
  }

  if (dryRun || toInsert.length === 0) {
    console.log(dryRun ? 'Dry-run — yazılmadı.' : 'Yazılacak satır yok.')
    return
  }

  const { error: insertErr } = await admin.from('ai_usage_logs').insert(toInsert)
  if (insertErr) throw new Error(insertErr.message)

  console.log(`✓ ${toInsert.length} satır ai_usage_logs'a eklendi.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

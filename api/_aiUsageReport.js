/**
 * Admin YZ gider raporu — /api/auth action: ai-usage-report
 */
import { requireAdmin } from './_guards.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'

function startOfDayIso(daysAgo = 0) {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString()
}

function roundMoney(n) {
  return Math.round((Number(n) || 0) * 1_000_000) / 1_000_000
}

function emptySummary() {
  return {
    calls: 0,
    successCalls: 0,
    failedCalls: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    costUsd: 0,
  }
}

function accumulate(summary, row) {
  summary.calls += 1
  if (row.success) summary.successCalls += 1
  else summary.failedCalls += 1
  summary.promptTokens += Number(row.prompt_tokens) || 0
  summary.completionTokens += Number(row.completion_tokens) || 0
  summary.totalTokens += Number(row.total_tokens) || 0
  summary.costUsd = roundMoney(summary.costUsd + (Number(row.cost_usd) || 0))
}

export async function handleAiUsageReport(req, res, body = {}) {
  const auth = await requireAdmin(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error })
  }

  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ ok: false, error: 'Supabase yapılandırması eksik' })
  }

  const admin = getSupabaseAdmin()
  const days = Math.min(90, Math.max(1, Number(body.days) || 30))
  const since = startOfDayIso(days - 1)

  const { data, error } = await admin
    .from('ai_usage_logs')
    .select('id, created_at, provider, model, endpoint, user_id, prompt_tokens, completion_tokens, total_tokens, cost_usd, success, error_code')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(2000)

  if (error) {
    return res.status(500).json({ ok: false, error: error.message || 'YZ gider verisi alınamadı' })
  }

  const rows = data || []
  const totals = emptySummary()
  const byDay = {}
  const byEndpoint = {}
  const byProvider = {}
  const byModel = {}

  for (const row of rows) {
    accumulate(totals, row)

    const day = String(row.created_at || '').slice(0, 10) || '—'
    if (!byDay[day]) byDay[day] = emptySummary()
    accumulate(byDay[day], row)

    const ep = row.endpoint || 'other'
    if (!byEndpoint[ep]) byEndpoint[ep] = emptySummary()
    accumulate(byEndpoint[ep], row)

    const prov = row.provider || 'other'
    if (!byProvider[prov]) byProvider[prov] = emptySummary()
    accumulate(byProvider[prov], row)

    const model = row.model || 'unknown'
    if (!byModel[model]) byModel[model] = emptySummary()
    accumulate(byModel[model], row)
  }

  const daySeries = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, s]) => ({ date, ...s }))

  const endpointRows = Object.entries(byEndpoint)
    .map(([endpoint, s]) => ({ endpoint, ...s }))
    .sort((a, b) => b.costUsd - a.costUsd)

  const providerRows = Object.entries(byProvider)
    .map(([provider, s]) => ({ provider, ...s }))
    .sort((a, b) => b.costUsd - a.costUsd)

  const modelRows = Object.entries(byModel)
    .map(([model, s]) => ({ model, ...s }))
    .sort((a, b) => b.costUsd - a.costUsd)

  const recent = rows.slice(0, 50).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    provider: r.provider,
    model: r.model,
    endpoint: r.endpoint,
    userId: r.user_id,
    promptTokens: r.prompt_tokens,
    completionTokens: r.completion_tokens,
    totalTokens: r.total_tokens,
    costUsd: Number(r.cost_usd) || 0,
    success: r.success,
    errorCode: r.error_code,
  }))

  const foodTextEndpoints = new Set(['food-text', 'food-text-cache', 'food-text-dictionary'])
  let foodTextTotal = 0
  let foodTextCacheHits = 0
  for (const row of rows) {
    const ep = row.endpoint || ''
    if (!foodTextEndpoints.has(ep)) continue
    foodTextTotal += 1
    if (ep === 'food-text-cache' || ep === 'food-text-dictionary') foodTextCacheHits += 1
  }
  const cacheHitRate = foodTextTotal
    ? Math.round((foodTextCacheHits / foodTextTotal) * 1000) / 10
    : 0

  return res.status(200).json({
    ok: true,
    days,
    since,
    totals: { ...totals, costUsd: roundMoney(totals.costUsd) },
    cacheStats: {
      foodTextTotal,
      foodTextCacheHits,
      foodTextOpenAi: Math.max(0, foodTextTotal - foodTextCacheHits),
      cacheHitRate,
    },
    daySeries,
    byEndpoint: endpointRows,
    byProvider: providerRows,
    byModel: modelRows,
    recent,
    pricingNote: 'Maliyet tahmini: Kalori GPT-4o $2.50 / $10.00; Program GPT-4.1 $2.00 / $8.00 (1M giriş/çıkış token). Cache/sözlük hit’leri $0. OpenAI fatura tutarıyla küçük farklar olabilir.',
  })
}

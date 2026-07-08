/**
 * Günün ipucu — Gemini ile günlük motivasyon cümlesi.
 *
 * GET (üye oturumu): bugünün ipucunu döner; yoksa üretir ve site_content'e yazar.
 * Cron (CRON_SECRET): her sabah önceden üretir — vercel.json schedule.
 */

import {
  DAILY_TIP_SYSTEM,
  buildDailyTipInstruction,
  DAILY_TIP_CONFIG,
} from './_ai-prompts.js'
import { pickFallbackTip } from './_daily-tip-fallback.js'
import { setCorsHeaders, handleOptions, requireAuth } from './_guards.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'

async function loadGemini() {
  const href = new URL('./_gemini.js', import.meta.url).href
  const url = process.env.NODE_ENV === 'production' ? href : `${href}?t=${Date.now()}`
  return import(url)
}

const TZ = 'Europe/Istanbul'
const KIND = 'daily_tip'

function todayIstanbul() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ })
}

function isCronRequest(req) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.authorization || ''
  return auth === `Bearer ${secret}` || req.headers['x-cron-secret'] === secret
}

function normalizeTip(text) {
  return String(text || '').trim().replace(/\s+/g, ' ').slice(0, 160)
}

async function getCachedTip(admin, date) {
  const { data } = await admin
    .from('site_content')
    .select('id, data')
    .eq('kind', KIND)
    .filter('data->>date', 'eq', date)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const tip = normalizeTip(data?.data?.tip)
  if (!tip) return null
  return {
    tip,
    date: data.data.date || date,
    aiGenerated: Boolean(data.data.aiGenerated),
    cached: true,
  }
}

async function getRecentTips(admin, limit = 7) {
  const { data } = await admin
    .from('site_content')
    .select('data')
    .eq('kind', KIND)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data || [])
    .map((r) => normalizeTip(r.data?.tip))
    .filter(Boolean)
}

async function saveTip(admin, { date, tip, aiGenerated }) {
  const { error } = await admin.from('site_content').insert({
    kind: KIND,
    sort: 0,
    data: { date, tip, aiGenerated },
  })
  if (error) throw new Error(error.message)
}

async function generateTip(admin, date) {
  const { callGemini, parseJsonResponse, isGeminiConfigured } = await loadGemini()

  if (!isGeminiConfigured()) {
    const tip = pickFallbackTip(date)
    await saveTip(admin, { date, tip, aiGenerated: false })
    return { tip, date, aiGenerated: false, cached: false, fallback: true }
  }

  const recentTips = await getRecentTips(admin)
  const instruction = buildDailyTipInstruction({ date, recentTips })
  const raw = await callGemini([{ text: instruction }], DAILY_TIP_SYSTEM, DAILY_TIP_CONFIG)
  const parsed = parseJsonResponse(raw)
  let tip = normalizeTip(parsed.tip)

  if (!tip) {
    tip = pickFallbackTip(date)
    await saveTip(admin, { date, tip, aiGenerated: false })
    return { tip, date, aiGenerated: false, cached: false, fallback: true }
  }

  await saveTip(admin, { date, tip, aiGenerated: true })
  return { tip, date, aiGenerated: true, cached: false, fallback: false }
}

export async function resolveDailyTip({ force = false } = {}) {
  const date = todayIstanbul()

  if (!isSupabaseAdminConfigured()) {
    return {
      ok: true,
      tip: pickFallbackTip(date),
      date,
      aiGenerated: false,
      cached: false,
      fallback: true,
    }
  }

  const admin = getSupabaseAdmin()

  if (!force) {
    const cached = await getCachedTip(admin, date)
    if (cached) return { ok: true, ...cached }
  }

  try {
    const result = await generateTip(admin, date)
    return { ok: true, ...result }
  } catch {
    const tip = pickFallbackTip(date)
    return { ok: true, tip, date, aiGenerated: false, cached: false, fallback: true }
  }
}

export default async function handler(req, res) {
  setCorsHeaders(res, 'GET, POST, OPTIONS', 'Content-Type, Authorization, X-Cron-Secret')
  if (handleOptions(req, res)) return
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Yalnızca GET/POST desteklenir' })
  }

  const cron = isCronRequest(req)
  if (!cron) {
    const auth = await requireAuth(req)
    if (!auth.ok) {
      return res.status(auth.status).json({ ok: false, error: auth.error })
    }
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const force = body.force === true || req.query?.force === 'true'

  try {
    const result = await resolveDailyTip({ force })
    return res.status(200).json(result)
  } catch (e) {
    const date = todayIstanbul()
    return res.status(200).json({
      ok: true,
      tip: pickFallbackTip(date),
      date,
      aiGenerated: false,
      cached: false,
      fallback: true,
    })
  }
}

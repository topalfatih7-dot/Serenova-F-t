/**
 * Günlük AI blog makalesi üretimi — Vercel Cron veya manuel tetikleme.
 *
 * Her gün belirlenen saatte (vercel.json cron) Gemini ile bilimsel makale üretir
 * ve Supabase posts tablosuna yayınlar. İçerik min. 900 karakter.
 *
 * Koruma: CRON_SECRET (Vercel cron otomatik Bearer gönderir)
 * Manuel test: POST + header X-Cron-Secret veya Authorization: Bearer <CRON_SECRET>
 *
 * Opsiyonel body: { "force": true } — bugün yazı olsa bile yeni üret
 */

import {
  BLOG_SYSTEM,
  BLOG_CONFIG,
  BLOG_MIN_CHARS,
  BLOG_ACCENTS,
  BLOG_CATEGORIES,
  BLOG_TOPIC_ROTATION,
  buildBlogInstruction,
} from './_ai-prompts.js'
import { setCorsHeaders, handleOptions, requireCronSecret } from './_guards.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'

async function loadGemini() {
  const href = new URL('./_gemini.js', import.meta.url).href
  const url = process.env.NODE_ENV === 'production' ? href : `${href}?t=${Date.now()}`
  return import(url)
}

const TZ = 'Europe/Istanbul'

function todayIstanbul() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ })
}

function estimateReadMinutes(content) {
  const words = String(content || '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

function pickTopicForToday() {
  const now = new Date()
  const dayOfYear = Math.floor(
    (now - new Date(now.getFullYear(), 0, 0)) / 86400000,
  )
  const rotation = BLOG_TOPIC_ROTATION[dayOfYear % BLOG_TOPIC_ROTATION.length]
  const topicIndex = Math.floor(dayOfYear / BLOG_TOPIC_ROTATION.length) % rotation.topics.length
  return {
    category: rotation.category,
    topicHint: rotation.topics[topicIndex],
  }
}

function normalizePost(result) {
  const content = String(result.content || '').trim()
  const category = BLOG_CATEGORIES.includes(result.category) ? result.category : 'Yaşam'
  const accent = BLOG_ACCENTS.includes(result.accent) ? result.accent : 'brand'
  return {
    title: String(result.title || 'Yeni Form Blog').slice(0, 120),
    category,
    excerpt: String(result.excerpt || content.slice(0, 140)).slice(0, 200),
    author: String(result.author || 'Yeni Form Ekibi').slice(0, 60),
    accent,
    content,
    readMinutes: estimateReadMinutes(content),
    createdAt: todayIstanbul(),
    updatedAt: todayIstanbul(),
  }
}

async function getRecentTitles(admin) {
  const { data } = await admin
    .from('posts')
    .select('data')
    .order('created_at', { ascending: false })
    .limit(12)
  return (data || []).map((r) => r.data?.title).filter(Boolean)
}

async function hasPostToday(admin) {
  const today = todayIstanbul()
  const { data } = await admin
    .from('posts')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return (data || []).some((row) => {
    const postDate = new Date(row.created_at).toLocaleDateString('en-CA', { timeZone: TZ })
    return postDate === today
  })
}

export default async function handler(req, res) {
  setCorsHeaders(res, 'GET, POST, OPTIONS', 'Content-Type, Authorization, X-Cron-Secret')
  if (handleOptions(req, res)) return
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Yalnızca GET/POST desteklenir' })
  }

  const cronGuard = requireCronSecret(req)
  if (!cronGuard.ok) {
    return res.status(cronGuard.status).json({ ok: false, error: cronGuard.error })
  }

  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ ok: false, error: 'Supabase admin yapılandırması eksik' })
  }

  const { callGemini, parseJsonResponse, isGeminiConfigured } = await loadGemini()
  if (!isGeminiConfigured()) {
    return res.status(503).json({ ok: false, error: 'AI yapılandırması eksik (GEMINI_API_KEY)' })
  }

  const admin = getSupabaseAdmin()
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const force = body.force === true || req.query?.force === 'true'

  try {
    if (!force && (await hasPostToday(admin))) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        reason: 'Bugün zaten bir blog yazısı yayınlandı',
        date: todayIstanbul(),
      })
    }

    const { category, topicHint } = pickTopicForToday()
    const recentTitles = await getRecentTitles(admin)
    const instruction = buildBlogInstruction({ category, topicHint, recentTitles })

    const raw = await callGemini([{ text: instruction }], BLOG_SYSTEM, BLOG_CONFIG)
    const parsed = parseJsonResponse(raw)
    const post = normalizePost(parsed)

    if (post.content.length < BLOG_MIN_CHARS) {
      return res.status(502).json({
        ok: false,
        error: `Üretilen içerik çok kısa (${post.content.length}/${BLOG_MIN_CHARS} karakter)`,
      })
    }

    const { data: row, error } = await admin
      .from('posts')
      .insert({
        published: true,
        data: post,
      })
      .select('id, data, created_at')
      .single()

    if (error) {
      return res.status(500).json({ ok: false, error: error.message })
    }

    return res.status(201).json({
      ok: true,
      id: row.id,
      title: post.title,
      category: post.category,
      charCount: post.content.length,
      readMinutes: post.readMinutes,
      createdAt: row.created_at,
    })
  } catch (e) {
    const status = e?.status || 500
    const errBody = e?.code
      ? { ok: false, code: e.code, error: e.message || String(e) }
      : { ok: false, error: String(e?.message || e) }
    return res.status(status).json(errBody)
  }
}

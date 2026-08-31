/**
 * Günlük AI / ops işleri — Vercel Hobby 12 fonksiyon limiti için tek route.
 *
 * ?task=blog (varsayılan) — günlük blog makalesi (CRON_SECRET, cron 05:00)
 * ?task=daily-tip — dashboard günün ipucu (üye GET veya CRON_SECRET, cron 04:00)
 * ?task=supabase-health — Supabase kota/erişim kontrolü + Telegram (CRON_SECRET, saatlik)
 * ?task=membership-expiry — süresi dolan ücretli üyeleri free fallback'e indirger + katalog fiyat hizalama / T-7 (CRON_SECRET, cron 03:00)
 * ?task=session-reminders — randevu T-24s / T-1s in-app (CRON_SECRET, saatlik)
 * ?task=session-attendance — açık görüşme attendance finalize + şişmiş hakediş denetimi (CRON_SECRET, cron 02:20; Hobby günlük)
 */

import {
  BLOG_SYSTEM,
  BLOG_CONFIG,
  BLOG_MIN_CHARS,
  BLOG_ACCENTS,
  BLOG_CATEGORIES,
  BLOG_AUTHOR,
  pickBlogTopic,
  buildBlogInstruction,
} from './_ai-prompts.js'
import { coverForCategory } from './_blog-images.js'
import { handleDailyTip } from './_dailyTip.js'
import { handleSupabaseHealth } from './_supabaseHealth.js'
import { setCorsHeaders, handleOptions, requireCronSecret } from './_guards.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'

async function loadGemini() {
  const href = new URL('./_gemini.js', import.meta.url).href
  const url = process.env.NODE_ENV === 'production' ? href : `${href}?t=${Date.now()}`
  return import(url)
}

const TZ = 'Europe/Istanbul'

function slugifyTurkish(text) {
  return String(text || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function todayIstanbul() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ })
}

function estimateReadMinutes(content) {
  const words = String(content || '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

function normalizePost(result) {
  const content = String(result.content || '').trim()
  const category = BLOG_CATEGORIES.includes(result.category) ? result.category : 'Yaşam'
  const accent = BLOG_ACCENTS.includes(result.accent) ? result.accent : 'brand'
  const cover = coverForCategory(category)
  const title = String(result.title || 'Yeni Form Blog').slice(0, 120)
  return {
    title,
    slug: slugifyTurkish(title),
    category,
    excerpt: String(result.excerpt || content.slice(0, 140)).slice(0, 200),
    author: BLOG_AUTHOR,
    accent,
    content,
    coverImage: cover.coverImage,
    coverImageAlt: cover.coverImageAlt,
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
    .limit(40)
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
  const task = String(req.query?.task || 'blog').toLowerCase()
  if (task === 'daily-tip' || task === 'daily_tip') {
    return handleDailyTip(req, res)
  }
  if (task === 'supabase-health' || task === 'supabase_health' || task === 'health') {
    return handleSupabaseHealth(req, res)
  }
  if (
    task === 'membership-expiry'
    || task === 'membership_expiry'
    || task === 'expiry'
  ) {
    return handleMembershipExpiry(req, res)
  }
  if (
    task === 'session-reminders'
    || task === 'session_reminders'
    || task === 'reminders'
  ) {
    return handleSessionReminders(req, res)
  }
  if (
    task === 'session-attendance'
    || task === 'session_attendance'
    || task === 'attendance-finalize'
  ) {
    return handleSessionAttendanceFinalize(req, res)
  }
  return handleBlogGenerate(req, res)
}

async function handleSessionAttendanceFinalize(req, res) {
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

  try {
    const { finalizeExpiredSessionAttendances, auditInflatedStaffEarnings } = await import('./_sessionAttendance.js')
    const admin = getSupabaseAdmin()
    const finalized = await finalizeExpiredSessionAttendances(admin)
    const audit = await auditInflatedStaffEarnings(admin)
    return res.status(200).json({ ok: true, finalized, audit })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Attendance finalize hatası' })
  }
}

async function handleSessionReminders(req, res) {
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

  try {
    const { runSessionRemindersBatch } = await import('./_sessionReminders.js')
    const admin = getSupabaseAdmin()
    const result = await runSessionRemindersBatch(admin)
    return res.status(200).json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Hatırlatma hatası' })
  }
}

async function handleMembershipExpiry(req, res) {
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

  try {
    const { runMembershipExpiryBatch } = await import('./_membershipExpiry.js')
    const admin = getSupabaseAdmin()
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
    const expiryLimit = Math.min(200, Math.max(1, Number(body.expiryLimit || req.query?.expiryLimit) || 100))
    const expiry = await runMembershipExpiryBatch(admin, { limit: expiryLimit })

    let catalog = { skipped: true }
    try {
      const { isStripeConfigured, getStripe } = await import('./_stripe.js')
      if (isStripeConfigured()) {
        const { alignAllPlanCatalogs } = await import('./_stripePriceSync.js')
        const { runCatalogPriceReminders } = await import('./_stripePriceReminders.js')
        const stripe = getStripe()
        catalog = {
          align: await alignAllPlanCatalogs(stripe, admin),
          reminders: await runCatalogPriceReminders(stripe, admin),
        }
      }
    } catch (catalogErr) {
      console.warn('[membership-expiry] catalog', catalogErr)
      catalog = { ok: false, error: catalogErr.message }
    }

    return res.status(200).json({ ok: true, expiry, catalog })
  } catch (e) {
    console.error('[membership-expiry]', e)
    return res.status(500).json({ ok: false, error: e.message || 'Üyelik süre dolumu hatası' })
  }
}

async function handleBlogGenerate(req, res) {
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

    const recentTitles = await getRecentTitles(admin)
    const { category, topicHint } = pickBlogTopic(recentTitles)
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

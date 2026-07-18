/**
 * Form / API saldırı uyarısı → TELEGRAM_OPS_CHAT_ID (supabase healthcheck ile aynı chat).
 * Eşik + cooldown ile Telegram spam’ini önler.
 */

import { sendTelegramMessage } from './_telegramSend.js'
import { getClientIp } from './_rateLimit.js'

const TZ = 'Europe/Istanbul'
/** Aynı tür uyarı için minimum aralık */
const COOLDOWN_MS = 10 * 60 * 1000
/** Bu kadar engellenen istek sonrası ilk uyarı */
const ALERT_THRESHOLD = 3
const SCORE_WINDOW_MS = 10 * 60 * 1000

const memoryCooldown = new Map()
const memoryScores = new Map()

let redisPromise = null

function getOpsChatId() {
  return process.env.TELEGRAM_OPS_CHAT_ID || process.env.TELEGRAM_CHAT_ID || ''
}

function nowTr() {
  return new Date().toLocaleString('tr-TR', { timeZone: TZ })
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function reasonLabel(reason) {
  switch (reason) {
    case 'turnstile_missing':
      return 'Turnstile yok / boş token'
    case 'turnstile_failed':
      return 'Sahte / geçersiz Turnstile'
    case 'rate_limit':
      return 'Rate limit aşıldı (429)'
    case 'honeypot':
      return 'Honeypot dolduruldu (bot)'
    case 'invalid_session':
      return 'Geçersiz form oturumu'
    case 'auth_rate_limit':
      return 'Auth rate limit (signup/login/reset)'
    case 'disposable_email':
      return 'Tek kullanımlık e-posta (bot)'
    default:
      return reason || 'Bilinmeyen'
  }
}

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  if (!redisPromise) {
    redisPromise = import('@upstash/redis').then(({ Redis }) => new Redis({ url, token }))
  }
  try {
    return await redisPromise
  } catch {
    redisPromise = null
    return null
  }
}

function bumpMemoryScore(key, windowMs) {
  const now = Date.now()
  const entry = memoryScores.get(key)
  if (!entry || entry.resetAt <= now) {
    memoryScores.set(key, { count: 1, resetAt: now + windowMs })
    return 1
  }
  entry.count += 1
  return entry.count
}

async function getBlockCount(reason, ip) {
  const key = `serenova:attack-score:${reason}:${ip || 'unknown'}`
  const redis = await getRedis()
  if (redis) {
    try {
      const count = await redis.incr(key)
      if (count === 1) await redis.pexpire(key, SCORE_WINDOW_MS)
      return Number(count) || 1
    } catch {
      /* fall through */
    }
  }
  return bumpMemoryScore(`${reason}:${ip}`, SCORE_WINDOW_MS)
}

async function cooldownOk(fingerprint) {
  const redis = await getRedis()
  if (redis) {
    try {
      const key = `serenova:attack-cooldown:${fingerprint}`
      const set = await redis.set(key, '1', { nx: true, px: COOLDOWN_MS })
      return set === 'OK'
    } catch {
      /* fall through */
    }
  }
  const now = Date.now()
  const last = memoryCooldown.get(fingerprint) || 0
  if (now - last < COOLDOWN_MS) return false
  memoryCooldown.set(fingerprint, now)
  return true
}

function buildAttackMessage({ reason, action, ip, status, email, count, path }) {
  return [
    '🚨 <b>Saldırı / bot aktivitesi tespit edildi</b>',
    '',
    `⏱ ${nowTr()}`,
    `🧭 <b>Kaynak:</b> ${escapeHtml(path || '/api/contact')}`,
    `🧩 <b>Aksiyon:</b> ${escapeHtml(action || '—')}`,
    `🛡 <b>Neden:</b> ${escapeHtml(reasonLabel(reason))}`,
    `📊 <b>HTTP:</b> ${escapeHtml(String(status || '—'))}`,
    `🌐 <b>IP:</b> <code>${escapeHtml(ip || 'unknown')}</code>`,
    email ? `📧 <b>E-posta denemesi:</b> ${escapeHtml(email)}` : null,
    `🔢 <b>Pencere içi engel (IP):</b> ${count}`,
    '',
    '<i>Kanal: ops healthcheck (TELEGRAM_OPS_CHAT_ID). 10 dk cooldown.</i>',
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * Engellenen isteği kaydet; eşik aşılırsa OPS chat’e Telegram at.
 */
export async function reportFormAttack(req, {
  action = 'contact',
  reason = 'unknown',
  status = 0,
  email = '',
  path = '/api/contact',
  force = false,
} = {}) {
  const chatId = getOpsChatId()
  if (!chatId) {
    console.info('[attack-alert]', { reason, skipped: true, error: 'ops_chat_missing' })
    return { ok: false, skipped: true, error: 'ops_chat_missing' }
  }

  const ip = getClientIp(req)
  const count = await getBlockCount(reason, ip)

  const urgent =
    reason === 'rate_limit' ||
    reason === 'auth_rate_limit' ||
    reason === 'honeypot' ||
    reason === 'disposable_email' ||
    force
  const hitThreshold = count >= ALERT_THRESHOLD || (urgent && count >= 1)
  if (!hitThreshold) {
    console.info('[attack-alert]', { reason, alerted: false, count, skip: 'below_threshold' })
    return { ok: true, alerted: false, count, reason: 'below_threshold' }
  }

  const fingerprint = `form:${reason}`
  if (!force && !(await cooldownOk(fingerprint))) {
    console.info('[attack-alert]', { reason, alerted: false, count, skip: 'cooldown' })
    return { ok: true, alerted: false, count, reason: 'cooldown' }
  }

  const text = buildAttackMessage({
    reason,
    action,
    ip,
    status,
    email: email ? String(email).slice(0, 80) : '',
    count,
    path,
  })

  const result = await sendTelegramMessage({ chatId, text })
  const out = {
    ok: result.ok,
    alerted: result.ok,
    count,
    error: result.error,
  }
  console.info('[attack-alert]', {
    reason,
    action,
    status,
    count,
    alerted: out.alerted,
    error: out.error || null,
    chatConfigured: Boolean(chatId),
  })
  return out
}

export function mapGuardToAttackReason(guard) {
  if (!guard || guard.ok) return null
  if (guard.status === 429) return 'rate_limit'
  const err = String(guard.error || '').toLowerCase()
  if (err.includes('oturum')) return 'invalid_session'
  if (err.includes('başarısız') || err.includes('basarisiz')) return 'turnstile_failed'
  if (err.includes('gerekli') || err.includes('zorunlu') || err.includes('503')) return 'turnstile_missing'
  if (guard.status === 403) return 'turnstile_failed'
  if (guard.status === 400) return 'turnstile_missing'
  return 'turnstile_failed'
}

/**
 * Supabase sağlık kontrolü — Vercel Cron + Telegram uyarı.
 * Route: /api/ai-blog-generate?task=supabase-health (Hobby 12-fn limiti)
 */

import { setCorsHeaders, handleOptions, requireCronSecret } from './_guards.js'
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_supabaseAdmin.js'
import { sendTelegramMessage } from './_telegramSend.js'

const TZ = 'Europe/Istanbul'
const STATE_KIND = 'ops_health_alert'
/** Aynı uyarıyı en fazla 6 saatte bir tekrar gönder (spam önleme). */
const REALERT_MS = 6 * 60 * 60 * 1000

const PLAN_LIMITS = {
  free: {
    dbWarnBytes: 400 * 1024 * 1024,
    dbCritBytes: 480 * 1024 * 1024,
    storageWarnBytes: Math.floor(0.8 * 1024 * 1024 * 1024),
    storageCritBytes: Math.floor(0.95 * 1024 * 1024 * 1024),
    connWarnRatio: 0.75,
    dbQuotaLabel: '500 MB',
    storageQuotaLabel: '1 GB',
  },
  pro: {
    dbWarnBytes: Math.floor(6.5 * 1024 * 1024 * 1024),
    dbCritBytes: Math.floor(7.5 * 1024 * 1024 * 1024),
    storageWarnBytes: Math.floor(80 * 1024 * 1024 * 1024),
    storageCritBytes: Math.floor(95 * 1024 * 1024 * 1024),
    connWarnRatio: 0.8,
    dbQuotaLabel: '8 GB disk',
    storageQuotaLabel: '100 GB',
  },
}

function getPlan() {
  const raw = String(process.env.SUPABASE_PLAN || 'free').trim().toLowerCase()
  return raw === 'pro' || raw === 'team' ? 'pro' : 'free'
}

function getOpsChatId() {
  return process.env.TELEGRAM_OPS_CHAT_ID || process.env.TELEGRAM_CHAT_ID || ''
}

function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 ** 2) return `${(v / 1024).toFixed(1)} KB`
  if (v < 1024 ** 3) return `${(v / 1024 ** 2).toFixed(1)} MB`
  return `${(v / 1024 ** 3).toFixed(2)} GB`
}

function nowTr() {
  return new Date().toLocaleString('tr-TR', { timeZone: TZ })
}

function severityRank(level) {
  if (level === 'critical') return 3
  if (level === 'warn') return 2
  return 1
}

function worstSeverity(issues) {
  return issues.reduce(
    (acc, i) => (severityRank(i.level) > severityRank(acc) ? i.level : acc),
    'ok',
  )
}

function fingerprint(issues) {
  return issues
    .map((i) => `${i.code}:${i.level}`)
    .sort()
    .join('|')
}

async function collectSnapshot(admin) {
  const started = Date.now()
  const { data, error } = await admin.rpc('ops_health_snapshot')
  const latencyMs = Date.now() - started

  if (error) {
    // RPC yoksa veya hata: en azından API ayakta mı diye ping
    const ping = await admin.from('plans').select('id').limit(1)
    if (ping.error) {
      return {
        ok: false,
        error: error.message || ping.error.message,
        latencyMs,
      }
    }
    return {
      ok: false,
      error: `ops_health_snapshot RPC: ${error.message}`,
      latencyMs,
      partial: true,
    }
  }

  const snap = data && typeof data === 'object' ? data : {}
  return {
    ok: true,
    latencyMs,
    dbBytes: Number(snap.db_bytes) || 0,
    dbPretty: snap.db_pretty || formatBytes(snap.db_bytes),
    activeConnections: Number(snap.active_connections) || 0,
    maxConnections: Number(snap.max_connections) || 0,
    storageBytes: Number(snap.storage_bytes) || 0,
    storageObjects: Number(snap.storage_objects) || 0,
    storagePretty: snap.storage_pretty || formatBytes(snap.storage_bytes),
    members: Number(snap.member_count) || 0,
    authUsers: Number(snap.auth_user_count) || 0,
  }
}

function buildIssues(metrics, plan) {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free
  const issues = []

  if (!metrics.ok) {
    issues.push({
      code: 'db_unreachable',
      level: 'critical',
      text: `Veritabanı/API sorunu: ${metrics.error || 'bilinmeyen hata'}`,
    })
    return issues
  }

  if (metrics.latencyMs > 5000) {
    issues.push({
      code: 'high_latency',
      level: 'warn',
      text: `API yanıtı yavaş: ${metrics.latencyMs} ms`,
    })
  }

  if (metrics.dbBytes >= limits.dbCritBytes) {
    issues.push({
      code: 'db_critical',
      level: 'critical',
      text: `DB kritik: ${metrics.dbPretty} / ${limits.dbQuotaLabel} (${plan})`,
    })
  } else if (metrics.dbBytes >= limits.dbWarnBytes) {
    issues.push({
      code: 'db_warn',
      level: 'warn',
      text: `DB yüksek: ${metrics.dbPretty} / ${limits.dbQuotaLabel} (${plan})`,
    })
  }

  if (metrics.storageBytes >= limits.storageCritBytes) {
    issues.push({
      code: 'storage_critical',
      level: 'critical',
      text: `Storage kritik: ${metrics.storagePretty} / ${limits.storageQuotaLabel} (${plan})`,
    })
  } else if (metrics.storageBytes >= limits.storageWarnBytes) {
    issues.push({
      code: 'storage_warn',
      level: 'warn',
      text: `Storage yüksek: ${metrics.storagePretty} / ${limits.storageQuotaLabel} (${plan})`,
    })
  }

  if (metrics.maxConnections > 0) {
    const ratio = metrics.activeConnections / metrics.maxConnections
    if (ratio >= 0.9) {
      issues.push({
        code: 'conn_critical',
        level: 'critical',
        text: `Bağlantı kritik: ${metrics.activeConnections}/${metrics.maxConnections}`,
      })
    } else if (ratio >= limits.connWarnRatio) {
      issues.push({
        code: 'conn_warn',
        level: 'warn',
        text: `Bağlantı yüksek: ${metrics.activeConnections}/${metrics.maxConnections}`,
      })
    }
  }

  return issues
}

function buildAlertMessage(issues, metrics, plan) {
  const level = worstSeverity(issues)
  const icon = level === 'critical' ? '🚨' : '⚠️'
  const lines = [
    `${icon} <b>Supabase uyarı</b> — Yeni Form`,
    `• Plan: <code>${plan}</code>`,
    ...issues.map((i) => `• [${i.level}] ${i.text}`),
  ]
  if (metrics?.ok) {
    lines.push(`• API: ${metrics.latencyMs} ms`)
    lines.push(`• Üyeler: ${metrics.members} · Auth: ${metrics.authUsers}`)
    lines.push(`• Storage: ${metrics.storagePretty} (${metrics.storageObjects} dosya)`)
    lines.push(`• DB: ${metrics.dbPretty}`)
  }
  lines.push(`• Zaman: ${nowTr()}`)
  return lines.join('\n')
}

function buildRecoveryMessage(metrics, plan) {
  return [
    `✅ <b>Supabase düzeldi</b> — Yeni Form`,
    `• Önceki uyarılar kapandı`,
    `• Plan: <code>${plan}</code>`,
    metrics?.ok ? `• API: ${metrics.latencyMs} ms` : null,
    metrics?.ok ? `• Storage: ${metrics.storagePretty}` : null,
    metrics?.ok ? `• DB: ${metrics.dbPretty}` : null,
    `• Zaman: ${nowTr()}`,
  ]
    .filter(Boolean)
    .join('\n')
}

function buildOkSummary(metrics, plan) {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free
  return [
    `✅ <b>Supabase OK</b> — Yeni Form`,
    `• Plan: <code>${plan}</code>`,
    `• API: ${metrics.latencyMs} ms`,
    `• DB: ${metrics.dbPretty} / ${limits.dbQuotaLabel}`,
    `• Storage: ${metrics.storagePretty} / ${limits.storageQuotaLabel} (${metrics.storageObjects} dosya)`,
    `• Bağlantı: ${metrics.activeConnections}/${metrics.maxConnections}`,
    `• Üyeler: ${metrics.members} · Auth: ${metrics.authUsers}`,
    `• Zaman: ${nowTr()}`,
  ].join('\n')
}

async function loadAlertState(admin) {
  const { data } = await admin
    .from('site_content')
    .select('id, data')
    .eq('kind', STATE_KIND)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data || null
}

async function saveAlertState(admin, existingId, payload) {
  if (existingId) {
    const { error } = await admin.from('site_content').update({ data: payload }).eq('id', existingId)
    if (error) throw error
    return existingId
  }
  const { data, error } = await admin
    .from('site_content')
    .insert({ kind: STATE_KIND, sort: 0, data: payload })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function handleSupabaseHealth(req, res) {
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

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const forceNotify = body.force === true || req.query?.force === 'true'
  const notifyOk = body.notifyOk === true || req.query?.notifyOk === 'true'

  const plan = getPlan()
  const chatId = getOpsChatId()
  const admin = getSupabaseAdmin()

  let metrics
  try {
    metrics = await collectSnapshot(admin)
  } catch (e) {
    metrics = { ok: false, error: String(e?.message || e), latencyMs: 0 }
  }

  const issues = buildIssues(metrics, plan)
  const fp = fingerprint(issues)
  const stateRow = await loadAlertState(admin)
  const prev = stateRow?.data || {}
  const now = Date.now()

  let telegram = { sent: false, reason: 'none' }

  const shouldAlert =
    issues.length > 0 &&
    (forceNotify ||
      fp !== prev.fingerprint ||
      !prev.lastAlertAt ||
      now - Number(prev.lastAlertAt) >= REALERT_MS)

  const shouldRecover = issues.length === 0 && Boolean(prev.fingerprint)

  try {
    if (!chatId) {
      telegram = { sent: false, reason: 'TELEGRAM_OPS_CHAT_ID / TELEGRAM_CHAT_ID yok' }
    } else if (shouldAlert) {
      const text = buildAlertMessage(issues, metrics, plan)
      const result = await sendTelegramMessage({ chatId, text })
      telegram = { sent: result.ok, reason: result.ok ? 'alert' : result.error }
      if (result.ok) {
        await saveAlertState(admin, stateRow?.id, {
          fingerprint: fp,
          lastAlertAt: now,
          lastStatus: worstSeverity(issues),
          issues,
          updatedAt: new Date().toISOString(),
        })
      }
    } else if (shouldRecover) {
      const text = buildRecoveryMessage(metrics, plan)
      const result = await sendTelegramMessage({ chatId, text })
      telegram = { sent: result.ok, reason: result.ok ? 'recovered' : result.error }
      if (result.ok) {
        await saveAlertState(admin, stateRow?.id, {
          fingerprint: '',
          lastAlertAt: prev.lastAlertAt || null,
          lastStatus: 'ok',
          issues: [],
          recoveredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    } else if (notifyOk && issues.length === 0 && metrics.ok) {
      const text = buildOkSummary(metrics, plan)
      const result = await sendTelegramMessage({ chatId, text })
      telegram = { sent: result.ok, reason: result.ok ? 'ok_summary' : result.error }
    } else if (issues.length > 0) {
      telegram = { sent: false, reason: 'deduped_same_alert' }
    }
  } catch (e) {
    telegram = { sent: false, reason: String(e?.message || e) }
  }

  return res.status(200).json({
    ok: true,
    plan,
    healthy: issues.length === 0 && metrics.ok,
    issues,
    metrics: metrics.ok
      ? {
          latencyMs: metrics.latencyMs,
          dbPretty: metrics.dbPretty,
          dbBytes: metrics.dbBytes,
          storagePretty: metrics.storagePretty,
          storageBytes: metrics.storageBytes,
          storageObjects: metrics.storageObjects,
          connections: `${metrics.activeConnections}/${metrics.maxConnections}`,
          members: metrics.members,
          authUsers: metrics.authUsers,
        }
      : { error: metrics.error, latencyMs: metrics.latencyMs },
    telegram,
    checkedAt: nowTr(),
  })
}

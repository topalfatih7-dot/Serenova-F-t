/**
 * Kullanıcı başına günlük AI istek kotası (ai_usage_logs üzerinden).
 */

import { getSupabaseAdmin } from './_supabaseAdmin.js'

const DEFAULT_DAILY_LIMIT = 50

export function getAiDailyLimit() {
  const n = Number(process.env.AI_DAILY_USER_LIMIT)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_DAILY_LIMIT
}

/**
 * @param {string} userId
 * @param {string[]} [endpoints] — boşsa tüm başarılı AI çağrıları
 */
export async function checkAiDailyQuota(userId, endpoints = []) {
  if (!userId) {
    return { ok: false, status: 401, error: 'Oturum gerekli.' }
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return { ok: true, skipped: true }
  }

  const limit = getAiDailyLimit()
  const since = new Date()
  since.setUTCHours(0, 0, 0, 0)

  let query = admin
    .from('ai_usage_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('success', true)
    .gte('created_at', since.toISOString())
    .not('provider', 'eq', 'cache')

  if (endpoints.length) {
    query = query.in('endpoint', endpoints)
  }

  const { count, error } = await query
  if (error) {
    /* kota kontrolü başarısız olsa bile isteği tamamen kilitleme */
    return { ok: true, skipped: true, error: error.message }
  }

  const used = count || 0
  if (used >= limit) {
    return {
      ok: false,
      status: 429,
      error: `Günlük yapay zeka kullanım limitine ulaştınız (${limit}/gün). Yarın tekrar deneyin.`,
      used,
      limit,
    }
  }

  return { ok: true, used, limit, remaining: limit - used }
}

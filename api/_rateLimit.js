/**
 * IP / anahtar bazlı rate limit — Upstash Redis (tercih) veya bellek içi yedek.
 *
 * Env: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 */

const memoryBuckets = new Map()

function pruneMemory(now) {
  if (memoryBuckets.size < 500) return
  for (const [key, entry] of memoryBuckets) {
    if (entry.resetAt <= now) memoryBuckets.delete(key)
  }
}

function memoryLimit(key, limit, windowMs) {
  const now = Date.now()
  pruneMemory(now)
  const entry = memoryBuckets.get(key)
  if (!entry || entry.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1, reset: now + windowMs }
  }
  if (entry.count >= limit) {
    return { success: false, remaining: 0, reset: entry.resetAt }
  }
  entry.count += 1
  return { success: true, remaining: limit - entry.count, reset: entry.resetAt }
}

let ratelimitModulePromise = null

async function getUpstashLimiter(prefix, limit, windowMs) {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  if (!ratelimitModulePromise) {
    ratelimitModulePromise = Promise.all([
      import('@upstash/ratelimit'),
      import('@upstash/redis'),
    ])
  }
  const [{ Ratelimit }, { Redis }] = await ratelimitModulePromise
  const redis = new Redis({ url, token })
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000))
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    prefix: `serenova:${prefix}`,
    analytics: false,
  })
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || ''
  const first = String(forwarded).split(',')[0].trim()
  if (first) return first
  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown'
}

/**
 * @param {object} opts
 * @param {import('http').IncomingMessage} opts.req
 * @param {string} opts.prefix
 * @param {number} opts.limit
 * @param {number} [opts.windowMs=3600000]
 * @param {string} [opts.extraKey]
 */
export async function enforceRateLimit({ req, prefix, limit, windowMs = 60 * 60 * 1000, extraKey = '' }) {
  const ip = getClientIp(req)
  const identity = extraKey ? `${ip}:${extraKey}` : ip
  const key = `${prefix}:${identity}`

  try {
    const limiter = await getUpstashLimiter(prefix, limit, windowMs)
    if (limiter) {
      const result = await limiter.limit(key)
      if (!result.success) {
        return {
          ok: false,
          status: 429,
          error: 'Çok fazla istek. Lütfen bir süre sonra tekrar deneyin.',
          headers: {
            'Retry-After': String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))),
            'X-RateLimit-Remaining': '0',
          },
        }
      }
      return {
        ok: true,
        headers: {
          'X-RateLimit-Remaining': String(result.remaining ?? ''),
        },
      }
    }
  } catch {
    /* Upstash hata verirse bellek içi yedeğe düş */
  }

  const mem = memoryLimit(key, limit, windowMs)
  if (!mem.success) {
    return {
      ok: false,
      status: 429,
      error: 'Çok fazla istek. Lütfen bir süre sonra tekrar deneyin.',
      headers: {
        'Retry-After': String(Math.max(1, Math.ceil((mem.reset - Date.now()) / 1000))),
        'X-RateLimit-Remaining': '0',
      },
    }
  }
  return {
    ok: true,
    headers: { 'X-RateLimit-Remaining': String(mem.remaining) },
  }
}

export function applyRateLimitHeaders(res, headers = {}) {
  for (const [k, v] of Object.entries(headers)) {
    if (v != null && v !== '') res.setHeader(k, v)
  }
}

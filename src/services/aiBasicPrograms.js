import { getApiAuthHeaders } from './apiAuth.js'
import { formatAiError } from '../utils/aiErrors.js'

const AI_PROGRAM_TIMEOUT_MS = 55_000

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = AI_PROGRAM_TIMEOUT_MS) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal })
    const data = await res.json().catch(() => ({}))
    return { res, data }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Basic üye — sağlık testi sonrası Gemini ile diyet + antrenman üretimi.
 */
export async function fetchAiBasicPrograms() {
  try {
    const { res, data } = await fetchJsonWithTimeout('/api/ai-nutrition-tips', {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({ task: 'basic-programs' }),
    })

    if (data?.skipped) {
      return {
        ok: true,
        synced: false,
        skipped: data.skipped,
        error: data.error || null,
        programs: data.programs || [],
      }
    }

    if (!res.ok || !data.ok) {
      return {
        ok: false,
        synced: false,
        error: formatAiError(data.error || res.statusText),
      }
    }

    return {
      ok: true,
      synced: Boolean(data.synced),
      programs: data.programs || [],
      cycleStartDate: data.cycleStartDate || null,
      cycleEndDate: data.cycleEndDate || null,
      dailyCalories: data.dailyCalories || null,
    }
  } catch (e) {
    const aborted = e?.name === 'AbortError'
    return {
      ok: false,
      synced: false,
      timedOut: aborted,
      error: formatAiError(aborted ? 'AI program üretimi zaman aşımına uğradı' : (e.message || e)),
    }
  }
}

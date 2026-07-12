import { getApiAuthHeaders } from './apiAuth.js'
import { formatAiError } from '../utils/aiErrors.js'

const AI_FETCH_TIMEOUT_MS = 12_000

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = AI_FETCH_TIMEOUT_MS) {
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
 * Sağlık testi + profil → Gemini beslenme ipuçları.
 */
export async function fetchAiNutritionTips({ profile, healthTestSummary }) {
  try {
    const { res, data } = await fetchJsonWithTimeout('/api/ai-nutrition-tips', {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({ profile, healthTestSummary }),
    })
    if (!res.ok || !data.ok) {
      return { ok: false, error: formatAiError(data.error || res.statusText) }
    }
    return {
      ok: true,
      tips: data.tips || [],
      focus: data.focus || '',
      aiGenerated: true,
    }
  } catch (e) {
    const aborted = e?.name === 'AbortError'
    return {
      ok: false,
      error: formatAiError(aborted ? 'AI yanıtı zaman aşımına uğradı' : (e.message || e)),
      timedOut: aborted,
    }
  }
}

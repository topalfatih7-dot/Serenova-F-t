/**
 * Gemini otomatik antrenman + diyet programı istemcisi.
 */
import { getApiAuthHeaders } from './apiAuth.js'
import { formatAiError } from '../utils/aiErrors.js'

const AI_FETCH_TIMEOUT_MS = 20_000

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

export async function fetchAiAutoPrograms({
  profile,
  healthTestSummary,
  candidates,
  workoutDays,
  dailyCalories,
}) {
  try {
    const { res, data } = await fetchJsonWithTimeout('/api/ai-nutrition-tips?task=auto-programs', {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({
        task: 'auto-programs',
        profile,
        healthTestSummary,
        candidates,
        workoutDays,
        dailyCalories,
      }),
    })
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        error: formatAiError(data.error || res.statusText, data.code),
        code: data.code,
      }
    }
    return {
      ok: true,
      aiGenerated: true,
      workout: data.workout || { message: '', days: [] },
      nutrition: data.nutrition || { focus: '', meals: [] },
    }
  } catch (e) {
    const aborted = e?.name === 'AbortError'
    return {
      ok: false,
      error: formatAiError(aborted ? 'AI program yanıtı zaman aşımına uğradı' : (e.message || e)),
      timedOut: aborted,
    }
  }
}

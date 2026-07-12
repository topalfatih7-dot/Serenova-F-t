/**
 * Gemini otomatik antrenman + diyet programı istemcisi.
 */
import { getApiAuthHeaders } from './apiAuth.js'
import { formatAiError } from '../utils/aiErrors.js'

export async function fetchAiAutoPrograms({
  profile,
  healthTestSummary,
  candidates,
  workoutDays,
  dailyCalories,
}) {
  try {
    const res = await fetch('/api/ai-auto-programs', {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({
        profile,
        healthTestSummary,
        candidates,
        workoutDays,
        dailyCalories,
      }),
    })
    const data = await res.json().catch(() => ({}))
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
    return { ok: false, error: formatAiError(e.message || e) }
  }
}

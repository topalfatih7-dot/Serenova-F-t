import { getApiAuthHeaders } from './apiAuth.js'
import { formatAiError } from '../utils/aiErrors.js'

/**
 * Sağlık testi + profil → Gemini beslenme ipuçları.
 */
export async function fetchAiNutritionTips({ profile, healthTestSummary }) {
  try {
    const res = await fetch('/api/ai-nutrition-tips', {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({ profile, healthTestSummary }),
    })
    const data = await res.json().catch(() => ({}))
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
    return { ok: false, error: formatAiError(e.message || e) }
  }
}

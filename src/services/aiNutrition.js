/**
 * AI Destekli Beslenme Notu — frontend servisi.
 * Üye profili + kural tabanlı plan özetini /api/ai-nutrition'a gönderir.
 * AI yoksa/başarısızsa çağıran taraf kural tabanlı metne geri döner.
 */

export function isAiNutritionEnabled() {
  return import.meta.env.VITE_AI_NUTRITION_ENABLED === 'true'
}

/**
 * @param {object} profile - üye profili (age, gender, height, weight, goals, nutritionPrefs, fitnessLevel)
 * @param {string} baseSummary - kural tabanlı plan özeti (mealPlan + tips düz metin)
 * @returns {Promise<{ok, summary?, tips?, focus?, error?}>}
 */
export async function enhanceNutritionPlan(profile, baseSummary) {
  try {
    const res = await fetch('/api/ai-nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, baseSummary }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Beslenme analizi başarısız' }
    }
    return { ok: true, summary: data.summary, tips: data.tips, focus: data.focus }
  } catch (e) {
    return { ok: false, error: String(e.message || e) }
  }
}

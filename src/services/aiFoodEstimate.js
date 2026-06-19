/**
 * Bilinmeyen besin tahmini — frontend servisi.
 * Sadece yerel DB'de bulunamayan besinler için /api/ai-food-estimate çağrılır.
 * VITE_AI_FOOD_ENABLED=true değilse tahmin atlanır ve bilinmeyen kalır.
 */

export function isAiFoodEnabled() {
  return import.meta.env.VITE_AI_FOOD_ENABLED === 'true'
}

/**
 * @param {Array} unknownFoods — [{name, qty, unit}]
 * @returns {Promise<{ok, results?[], error?}>}
 */
export async function estimateUnknownFoods(unknownFoods) {
  if (!unknownFoods?.length) return { ok: true, results: [] }
  try {
    const res = await fetch('/api/ai-food-estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foods: unknownFoods.map((f) => ({ name: f.name, qty: f.qty, unit: f.unit })) }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) return { ok: false, error: data.error || 'AI tahmini başarısız' }
    return { ok: true, results: data.results }
  } catch (e) {
    return { ok: false, error: String(e.message || e) }
  }
}

/**
 * Kalori chat — metin analizi servisi.
 */

import { formatAiError } from '../utils/aiErrors.js'
import { getApiAuthHeaders } from './apiAuth.js'

/** Kalori analizi — varsayılan açık; yalnızca VITE_AI_*_ENABLED=false ile kapatılır. */
export function isCalorieAiEnabled() {
  const chat = import.meta.env.VITE_AI_CHAT_ENABLED
  const vision = import.meta.env.VITE_AI_VISION_ENABLED
  if (chat === 'false' && vision === 'false') return false
  return chat !== 'false' || vision !== 'false'
}

/**
 * Metinden kalori analizi (fotoğraf modu ile aynı JSON şeması).
 */
export async function analyzeFoodText(text) {
  try {
    const res = await fetch('/api/ai-food-text', {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({ text }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        code: data.code,
        error: formatAiError(data.error, data.code),
      }
    }
    return {
      ok: true,
      label: data.label,
      items: data.items,
      confidence: data.confidence,
    }
  } catch (e) {
    return { ok: false, code: 'network_error', error: formatAiError(e.message, 'network_error') }
  }
}

export function formatAnalysisReply(result) {
  if (!result?.items?.length) {
    return 'Yiyecek tespit edilemedi. Lütfen ne yediğinizi daha açık yazın.\nÖrnek: 2 yumurta, 1 dilim tam buğday ekmeği, 1 kase yoğurt'
  }
  const lines = [`🍽 ${result.label}`, '']
  let total = 0
  result.items.forEach((item) => {
    total += item.cal || 0
    lines.push(`• ${item.name} — ${item.amount} ${item.unit} · ~${item.cal} kcal`)
  })
  lines.push('', `📊 Toplam: ~${total} kcal`)
  if (result.confidence === 'low') {
    lines.push('', '⚠️ Düşük güven — tahmini değerlerdir.')
  }
  return lines.join('\n')
}

/**
 * Kalori chat — metin analizi servisi.
 */

import { formatAiError } from '../utils/aiErrors.js'
import { getApiAuthHeaders } from './apiAuth.js'

export function isCalorieAiEnabled() {
  const chat = import.meta.env.VITE_AI_CHAT_ENABLED
  const vision = import.meta.env.VITE_AI_VISION_ENABLED
  if (chat === 'false' && vision === 'false') return false
  return chat !== 'false' || vision !== 'false'
}

function roundG(n) {
  return Math.round(Number(n) || 0)
}

export function formatMacros(macros = {}) {
  return `Protein ${roundG(macros.protein)}g · Karb. ${roundG(macros.carb)}g · Yağ ${roundG(macros.fat)}g`
}

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
      ...data,
      cached: Boolean(data.cached),
      source: data.source || (data.cached ? 'cache' : 'openai'),
    }
  } catch (e) {
    return { ok: false, code: 'network_error', error: formatAiError(e.message, 'network_error') }
  }
}

export function formatAnalysisReply(result) {
  if (!result?.items?.length) {
    const unmatched = (result?.unmatched || []).map((u) => u.name).filter(Boolean)
    if (unmatched.length) {
      return `Kalori hesaplanamadı: ${unmatched.join(', ')}.\nDaha açık yazın: 2 yumurta, 1 dilim tam buğday ekmeği, 1 kase yoğurt`
    }
    return 'Yiyecek tespit edilemedi. Lütfen ne yediğinizi daha açık yazın.\nÖrnek: 2 yumurta, 1 dilim tam buğday ekmeği, 1 kase yoğurt'
  }
  const lines = [`🍽 ${result.label}`, '']
  result.items.forEach((item) => {
    const kcal = Math.round(Number(item.cal) || 0)
    lines.push(`• ${item.name} — ${item.amount} ${item.unit} · ${kcal} kcal`)
    lines.push(`  ${formatMacros(item)}`)
  })
  const total = Math.round(result.totalCal ?? result.items.reduce((s, i) => s + (i.cal || 0), 0))
  lines.push('', `📊 Toplam: ${total} kcal`)
  if (result.macros) {
    lines.push(formatMacros(result.macros))
  }
  if (result.unmatched?.length) {
    lines.push('', `Hesaplanamadı: ${result.unmatched.map((u) => u.name).join(', ')}`)
  }
  return lines.join('\n')
}

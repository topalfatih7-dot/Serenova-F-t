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

export const SOURCE_LABELS = {
  open_food_facts: 'Ürün veritabanı',
  food_dictionary: 'Sözlük',
  usda: 'USDA',
  cache: 'Kayıtlı öğün',
  dictionary: 'Sözlük',
  openai: 'AI ayıklama',
}

export const CONFIDENCE_LABELS = {
  high: 'Yüksek güven',
  medium: 'Orta güven',
  low: 'Düşük güven',
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

function rangeText(low, mid, high) {
  const lo = Math.round(Number(low) || 0)
  const hi = Math.round(Number(high) || 0)
  const m = Math.round(Number(mid) || 0)
  if (lo && hi && lo !== hi) return `${m} kcal (${lo}–${hi})`
  return `~${m} kcal`
}

export function formatAnalysisReply(result) {
  if (!result?.items?.length) {
    const unmatched = (result?.unmatched || []).map((u) => u.name).filter(Boolean)
    if (unmatched.length) {
      return `Yiyecek ayrıştırıldı ancak besin değeri bulunamadı: ${unmatched.join(', ')}.\nDaha açık yazın: 2 yumurta, 1 dilim tam buğday ekmeği, 1 kase yoğurt`
    }
    return 'Yiyecek tespit edilemedi. Lütfen ne yediğinizi daha açık yazın.\nÖrnek: 2 yumurta, 1 dilim tam buğday ekmeği, 1 kase yoğurt'
  }
  const lines = [`🍽 ${result.label}`, '']
  result.items.forEach((item) => {
    const src = SOURCE_LABELS[item.source]
    const calBit = rangeText(item.calLow, item.cal, item.calHigh)
    lines.push(`• ${item.name} — ${item.amount} ${item.unit} · ${calBit}${src ? ` · ${src}` : ''}`)
  })
  const total = result.totalCal ?? result.items.reduce((s, i) => s + (i.cal || 0), 0)
  lines.push('', `📊 Toplam: ${rangeText(result.totalCalLow, total, result.totalCalHigh)}`)
  if (result.macros) {
    lines.push(`🥩 P ${Math.round(result.macros.protein)}g · 🌾 K ${Math.round(result.macros.carb)}g · 🧈 Y ${Math.round(result.macros.fat)}g`)
  }
  const band = result.confidence || 'medium'
  lines.push('', `${band === 'low' ? '⚠️' : '✓'} ${CONFIDENCE_LABELS[band] || band}`)
  if (result.confidenceReasons?.length) {
    lines.push(result.confidenceReasons.join(' · '))
  }
  if (result.unmatched?.length) {
    lines.push('', `Bulunamayan: ${result.unmatched.map((u) => u.name).join(', ')}`)
  }
  if (result.source === 'cache' || result.source === 'dictionary' || result.cached) {
    const tip = result.source === 'dictionary'
      ? '💾 Kayıtlı yiyecek sözlüğünden hesaplandı (AI çağrılmadı).'
      : '💾 Kayıtlı öğünden getirildi (AI çağrılmadı).'
    lines.push('', tip)
  }
  return lines.join('\n')
}

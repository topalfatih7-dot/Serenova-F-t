/**
 * Kalori chat — AI metin analizi + Telegram bildirimi.
 */

import { formatAiError } from '../utils/aiErrors.js'
import { getApiAuthHeaders } from './apiAuth.js'

const NOTIFY_SECRET = import.meta.env.VITE_TELEGRAM_NOTIFY_SECRET || ''

async function notifyHeaders() {
  const h = await getApiAuthHeaders()
  if (NOTIFY_SECRET) h['X-Notify-Secret'] = NOTIFY_SECRET
  return h
}

export function isCalorieAiEnabled() {
  return import.meta.env.VITE_AI_VISION_ENABLED === 'true'
}

/**
 * Chat mesajını Bize Ulaşın Telegram chat'ine iletir (fire-and-forget).
 */
export async function notifyCalorieChatMessage({ text, userName, userEmail, membership }) {
  try {
    const res = await fetch('/api/calorie-chat-notify', {
      method: 'POST',
      headers: await notifyHeaders(),
      body: JSON.stringify({ text, userName, userEmail, membership }),
    })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok && data.ok, error: data.error }
  } catch (e) {
    return { ok: false, error: String(e.message || e) }
  }
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

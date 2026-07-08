import { getApiAuthHeaders } from './apiAuth.js'
import { pickFallbackTip } from '../data/dailyTipFallback.js'

function todayLocal() {
  return new Date().toLocaleDateString('en-CA')
}

/**
 * Dashboard günün ipucu — sunucuda günlük cache (site_content kind=daily_tip).
 */
export async function fetchDailyTip() {
  const date = todayLocal()
  try {
    const res = await fetch('/api/ai-daily-tip', {
      method: 'GET',
      headers: await getApiAuthHeaders(),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok || !data.tip) {
      return { ok: true, tip: pickFallbackTip(date), date, aiGenerated: false, fallback: true }
    }
    return {
      ok: true,
      tip: data.tip,
      date: data.date || date,
      aiGenerated: Boolean(data.aiGenerated),
      fallback: Boolean(data.fallback),
    }
  } catch {
    return { ok: true, tip: pickFallbackTip(date), date, aiGenerated: false, fallback: true }
  }
}

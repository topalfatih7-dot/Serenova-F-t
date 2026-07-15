/** Admin paneli — YZ gider raporu (/api/auth action: ai-usage-report). */
import { getApiAuthHeaders } from './apiAuth'

export async function fetchAiUsageReport(days = 30) {
  const headers = await getApiAuthHeaders()
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action: 'ai-usage-report', days }),
  })

  const raw = await res.text()
  let json
  try {
    json = raw ? JSON.parse(raw) : {}
  } catch {
    throw new Error('YZ gider API geçersiz yanıt döndü — endpoint deploy edilmiş mi kontrol edin.')
  }

  if (!res.ok) {
    throw new Error(json?.error || `YZ gider raporu alınamadı (${res.status})`)
  }

  return json
}

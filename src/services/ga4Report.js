/** Admin paneli — GA4 Data API özeti (/api/auth action: ga4-report). */
import { getApiAuthHeaders } from './apiAuth'

export async function fetchGa4Report(days = 28) {
  const headers = await getApiAuthHeaders()
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action: 'ga4-report', days }),
  })

  const raw = await res.text()
  let json
  try {
    json = raw ? JSON.parse(raw) : {}
  } catch {
    throw new Error('GA4 API geçersiz yanıt döndü — endpoint deploy edilmiş mi kontrol edin.')
  }

  if (!res.ok) {
    throw new Error(json?.error || `GA4 raporu alınamadı (${res.status})`)
  }

  return json
}

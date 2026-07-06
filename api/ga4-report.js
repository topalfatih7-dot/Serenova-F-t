import { requireAdmin } from './_guards.js'

const GA4_PROPERTY_ID = (process.env.GA4_PROPERTY_ID || '').trim()
const SA_JSON = process.env.GA4_SERVICE_ACCOUNT_JSON || ''

function parseServiceAccount() {
  if (!SA_JSON) return null
  try {
    const sa = JSON.parse(SA_JSON)
    if (sa?.private_key && typeof sa.private_key === 'string') {
      sa.private_key = sa.private_key.replace(/\\n/g, '\n')
    }
    return sa
  } catch {
    return null
  }
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function getAccessToken(sa) {
  const crypto = await import('crypto')
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))
  const unsigned = `${header}.${claim}`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(unsigned)
  sign.end()
  const signature = sign.sign(sa.private_key)
  const jwt = `${unsigned}.${base64url(signature)}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(data.error_description || 'GA4 token alınamadı')
  return data.access_token
}

async function runGa4Report(accessToken, body) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'GA4 rapor hatası')
  return data
}

function metricValue(report, index = 0) {
  const row = report?.rows?.[0]
  const val = row?.metricValues?.[index]?.value
  return val ? Number(val) : 0
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireAdmin(req)
  if (!auth.ok) {
    return res.status(auth.status || 401).json({ error: auth.error || 'Yetkisiz' })
  }

  if (!GA4_PROPERTY_ID || !SA_JSON) {
    return res.status(200).json({
      configured: false,
      hint: 'Vercel env: GA4_PROPERTY_ID ve GA4_SERVICE_ACCOUNT_JSON',
    })
  }

  try {
    const sa = parseServiceAccount()
    if (!sa?.client_email || !sa?.private_key) {
      return res.status(500).json({ configured: false, error: 'Geçersiz service account JSON' })
    }

    const token = await getAccessToken(sa)
    const daysAgo = Number(req.query?.days) || 28
    const startDate = `${daysAgo}daysAgo`

    const [summary, funnel] = await Promise.all([
      runGa4Report(token, {
        dateRanges: [{ startDate, endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'conversions' },
        ],
      }),
      runGa4Report(token, {
        dateRanges: [{ startDate, endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            inListFilter: {
              values: ['/', '/membership', '/onboarding', '/dashboard'],
            },
          },
        },
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),
    ])

    const funnelSteps = (funnel.rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || '',
      views: Number(row.metricValues?.[0]?.value || 0),
    }))

    return res.status(200).json({
      configured: true,
      periodDays: daysAgo,
      activeUsers: metricValue(summary, 0),
      sessions: metricValue(summary, 1),
      pageViews: metricValue(summary, 2),
      conversions: metricValue(summary, 3),
      funnelSteps,
    })
  } catch (err) {
    return res.status(500).json({
      configured: true,
      error: err.message || 'GA4 raporu alınamadı',
    })
  }
}

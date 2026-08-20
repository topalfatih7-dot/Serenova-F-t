/**
 * Dinamik sitemap.xml — blog + kadro + static.
 * Modül init asla throw etmez (production 500 önlemi).
 */
function getDeployDate() {
  try {
    const envDate = process.env.DEPLOY_DATE
    if (envDate && /^\d{4}-\d{2}-\d{2}$/.test(envDate)) return envDate
    return new Date().toISOString().slice(0, 10)
  } catch {
    return '2026-01-01'
  }
}

const DEPLOY = getDeployDate()

/** Canonical public URL'ler — redirect duplicate'ler yok */
const STATIC_ROUTES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0', lastmod: DEPLOY },
  { loc: '/hakkimizda', changefreq: 'monthly', priority: '0.8', lastmod: DEPLOY },
  { loc: '/online-diyetisyen', changefreq: 'weekly', priority: '0.95', lastmod: DEPLOY },
  { loc: '/online-diyetisyen/fiyat', changefreq: 'weekly', priority: '0.9', lastmod: DEPLOY },
  { loc: '/online-kocluk', changefreq: 'weekly', priority: '0.95', lastmod: DEPLOY },
  { loc: '/online-kocluk/ev-antrenman', changefreq: 'weekly', priority: '0.85', lastmod: DEPLOY },
  { loc: '/kilo-verme', changefreq: 'weekly', priority: '0.9', lastmod: DEPLOY },
  { loc: '/beslenme/sporcu-beslenmesi', changefreq: 'weekly', priority: '0.85', lastmod: DEPLOY },
  { loc: '/membership', changefreq: 'weekly', priority: '0.9', lastmod: DEPLOY },
  { loc: '/onboarding', changefreq: 'monthly', priority: '0.9', lastmod: DEPLOY },
  { loc: '/stories', changefreq: 'weekly', priority: '0.8', lastmod: DEPLOY },
  { loc: '/blog', changefreq: 'daily', priority: '0.8', lastmod: DEPLOY },
  { loc: '/team/coaches', changefreq: 'monthly', priority: '0.7', lastmod: DEPLOY },
  { loc: '/team/dietitians', changefreq: 'monthly', priority: '0.7', lastmod: DEPLOY },
  { loc: '/team/doctors', changefreq: 'monthly', priority: '0.7', lastmod: DEPLOY },
  { loc: '/corporate', changefreq: 'monthly', priority: '0.7', lastmod: DEPLOY },
  { loc: '/corporate/apply', changefreq: 'monthly', priority: '0.6', lastmod: DEPLOY },
  { loc: '/team/apply', changefreq: 'monthly', priority: '0.6', lastmod: DEPLOY },
  { loc: '/legal/kvkk', changefreq: 'yearly', priority: '0.4' },
  { loc: '/legal/kvkk-acik-riza-metni', changefreq: 'yearly', priority: '0.4' },
  { loc: '/legal/gizlilik-politikasi', changefreq: 'yearly', priority: '0.4' },
  { loc: '/legal/cerez-politikasi', changefreq: 'yearly', priority: '0.4' },
  { loc: '/legal/saglik-verisi-isleme-bilgilendirmesi', changefreq: 'yearly', priority: '0.4' },
  { loc: '/legal/veri-saklama-ve-imha-politikasi', changefreq: 'yearly', priority: '0.4' },
  { loc: '/legal/yapay-zeka-kullanim-politikasi', changefreq: 'yearly', priority: '0.4' },
  { loc: '/legal/uyelik-ve-abonelik-sozlesmesi', changefreq: 'yearly', priority: '0.4' },
  { loc: '/legal/mesafeli-hizmet-sozlesmesi', changefreq: 'yearly', priority: '0.4' },
  { loc: '/legal/iptal-ve-iade-politikasi', changefreq: 'yearly', priority: '0.4' },
  { loc: '/legal/topluluk-kurallari', changefreq: 'yearly', priority: '0.4' },
  { loc: '/legal/saglik-sorumluluk-reddi', changefreq: 'yearly', priority: '0.4' },
  { loc: '/legal/antrenor-hizmet-standartlari', changefreq: 'yearly', priority: '0.4' },
  { loc: '/legal/diyetisyen-hizmet-standartlari', changefreq: 'yearly', priority: '0.4' },
  { loc: '/hesap-silme', changefreq: 'yearly', priority: '0.5' },
]

function slugifyTurkish(text) {
  return String(text || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const STAFF_ROLE_SLUG = { coach: 'koc', dietitian: 'diyetisyen', doctor: 'doktor' }

function staffPublicSlug(member) {
  const namePart = slugifyTurkish(member?.name)
  if (!namePart) return member?.id || ''
  const rolePrefix = STAFF_ROLE_SLUG[member?.role] || 'uzman'
  if (namePart === rolePrefix || namePart.startsWith(`${rolePrefix}-`)) {
    const specialty = slugifyTurkish(member?.specialty || member?.title || '')
    if (specialty && specialty !== namePart && specialty !== rolePrefix) {
      return `${rolePrefix}-${specialty}`
    }
    const shortId = String(member?.id || '').replace(/-/g, '').slice(0, 8)
    return shortId ? `${rolePrefix}-${shortId}` : rolePrefix
  }
  return `${rolePrefix}-${namePart}`
}

function siteBase() {
  return (
    process.env.VITE_SITE_URL ||
    process.env.APP_URL ||
    'https://www.yeniform.com'
  ).replace(/\/$/, '')
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function urlEntry(base, path, { changefreq = 'weekly', priority = '0.5', lastmod } = {}) {
  const loc = `${base}${path.startsWith('/') ? path : `/${path}`}`
  const lastmodTag = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : ''
  return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmodTag}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

async function fetchDynamicUrls() {
  const urls = []
  let createClient
  let getSupabaseUrl
  let isSupabaseAdminConfigured
  let getSupabaseAdmin
  try {
    ;({ createClient } = await import('@supabase/supabase-js'))
    ;({
      getSupabaseUrl,
      isSupabaseAdminConfigured,
      getSupabaseAdmin,
    } = await import('./_supabaseAdmin.js'))
  } catch (err) {
    console.error('[sitemap] import', err?.message || err)
    return urls
  }

  let url
  let key
  try {
    url = getSupabaseUrl()
    key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY
  } catch (err) {
    console.error('[sitemap] env/url', err?.message || err)
    return urls
  }

  if (!url || !key) return urls

  let client
  try {
    client = isSupabaseAdminConfigured()
      ? getSupabaseAdmin()
      : createClient(url, key)
  } catch (err) {
    console.error('[sitemap] client', err?.message || err)
    return urls
  }

  if (!client) return urls

  try {
    const { data: posts, error } = await client
      .from('posts')
      .select('id, data, created_at')
      .eq('published', true)

    if (error) {
      console.error('[sitemap] posts', error.message)
    } else {
      for (const post of posts || []) {
        const title = post.data?.title || ''
        const slug = post.data?.slug || slugifyTurkish(title) || post.id
        urls.push({
          path: `/blog/${slug}`,
          changefreq: 'monthly',
          priority: '0.6',
          lastmod: (post.created_at || '').slice(0, 10),
        })
      }
    }
  } catch (err) {
    console.error('[sitemap] posts fetch', err?.message || err)
  }

  try {
    const { data: staff, error } = await client
      .from('staff')
      .select('id, name, role, created_at, data')
      .eq('active', true)

    if (error) {
      console.error('[sitemap] staff', error.message)
    } else {
      for (const member of staff || []) {
        const specialty = member.data?.specialty || member.data?.title || ''
        urls.push({
          path: `/team/${staffPublicSlug({ ...member, specialty, title: specialty })}`,
          changefreq: 'monthly',
          priority: '0.6',
          lastmod: (member.created_at || '').slice(0, 10),
        })
      }
    }
  } catch (err) {
    console.error('[sitemap] staff fetch', err?.message || err)
  }

  return urls
}

function buildXml(base, routes) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => urlEntry(base, r.loc || r.path, r)).join('\n')}
</urlset>`
}

function sendXml(res, body, cacheControl, method) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', cacheControl)
  if (method === 'HEAD') return res.status(200).end()
  return res.status(200).end(body)
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return res.status(405).end()
    }

    const base = siteBase()
    let dynamic = []
    try {
      dynamic = await fetchDynamicUrls()
    } catch (err) {
      console.error('[sitemap] dynamic', err?.message || err)
    }

    const body = buildXml(base, [...STATIC_ROUTES, ...dynamic])
    return sendXml(res, body, 'public, s-maxage=3600, stale-while-revalidate=86400', req.method)
  } catch (err) {
    console.error('[sitemap] fatal', err?.message || err)
    try {
      const body = buildXml(siteBase(), STATIC_ROUTES)
      return sendXml(res, body, 'public, s-maxage=300, stale-while-revalidate=3600', req.method)
    } catch (inner) {
      console.error('[sitemap] static fallback', inner?.message || inner)
      res.setHeader('Content-Type', 'application/xml; charset=utf-8')
      return res.status(200).end(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://www.yeniform.com/</loc></url></urlset>`,
      )
    }
  }
}

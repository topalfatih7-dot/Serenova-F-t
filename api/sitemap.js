/**
 * Dinamik sitemap.xml — blog yazıları ve kadro profilleri Supabase'den eklenir.
 * URL: /sitemap.xml (vercel.json rewrite)
 */
import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, isSupabaseAdminConfigured, getSupabaseAdmin } from './_supabaseAdmin.js'

const STATIC_ROUTES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/membership', changefreq: 'weekly', priority: '0.9' },
  { loc: '/onboarding', changefreq: 'monthly', priority: '0.9' },
  { loc: '/stories', changefreq: 'weekly', priority: '0.8' },
  { loc: '/blog', changefreq: 'daily', priority: '0.8' },
  { loc: '/team/coaches', changefreq: 'monthly', priority: '0.7' },
  { loc: '/team/dietitians', changefreq: 'monthly', priority: '0.7' },
  { loc: '/team/doctors', changefreq: 'monthly', priority: '0.7' },
  { loc: '/corporate', changefreq: 'monthly', priority: '0.7' },
  { loc: '/corporate/apply', changefreq: 'monthly', priority: '0.6' },
  { loc: '/team/apply', changefreq: 'monthly', priority: '0.6' },
  { loc: '/kvkk', changefreq: 'yearly', priority: '0.4' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.4' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.4' },
]

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
  const url = getSupabaseUrl()
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) return urls

  const client = isSupabaseAdminConfigured()
    ? getSupabaseAdmin()
    : createClient(url, key)

  try {
    const { data: posts } = await client
      .from('posts')
      .select('id, created_at')
      .eq('published', true)

    for (const post of posts || []) {
      urls.push({
        path: `/blog/${post.id}`,
        changefreq: 'monthly',
        priority: '0.6',
        lastmod: (post.created_at || '').slice(0, 10),
      })
    }
  } catch {
    /* posts tablosu yoksa devam */
  }

  try {
    const { data: staff } = await client
      .from('staff')
      .select('id, created_at')
      .eq('active', true)

    for (const member of staff || []) {
      urls.push({
        path: `/team/${member.id}`,
        changefreq: 'monthly',
        priority: '0.5',
        lastmod: (member.created_at || '').slice(0, 10),
      })
    }
  } catch {
    /* staff tablosu yoksa devam */
  }

  return urls
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).end()
  }

  const base = siteBase()
  const dynamic = await fetchDynamicUrls()
  const all = [...STATIC_ROUTES, ...dynamic]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map((r) => urlEntry(base, r.loc || r.path, r)).join('\n')}
</urlset>`

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  if (req.method === 'HEAD') return res.status(200).end()
  return res.status(200).end(body)
}

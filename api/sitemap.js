/**
 * Dinamik sitemap.xml — blog + kadro + static.
 * Modül init asla throw etmez (production 500 önlemi).
 */
import { slugifyTurkish, staffPublicSlug, dedupeUrlsByPath, isoDay } from '../src/utils/publicSlugs.js'
import {
  PUBLIC_STAFF_RELATION,
  buildBlogShellHtml,
  buildStaffShellHtml,
  matchPublishedPost,
  matchPublicStaff,
  sanitizePublicSlug,
} from '../src/utils/seoPublicShell.js'

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
  { loc: '/indir', changefreq: 'weekly', priority: '0.8', lastmod: DEPLOY },
  { loc: '/hakkimizda', changefreq: 'monthly', priority: '0.8', lastmod: DEPLOY },
  { loc: '/online-diyetisyen', changefreq: 'weekly', priority: '0.95', lastmod: DEPLOY },
  { loc: '/online-diyetisyen/fiyat', changefreq: 'weekly', priority: '0.9', lastmod: DEPLOY },
  { loc: '/online-kocluk', changefreq: 'weekly', priority: '0.95', lastmod: DEPLOY },
  { loc: '/online-kocluk/ev-antrenman', changefreq: 'weekly', priority: '0.85', lastmod: DEPLOY },
  { loc: '/kilo-verme', changefreq: 'weekly', priority: '0.9', lastmod: DEPLOY },
  { loc: '/beslenme/sporcu-beslenmesi', changefreq: 'weekly', priority: '0.85', lastmod: DEPLOY },
  { loc: '/beslenme/pcos', changefreq: 'weekly', priority: '0.85', lastmod: DEPLOY },
  { loc: '/beslenme/insulin-direnci', changefreq: 'weekly', priority: '0.85', lastmod: DEPLOY },
  { loc: '/beslenme/hamilelik', changefreq: 'weekly', priority: '0.85', lastmod: DEPLOY },
  { loc: '/kalori-hesaplama', changefreq: 'weekly', priority: '0.9', lastmod: DEPLOY },
  { loc: '/online-wellness', changefreq: 'weekly', priority: '0.9', lastmod: DEPLOY },
  { loc: '/membership', changefreq: 'weekly', priority: '0.9', lastmod: DEPLOY },
  { loc: '/onboarding', changefreq: 'monthly', priority: '0.9', lastmod: DEPLOY },
  { loc: '/stories', changefreq: 'weekly', priority: '0.8', lastmod: DEPLOY },
  { loc: '/blog', changefreq: 'daily', priority: '0.8', lastmod: DEPLOY },
  { loc: '/team/coaches', changefreq: 'monthly', priority: '0.7', lastmod: DEPLOY },
  { loc: '/team/dietitians', changefreq: 'monthly', priority: '0.7', lastmod: DEPLOY },
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

function queryParam(req, name) {
  const direct = req.query?.[name]
  if (direct != null && String(direct).trim()) return String(direct).trim()
  try {
    const u = new URL(req.url || '', 'https://www.yeniform.com')
    return u.searchParams.get(name) || ''
  } catch {
    return ''
  }
}

async function getSitemapClient() {
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
    return null
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
    return null
  }

  if (!url || !key) return null

  try {
    const client = isSupabaseAdminConfigured()
      ? getSupabaseAdmin()
      : createClient(url, key)
    return client || null
  } catch (err) {
    console.error('[sitemap] client', err?.message || err)
    return null
  }
}

function sendHtml(res, html, method, status = 200) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400')
  if (method === 'HEAD') return res.status(status).end()
  return res.status(status).end(html)
}

async function handleSeoShell(req, res) {
  const kind = queryParam(req, 'shell')
  const slug = sanitizePublicSlug(queryParam(req, 'slug'))
  if ((kind !== 'blog' && kind !== 'team') || !slug) {
    return res.status(404).end()
  }

  const client = await getSitemapClient()
  if (!client) return res.status(503).end()

  try {
    if (kind === 'blog') {
      const { data: posts, error } = await client
        .from('posts')
        .select('id, data, created_at')
        .eq('published', true)
        .limit(500)
      if (error) console.error('[sitemap] shell posts', error.message)
      const post = matchPublishedPost(posts, slug)
      if (!post) return res.status(404).end()
      return sendHtml(res, buildBlogShellHtml(post, { requestedSlug: slug }), req.method)
    }

    const { data: staff, error } = await client
      .from(PUBLIC_STAFF_RELATION)
      .select('id, name, role, created_at, data')
      .eq('active', true)
      .limit(200)
    if (error) console.error('[sitemap] shell staff', error.message)
    const member = matchPublicStaff(staff, slug)
    if (!member) return res.status(404).end()
    return sendHtml(res, buildStaffShellHtml(member, { requestedSlug: slug }), req.method)
  } catch (err) {
    console.error('[sitemap] shell', err?.message || err)
    return res.status(503).end()
  }
}

async function fetchDynamicUrls() {
  const urls = []
  const client = await getSitemapClient()
  if (!client) return urls

  try {
    const { data: posts, error } = await client
      .from('posts')
      .select('id, data, created_at')
      .eq('published', true)
      .limit(500)

    if (error) {
      console.error('[sitemap] posts', error.message)
    } else {
      const published = [...(posts || [])].sort((a, b) =>
        String(b.data?.updatedAt || b.created_at || '').localeCompare(String(a.data?.updatedAt || a.created_at || '')),
      )
      for (const post of published) {
        const title = post.data?.title || ''
        const slug = post.data?.slug || slugifyTurkish(title) || post.id
        if (!slug) continue
        urls.push({
          path: `/blog/${slug}`,
          changefreq: 'monthly',
          priority: '0.6',
          lastmod: isoDay(post.data?.updatedAt || post.updated_at || post.created_at),
        })
      }
    }
  } catch (err) {
    console.error('[sitemap] posts fetch', err?.message || err)
  }

  try {
    const { data: staff, error } = await client
      .from(PUBLIC_STAFF_RELATION)
      .select('id, name, role, created_at, data')
      .eq('active', true)
      .limit(200)

    if (error) {
      console.error('[sitemap] staff', error.message)
    } else {
      for (const member of staff || []) {
        if (member.role !== 'coach' && member.role !== 'dietitian') continue
        if (member.data?.listedOnTeam === false) continue
        urls.push({
          path: `/team/${staffPublicSlug(member)}`,
          changefreq: 'monthly',
          priority: '0.65',
          lastmod: isoDay(member.data?.updatedAt || member.updated_at || member.created_at),
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

    const shell = queryParam(req, 'shell')
    if (shell === 'blog' || shell === 'team') {
      return handleSeoShell(req, res)
    }

    const base = siteBase()
    let dynamic = []
    try {
      dynamic = await fetchDynamicUrls()
    } catch (err) {
      console.error('[sitemap] dynamic', err?.message || err)
    }

    const body = buildXml(base, [...STATIC_ROUTES, ...dedupeUrlsByPath(dynamic)])
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

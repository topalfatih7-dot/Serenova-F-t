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
  { loc: '/kvkk', changefreq: 'yearly', priority: '0.3' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
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
      .select('id, name, role, created_at')
      .eq('active', true)

    for (const member of staff || []) {
      urls.push({
        path: `/team/${staffPublicSlug(member)}`,
        changefreq: 'monthly',
        priority: '0.6',
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

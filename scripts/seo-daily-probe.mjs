/**
 * Canlı www SEO taraması — Googlebot UA.
 *   npm run seo:probe
 * Çıkış: JSON (stdout). Sitemap veya sayfa 200 değilse exit 1.
 */
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const SITE = (process.env.SEO_PROBE_SITE || 'https://www.yeniform.com').replace(/\/$/, '')
const UA = process.env.SEO_PROBE_UA || 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
const TIMEOUT_MS = Number(process.env.SEO_PROBE_TIMEOUT_MS || 20000)

export const HOME_TITLE = 'Yeni Form — Online Koçluk ve Online Diyetisyen Platformu'

export const PROBE_PATHS = [
  '/',
  '/online-diyetisyen',
  '/online-diyetisyen/fiyat',
  '/online-kocluk',
  '/online-kocluk/ev-antrenman',
  '/kilo-verme',
  '/membership',
  '/kalori-hesaplama',
  '/beslenme/hamilelik',
  '/beslenme/pcos',
  '/beslenme/insulin-direnci',
  '/beslenme/sporcu-beslenmesi',
  '/hakkimizda',
  '/blog',
  '/team/dietitians',
  '/team/coaches',
  '/indir',
]

export function selectDynamicProbePaths(locs, { blog = 5, team = 5 } = {}) {
  const blogPaths = []
  const teamPaths = []
  const skipTeam = new Set(['coaches', 'dietitians', 'apply', 'doctors'])
  for (const loc of locs || []) {
    let path
    try {
      path = new URL(loc).pathname.replace(/\/$/, '') || '/'
    } catch {
      continue
    }
    if (path.startsWith('/blog/') && blogPaths.length < blog) blogPaths.push(path)
    if (path.startsWith('/team/')) {
      const last = path.split('/').pop()
      if (!skipTeam.has(last) && teamPaths.length < team) teamPaths.push(path)
    }
  }
  return [...blogPaths, ...teamPaths]
}

function attr(html, name) {
  const re = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i')
  return html.match(re)?.[1]?.trim() || ''
}

export function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

export function parsePageHtml(html) {
  const raw = String(html || '')
  const title = decodeHtml(raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim()
  const canonicalTag = raw.match(/<link[^>]*rel=["']canonical["'][^>]*>/i)?.[0] || ''
  const canonical = decodeHtml(attr(canonicalTag, 'href'))
  const robotsTag = raw.match(/<meta[^>]*name=["']robots["'][^>]*>/i)?.[0] || ''
  const robots = attr(robotsTag, 'content')
  const h1 = decodeHtml(raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const jsonLdTypes = []
  const jsonLdBlocks = raw.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block[1])
      const nodes = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data]
      for (const node of nodes) {
        const type = node?.['@type']
        if (!type) continue
        for (const item of Array.isArray(type) ? type : [type]) jsonLdTypes.push(String(item))
      }
    } catch {
      jsonLdTypes.push('parse_error')
    }
  }
  return {
    title,
    canonical,
    robots,
    h1,
    jsonLdTypes: [...new Set(jsonLdTypes)],
    hasSeoStatic: raw.includes('id="seo-static-content"'),
  }
}

export function parseSitemapLocs(xml) {
  const locs = []
  for (const match of String(xml || '').matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)) {
    locs.push(match[1].trim())
  }
  return locs
}

export function evaluateFindings({ robots, sitemap, pages }) {
  const findings = []
  if (!robots.ok) findings.push({ severity: 'error', id: 'robots_fetch', detail: robots.error || String(robots.status) })
  if (sitemap.status !== 200) {
    findings.push({ severity: 'error', id: 'sitemap_status', detail: `sitemap.xml ${sitemap.status}` })
  }
  const type = String(sitemap.contentType || '')
  if (sitemap.status === 200 && type && !/xml|text\/plain/i.test(type)) {
    findings.push({ severity: 'warn', id: 'sitemap_content_type', detail: type })
  }
  const locs = sitemap.locs || []
  if (locs.length && new Set(locs).size < locs.length) {
    findings.push({ severity: 'warn', id: 'duplicate_sitemap_loc', detail: `${locs.length - new Set(locs).size} tekrar` })
  }
  for (const page of pages) {
    if (page.status !== 200) {
      findings.push({ severity: 'error', id: 'page_status', path: page.path, detail: String(page.status) })
      continue
    }
    if (!page.title) findings.push({ severity: 'error', id: 'missing_title', path: page.path })
    if (!page.canonical) findings.push({ severity: 'error', id: 'missing_canonical', path: page.path })
    if (!page.h1) findings.push({ severity: 'warn', id: 'missing_h1', path: page.path })
    const isDynamicDetail = /^\/(blog|team)\//.test(page.path)
      && !['/team/coaches', '/team/dietitians', '/team/apply'].includes(page.path)
    if (isDynamicDetail && page.title === HOME_TITLE) {
      findings.push({ severity: 'error', id: 'homepage_title', path: page.path })
    }
    const robots = String(page.robots || '').toLowerCase()
    if (isDynamicDetail && !robots.includes('noindex') && !(page.jsonLdTypes || []).length) {
      findings.push({ severity: 'warn', id: 'missing_jsonld', path: page.path })
    }
    if (page.canonical && !page.canonical.startsWith(`${SITE}`)) {
      findings.push({ severity: 'warn', id: 'canonical_host', path: page.path, detail: page.canonical })
    }
    if (robots.includes('noindex')) continue
    if (locs.length && !locs.includes(`${SITE}${page.path === '/' ? '/' : page.path}`)) {
      const expected = `${SITE}${page.path}`
      const slashVariants = [expected, `${SITE}${page.path}/`, `${SITE}${page.path === '/' ? '' : page.path}`]
      if (!locs.some((loc) => slashVariants.includes(loc))) {
        findings.push({ severity: 'warn', id: 'not_in_sitemap', path: page.path })
      }
    }
  }
  return findings
}

async function fetchText(url) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, accept: 'text/html,application/xml,text/plain,*/*' },
      redirect: 'follow',
      signal: ctrl.signal,
    })
    const text = await res.text()
    return {
      url,
      status: res.status,
      ok: res.ok,
      contentType: res.headers.get('content-type') || '',
      finalUrl: res.url,
      text,
    }
  } catch (err) {
    return { url, status: 0, ok: false, contentType: '', finalUrl: url, text: '', error: err.message }
  } finally {
    clearTimeout(timer)
  }
}

export async function runProbe() {
  const robotsRes = await fetchText(`${SITE}/robots.txt`)
  const sitemapRes = await fetchText(`${SITE}/sitemap.xml`)
  const llmsRes = await fetchText(`${SITE}/llms.txt`)
  const locs = parseSitemapLocs(sitemapRes.text)
  const probePaths = [...PROBE_PATHS, ...selectDynamicProbePaths(locs)]
  const pages = []
  for (const path of probePaths) {
    const res = await fetchText(`${SITE}${path}`)
    const parsed = parsePageHtml(res.text)
    pages.push({
      path,
      status: res.status,
      finalUrl: res.finalUrl,
      contentType: res.contentType,
      ...parsed,
    })
  }
  const payload = {
    capturedAt: new Date().toISOString(),
    site: SITE,
    robots: {
      status: robotsRes.status,
      ok: robotsRes.ok,
      error: robotsRes.error,
      allowsRoot: /Allow:\s*\//i.test(robotsRes.text),
      sitemapLine: robotsRes.text.match(/Sitemap:\s*(\S+)/i)?.[1] || '',
    },
    sitemap: {
      status: sitemapRes.status,
      contentType: sitemapRes.contentType,
      locCount: locs.length,
      locs,
    },
    llms: { status: llmsRes.status, ok: llmsRes.ok },
    pages,
  }
  payload.findings = evaluateFindings(payload)
  payload.ok = !payload.findings.some((f) => f.severity === 'error')
  return payload
}

function isDirectRun() {
  try {
    return resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1] || '')
  } catch {
    return false
  }
}

if (isDirectRun()) {
  const report = await runProbe()
  console.log(JSON.stringify(report, null, 2))
  if (!report.ok) process.exit(1)
}

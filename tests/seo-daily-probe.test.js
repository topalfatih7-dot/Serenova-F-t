import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  parsePageHtml,
  parseSitemapLocs,
  evaluateFindings,
  selectDynamicProbePaths,
  HOME_TITLE,
} from '../scripts/seo-daily-probe.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function read(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

describe('public Keşfet nav vs footer', () => {
  it('does not list service pillars in discoverSubLinks', () => {
    const src = read('src/components/layout/PublicLayout.jsx')
    const start = src.indexOf('const discoverSubLinks')
    const end = src.indexOf('const memberExtraLinks')
    const block = src.slice(start, end)
    assert.equal(block.includes("/online-diyetisyen"), false)
    assert.equal(block.includes("/online-kocluk"), false)
    assert.ok(block.includes("/hakkimizda"))
    assert.ok(block.includes("/blog"))
  })

  it('keeps crawlable footer links to service pillars', () => {
    const src = read('src/components/layout/PublicLayout.jsx')
    const footer = src.slice(src.indexOf('<footer'))
    assert.ok(footer.includes('to="/online-diyetisyen"'))
    assert.ok(footer.includes('to="/online-kocluk"'))
    assert.ok(footer.includes('to="/online-diyetisyen/fiyat"'))
  })
})

describe('seo-daily-probe parser', () => {
  it('reads title, canonical, h1 and JSON-LD types', () => {
    const html = `
      <html><head>
        <title>Online Diyetisyen — Video | Yeni Form</title>
        <link rel="canonical" href="https://www.yeniform.com/online-diyetisyen" />
        <meta name="robots" content="index,follow" />
        <script type="application/ld+json">{"@type":"Service","name":"Online diyetisyen"}</script>
      </head><body>
        <div id="seo-static-content"><h1>Online Diyetisyen</h1></div>
      </body></html>
    `
    const parsed = parsePageHtml(html)
    assert.equal(parsed.title, 'Online Diyetisyen — Video | Yeni Form')
    assert.equal(parsed.canonical, 'https://www.yeniform.com/online-diyetisyen')
    assert.equal(parsed.h1, 'Online Diyetisyen')
    assert.equal(parsed.robots, 'index,follow')
    assert.deepEqual(parsed.jsonLdTypes, ['Service'])
    assert.equal(parsed.hasSeoStatic, true)
  })

  it('flags sitemap 500 and missing title', () => {
    const findings = evaluateFindings({
      robots: { ok: true },
      sitemap: { status: 500, contentType: 'text/plain', locs: [] },
      pages: [{ path: '/kilo-verme', status: 200, title: '', canonical: 'https://www.yeniform.com/kilo-verme', h1: 'Kilo' }],
    })
    assert.ok(findings.some((f) => f.id === 'sitemap_status'))
    assert.ok(findings.some((f) => f.id === 'missing_title' && f.path === '/kilo-verme'))
  })

  it('parses sitemap loc list', () => {
    const xml = `<?xml version="1.0"?><urlset><url><loc>https://www.yeniform.com/</loc></url><url><loc>https://www.yeniform.com/kilo-verme</loc></url></urlset>`
    assert.deepEqual(parseSitemapLocs(xml), [
      'https://www.yeniform.com/',
      'https://www.yeniform.com/kilo-verme',
    ])
  })

  it('samples blog and staff profile paths from sitemap', () => {
    const locs = [
      'https://www.yeniform.com/blog',
      'https://www.yeniform.com/blog/kas-onarimi',
      'https://www.yeniform.com/team/dietitians',
      'https://www.yeniform.com/team/diyetisyen-pelinay-tohumcu',
      'https://www.yeniform.com/team/koc-ahmet-yilmaz',
    ]
    assert.deepEqual(selectDynamicProbePaths(locs, { blog: 2, team: 2 }), [
      '/blog/kas-onarimi',
      '/team/diyetisyen-pelinay-tohumcu',
      '/team/koc-ahmet-yilmaz',
    ])
  })

  it('flags homepage title and duplicate sitemap locs on dynamic pages', () => {
    const loc = 'https://www.yeniform.com/blog/kas-onarimi'
    const findings = evaluateFindings({
      robots: { ok: true },
      sitemap: { status: 200, contentType: 'application/xml', locs: [loc, loc] },
      pages: [{
        path: '/blog/kas-onarimi',
        status: 200,
        title: HOME_TITLE,
        canonical: loc,
        h1: 'Kas',
        jsonLdTypes: [],
      }],
    })
    assert.ok(findings.some((f) => f.id === 'duplicate_sitemap_loc'))
    assert.ok(findings.some((f) => f.id === 'homepage_title' && f.path === '/blog/kas-onarimi'))
    assert.ok(findings.some((f) => f.id === 'missing_jsonld' && f.severity === 'warn'))
  })

  it('does not require noindex UUID shells in the sitemap', () => {
    const findings = evaluateFindings({
      robots: { ok: true },
      sitemap: { status: 200, contentType: 'application/xml', locs: ['https://www.yeniform.com/blog/kas-onarimi'] },
      pages: [{
        path: '/blog/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        status: 200,
        title: 'Kas | Yeni Form',
        canonical: 'https://www.yeniform.com/blog/kas-onarimi',
        robots: 'noindex, follow',
        h1: 'Kas',
        jsonLdTypes: [],
      }],
    })
    assert.equal(findings.some((f) => f.id === 'not_in_sitemap'), false)
  })
})

describe('fiyat snippet and calorie FAQ contract', () => {
  it('keeps price intent on /online-diyetisyen/fiyat, not membership title', () => {
    const seo = read('src/config/seo.js')
    const content = read('src/data/seoServiceContent.js')
    assert.ok(seo.includes("Online Diyetisyen Fiyatları 2026 — 2.700 TL/ay, Seans Dahil"))
    assert.ok(content.includes('Online diyetisyen fiyatları 2026 — 2.700 TL/ay, seans dahil'))
    assert.ok(content.includes('/team/diyetisyen-selin-durmaz'))
    assert.ok(content.includes('/team/diyetisyen-kubra-ozek'))
    const membershipBlock = seo.slice(seo.indexOf("'/membership'"), seo.indexOf("'/onboarding'"))
    assert.equal(membershipBlock.includes('fiyatları'), false)
    assert.equal(membershipBlock.includes('online diyetisyen fiyat'), false)
  })

  it('answers kilo vermek için kaç kalori on the existing calculator page', () => {
    const calorie = read('src/data/seoCalorieCalculator.js')
    assert.ok(calorie.includes('Kilo vermek için kaç kalori almalıyım?'))
    assert.ok(calorie.includes('İdeal kilo nasıl hesaplanır?'))
    assert.ok(calorie.includes('href="/online-diyetisyen/fiyat"'))
  })
})

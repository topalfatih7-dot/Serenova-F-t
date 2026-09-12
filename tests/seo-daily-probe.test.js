import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parsePageHtml, parseSitemapLocs, evaluateFindings } from '../scripts/seo-daily-probe.mjs'

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
})

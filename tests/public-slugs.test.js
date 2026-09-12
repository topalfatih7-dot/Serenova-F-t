import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  slugifyTurkish,
  staffPublicSlug,
  staffProfilePath,
  isUuidParam,
  dedupeUrlsByPath,
  isoDay,
} from '../src/utils/publicSlugs.js'
import { blogContentToSeoHtml } from '../src/utils/blogContent.js'

describe('publicSlugs', () => {
  it('slugifies Turkish titles', () => {
    assert.equal(slugifyTurkish('İradeniz Tükenmesin'), 'iradeniz-tukenmesin')
    assert.equal(slugifyTurkish('Pelinay Tohumcu'), 'pelinay-tohumcu')
  })

  it('prefixes staff slugs with role', () => {
    assert.equal(
      staffPublicSlug({ id: 'abc', name: 'Pelinay Tohumcu', role: 'dietitian' }),
      'diyetisyen-pelinay-tohumcu',
    )
    assert.equal(
      staffProfilePath({ name: 'Ahmet Yılmaz', role: 'coach' }),
      '/team/koc-ahmet-yilmaz',
    )
  })

  it('dedupes sitemap paths keeping newer lastmod', () => {
    const urls = dedupeUrlsByPath([
      { path: '/blog/kas-onarimi', lastmod: '2026-01-01' },
      { path: '/blog/kas-onarimi', lastmod: '2026-08-12' },
      { loc: '/team/koc-ahmet-yilmaz', lastmod: '2026-02-01' },
    ])
    assert.equal(urls.length, 2)
    assert.equal(urls.find((u) => u.path === '/blog/kas-onarimi').lastmod, '2026-08-12')
  })

  it('recognizes UUID params and ISO days', () => {
    assert.equal(isUuidParam('b4141933-6cf1-4296-987f-fca5b5790fb9'), true)
    assert.equal(isUuidParam('diyetisyen-pelinay-tohumcu'), false)
    assert.equal(isoDay('2026-09-12T10:00:00.000Z'), '2026-09-12')
    assert.equal(isoDay('not-a-date'), '')
  })
})

describe('blogContentToSeoHtml', () => {
  it('renders headings and lists for Googlebot shells', () => {
    const html = blogContentToSeoHtml('# Başlık\n\nParagraf\n\n- bir\n- iki\n\n## Alt')
    assert.match(html, /<h2>Başlık<\/h2>/)
    assert.match(html, /<p>Paragraf<\/p>/)
    assert.match(html, /<ul><li>bir<\/li><li>iki<\/li><\/ul>/)
    assert.match(html, /<h2>Alt<\/h2>/)
  })
})

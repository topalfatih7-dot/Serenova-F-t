import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  PUBLIC_STAFF_RELATION,
  buildBlogShellHtml,
  buildStaffShellHtml,
  matchPublishedPost,
  matchPublicStaff,
  sanitizePublicSlug,
} from '../src/utils/seoPublicShell.js'
import { parsePageHtml, HOME_TITLE } from '../scripts/seo-daily-probe.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function read(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

describe('public staff relation', () => {
  it('sitemap and prerender read staff_directory, not raw staff', () => {
    assert.equal(PUBLIC_STAFF_RELATION, 'staff_directory')
    const sitemap = read('api/sitemap.js')
    const prerender = read('scripts/prerender-seo.mjs')
    assert.match(sitemap, /from\(PUBLIC_STAFF_RELATION\)/)
    assert.match(prerender, /from\(PUBLIC_STAFF_RELATION\)/)
    assert.equal(/\n\s*\.from\(['"]staff['"]\)/.test(sitemap), false)
    assert.equal(/\n\s*\.from\(['"]staff['"]\)/.test(prerender), false)
  })

  it('rewrites Googlebot blog and staff profile URLs to sitemap shells', () => {
    const vercel = read('vercel.json')
    assert.match(vercel, /shell=blog/)
    assert.match(vercel, /shell=team/)
    assert.match(vercel, /Googlebot/)
    assert.match(vercel, /\/team\/koc-:rest/)
    assert.match(vercel, /\/team\/diyetisyen-:rest/)
  })
})

describe('seo public shells', () => {
  it('sanitizes slugs', () => {
    assert.equal(sanitizePublicSlug('koc-ilke-ege'), 'koc-ilke-ege')
    assert.equal(sanitizePublicSlug('../etc/passwd'), '')
    assert.equal(sanitizePublicSlug(''), '')
  })

  it('matches published posts and public staff', () => {
    const post = {
      id: '11111111-1111-4111-8111-111111111111',
      data: { title: 'Video Koçluk Seansına Hazırlık', slug: 'video-kocluk-seansina-hazirlik-maksimum-verim-icin-ipuclari', content: 'Hazırlık maddeleri.' },
      created_at: '2026-09-14T08:00:00Z',
    }
    assert.equal(
      matchPublishedPost([post], 'video-kocluk-seansina-hazirlik-maksimum-verim-icin-ipuclari')?.id,
      post.id,
    )
    const member = { id: 'abc', name: 'İlke Ege', role: 'coach', data: { bio: 'Koç' } }
    assert.equal(matchPublicStaff([member], 'koc-ilke-ege')?.name, 'İlke Ege')
    assert.equal(matchPublicStaff([member], 'coaches'), null)
  })

  it('blog shell uses article title not homepage title', () => {
    const html = buildBlogShellHtml({
      data: {
        title: 'Video Koçluk Seansına Hazırlık',
        slug: 'video-kocluk-seansina-hazirlik-maksimum-verim-icin-ipuclari',
        excerpt: 'Seansa hazırlık.',
        content: 'Kamerayı ayarlayın.\n\nSu bulundurun.',
      },
      created_at: '2026-09-14T08:00:00Z',
    })
    const parsed = parsePageHtml(html)
    assert.notEqual(parsed.title, HOME_TITLE)
    assert.match(parsed.title, /Video Koçluk Seansına Hazırlık/)
    assert.equal(
      parsed.canonical,
      'https://www.yeniform.com/blog/video-kocluk-seansina-hazirlik-maksimum-verim-icin-ipuclari',
    )
    assert.equal(parsed.h1, 'Video Koçluk Seansına Hazırlık')
    assert.ok(parsed.jsonLdTypes.includes('Article'))
    assert.equal(parsed.hasSeoStatic, true)
  })

  it('staff shell uses profile canonical', () => {
    const html = buildStaffShellHtml({
      id: 'abc',
      name: 'selin durmaz',
      role: 'dietitian',
      data: { bio: 'Beslenme uzmanı.' },
    })
    const parsed = parsePageHtml(html)
    assert.match(parsed.title, /Selin Durmaz/)
    assert.equal(parsed.canonical, 'https://www.yeniform.com/team/diyetisyen-selin-durmaz')
    assert.match(parsed.h1, /Selin Durmaz/)
    assert.ok(parsed.jsonLdTypes.includes('Person'))
  })
})

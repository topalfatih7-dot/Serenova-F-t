/**
 * Googlebot HTML for public blog/staff URLs.
 * Sitemap and prerender read kadro from staff_directory (anon-safe), never raw staff.
 */
import { BLOG_AUTHOR } from '../data/blogPosts.js'
import { formatStaffDisplayName } from '../data/staffProfile.js'
import { blogContentToSeoHtml } from './blogContent.js'
import { blogServiceCta } from './blogServiceCta.js'
import { isUuidParam, slugifyTurkish, staffPublicSlug } from './publicSlugs.js'

export const SITE = 'https://www.yeniform.com'
export const PUBLIC_STAFF_RELATION = 'staff_directory'
export const RESERVED_TEAM_SLUGS = new Set(['coaches', 'dietitians', 'apply', 'doctors'])

export function escapeAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

export function sanitizePublicSlug(value) {
  const slug = String(value || '').trim().replace(/^\/+|\/+$/g, '')
  if (!slug || slug.includes('..') || !/^[a-z0-9-]{1,180}$/i.test(slug)) return ''
  return slug
}

export function postPublicSlug(post) {
  const title = post?.data?.title || ''
  return post?.data?.slug || slugifyTurkish(title) || post?.id || ''
}

export function matchPublishedPost(posts, slug) {
  const needle = sanitizePublicSlug(slug)
  if (!needle) return null
  return (posts || []).find((post) => post?.id === needle || postPublicSlug(post) === needle) || null
}

export function matchPublicStaff(staff, slug) {
  const needle = sanitizePublicSlug(slug)
  if (!needle || RESERVED_TEAM_SLUGS.has(needle)) return null
  return (staff || []).find((member) => {
    if (!member || (member.role !== 'coach' && member.role !== 'dietitian')) return false
    if (member.data?.listedOnTeam === false) return false
    return member.id === needle || staffPublicSlug(member) === needle
  }) || null
}

function pillarLinks() {
  return `<p><a href="/online-diyetisyen">Online diyetisyen</a> · <a href="/online-kocluk">Online koçluk</a> · <a href="/kilo-verme">Kilo verme</a> · <a href="/membership">Paketler</a></p>`
}

function ctaHtml(post) {
  const cta = blogServiceCta(post)
  return `<p>${escapeAttr(cta.text)} <a href="${cta.primary.to}">${escapeAttr(cta.primary.label)}</a> · <a href="${cta.secondary.to}">${escapeAttr(cta.secondary.label)}</a></p>`
}

function articleJsonLd({ title, description, slug, datePublished, dateModified }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    author: { '@type': 'Organization', name: BLOG_AUTHOR || 'Yeni Form Ekibi' },
    datePublished: datePublished || undefined,
    dateModified: dateModified || datePublished || undefined,
    inLanguage: 'tr',
    publisher: {
      '@type': 'Organization',
      name: 'Yeni Form',
      logo: { '@type': 'ImageObject', url: `${SITE}/brand-logo.png` },
    },
    mainEntityOfPage: `${SITE}/blog/${slug}`,
  }
}

function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE}${item.path}`,
    })),
  }
}

function personJsonLd({ name, roleLabel, bio, slug, image }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: roleLabel,
    description: bio || undefined,
    image: image || undefined,
    url: `${SITE}/team/${slug}`,
    worksFor: { '@type': 'Organization', name: 'Yeni Form' },
  }
}

export function renderSeoDocument({ title, description, canonicalPath, robots, jsonLd, h1, body }) {
  const canonical = `${SITE}${canonicalPath}`
  const robotsTag = robots || 'index, follow, max-image-preview:large'
  const nodes = (Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []).filter(Boolean)
  const scripts = nodes
    .map((node) => `<script type="application/ld+json">${JSON.stringify(node)}</script>`)
    .join('\n  ')
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <title>${escapeAttr(title)}</title>
  <meta name="description" content="${escapeAttr(description)}" />
  <link rel="canonical" href="${escapeAttr(canonical)}" />
  <meta name="robots" content="${escapeAttr(robotsTag)}" />
  ${scripts}
</head>
<body>
  <article id="seo-static-content" data-seo-prerender="1">
    <h1>${escapeAttr(h1)}</h1>
    ${body}
  </article>
</body>
</html>`
}

export function buildBlogShellHtml(post, { requestedSlug } = {}) {
  const title = post?.data?.title || 'Blog yazısı'
  const canonicalSlug = postPublicSlug(post)
  const excerpt = post?.data?.excerpt || ''
  const description = (excerpt || title).slice(0, 160)
  const articleHtml = blogContentToSeoHtml(post?.data?.content || '')
  const isAlias = requestedSlug && requestedSlug !== canonicalSlug && isUuidParam(requestedSlug)
  const canonicalPath = `/blog/${canonicalSlug}`
  if (isAlias) {
    return renderSeoDocument({
      title: `${title} | Yeni Form`,
      description,
      canonicalPath,
      robots: 'noindex, follow',
      h1: title,
      body: `<p>Bu yazının kalıcı adresi: <a href="${canonicalPath}">${escapeAttr(title)}</a>.</p>${pillarLinks()}`,
    })
  }
  return renderSeoDocument({
    title: `${title} | Yeni Form`,
    description,
    canonicalPath,
    jsonLd: [
      articleJsonLd({
        title,
        description,
        slug: canonicalSlug,
        datePublished: post.data?.createdAt || post.created_at,
        dateModified: post.data?.updatedAt || post.created_at,
      }),
      breadcrumbJsonLd([
        { name: 'Ana Sayfa', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: title, path: canonicalPath },
      ]),
    ],
    h1: title,
    body: `${articleHtml || `<p>${escapeAttr(excerpt)}</p>`}${ctaHtml({
      title,
      slug: canonicalSlug,
      category: post.data?.category,
    })}<p>Yazar: ${escapeAttr(BLOG_AUTHOR)}</p>${pillarLinks()}`,
  })
}

export function buildStaffShellHtml(member, { requestedSlug } = {}) {
  const slug = staffPublicSlug(member)
  const displayName = formatStaffDisplayName(member.name)
  const roleLabel = member.role === 'dietitian' ? 'Online Diyetisyen' : 'Online Fitness Koçu'
  const bio = String(member.data?.bio || member.data?.description || '').trim()
  const specialties = []
    .concat(member.data?.specialties || [])
    .concat(member.data?.specialty ? [member.data.specialty] : [])
    .map((s) => String(s || '').trim())
    .filter(Boolean)
  const uniqueSpecs = [...new Set(specialties)].slice(0, 8)
  const specHtml = uniqueSpecs.length
    ? `<p>Uzmanlık: ${uniqueSpecs.map((s) => escapeAttr(s)).join(', ')}</p>`
    : ''
  const photo = member.data?.photo
  const image = typeof photo === 'string' && photo.startsWith('http') ? photo : undefined
  const canonicalPath = `/team/${slug}`
  const description = (bio || `${displayName}, Yeni Form ${roleLabel.toLowerCase()} kadrosu.`).slice(0, 160)
  const isAlias = requestedSlug && requestedSlug !== slug && isUuidParam(requestedSlug)
  if (isAlias) {
    return renderSeoDocument({
      title: `${displayName} — ${roleLabel} | Yeni Form`,
      description,
      canonicalPath,
      robots: 'noindex, follow',
      h1: `${roleLabel} ${displayName}`,
      body: `<p>Profilin kalıcı adresi: <a href="${canonicalPath}">${escapeAttr(displayName)}</a>.</p>${pillarLinks()}`,
    })
  }
  return renderSeoDocument({
    title: `${displayName} — ${roleLabel} | Yeni Form`,
    description,
    canonicalPath,
    jsonLd: [
      personJsonLd({ name: displayName, roleLabel, bio: bio.slice(0, 400), slug, image }),
      breadcrumbJsonLd([
        { name: 'Ana Sayfa', path: '/' },
        { name: roleLabel, path: member.role === 'dietitian' ? '/team/dietitians' : '/team/coaches' },
        { name: displayName, path: canonicalPath },
      ]),
    ],
    h1: `${roleLabel} ${displayName}`,
    body: `<p>${escapeAttr(bio.slice(0, 800))}</p>${specHtml}${pillarLinks()}`,
  })
}

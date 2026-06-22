import { useEffect } from 'react'
import {
  SEO,
  formatTitle,
  truncateDescription,
  absoluteUrl,
  getSiteUrl,
} from '../../config/seo'

const MANAGED = new Set()

function upsertMeta(attr, key, content) {
  if (!content && content !== '0') return
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
    MANAGED.add(selector)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href) {
  if (!href) return
  const selector = `link[rel="${rel}"]`
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
    MANAGED.add(selector)
  }
  el.setAttribute('href', href)
}

function removeManaged() {
  MANAGED.forEach((selector) => {
    document.head.querySelector(selector)?.remove()
  })
  MANAGED.clear()
}

/**
 * Sayfa başına title, meta, Open Graph, Twitter Card ve canonical yönetimi.
 */
export default function SeoHead({
  title,
  description,
  keywords,
  canonicalPath,
  ogImage,
  ogType = 'website',
  noindex = false,
  jsonLd,
}) {
  const fullTitle = formatTitle(title)
  const desc = truncateDescription(description || SEO.defaultDescription)
  const kw = keywords || SEO.defaultKeywords
  const canonical = canonicalPath ? absoluteUrl(canonicalPath) : absoluteUrl(window.location.pathname)
  const image = absoluteUrl(ogImage || SEO.ogImage)
  const siteUrl = getSiteUrl()

  useEffect(() => {
    document.title = fullTitle
    document.documentElement.lang = SEO.language

    upsertMeta('name', 'description', desc)
    upsertMeta('name', 'keywords', kw)
    upsertMeta('name', 'author', SEO.siteName)
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
    upsertMeta('name', 'theme-color', SEO.themeColor)

    upsertMeta('property', 'og:site_name', SEO.siteName)
    upsertMeta('property', 'og:locale', SEO.locale)
    upsertMeta('property', 'og:type', ogType)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', desc)
    upsertMeta('property', 'og:url', canonical)
    if (siteUrl) {
      upsertMeta('property', 'og:image', image)
      upsertMeta('property', 'og:image:width', String(SEO.ogImageWidth))
      upsertMeta('property', 'og:image:height', String(SEO.ogImageHeight))
    }

    upsertMeta('name', 'twitter:card', SEO.twitterCard)
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', desc)
    if (siteUrl) upsertMeta('name', 'twitter:image', image)

    if (siteUrl) upsertLink('canonical', canonical)

    return removeManaged
  }, [fullTitle, desc, kw, canonical, image, ogType, noindex, siteUrl])

  const schemas = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : jsonLd ? [jsonLd] : []
  if (!schemas.length) return null

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          // eslint-disable-next-line react/no-danger
          key={`ld-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}

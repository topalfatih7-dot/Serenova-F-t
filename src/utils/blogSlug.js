import { slugifyTurkish } from '../config/seo'

/** Blog yazısı için benzersiz slug üretir veya mevcut slug'ı döner. */
export function blogPostSlug(post) {
  if (!post) return ''
  if (post.slug) return post.slug
  const fromTitle = slugifyTurkish(post.title)
  return fromTitle || post.id || ''
}

export function blogPostPath(post) {
  const slug = blogPostSlug(post)
  return slug ? `/blog/${slug}` : '/blog'
}

export function findBlogPost(posts, param) {
  if (!param) return null
  const list = (posts || []).filter((p) => p.published !== false)
  const byId = list.find((p) => p.id === param)
  if (byId) return byId
  return list.find((p) => blogPostSlug(p) === param)
}

/** Yeni yazı oluştururken slug çakışmasını önler. */
export function ensureUniqueBlogSlug(slug, posts, excludeId) {
  const base = slugifyTurkish(slug) || 'yazi'
  const taken = new Set(
    (posts || [])
      .filter((p) => p.id !== excludeId)
      .map((p) => blogPostSlug(p))
  )
  if (!taken.has(base)) return base
  let i = 2
  while (taken.has(`${base}-${i}`)) i += 1
  return `${base}-${i}`
}

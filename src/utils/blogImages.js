/** Blog kapak görselleri — kategori bazlı (Unsplash, ücretsiz CDN). */

export const BLOG_COVER_BY_CATEGORY = {
  Beslenme: {
    url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
    alt: 'Sağlıklı beslenme tabağı',
  },
  Antrenman: {
    url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80',
    alt: 'Fitness antrenmanı',
  },
  Motivasyon: {
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
    alt: 'Motivasyon ve wellness',
  },
  Yaşam: {
    url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',
    alt: 'Sağlıklı yaşam tarzı',
  },
}

const DEFAULT = BLOG_COVER_BY_CATEGORY.Yaşam

export function resolveBlogCover(post) {
  if (post?.coverImage) {
    return {
      url: post.coverImage,
      alt: post.coverImageAlt || post.title || 'Blog yazısı',
    }
  }
  const cat = BLOG_COVER_BY_CATEGORY[post?.category] || DEFAULT
  return cat
}

export function coverForCategory(category) {
  const cat = BLOG_COVER_BY_CATEGORY[category] || DEFAULT
  return { coverImage: cat.url, coverImageAlt: cat.alt }
}

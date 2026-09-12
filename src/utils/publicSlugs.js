/** Vite env yok — sitemap, prerender ve client aynı slug’ı üretsin. */

export function slugifyTurkish(text) {
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

const STAFF_ROLE_SLUG = { coach: 'koc', dietitian: 'diyetisyen' }

export function staffSpecialtyText(member) {
  return (
    member?.specialty ||
    member?.title ||
    member?.data?.specialty ||
    member?.data?.title ||
    ''
  )
}

/** SEO dostu profil slug — "koç ahmet yeniform" aramaları için rol öneki */
export function staffPublicSlug(member) {
  const namePart = slugifyTurkish(member?.name)
  if (!namePart) return member?.id || ''
  const rolePrefix = STAFF_ROLE_SLUG[member?.role] || 'uzman'
  if (namePart === rolePrefix || namePart.startsWith(`${rolePrefix}-`)) {
    const specialty = slugifyTurkish(staffSpecialtyText(member))
    if (specialty && specialty !== namePart && specialty !== rolePrefix) {
      return `${rolePrefix}-${specialty}`
    }
    const shortId = String(member?.id || '').replace(/-/g, '').slice(0, 8)
    return shortId ? `${rolePrefix}-${shortId}` : rolePrefix
  }
  return `${rolePrefix}-${namePart}`
}

export function staffProfilePath(member) {
  const slug = staffPublicSlug(member)
  return slug ? `/team/${slug}` : '/'
}

export function isUuidParam(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''))
}

/** Aynı path bir kez; daha yeni lastmod kazanır. */
export function dedupeUrlsByPath(urls) {
  const map = new Map()
  for (const url of urls || []) {
    const path = url?.path || url?.loc
    if (!path) continue
    const prev = map.get(path)
    if (!prev || String(url.lastmod || '') > String(prev.lastmod || '')) {
      map.set(path, { ...url, path })
    }
  }
  return [...map.values()]
}

export function isoDay(value) {
  const raw = String(value || '')
  const day = raw.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : ''
}

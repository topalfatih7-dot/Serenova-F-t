function socialUrlsFromEnv() {
  return [
    import.meta.env.VITE_SOCIAL_INSTAGRAM,
    import.meta.env.VITE_SOCIAL_FACEBOOK,
    import.meta.env.VITE_SOCIAL_LINKEDIN,
    import.meta.env.VITE_SOCIAL_X,
    import.meta.env.VITE_SOCIAL_YOUTUBE,
  ].filter((url) => typeof url === 'string' && url.startsWith('http'))
}

const manualSocialUrls = [
  'https://www.instagram.com/yeniform/',
]

/** Footer + sosyal bağlantılar — yeni platform eklemek için buraya ekleyin */
export const BRAND_SOCIAL_LINKS = [
  {
    id: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com/yeniform/',
    handle: '@yeniform',
  },
]

function mergeSocialUrls() {
  return [...new Set([
    ...socialUrlsFromEnv(),
    ...manualSocialUrls,
    ...BRAND_SOCIAL_LINKS.map((item) => item.url),
  ].filter(Boolean))]
}

export const BRAND = {
  name: 'Yeni Form',
  shortName: 'Yeni Form',
  domain: 'yeniform.com',
  siteUrl: 'https://www.yeniform.com',
  instagram: BRAND_SOCIAL_LINKS[0]?.url || '',
  socialLinks: BRAND_SOCIAL_LINKS,
  tagline: 'Online koçluk ve online diyetisyen ile sürdürülebilir wellness',
  initials: 'YF',
  /** Statik marka görselleri — kaynak: public/brand-logo-alt.png → npm run og:image */
  assets: {
    /** Navbar, giriş, panel — yatay logo (ikon + Yeni Form yazısı) */
    logo: '/brand-logo.png?v=4',
    logoWebp: '/brand-logo.webp?v=4',
    /** Favicon, manifest, JSON-LD — yalnızca ikon karesi */
    mark: '/brand-mark.png',
    /** Sosyal paylaşım / Open Graph — 1200×630 */
    ogImage: '/og-image.png',
    /** Google Auth Platform App logo — kare PNG */
    googleOAuthLogo: '/google-oauth-logo.png',
    /** Meta App Icon (Facebook Login ekranı) — 1024×1024 PNG */
    facebookOAuthLogo: '/facebook-oauth-logo.png',
    /** Orijinal kaynak — değiştirin, sonra npm run og:image */
    logoSource: '/brand-logo-alt.png',
  },
  /** Organization JSON-LD sameAs — Vercel env + manualSocialUrls birleşimi */
  socialUrls: mergeSocialUrls(),
  /** Google Analytics 4 — env ile override: VITE_GA4_MEASUREMENT_ID */
  ga4MeasurementId: 'G-40ENH7MC5W',
}

/**
 * Admin e-postası — şifre kodda tutulmaz; panelden /admin/account ile güncellenir.
 * RLS `is_admin()` → `platform_settings.admin_email` (varsayılan aynı).
 * Override: VITE_ADMIN_EMAIL + ADMIN_EMAIL + DB satırını birlikte güncelleyin.
 */
export const ADMIN_EMAIL = (
  import.meta.env.VITE_ADMIN_EMAIL || 'admin@yeniform.com'
).trim().toLowerCase()

export const ADMIN_CREDENTIALS = {
  email: ADMIN_EMAIL,
  name: 'Yeni Form Admin',
}

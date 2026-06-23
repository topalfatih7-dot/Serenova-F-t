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
  // 'https://www.instagram.com/yeniform',
  // 'https://www.facebook.com/yeniform',
  // 'https://www.linkedin.com/company/yeniform',
]

export const BRAND = {
  name: 'Yeni Form',
  shortName: 'Yeni Form',
  tagline: 'Herkes için çevrimiçi koçluk ve wellness',
  initials: 'YF',
  /** Statik marka görselleri — kaynak: public/brand-logo-alt.png → npm run og:image */
  assets: {
    /** Navbar, giriş, panel — yatay logo (ikon + Yeni Form yazısı) */
    logo: '/brand-logo.png?v=3',
    /** Favicon, manifest, JSON-LD — yalnızca ikon karesi */
    mark: '/brand-mark.png',
    /** Sosyal paylaşım / Open Graph — 1200×630 */
    ogImage: '/og-image.png',
    /** Orijinal kaynak — değiştirin, sonra npm run og:image */
    logoSource: '/brand-logo-alt.png',
  },
  /** Organization JSON-LD sameAs — Vercel env veya manualSocialUrls */
  socialUrls: socialUrlsFromEnv().length ? socialUrlsFromEnv() : manualSocialUrls,
  /** Google Analytics 4 — env ile override: VITE_GA4_MEASUREMENT_ID */
  ga4MeasurementId: 'G-40ENH7MC5W',
}

export const ADMIN_CREDENTIALS = {
  email: 'admin@serenova.fit',
  password: 'Serenova2026!',
  name: 'Yeni Form Admin',
}

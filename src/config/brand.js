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
  /** Organization JSON-LD sameAs — sosyal medya URL'lerini buraya ekleyin */
  socialUrls: [
    // 'https://www.instagram.com/yeniform',
    // 'https://www.facebook.com/yeniform',
    // 'https://www.linkedin.com/company/yeniform',
  ],
}

export const ADMIN_CREDENTIALS = {
  email: 'admin@serenova.fit',
  password: 'Serenova2026!',
  name: 'Yeni Form Admin',
}

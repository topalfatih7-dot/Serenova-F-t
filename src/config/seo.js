import { BRAND } from './brand'
export function getSiteUrl() {
  const fromEnv = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (import.meta.env.PROD) return SEO.siteUrl || ''
  if (typeof window !== 'undefined') return window.location.origin
  return SEO.siteUrl || ''
}

export function absoluteUrl(path = '/') {
  const base = getSiteUrl()
  const normalized = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${normalized}` : normalized
}

export const SEO = {
  siteName: BRAND.name,
  locale: 'tr_TR',
  language: 'tr',
  defaultTitle: `${BRAND.name} — Online Koçluk, Diyetisyen & Wellness Platformu`,
  titleSuffix: BRAND.name,
  defaultDescription:
    'Yeni Form ile kişisel sağlık analizi, uzman koç ve diyetisyen desteği, video görüşme randevuları ve beslenme programları. Türkiye\'nin çevrimiçi wellness platformu.',
  defaultKeywords: [
    'online koçluk',
    'fitness koçu',
    'diyetisyen online',
    'wellness platformu',
    'beslenme programı',
    'antrenman programı',
    'kalori hesaplama',
    'kişisel sağlık analizi',
    'Yeni Form',
    'online fitness',
    'video koçluk',
    'sağlıklı yaşam',
  ].join(', '),
  ogImage: BRAND.assets.ogImage,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image',
  themeColor: '#2d6a4f',
  contactEmail: 'info@yeniform.com',
  siteUrl: 'https://www.yeniform.com',
}

/** Kadro rolü → liste sayfası rotası */
export function teamListPathForRole(role) {
  if (role === 'coach') return '/team/coaches'
  if (role === 'dietitian') return '/team/dietitians'
  return '/team/doctors'
}

/** Statik public rotalar — sitemap ve varsayılan meta eşlemesi */
export const STATIC_PUBLIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/membership', changefreq: 'weekly', priority: '0.9' },
  { path: '/onboarding', changefreq: 'monthly', priority: '0.9' },
  { path: '/stories', changefreq: 'weekly', priority: '0.8' },
  { path: '/blog', changefreq: 'daily', priority: '0.8' },
  { path: '/team/coaches', changefreq: 'monthly', priority: '0.7' },
  { path: '/team/dietitians', changefreq: 'monthly', priority: '0.7' },
  { path: '/team/doctors', changefreq: 'monthly', priority: '0.7' },
  { path: '/corporate', changefreq: 'monthly', priority: '0.7' },
  { path: '/corporate/apply', changefreq: 'monthly', priority: '0.6' },
  { path: '/team/apply', changefreq: 'monthly', priority: '0.6' },
]

export const PAGE_SEO = {
  '/': {
    title: `${BRAND.name} — Online Koçluk, Diyetisyen & Wellness Platformu`,
    description:
      'Kişisel sağlık analizi, uzman koç ve diyetisyen görüşmeleri, otomatik beslenme ve antrenman programları. Ücretsiz Basic paketle hemen başlayın.',
    keywords:
      'online koçluk, fitness koçu, diyetisyen, wellness, beslenme programı, antrenman, Yeni Form, ücretsiz fitness',
  },
  '/membership': {
    title: 'Üyelik Planları — Basic, Gümüş, Altın, Platinum',
    description:
      'Basic (ücretsiz), Gümüş, Altın ve Platinum üyelik planlarını karşılaştırın. Koç görüşmesi, diyetisyen desteği, kalori hesaplama ve VIP özellikler.',
    keywords:
      'üyelik planları, fitness paketi, online koçluk fiyat, diyetisyen paketi, platinum wellness, Yeni Form üyelik',
  },
  '/onboarding': {
    title: 'Kayıt Ol — Ücretsiz Hesap Oluştur',
    description:
      'Yeni Form\'a birkaç dakikada kayıt olun. Ücretsiz Basic paket veya premium planlarla kişisel wellness yolculuğunuza başlayın.',
    keywords: 'kayıt ol, ücretsiz fitness hesabı, online koçluk kayıt, wellness üyelik',
  },
  '/login': {
    title: 'Giriş Yap',
    description: 'Yeni Form üye panelinize giriş yapın. Programlarınız, randevularınız ve sağlık analiziniz sizi bekliyor.',
    noindex: true,
  },
  '/forgot-password': {
    title: 'Şifremi Unuttum',
    description: 'Yeni Form hesabınız için şifre sıfırlama bağlantısı alın.',
    noindex: true,
  },
  '/stories': {
    title: 'Başarı Hikayeleri — Topluluk Dönüşümleri',
    description:
      'Yeni Form topluluğunun ilham verici dönüşüm hikayeleri. Gerçek üyelerin wellness yolculuklarından öğrenin.',
    keywords: 'başarı hikayeleri, dönüşüm, fitness motivasyon, kilo verme hikayesi, wellness',
  },
  '/blog': {
    title: 'Blog — Sağlık, Beslenme ve Motivasyon',
    description:
      'Beslenme, antrenman, motivasyon ve sağlıklı yaşam üzerine uzman içerikler. Yeni Form blog.',
    keywords: 'fitness blog, beslenme ipuçları, antrenman rehberi, sağlıklı yaşam, motivasyon',
  },
  '/team/coaches': {
    title: 'Koçlarımız — Uzman Fitness Koçları',
    description:
      'Deneyimli fitness koçlarımızla tanışın. Kişisel antrenman programları ve video görüşme desteği.',
    keywords: 'fitness koçu, online koç, antrenör, kişisel antrenman',
  },
  '/team/dietitians': {
    title: 'Diyetisyenlerimiz — Uzman Beslenme Danışmanları',
    description:
      'Uzman diyetisyenlerimizle sağlıklı ve sürdürülebilir beslenme alışkanlıkları kazanın.',
    keywords: 'online diyetisyen, beslenme danışmanı, diyet programı',
  },
  '/team/doctors': {
    title: 'Doktorlarımız — Sağlık Sürecinizde Yanınızda',
    description:
      'Wellness yolculuğunuzda sağlık sürecinizi destekleyen uzman doktor kadromuz.',
    keywords: 'wellness doktor, sağlık danışmanlığı, online sağlık',
  },
  '/corporate': {
    title: 'Kurumsal Wellness Programları',
    description:
      'Şirketiniz için ölçeklenebilir koçluk, beslenme ve çalışan wellness çözümleri. Yeni Form kurumsal paketleri.',
    keywords: 'kurumsal wellness, çalışan sağlığı, şirket fitness programı, kurumsal koçluk',
  },
  '/corporate/apply': {
    title: 'Kurumsal Başvuru Formu',
    description: 'Kurumsal wellness programı için başvuru formu. Ekibimiz size özel teklif hazırlar.',
    noindex: false,
  },
  '/team/apply': {
    title: 'Kadromuza Katıl — Koç & Diyetisyen Başvurusu',
    description: 'Yeni Form kadrosuna koç veya diyetisyen olarak başvurun. Online wellness platformunda uzman ekibimize katılın.',
    keywords: 'koç başvurusu, diyetisyen iş ilanı, online koçluk kariyer',
  },
  '/reset-password': {
    title: 'Yeni Şifre Belirle',
    description: 'Yeni Form hesabınız için yeni şifre oluşturun.',
    noindex: true,
  },
}

export function formatTitle(pageTitle) {
  if (!pageTitle) return SEO.defaultTitle
  if (pageTitle.includes(BRAND.name)) return pageTitle
  return `${pageTitle} | ${SEO.titleSuffix}`
}

export function truncateDescription(text, max = 160) {
  if (!text) return SEO.defaultDescription
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trim()}…`
}

export function buildOrganizationSchema() {
  const url = absoluteUrl('/')
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND.name,
    url,
    logo: absoluteUrl(BRAND.assets.logo),
    description: SEO.defaultDescription,
    email: SEO.contactEmail,
    sameAs: (BRAND.socialUrls || []).filter(Boolean),
  }
}

export function buildItemListSchema({ name, path, items = [] }) {
  const list = items.filter((item) => item?.name && item?.path)
  if (!list.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: absoluteUrl(path),
    numberOfItems: list.length,
    itemListElement: list.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  }
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND.name,
    url: absoluteUrl('/'),
    description: SEO.defaultDescription,
    inLanguage: SEO.language,
    publisher: { '@type': 'Organization', name: BRAND.name },
  }
}

export function buildFaqSchema(faqs = []) {
  const items = (faqs || [])
    .filter((f) => f?.question && f?.answer)
    .slice(0, 20)
    .map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    }))
  if (!items.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items,
  }
}

export function buildArticleSchema(post) {
  if (!post) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || truncateDescription(post.content),
    author: { '@type': 'Person', name: post.author || BRAND.name },
    datePublished: post.createdAt,
    dateModified: post.updatedAt || post.createdAt,
    inLanguage: SEO.language,
    publisher: {
      '@type': 'Organization',
      name: BRAND.name,
      logo: { '@type': 'ImageObject', url: absoluteUrl(BRAND.assets.logo) },
    },
    mainEntityOfPage: absoluteUrl(`/blog/${post.id}`),
  }
}

export function buildPersonSchema(member) {
  if (!member) return null
  const profile = typeof member.specialties !== 'undefined' ? member : { ...member }
  const credentials = (profile.certificates || [])
    .filter((c) => c?.name)
    .map((c) => ({
      '@type': 'EducationalOccupationalCredential',
      name: c.name,
      credentialCategory: c.issuer || 'Sertifika',
    }))
  const alumni = (profile.education || [])
    .filter((e) => e?.school)
    .map((e) => ({ '@type': 'EducationalOrganization', name: e.school }))

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.title || profile.specialty || profile.role,
    description: profile.headline || profile.bio || profile.description,
    image: profile.photo || undefined,
    knowsAbout: profile.specialties?.length ? profile.specialties : undefined,
    hasCredential: credentials.length ? credentials : undefined,
    alumniOf: alumni.length ? alumni : undefined,
    worksFor: { '@type': 'Organization', name: BRAND.name },
  }
}

export function buildBreadcrumbSchema(items) {
  if (!items?.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

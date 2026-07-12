import { BRAND } from './brand'
import { blogPostPath } from '../utils/blogSlug'

const LEGAL_SEO_SLUGS = [
  'kvkk', 'kvkk-acik-riza-metni', 'gizlilik-politikasi', 'cerez-politikasi',
  'saglik-verisi-isleme-bilgilendirmesi', 'veri-saklama-ve-imha-politikasi', 'yapay-zeka-kullanim-politikasi',
  'uyelik-ve-abonelik-sozlesmesi', 'mesafeli-hizmet-sozlesmesi', 'iptal-ve-iade-politikasi',
  'topluluk-kurallari', 'saglik-sorumluluk-reddi', 'antrenor-hizmet-standartlari', 'diyetisyen-hizmet-standartlari',
]

const LEGAL_ROUTE_ENTRIES = LEGAL_SEO_SLUGS.map((slug) => ({
  path: `/legal/${slug}`,
  changefreq: 'yearly',
  priority: '0.4',
}))
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

/** Resmi alan adı — arama ve schema için */
export const BRAND_DOMAIN = 'yeniform.com'

/** Schema.org alternateName — boşluksuz / domain / yaygın yazımlar */
export const BRAND_ALIASES = [
  'YeniForm',
  BRAND_DOMAIN,
  `www.${BRAND_DOMAIN}`,
  'yenifrom',
  'Yeni Form Wellness',
]

/** Meta keywords — marka + domain + yaygın yazım hataları */
export const BRAND_SEARCH_TERMS = [
  'Yeni Form',
  'YeniForm',
  'yeniform',
  'yeniform.com',
  'www.yeniform.com',
  'yeni form wellness',
  'yeni form koçluk',
  'yeni form diyetisyen',
  'yeni form üyelik',
  'yenifrom',
  'yenifrom.com',
  'yneiform',
  'yeni frm',
  'yeni-form',
]

const CORE_KEYWORDS = [
  'online koçluk',
  'fitness koçu',
  'diyetisyen online',
  'wellness platformu',
  'beslenme programı',
  'antrenman programı',
  'kalori hesaplama',
  'kişisel sağlık analizi',
  'online fitness',
  'video koçluk',
  'sağlıklı yaşam',
  'evde antrenman',
  'spor salonu programı',
]

/** Marka keşfi için statik SSS — admin SSS boş olsa bile JSON-LD ve landing'de görünür */
export const STATIC_BRAND_FAQS = [
  {
    q: 'Yeni Form nedir?',
    a: 'Yeni Form (yeniform.com), Türkiye\'nin çevrimiçi koçluk, diyetisyen ve wellness platformudur. Kişisel sağlık analizi, uzman görüşmeleri ve otomatik beslenme-antrenman programları sunar.',
  },
  {
    q: 'Yeni Form sitesine nasıl ulaşırım?',
    a: 'Resmi web adresimiz www.yeniform.com\'dur. Google\'da "Yeni Form", "yeniform" veya "yeni form wellness" yazarak da bize ulaşabilirsiniz.',
  },
  {
    q: 'Yeni Form ücretsiz mi?',
    a: 'Evet. Basic paket tamamen ücretsizdir; kayıt olup kişisel sağlık analizi ile başlayabilirsiniz. Antrenman ve beslenme programları ücretli paketlerde koç / diyetisyen tarafından hazırlanır. Ücretli paketler isteğe bağlıdır.',
  },
]

export function mergeKeywords(...parts) {
  const set = new Set()
  for (const part of parts) {
    if (!part) continue
    const items = Array.isArray(part) ? part : String(part).split(',')
    for (const item of items) {
      const trimmed = item.trim()
      if (trimmed) set.add(trimmed)
    }
  }
  return [...set].join(', ')
}

export function buildBrandKeywords(extra) {
  return mergeKeywords(BRAND_SEARCH_TERMS, extra)
}

/** Admin SSS ile marka SSS birleştir — tekrar eden sorular elenir */
export function mergeBrandFaqs(faqs = []) {
  const seen = new Set()
  const merged = []
  for (const faq of [...STATIC_BRAND_FAQS, ...(faqs || [])]) {
    const q = (faq?.q || faq?.question || '').trim().toLowerCase()
    if (!q || seen.has(q)) continue
    seen.add(q)
    merged.push(faq)
  }
  return merged
}

export const SEO = {
  siteName: BRAND.name,
  locale: 'tr_TR',
  language: 'tr',
  defaultTitle: `${BRAND.name} — Online Koçluk, Diyetisyen & Wellness Platformu`,
  titleSuffix: BRAND.name,
  defaultDescription:
    'Yeni Form (yeniform.com) ile kişisel sağlık analizi, uzman koç ve diyetisyen desteği, video görüşme randevuları ve beslenme programları. Türkiye\'nin çevrimiçi wellness platformu.',
  defaultKeywords: buildBrandKeywords(CORE_KEYWORDS),
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

/** Türkçe karakter destekli URL slug (ör. "Koç Ahmet Yılmaz" → "koc-ahmet-yilmaz") */
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

const STAFF_ROLE_SLUG = { coach: 'koc', dietitian: 'diyetisyen', doctor: 'doktor' }

/** SEO dostu profil slug — "koç ahmet yeniform" aramaları için rol öneki eklenir */
export function staffPublicSlug(member) {
  const namePart = slugifyTurkish(member?.name)
  if (!namePart) return member?.id || ''
  const rolePrefix = STAFF_ROLE_SLUG[member?.role] || 'uzman'
  return `${rolePrefix}-${namePart}`
}

export function staffProfilePath(member) {
  const slug = staffPublicSlug(member)
  return slug ? `/team/${slug}` : '/'
}

/** UUID veya slug ile kadro üyesi bul */
export function findStaffMember(staffList, param) {
  if (!param) return null
  const list = (staffList || []).filter((s) => s.active !== false)
  const byId = list.find((s) => s.id === param)
  if (byId) return byId
  return list.find((s) => staffPublicSlug(s) === param)
}

/** Kadro profili meta keywords — "koç ahmet yeni form" gibi aramalar için */
export function buildStaffProfileKeywords(member, roleLabel) {
  const name = (member?.name || '').trim()
  const first = name.split(/\s+/)[0] || ''
  const roleLower = (roleLabel || '').toLowerCase()
  const brand = BRAND.name
  const keywords = new Set([
    name,
    `${roleLower} ${first}`.toLowerCase(),
    `${first} ${roleLower}`.toLowerCase(),
    `${name} ${brand}`.toLowerCase(),
    `${brand} ${roleLower}`.toLowerCase(),
    `${first} ${brand}`.toLowerCase(),
    `${first} yeniform`.toLowerCase(),
    `${roleLower} ${first} yeniform`.toLowerCase(),
    'yeniform',
    BRAND_DOMAIN,
    member?.specialty,
    member?.title,
    ...(member?.specialties || []),
  ].filter(Boolean))
  return mergeKeywords([...keywords])
}

/** Statik public rotalar — sitemap ve varsayılan meta eşlemesi */
export const STATIC_PUBLIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/hakkimizda', changefreq: 'monthly', priority: '0.8' },
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
  ...LEGAL_ROUTE_ENTRIES,
]

export const PAGE_SEO = {
  '/': {
    title: `${BRAND.name} — Online Koçluk, Diyetisyen & Wellness Platformu`,
    description:
      'Yeni Form (yeniform.com) — evde veya spor salonunda antrenman, kişisel sağlık analizi, uzman koç ve diyetisyen görüşmeleri, otomatik beslenme ve antrenman programları. Basic (ücretsiz) paketle hemen başlayın.',
    keywords: buildBrandKeywords('online koçluk, fitness koçu, spor salonu programı, evde antrenman, diyetisyen, wellness, beslenme programı, antrenman, ücretsiz fitness'),
  },
  '/hakkimizda': {
    title: 'Hakkımızda — Misyonumuz, Değerlerimiz ve Uzman Kadromuz',
    description:
      'Yeni Form (yeniform.com) kimdir? Online koçluk, diyetisyen ve wellness platformumuzun misyonu, değerleri, uzman kadrosu ve güvenlik yaklaşımı hakkında bilgi edinin.',
    keywords: buildBrandKeywords('hakkımızda, yeni form kimdir, wellness platformu, online koçluk şirketi, misyon, vizyon, güvenilir diyetisyen platformu'),
  },
  '/membership': {
    title: 'Üyelik Planları — Basic, Eko, Diyet, Spor, Doktor & VIP',
    description:
      'Basic (ücretsiz), Eko, Diyet, Spor, Doktor Paketi ve VIP paketlerini karşılaştırın. Koç, diyetisyen ve doktor görüşmeleri, kalori hesaplama, video kütüphanesi ve kişisel programlar.',
    keywords: buildBrandKeywords('üyelik planları, eko paket, diyet paketi, spor paketi, doktor paketi, vip paket, online koçluk fiyat'),
  },
  '/onboarding': {
    title: 'Kayıt Ol — Ücretsiz Hesap Oluştur',
    description:
      'Yeni Form\'a birkaç dakikada kayıt olun. Ücretsiz Basic paket veya Eko, Diyet, Spor, Doktor Paketi ve VIP planlarıyla kişisel wellness yolculuğunuza başlayın.',
    keywords: buildBrandKeywords('kayıt ol, ücretsiz fitness hesabı, online koçluk kayıt, wellness üyelik, eko paket kayıt'),
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
    keywords: buildBrandKeywords('başarı hikayeleri, dönüşüm, fitness motivasyon, kilo verme hikayesi, wellness'),
  },
  '/blog': {
    title: 'Blog — Sağlık, Beslenme ve Motivasyon',
    description:
      'Beslenme, antrenman, motivasyon ve sağlıklı yaşam üzerine uzman içerikler. Yeni Form blog.',
    keywords: buildBrandKeywords('fitness blog, beslenme ipuçları, antrenman rehberi, sağlıklı yaşam, motivasyon'),
  },
  '/team/coaches': {
    title: 'Koçlarımız — Uzman Fitness Koçları',
    description:
      'Deneyimli fitness koçlarımızla tanışın. Kişisel antrenman programları ve video görüşme desteği.',
    keywords: buildBrandKeywords('fitness koçu, online koç, antrenör, kişisel antrenman'),
  },
  '/team/dietitians': {
    title: 'Diyetisyenlerimiz — Uzman Beslenme Danışmanları',
    description:
      'Uzman diyetisyenlerimizle sağlıklı ve sürdürülebilir beslenme alışkanlıkları kazanın.',
    keywords: buildBrandKeywords('online diyetisyen, beslenme danışmanı, diyet programı'),
  },
  '/team/doctors': {
    title: 'Doktorlarımız — Sağlık Sürecinizde Yanınızda',
    description:
      'Wellness yolculuğunuzda sağlık sürecinizi destekleyen uzman doktor kadromuz.',
    keywords: buildBrandKeywords('wellness doktor, sağlık danışmanlığı, online sağlık'),
  },
  '/corporate': {
    title: 'Kurumsal Wellness Programları',
    description:
      'Şirketiniz için ölçeklenebilir koçluk, beslenme ve çalışan wellness çözümleri. Yeni Form kurumsal paketleri.',
    keywords: buildBrandKeywords('kurumsal wellness, çalışan sağlığı, şirket fitness programı, kurumsal koçluk'),
  },
  '/corporate/apply': {
    title: 'Kurumsal Başvuru Formu',
    description: 'Kurumsal wellness programı için başvuru formu. Ekibimiz size özel teklif hazırlar.',
    noindex: false,
  },
  '/team/apply': {
    title: 'Kadromuza Katıl — Koç & Diyetisyen Başvurusu',
    description: 'Yeni Form kadrosuna koç veya diyetisyen olarak başvurun. Online wellness platformunda uzman ekibimize katılın.',
    keywords: buildBrandKeywords('koç başvurusu, diyetisyen iş ilanı, online koçluk kariyer'),
  },
  '/kvkk': {
    title: 'KVKK Aydınlatma Metni',
    description: `${BRAND.name} kişisel verilerin korunması ve KVKK aydınlatma metni.`,
    keywords: 'KVKK, kişisel veriler, aydınlatma metni, gizlilik',
  },
  '/legal/kvkk': {
    title: 'KVKK Aydınlatma Metni',
    description: `${BRAND.name} kişisel verilerin korunması ve KVKK aydınlatma metni.`,
    keywords: 'KVKK, kişisel veriler, aydınlatma metni, gizlilik',
  },
  '/privacy': {
    title: 'Gizlilik Politikası',
    description: `${BRAND.name} gizlilik politikası ve çerez kullanımı hakkında bilgi.`,
    keywords: 'gizlilik politikası, çerezler, veri güvenliği',
  },
  '/legal/gizlilik-politikasi': {
    title: 'Gizlilik Politikası',
    description: `${BRAND.name} gizlilik politikası ve çerez kullanımı hakkında bilgi.`,
    keywords: 'gizlilik politikası, çerezler, veri güvenliği',
  },
  '/terms': {
    title: 'Kullanım Koşulları',
    description: `${BRAND.name} platform kullanım koşulları ve üyelik sözleşmesi.`,
    keywords: 'kullanım koşulları, üyelik sözleşmesi, şartlar',
  },
  '/legal/uyelik-ve-abonelik-sozlesmesi': {
    title: 'Üyelik ve Abonelik Sözleşmesi',
    description: `${BRAND.name} üyelik ve abonelik sözleşmesi.`,
    keywords: 'üyelik sözleşmesi, abonelik, kullanım koşulları',
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
    '@id': `${url}#organization`,
    name: BRAND.name,
    alternateName: BRAND_ALIASES,
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
  const url = absoluteUrl('/')
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${url}#website`,
    name: BRAND.name,
    alternateName: BRAND_ALIASES,
    url,
    description: SEO.defaultDescription,
    inLanguage: SEO.language,
    publisher: { '@id': `${url}#organization` },
  }
}

export function buildFaqSchema(faqs = []) {
  const items = (faqs || [])
    .filter((f) => (f?.q || f?.question) && (f?.a || f?.answer))
    .slice(0, 20)
    .map((f) => ({
      '@type': 'Question',
      name: f.q || f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.a || f.answer },
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
    mainEntityOfPage: absoluteUrl(blogPostPath(post)),
  }
}

export function buildPersonSchema(member, { profilePath } = {}) {
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
    description: profile.bio || profile.description,
    image: profile.photo || undefined,
    url: profilePath ? absoluteUrl(profilePath) : undefined,
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

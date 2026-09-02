import { BRAND } from './brand'
import { blogPostPath } from '../utils/blogSlug'
import { publicCertificates, publicStaffTitle } from '../data/staffProfile'
import { BLOG_AUTHOR } from '../data/blogPosts'

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
  const raw = String(path || '/')
  if (/^https?:\/\//i.test(raw)) return raw
  const base = getSiteUrl()
  const normalized = raw.startsWith('/') ? raw : `/${raw}`
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
  'online diyetisyen',
  'online spor koçu',
  'online spor koçluğu',
  'online spor',
  'online fitness koçu',
  'online diyet',
  'online wellness',
  'online zayıflama',
  'fitness koçu',
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
  'dijital sağlık',
]

/** Marka keşfi için statik SSS — admin SSS boş olsa bile JSON-LD ve landing'de görünür */
export const STATIC_BRAND_FAQS = [
  {
    q: 'Yeni Form nedir?',
    a: 'Yeni Form (yeniform.com), Türkiye\'nin online koçluk, online diyetisyen ve wellness platformudur. Kişisel sağlık analizi, video görüşmeler ve beslenme-antrenman programları sunar.',
  },
  {
    q: 'Online diyetisyen hizmeti var mı?',
    a: 'Evet. Eko Diyet, Diyet ve VIP paketlerinde online diyetisyen desteği vardır (pakete göre seans hakkı değişir). Ayrıntılar: yeniform.com/online-diyetisyen',
  },
  {
    q: 'Online koçluk nasıl çalışır?',
    a: 'Eko Spor, Spor ve VIP paketlerinde video koç görüşmesi ve kişiye özel antrenman programı sunulur. Detay: yeniform.com/online-kocluk',
  },
  {
    q: 'Yeni Form sitesine nasıl ulaşırım?',
    a: 'Resmi web adresimiz www.yeniform.com\'dur. Google\'da "Yeni Form", "yeniform" veya "yeni form wellness" yazarak da bize ulaşabilirsiniz.',
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
  defaultTitle: `${BRAND.name} — Online Koçluk ve Online Diyetisyen Platformu`,
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
  return '/hakkimizda'
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

const STAFF_ROLE_SLUG = { coach: 'koc', dietitian: 'diyetisyen' }

/** SEO dostu profil slug — "koç ahmet yeniform" aramaları için rol öneki eklenir */
export function staffPublicSlug(member) {
  const namePart = slugifyTurkish(member?.name)
  if (!namePart) return member?.id || ''
  const rolePrefix = STAFF_ROLE_SLUG[member?.role] || 'uzman'
  if (namePart === rolePrefix || namePart.startsWith(`${rolePrefix}-`)) {
    const specialty = slugifyTurkish(member?.specialty || member?.title || '')
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
  const roleExtras =
    member?.role === 'dietitian'
      ? ['online diyetisyen', 'online diyet']
      : member?.role === 'coach'
        ? ['online koçluk', 'online spor koçu', 'online fitness koçu']
        : []
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
    ...roleExtras,
    ...(member?.specialties || []),
  ].filter(Boolean))
  return mergeKeywords([...keywords])
}

/** Statik public rotalar — sitemap ve varsayılan meta eşlemesi */
export const STATIC_PUBLIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/hakkimizda', changefreq: 'monthly', priority: '0.8' },
  { path: '/online-diyetisyen', changefreq: 'weekly', priority: '0.95' },
  { path: '/online-kocluk', changefreq: 'weekly', priority: '0.95' },
  { path: '/kilo-verme', changefreq: 'weekly', priority: '0.9' },
  { path: '/online-diyetisyen/fiyat', changefreq: 'weekly', priority: '0.9' },
  { path: '/online-kocluk/ev-antrenman', changefreq: 'weekly', priority: '0.85' },
  { path: '/beslenme/sporcu-beslenmesi', changefreq: 'weekly', priority: '0.85' },
  { path: '/beslenme/pcos', changefreq: 'weekly', priority: '0.85' },
  { path: '/beslenme/insulin-direnci', changefreq: 'weekly', priority: '0.85' },
  { path: '/beslenme/hamilelik', changefreq: 'weekly', priority: '0.85' },
  { path: '/kalori-hesaplama', changefreq: 'weekly', priority: '0.9' },
  { path: '/online-wellness', changefreq: 'weekly', priority: '0.9' },
  { path: '/membership', changefreq: 'weekly', priority: '0.9' },
  { path: '/onboarding', changefreq: 'monthly', priority: '0.9' },
  { path: '/stories', changefreq: 'weekly', priority: '0.8' },
  { path: '/blog', changefreq: 'daily', priority: '0.8' },
  { path: '/team/coaches', changefreq: 'monthly', priority: '0.7' },
  { path: '/team/dietitians', changefreq: 'monthly', priority: '0.7' },
  { path: '/corporate', changefreq: 'monthly', priority: '0.7' },
  { path: '/corporate/apply', changefreq: 'monthly', priority: '0.6' },
  { path: '/team/apply', changefreq: 'monthly', priority: '0.6' },
  { path: '/hesap-silme', changefreq: 'yearly', priority: '0.5' },
  ...LEGAL_ROUTE_ENTRIES,
]

export const PAGE_SEO = {
  '/': {
    title: `${BRAND.name} — Online Koçluk ve Online Diyetisyen Platformu`,
    description:
      'Yeni Form ile online koçluk ve online diyetisyen desteği: video görüşme, kişisel sağlık analizi, beslenme ve antrenman programları. Diyet, Spor ve VIP paketleriyle başlayın.',
    keywords: buildBrandKeywords('online koçluk, online diyetisyen, fitness koçu, spor salonu programı, evde antrenman, wellness, beslenme programı'),
  },
  '/hakkimizda': {
    title: 'Hakkımızda — Misyonumuz, Değerlerimiz ve Uzman Kadromuz',
    description:
      'Yeni Form (yeniform.com) kimdir? Online koçluk, diyetisyen ve wellness platformumuzun misyonu, değerleri, uzman kadrosu ve güvenlik yaklaşımı hakkında bilgi edinin.',
    keywords: buildBrandKeywords('hakkımızda, yeni form kimdir, wellness platformu, online koçluk şirketi, misyon, vizyon, güvenilir diyetisyen platformu'),
  },
  '/online-diyetisyen': {
    title: 'Online Diyetisyen — Video Görüşmeli Program',
    description:
      'Online diyetisyen ve online diyet: platform içi video görüşme, kişiye özel beslenme programı ve panel takibi. Diyet veya VIP ile evinizden başlayın.',
    keywords: buildBrandKeywords('online diyetisyen, online diyet, online beslenme danışmanlığı, video görüşmeli diyetisyen, online diyetisyen platformu, online diyet danışmanlığı'),
  },
  '/online-kocluk': {
    title: 'Online Koçluk — Fitness Koçu ile Video Antrenman',
    description:
      'Online koçluk ve online fitness koçu: kişiye özel antrenman programı, video görüşme ve takip. Spor ve VIP paketleriyle evde veya salonda ilerleyin.',
    keywords: buildBrandKeywords('online koçluk, online coaching, online spor koçluğu, online spor koçu, online spor, online fitness koçu, uzaktan antrenman, online antrenman, video koçluk, spor paketi'),
  },
  '/kilo-verme': {
    title: 'Kilo Verme ve Online Zayıflama — Diyetisyen Destekli Program',
    description:
      'Online zayıflama ve kilo verme diyetisyeni: video görüşme, kişiye özel beslenme programı ve takip. Yeni Form ile sürdürülebilir kilo yönetimi ve online diyet.',
    keywords: buildBrandKeywords('kilo verme diyetisyen, online zayıflama, zayıflama programı, kilo vermek için diyetisyen, online kilo verme, online diyet ve zayıflama, kilo verme programı'),
  },
  '/online-diyetisyen/fiyat': {
    title: 'Online Diyetisyen Fiyatları 2026 — 2.700 TL\'den',
    description:
      'Online diyetisyen fiyatları 2026: Eko Diyet 2.700 TL, Diyet 4.050 TL/ay. Video seans, gizli ücret yok. Paket ve seans ücretlerini karşılaştırın.',
    keywords: buildBrandKeywords('online diyetisyen fiyatları, online diyetisyen fiyat, diyetisyen fiyatları, diyetisyen fiyat, diyetisyen paket fiyatları, online diyet ücretleri, online diyetisyen ücretleri, online diyet fiyatları, diyetisyen seans ücretleri'),
  },
  '/online-kocluk/ev-antrenman': {
    title: 'Evde Antrenman Programı — Online Koç ile Ekipmansız',
    description:
      'Evde antrenman programı: ekipmansız veya ev aletleriyle kişiye özel plan, video koçluk ve hareket videoları. Spor ve VIP paketleriyle başlayın.',
    keywords: buildBrandKeywords('evde antrenman programı, ekipmansız antrenman, evde egzersiz, online spor koçu ev'),
  },
  '/beslenme/sporcu-beslenmesi': {
    title: 'Sporcu Beslenmesi — Antrenman Öncesi ve Sonrası',
    description:
      'Sporcu beslenmesi: antrenman öncesi/sonrası öğün, protein ve performans. Online diyetisyen + koçluk ile kişiye özel plan. Yeni Form.',
    keywords: buildBrandKeywords('sporcu beslenmesi, sporcu diyeti, antrenman beslenmesi, sporcu diyetisyen, online sporcu beslenmesi'),
  },
  '/beslenme/pcos': {
    title: 'PCOS Diyeti — Polikistik Over Beslenmesi ve Programı',
    description:
      'PCOS diyeti ve polikistik over beslenmesi: insülin direnci, kilo yönetimi, hormonal denge. Online diyetisyen ile kişiye özel PCOS beslenme programı.',
    keywords: buildBrandKeywords('PCOS diyeti, polikistik over beslenmesi, PCOS beslenme programı, PCOS için diyetisyen, polikistik yumurtalık diyeti, PCOS kilo verme'),
  },
  '/beslenme/insulin-direnci': {
    title: 'İnsülin Direnci Diyeti — Kişiye Özel Beslenme Programı',
    description:
      'İnsülin direnci diyeti ve beslenme programı: glisemik indeks, öğün zamanlaması ve kilo yönetimi. Online diyetisyen ile kişiye özel insülin direnci planı.',
    keywords: buildBrandKeywords('insülin direnci diyeti, insülin direnci beslenmesi, insülin direncinde ne yenir, insülin direnci beslenme programı, insülin direnci kilo verme'),
  },
  '/beslenme/hamilelik': {
    title: 'Hamilelikte Beslenme — Trimester Rehberi ve Diyetisyen',
    description:
      'Hamilelikte beslenme ve gebelikte diyet: trimester ihtiyaçları, güvenli öğün düzeni. Online diyetisyen hekim planınızı tamamlar; tıbbi tedavi yerine geçmez.',
    keywords: buildBrandKeywords('hamilelikte beslenme, gebelikte diyet, hamilelikte beslenme rehberi, gebelikte beslenme, hamile diyetisyen, online hamilelik beslenmesi'),
  },
  '/kalori-hesaplama': {
    title: 'Kalori Hesaplama — BMR ve Günlük İhtiyaç',
    description:
      'Kalori hesaplama: Mifflin–St Jeor ile BMR ve günlük kalori ihtiyacı (TDEE). Ücretsiz; tıbbi tanı değildir. Kişiye özel plan için online diyetisyen.',
    keywords: buildBrandKeywords('kalori hesaplama, günlük kalori ihtiyacı, BMR hesaplama, TDEE, kalori açığı, bazal metabolizma hızı'),
  },
  '/online-wellness': {
    title: 'Online Wellness — Dijital Sağlık ve Yaşam Koçluğu Platformu',
    description:
      'Online wellness platformu: online diyetisyen, online spor koçluğu, sağlık analizi ve kişisel program. Türkiye\'de dijital wellness için Yeni Form.',
    keywords: buildBrandKeywords('online wellness, wellness platformu, dijital wellness, online sağlık koçluğu, online sağlıklı yaşam, wellness Türkiye, online wellness programı'),
  },
  '/membership': {
    title: 'Üyelik Paketleri — Diyet, Spor ve VIP',
    description:
      'Diyet, Spor ve VIP paketlerini karşılaştırın. Video görüşme, kişisel program, şeffaf liste fiyatı. Diyetisyen ücretleri ayrı fiyat sayfasında.',
    keywords: buildBrandKeywords('üyelik paketleri, yeni form üyelik, diyet paketi, spor paketi, vip paket, paket karşılaştırma'),
  },
  '/onboarding': {
    title: 'Kayıt Ol — Paket Seç ve Başla',
    description:
      'Yeni Form\'a birkaç dakikada kayıt olun. Diyet, Spor veya VIP planıyla kişisel wellness yolculuğunuza başlayın.',
    keywords: buildBrandKeywords('kayıt ol, online koçluk kayıt, wellness üyelik, diyet paket kayıt'),
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
    title: 'Online Fitness Koçlarımız — Uzman Kadro',
    description:
      'Online koçluk için sertifikalı fitness koçlarımızla tanışın. Kişisel antrenman programları ve video görüşme desteği.',
    keywords: buildBrandKeywords('online fitness koçu, online koçluk, online spor koçu, antrenör, kişisel antrenman'),
  },
  '/team/dietitians': {
    title: 'Diyetisyen Kadromuz — Lisanslı Beslenme Uzmanları',
    description:
      'Yeni Form diyetisyen kadrosu: lisanslı beslenme uzmanları, video görüşme ve kişiye özel program. Hizmet akışı online diyetisyen sayfasında.',
    keywords: buildBrandKeywords('diyetisyen kadrosu, lisanslı diyetisyen, beslenme uzmanı ekibi, yeni form diyetisyen'),
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
  '/hesap-silme': {
    title: 'Hesabını sil',
    description:
      'Yeni Form hesabınızı ve kişisel verilerinizi silin. Giriş yapıp onayladıktan sonra hesap kapanır; ücretli paketler iadesiz sona erer.',
    keywords: 'hesap silme, hesap kapatma, KVKK silme, account deletion',
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
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * AggregateRating schema — testimonial/review verisi varsa kullan.
 * ratingValue: 1-5 arası ortalama, reviewCount: toplam değerlendirme sayısı.
 */
export function buildAggregateRatingSchema({ ratingValue, reviewCount } = {}) {
  const n = Number(reviewCount)
  const rating = Number(ratingValue)
  if (!Number.isFinite(n) || n < 5 || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return null
  }
  const url = absoluteUrl('/')
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${url}#organization`,
    name: BRAND.name,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(Math.round(rating * 10) / 10),
      bestRating: '5',
      worstRating: '1',
      reviewCount: String(n),
    },
  }
}

export function buildSpeakableWebPageSchema({ name, path, description } = {}) {
  if (!name || !path) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    url: absoluteUrl(path),
    description: description || SEO.defaultDescription,
    inLanguage: SEO.language,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.speakable-intro', '.faq-section'],
    },
  }
}

/**
 * HowTo schema — "Nasıl çalışır?" adım bölümleri için.
 * steps: [{ name, text, url? }]
 */
export function buildHowToSchema({ name, description, steps = [] }) {
  if (!name || !steps.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name || s.title,
      text: s.text,
      url: s.url ? absoluteUrl(s.url) : undefined,
    })),
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
    author: { '@type': 'Organization', name: BLOG_AUTHOR },
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
  const credentials = publicCertificates(profile.certificates)
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
    jobTitle: publicStaffTitle(profile)
      || (profile.role === 'dietitian' ? 'Online Diyetisyen' : 'Online Fitness Koçu'),
    description: profile.bio || profile.description,
    image: profile.photo ? absoluteUrl(profile.photo) : undefined,
    sameAs: [profile.instagram, profile.linkedin, profile.website, profile.youtube]
      .filter((u) => typeof u === 'string' && u.startsWith('http')),
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

/** Hizmet (para) sayfaları — Service + Offer JSON-LD */
export function buildServiceSchema({
  name,
  description,
  path,
  serviceType,
  offers = [],
}) {
  if (!name || !path) return null
  const url = absoluteUrl(path)
  const orgId = `${absoluteUrl('/')}#organization`
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description: description || SEO.defaultDescription,
    url,
    serviceType: serviceType || name,
    provider: { '@id': orgId },
    areaServed: { '@type': 'Country', name: 'Türkiye' },
    inLanguage: SEO.language,
  }
  if (offers.length) {
    schema.offers = offers.map((o) => ({
      '@type': 'Offer',
      name: o.name,
      url: absoluteUrl(o.path || '/membership'),
      priceCurrency: 'TRY',
      availability: 'https://schema.org/InStock',
      description: o.description,
      ...(o.price != null && Number(o.price) > 0 ? { price: String(o.price) } : {}),
    }))
  }
  return schema
}

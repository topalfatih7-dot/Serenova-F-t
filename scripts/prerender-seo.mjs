/**
 * Build sonrası kritik public sayfalar için SEO HTML shell üretir.
 * Googlebot JS çalıştırmadan doğru title/canonical/H1 görür.
 * Vercel static dosyayı rewrite'tan önce servis eder.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')
const site = 'https://www.yeniform.com'

const { SERVICE_PAGES, servicePagePlainHtml } = await import(
  pathToFileURL(join(root, 'src/data/seoServiceContent.js')).href
)

const STATIC_SHELLS = {
  '/': {
    title: 'Yeni Form — Online Koçluk ve Online Diyetisyen Platformu',
    description:
      'Yeni Form ile online koçluk ve online diyetisyen desteği: video görüşme, kişisel sağlık analizi, beslenme ve antrenman programları. Basic (ücretsiz) paketle hemen başlayın.',
    h1: 'Online koçluk ve diyetisyen ile size özel program',
    body: `<p>Online diyetisyen ve online spor koçunuz hedefinize göre programınızı hazırlar, video görüşmelerle yanınızda olur.</p>
<p><a href="/online-diyetisyen">Online diyetisyen</a> · <a href="/online-kocluk">Online koçluk</a> · <a href="/membership">Üyelik paketleri</a></p>`,
  },
  '/membership': {
    title: 'Üyelik Planları — Online Diyetisyen & Online Koçluk Fiyatları | Yeni Form',
    description:
      'Basic (ücretsiz), Eko, Diyet, Spor, Doktor ve VIP paketlerini karşılaştırın. Online diyetisyen ve online koç görüşmeleri, kalori hesaplama ve kişisel programlar.',
    h1: 'Online diyetisyen ve online koçluk paketleri',
    body: `<p>Video görüşmeli diyetisyen ve koç paketlerini karşılaştırın.</p>
<p><a href="/online-diyetisyen">Online diyetisyen</a> · <a href="/online-kocluk">Online koçluk</a></p>`,
  },
  '/hakkimizda': {
    title: 'Hakkımızda — Misyonumuz, Değerlerimiz ve Uzman Kadromuz | Yeni Form',
    description:
      'Yeni Form kimdir? Online koçluk, diyetisyen ve wellness platformumuzun misyonu, değerleri ve uzman kadrosu.',
    h1: 'Hakkımızda',
    body: `<p>Yeni Form, Türkiye’de online koçluk ve online diyetisyen hizmeti sunan wellness platformudur.</p>
<p><a href="/online-diyetisyen">Online diyetisyen</a> · <a href="/online-kocluk">Online koçluk</a></p>`,
  },
  '/team/dietitians': {
    title: 'Online Diyetisyenlerimiz — Uzman Beslenme Kadrosu | Yeni Form',
    description:
      'Online diyetisyen kadromuzla sağlıklı beslenme alışkanlıkları kazanın. Video görüşme ve kişiye özel program.',
    h1: 'Online Diyetisyenlerimiz',
    body: `<p>Online diyetisyen desteğiyle sürdürülebilir beslenme. Süreç ve paketler için hizmet sayfamızı inceleyin.</p>
<p><a href="/online-diyetisyen">Online diyetisyen nasıl çalışır?</a> · <a href="/membership">Üyelik paketleri</a></p>`,
  },
  '/team/coaches': {
    title: 'Online Fitness Koçlarımız — Uzman Kadro | Yeni Form',
    description:
      'Online koçluk için sertifikalı fitness koçlarımız. Kişisel antrenman ve video görüşme.',
    h1: 'Online Fitness Koçlarımız',
    body: `<p>Online koçluk kadromuzla tanışın. Evde veya salonda kişiye özel program.</p>
<p><a href="/online-kocluk">Online koçluk nasıl çalışır?</a> · <a href="/membership">Üyelik paketleri</a></p>`,
  },
  '/blog': {
    title: 'Blog — Sağlık, Beslenme ve Motivasyon | Yeni Form',
    description: 'Beslenme, antrenman, motivasyon ve sağlıklı yaşam üzerine uzman içerikler. Yeni Form blog.',
    h1: 'Yeni Form Blog',
    body: `<p>Online diyetisyen, online koçluk, beslenme ve antrenman yazıları.</p>
<p><a href="/online-diyetisyen">Online diyetisyen</a> · <a href="/online-kocluk">Online koçluk</a></p>`,
  },
}

for (const [path, page] of Object.entries(SERVICE_PAGES)) {
  STATIC_SHELLS[path] = {
    title: `${page.title} | Yeni Form`,
    description: page.description,
    h1: page.h1,
    body: servicePagePlainHtml(page),
  }
}

function escapeAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

function injectMeta(html, { title, description, path }) {
  const canonical = `${site}${path === '/' ? '/' : path}`
  let out = html
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeAttr(title)}</title>`)
  out = out.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeAttr(description)}" />`,
  )
  out = out.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
  )
  out = out.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
  )
  out = out.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${escapeAttr(canonical)}" />`,
  )
  out = out.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
  )
  out = out.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
  )
  out = out.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeAttr(canonical)}" />`,
  )
  return out
}

function injectBody(html, { h1, body }) {
  // Görsel olarak gizle (FOUC yok); botlar ilk HTML'de H1+metni okur. React mount edilince #root değişir.
  const style = '<style id="seo-prerender-style">#seo-static-content{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}</style>'
  const shell = `${style}<div id="root"><noscript><article data-seo-prerender="1"><h1>${escapeAttr(h1)}</h1>${body}</article></noscript><article data-seo-prerender="1" id="seo-static-content"><h1>${escapeAttr(h1)}</h1>${body}</article></div>`
  return html.replace(/<div id="root"><\/div>/i, shell)
}

function destPath(routePath) {
  if (routePath === '/') return join(dist, 'index.html')
  const dir = join(dist, routePath.replace(/^\//, ''))
  return join(dir, 'index.html')
}

if (!existsSync(join(dist, 'index.html'))) {
  console.error('[prerender-seo] dist/index.html yok — önce vite build çalıştırın')
  process.exit(1)
}

const template = readFileSync(join(dist, 'index.html'), 'utf8')
let count = 0

for (const [path, meta] of Object.entries(STATIC_SHELLS)) {
  let html = injectMeta(template, { ...meta, path })
  html = injectBody(html, meta)
  const outFile = destPath(path)
  mkdirSync(dirname(outFile), { recursive: true })
  // Ana index'i de güncelle (path === '/')
  writeFileSync(outFile, html, 'utf8')
  count += 1
  console.log('[prerender-seo]', path, '→', outFile.replace(root, ''))
}

console.log(`[prerender-seo] ${count} sayfa yazıldı`)

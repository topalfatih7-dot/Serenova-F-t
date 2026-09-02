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

function loadEnvFile(file) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (key && process.env[key] == null) process.env[key] = val
  }
}
loadEnvFile(join(root, '.env.local'))
loadEnvFile(join(root, '.env'))

const { SERVICE_PAGES, servicePagePlainHtml } = await import(
  pathToFileURL(join(root, 'src/data/seoServiceContent.js')).href
)
const { KALORI_HESAPLAMA, caloriePagePlainHtml } = await import(
  pathToFileURL(join(root, 'src/data/seoCalorieCalculator.js')).href
)

const STATIC_SHELLS = {
  '/': {
    title: 'Yeni Form — Online Koçluk ve Online Diyetisyen Platformu',
    description:
      'Yeni Form ile online koçluk ve online diyetisyen desteği: video görüşme, kişisel sağlık analizi, beslenme ve antrenman programları. Diyet, Spor veya VIP paketini seçin.',
    h1: 'Online koçluk ve diyetisyen ile size özel program',
    body: `<p>Online diyetisyen ve online spor koçunuz hedefinize göre programınızı hazırlar, video görüşmelerle yanınızda olur.</p>
<p><a href="/online-diyetisyen">Online diyetisyen</a> · <a href="/online-diyetisyen/fiyat">Diyetisyen fiyatları</a> · <a href="/online-kocluk">Online koçluk</a> · <a href="/kilo-verme">Kilo verme</a> · <a href="/kalori-hesaplama">Kalori hesaplama</a> · <a href="/beslenme/hamilelik">Hamilelikte beslenme</a> · <a href="/membership">Üyelik paketleri</a></p>`,
  },
  '/membership': {
    title: 'Üyelik Paketleri — Diyet, Spor ve VIP | Yeni Form',
    description:
      'Diyet, Spor ve VIP paketlerini karşılaştırın. Video görüşme, kişisel program, şeffaf liste fiyatı. Diyetisyen ücretleri ayrı fiyat sayfasında.',
    h1: 'Üyelik paketleri: Diyet, Spor ve VIP',
    body: `<p>Video görüşmeli diyetisyen ve koç paketlerini karşılaştırın. Online diyetisyen fiyat listesi ayrı sayfadadır.</p>
<p><a href="/online-diyetisyen">Online diyetisyen</a> · <a href="/online-diyetisyen/fiyat">Diyetisyen fiyatları 2026</a> · <a href="/online-kocluk">Online koçluk</a> · <a href="/kilo-verme">Kilo verme</a></p>`,
  },
  '/hakkimizda': {
    title: 'Hakkımızda — Misyonumuz, Değerlerimiz ve Uzman Kadromuz | Yeni Form',
    description:
      'Yeni Form kimdir? Online koçluk, diyetisyen ve wellness platformumuzun misyonu, değerleri ve uzman kadrosu.',
    h1: 'Sağlıklı dönüşümü herkes için erişilebilir kılıyoruz',
    body: `<p>Yeni Form, Türkiye’de online koçluk ve online diyetisyen hizmeti sunan wellness platformudur.</p>
<p><a href="/online-diyetisyen">Online diyetisyen</a> · <a href="/online-kocluk">Online koçluk</a></p>`,
  },
  '/team/dietitians': {
    title: 'Diyetisyen Kadromuz — Lisanslı Beslenme Uzmanları | Yeni Form',
    description:
      'Yeni Form diyetisyen kadrosu: lisanslı beslenme uzmanları, video görüşme ve kişiye özel program. Hizmet akışı online diyetisyen sayfasında.',
    h1: 'Diyetisyen kadromuz',
    body: `<p>Lisanslı diyetisyen kadromuzla tanışın. Süreç ve paketler hizmet sayfasında; ücretler fiyat sayfasındadır.</p>
<p><a href="/online-diyetisyen">Online diyetisyen nasıl çalışır?</a> · <a href="/online-diyetisyen/fiyat">Fiyatlar</a> · <a href="/membership">Üyelik paketleri</a></p>`,
  },
  '/team/coaches': {
    title: 'Online Fitness Koçlarımız — Uzman Kadro | Yeni Form',
    description:
      'Online koçluk için sertifikalı fitness koçlarımız. Kişisel antrenman ve video görüşme.',
    h1: 'Online Fitness Koçlarımız',
    body: `<p>Online koçluk kadromuzla tanışın. Evde veya salonda kişiye özel program.</p>
<p><a href="/online-kocluk">Online koçluk nasıl çalışır?</a> · <a href="/membership">Üyelik paketleri</a></p>`,
  },
  '/stories': {
    title: 'Başarı Hikayeleri — Topluluk Dönüşümleri | Yeni Form',
    description: 'Yeni Form topluluğunun dönüşüm hikayeleri. Online diyetisyen ve koçluk ile ilerleyen üyeler.',
    h1: 'Başarı Hikayeleri',
    body: `<p>Gerçek üyelerin wellness yolculukları. Sonuçlar kişiden kişiye değişir.</p>
<p><a href="/online-diyetisyen">Online diyetisyen</a> · <a href="/online-kocluk">Online koçluk</a> · <a href="/membership">Üyelik paketleri</a></p>`,
  },
  '/corporate': {
    title: 'Kurumsal Wellness Programları | Yeni Form',
    description: 'Şirketiniz için ölçeklenebilir koçluk, beslenme ve çalışan wellness çözümleri.',
    h1: 'Sağlıklı ekip',
    body: `<p>Çalışan sağlığı için online koçluk ve online diyetisyen.</p>
<p><a href="/corporate/apply">Kurumsal başvuru</a> · <a href="/membership">Paketler</a></p>`,
  },
  '/blog': {
    title: 'Blog — Sağlık, Beslenme ve Motivasyon | Yeni Form',
    description: 'Beslenme, antrenman, motivasyon ve sağlıklı yaşam üzerine uzman içerikler. Yeni Form blog.',
    h1: 'Sağlık, beslenme ve motivasyon',
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

STATIC_SHELLS[KALORI_HESAPLAMA.path] = {
  title: `${KALORI_HESAPLAMA.title} | Yeni Form`,
  description: KALORI_HESAPLAMA.description,
  h1: KALORI_HESAPLAMA.h1,
  body: caloriePagePlainHtml(),
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

function slugifyTurkish(text) {
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

function staffPublicSlug(member) {
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

async function fetchDynamicShells() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.warn('[prerender-seo] Supabase env yok — blog/kadro shell atlandı')
    return
  }
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(url, key)
    const { data: posts, error: postsErr } = await client
      .from('posts')
      .select('id, data, created_at')
      .eq('published', true)
    if (postsErr) console.error('[prerender-seo] posts', postsErr.message)
    for (const post of posts || []) {
      const title = post.data?.title || 'Blog yazısı'
      const slug = post.data?.slug || slugifyTurkish(title) || post.id
      const excerpt = post.data?.excerpt || ''
      const author = 'Yeni Form Ekibi'
      STATIC_SHELLS[`/blog/${slug}`] = {
        title: `${title} | Yeni Form`,
        description: excerpt.slice(0, 160) || title,
        h1: title,
        body: `<p>${escapeAttr(excerpt)}</p><p>Yazar: ${escapeAttr(author)}</p>
<p><a href="/online-diyetisyen">Online diyetisyen</a> · <a href="/online-kocluk">Online koçluk</a> · <a href="/kilo-verme">Kilo verme</a> · <a href="/membership">Paketler</a></p>`,
      }
    }
    const { data: staff, error: staffErr } = await client
      .from('staff')
      .select('id, name, role, data')
      .eq('active', true)
    if (staffErr) console.error('[prerender-seo] staff', staffErr.message)
    for (const member of staff || []) {
      if (member.role !== 'coach' && member.role !== 'dietitian') continue
      const specialty = member.data?.specialty || member.data?.title || ''
      const slug = staffPublicSlug({ ...member, specialty, title: specialty })
      const roleLabel = member.role === 'dietitian' ? 'Online Diyetisyen' : member.role === 'coach' ? 'Online Fitness Koçu' : 'Uzman'
      const bio = (member.data?.bio || member.data?.description || '').slice(0, 400)
      STATIC_SHELLS[`/team/${slug}`] = {
        title: `${member.name} — ${roleLabel} | Yeni Form`,
        description: bio || `${member.name}, Yeni Form ${roleLabel.toLowerCase()} kadrosu.`,
        h1: `${roleLabel} ${member.name}`,
        body: `<p>${escapeAttr(bio)}</p><p><a href="/online-diyetisyen">Online diyetisyen</a> · <a href="/online-kocluk">Online koçluk</a></p>`,
      }
    }
  } catch (err) {
    console.error('[prerender-seo] dynamic', err?.message || err)
  }
}

await fetchDynamicShells()

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
  writeFileSync(outFile, html, 'utf8')
  count += 1
  console.log('[prerender-seo]', path, '→', outFile.replace(root, ''))
}

console.log(`[prerender-seo] ${count} sayfa yazıldı`)

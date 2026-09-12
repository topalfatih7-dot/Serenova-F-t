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
const { blogContentToSeoHtml } = await import(
  pathToFileURL(join(root, 'src/utils/blogContent.js')).href
)
const { slugifyTurkish, staffPublicSlug, isUuidParam } = await import(
  pathToFileURL(join(root, 'src/utils/publicSlugs.js')).href
)
const { formatStaffDisplayName } = await import(
  pathToFileURL(join(root, 'src/data/staffProfile.js')).href
)
const { BLOG_AUTHOR } = await import(
  pathToFileURL(join(root, 'src/data/blogPosts.js')).href
)
const { blogServiceCta } = await import(
  pathToFileURL(join(root, 'src/utils/blogServiceCta.js')).href
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
    h1: 'Online Diyetisyenlerimiz',
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

function injectMeta(html, { title, description, path, canonicalPath, robots, jsonLd }) {
  const canonical = `${site}${canonicalPath || (path === '/' ? '/' : path)}`
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
  if (robots) {
    if (/<meta name="robots"/i.test(out)) {
      out = out.replace(
        /<meta name="robots" content="[^"]*"\s*\/?>/i,
        `<meta name="robots" content="${escapeAttr(robots)}" />`,
      )
    } else {
      out = out.replace(
        /<link rel="canonical"[^>]*>/i,
        (m) => `${m}\n    <meta name="robots" content="${escapeAttr(robots)}" />`,
      )
    }
  }
  const nodes = (Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []).filter(Boolean)
  if (nodes.length) {
    const scripts = nodes
      .map((node) => `<script type="application/ld+json">${JSON.stringify(node)}</script>`)
      .join('\n    ')
    out = out.replace(/<\/head>/i, `    ${scripts}\n  </head>`)
  }
  return out
}

function stripPrerender(html) {
  let out = String(html || '')
  out = out.replace(/<style id="seo-prerender-style">[\s\S]*?<\/style>/i, '')
  out = out.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, '')
  if (/id="seo-static-content"/.test(out)) {
    out = out.replace(
      /<div id="root">[\s\S]*id="seo-static-content"[\s\S]*?<\/article>\s*<\/div>/i,
      '<div id="root"></div>',
    )
  }
  return out
}

function injectBody(html, { h1, body }) {
  // Görsel olarak gizle (FOUC yok); botlar ilk HTML'de H1+metni okur. React mount edilince #root değişir.
  const style = '<style id="seo-prerender-style">#seo-static-content{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}</style>'
  const shell = `${style}<div id="root"><noscript><article data-seo-prerender="1"><h1>${escapeAttr(h1)}</h1>${body}</article></noscript><article data-seo-prerender="1" id="seo-static-content"><h1>${escapeAttr(h1)}</h1>${body}</article></div>`
  if (!/<div id="root">\s*<\/div>/i.test(html)) {
    throw new Error('[prerender-seo] boş #root bulunamadı — şablon prerender kalıntısı içeriyor olabilir')
  }
  return html.replace(/<div id="root">\s*<\/div>/i, shell)
}

function destPath(routePath) {
  if (routePath === '/') return join(dist, 'index.html')
  const dir = join(dist, routePath.replace(/^\//, ''))
  return join(dir, 'index.html')
}

function pillarLinks() {
  return `<p><a href="/online-diyetisyen">Online diyetisyen</a> · <a href="/online-kocluk">Online koçluk</a> · <a href="/kilo-verme">Kilo verme</a> · <a href="/membership">Paketler</a></p>`
}

function articleJsonLd({ title, description, slug, datePublished, dateModified }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    author: { '@type': 'Organization', name: BLOG_AUTHOR || 'Yeni Form Ekibi' },
    datePublished: datePublished || undefined,
    dateModified: dateModified || datePublished || undefined,
    inLanguage: 'tr',
    publisher: {
      '@type': 'Organization',
      name: 'Yeni Form',
      logo: { '@type': 'ImageObject', url: `${site}/brand-logo.png` },
    },
    mainEntityOfPage: `${site}/blog/${slug}`,
  }
}

function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${site}${item.path}`,
    })),
  }
}

function itemListJsonLd(name, path, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: `${site}${path}`,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      url: `${site}${item.href}`,
    })),
  }
}

function ctaHtml(post) {
  const cta = blogServiceCta(post)
  return `<p>${escapeAttr(cta.text)} <a href="${cta.primary.to}">${escapeAttr(cta.primary.label)}</a> · <a href="${cta.secondary.to}">${escapeAttr(cta.secondary.label)}</a></p>`
}

function personJsonLd({ name, roleLabel, bio, slug, image }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: roleLabel,
    description: bio || undefined,
    image: image || undefined,
    url: `${site}/team/${slug}`,
    worksFor: { '@type': 'Organization', name: 'Yeni Form' },
  }
}

async function fetchDynamicShells() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.warn('[prerender-seo] Supabase env yok — blog/kadro shell atlandı')
    return { posts: [], staff: [] }
  }
  const collected = { posts: [], staff: [] }
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(url, key)
    const { data: posts, error: postsErr } = await client
      .from('posts')
      .select('id, data, created_at')
      .eq('published', true)
    if (postsErr) console.error('[prerender-seo] posts', postsErr.message)
    const published = [...(posts || [])].sort((a, b) =>
      String(b.data?.updatedAt || b.created_at || '').localeCompare(String(a.data?.updatedAt || a.created_at || '')),
    )
    collected.posts = published
    const seenBlog = new Set()
    for (const post of published) {
      const title = post.data?.title || 'Blog yazısı'
      const slug = post.data?.slug || slugifyTurkish(title) || post.id
      if (seenBlog.has(slug)) continue
      seenBlog.add(slug)
      const excerpt = post.data?.excerpt || ''
      const description = (excerpt || title).slice(0, 160)
      const articleHtml = blogContentToSeoHtml(post.data?.content || '')
      const canonicalPath = `/blog/${slug}`
      const jsonLd = [
        articleJsonLd({
          title,
          description,
          slug,
          datePublished: post.data?.createdAt || post.created_at,
          dateModified: post.data?.updatedAt || post.created_at,
        }),
        breadcrumbJsonLd([
          { name: 'Ana Sayfa', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: title, path: canonicalPath },
        ]),
      ]
      STATIC_SHELLS[canonicalPath] = {
        title: `${title} | Yeni Form`,
        description,
        h1: title,
        jsonLd,
        body: `${articleHtml || `<p>${escapeAttr(excerpt)}</p>`}${ctaHtml({
          title,
          slug,
          category: post.data?.category,
        })}<p>Yazar: ${escapeAttr(BLOG_AUTHOR)}</p>${pillarLinks()}`,
      }
      if (post.id && post.id !== slug && isUuidParam(post.id)) {
        STATIC_SHELLS[`/blog/${post.id}`] = {
          title: `${title} | Yeni Form`,
          description,
          h1: title,
          canonicalPath,
          robots: 'noindex, follow',
          body: `<p>Bu yazının kalıcı adresi: <a href="${canonicalPath}">${escapeAttr(title)}</a>.</p>${pillarLinks()}`,
        }
      }
    }

    const { data: staff, error: staffErr } = await client
      .from('staff')
      .select('id, name, role, data')
      .eq('active', true)
    if (staffErr) console.error('[prerender-seo] staff', staffErr.message)
    const coaches = []
    const dietitians = []
    const seenStaff = new Set()
    for (const member of staff || []) {
      if (member.role !== 'coach' && member.role !== 'dietitian') continue
      if (member.data?.listedOnTeam === false) continue
      const slug = staffPublicSlug(member)
      if (!slug || seenStaff.has(slug)) continue
      seenStaff.add(slug)
      const displayName = formatStaffDisplayName(member.name)
      const roleLabel = member.role === 'dietitian' ? 'Online Diyetisyen' : 'Online Fitness Koçu'
      const bio = String(member.data?.bio || member.data?.description || '').trim()
      const specialties = []
        .concat(member.data?.specialties || [])
        .concat(member.data?.specialty ? [member.data.specialty] : [])
        .map((s) => String(s || '').trim())
        .filter(Boolean)
      const uniqueSpecs = [...new Set(specialties)].slice(0, 8)
      const specHtml = uniqueSpecs.length
        ? `<p>Uzmanlık: ${uniqueSpecs.map((s) => escapeAttr(s)).join(', ')}</p>`
        : ''
      const photo = member.data?.photo
      const image = typeof photo === 'string' && photo.startsWith('http') ? photo : undefined
      const canonicalPath = `/team/${slug}`
      const description = (bio || `${displayName}, Yeni Form ${roleLabel.toLowerCase()} kadrosu.`).slice(0, 160)
      STATIC_SHELLS[canonicalPath] = {
        title: `${displayName} — ${roleLabel} | Yeni Form`,
        description,
        h1: `${roleLabel} ${displayName}`,
        jsonLd: [
          personJsonLd({ name: displayName, roleLabel, bio: bio.slice(0, 400), slug, image }),
          breadcrumbJsonLd([
            { name: 'Ana Sayfa', path: '/' },
            { name: roleLabel, path: member.role === 'dietitian' ? '/team/dietitians' : '/team/coaches' },
            { name: displayName, path: canonicalPath },
          ]),
        ],
        body: `<p>${escapeAttr(bio.slice(0, 800))}</p>${specHtml}${pillarLinks()}`,
      }
      if (member.id && member.id !== slug && isUuidParam(member.id)) {
        STATIC_SHELLS[`/team/${member.id}`] = {
          title: `${displayName} — ${roleLabel} | Yeni Form`,
          description,
          h1: `${roleLabel} ${displayName}`,
          canonicalPath,
          robots: 'noindex, follow',
          body: `<p>Profilin kalıcı adresi: <a href="${canonicalPath}">${escapeAttr(displayName)}</a>.</p>${pillarLinks()}`,
        }
      }
      const link = { href: canonicalPath, label: displayName }
      if (member.role === 'coach') coaches.push(link)
      else dietitians.push(link)
    }
    collected.staff = { coaches, dietitians }

    if (published.length && STATIC_SHELLS['/blog']) {
      const latest = []
      const listed = new Set()
      for (const post of published) {
        const title = post.data?.title || 'Blog yazısı'
        const slug = post.data?.slug || slugifyTurkish(title) || post.id
        if (!slug || listed.has(slug)) continue
        listed.add(slug)
        latest.push({ href: `/blog/${slug}`, label: title })
        if (latest.length >= 24) break
      }
      STATIC_SHELLS['/blog'] = {
        ...STATIC_SHELLS['/blog'],
        jsonLd: itemListJsonLd('Yeni Form Blog', '/blog', latest),
        body: `${STATIC_SHELLS['/blog'].body}<ul>${latest.map((m) => `<li><a href="${m.href}">${escapeAttr(m.label)}</a></li>`).join('')}</ul>`,
      }
    }
    if (dietitians.length && STATIC_SHELLS['/team/dietitians']) {
      STATIC_SHELLS['/team/dietitians'] = {
        ...STATIC_SHELLS['/team/dietitians'],
        jsonLd: itemListJsonLd('Online Diyetisyenlerimiz', '/team/dietitians', dietitians),
        body: `${STATIC_SHELLS['/team/dietitians'].body}<ul>${dietitians.map((m) => `<li><a href="${m.href}">${escapeAttr(m.label)}</a></li>`).join('')}</ul>`,
      }
    }
    if (coaches.length && STATIC_SHELLS['/team/coaches']) {
      STATIC_SHELLS['/team/coaches'] = {
        ...STATIC_SHELLS['/team/coaches'],
        jsonLd: itemListJsonLd('Online Fitness Koçlarımız', '/team/coaches', coaches),
        body: `${STATIC_SHELLS['/team/coaches'].body}<ul>${coaches.map((m) => `<li><a href="${m.href}">${escapeAttr(m.label)}</a></li>`).join('')}</ul>`,
      }
    }
  } catch (err) {
    console.error('[prerender-seo] dynamic', err?.message || err)
  }
  return collected
}

function writeLlmsTxt(collected) {
  const src = join(root, 'public', 'llms.txt')
  if (!existsSync(src)) return
  let text = readFileSync(src, 'utf8').trimEnd()
  const dietitians = collected?.staff?.dietitians || []
  const coaches = collected?.staff?.coaches || []
  const posts = collected?.posts || []
  if (dietitians.length || coaches.length) {
    text += '\n\n## Kadro\n'
    for (const m of [...dietitians, ...coaches]) {
      text += `\n- ${m.label}: ${site}${m.href}`
    }
  }
  if (posts.length) {
    text += '\n\n## Blog\n'
    for (const post of posts.slice(0, 20)) {
      const title = post.data?.title || 'Yazı'
      const slug = post.data?.slug || slugifyTurkish(title) || post.id
      text += `\n- ${title}: ${site}/blog/${slug}`
    }
  }
  text += '\n'
  writeFileSync(join(dist, 'llms.txt'), text, 'utf8')
  console.log('[prerender-seo] llms.txt kadro+blog satırları yazıldı')
}

const collected = await fetchDynamicShells()

if (!existsSync(join(dist, 'index.html'))) {
  console.error('[prerender-seo] dist/index.html yok — önce vite build çalıştırın')
  process.exit(1)
}

const template = stripPrerender(readFileSync(join(dist, 'index.html'), 'utf8'))
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

writeLlmsTxt(collected)
console.log(`[prerender-seo] ${count} sayfa yazıldı`)

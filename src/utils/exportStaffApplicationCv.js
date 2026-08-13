import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { BRAND } from '../config/brand'
import { staffRoleLabel } from '../utils/staffRoles'
import { educationLevelLabel, formatEducationEntry, getOfficialCoachingCertLabels } from '../data/staffApplication'
import { formatAvailabilitySummary } from '../services/availability'
import { supabase } from '../services/supabaseClient'

const GENDER_LABELS = { female: 'Kadın', male: 'Erkek' }
const MAX_PDF_PAGES = 4
const STAFF_DOCS_BUCKET = 'staff-application-docs'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function tagList(items) {
  const list = (items || []).filter(Boolean)
  if (!list.length) return '<p class="muted">—</p>'
  return `<div class="tags">${list.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join('')}</div>`
}

function section(title, body) {
  if (!body) return ''
  return `
    <section class="cv-section">
      <h2>${escapeHtml(title)}</h2>
      ${body}
    </section>
  `
}

function row(label, value) {
  if (!value) return ''
  return `<p class="row"><span class="label">${escapeHtml(label)}:</span> ${escapeHtml(value)}</p>`
}

function listItems(items, formatter = (x) => x) {
  const list = (items || []).filter(Boolean)
  if (!list.length) return ''
  return `<ul>${list.map((item) => `<li>${escapeHtml(formatter(item))}</li>`).join('')}</ul>`
}

/** Başvurudaki tüm ek belge URL'lerini topla (koç + diyetisyen). */
export function collectApplicationDocuments(d = {}) {
  const docs = []
  const push = (name, url, kind = 'document') => {
    if (!url || typeof url !== 'string') return
    if (docs.some((x) => x.url === url)) return
    docs.push({ name: name || 'Belge', url, kind })
  }

  if (d.graduationDocFile?.url) {
    push(d.graduationDocFile.name || 'e-Devlet mezuniyet belgesi', d.graduationDocFile.url, 'graduation')
  }
  if (d.educationFile?.url) {
    push(d.educationFile.name || 'Eğitim belgesi', d.educationFile.url, 'education')
  }
  for (const f of d.certificateFiles || []) {
    push(f.name || 'Sertifika belgesi', f.url, f.kind || 'certificate')
  }
  for (const [name, url] of Object.entries(d.certDocuments || {})) {
    push(name, typeof url === 'string' ? url : url?.url, 'certificate')
  }
  for (const e of d.education || []) {
    if (e?.file?.url) {
      push(e.file.name || `Eğitim — ${e.degree || e.school || 'belge'}`, e.file.url, 'education')
    }
  }
  for (const c of d.certificates || []) {
    if (c?.file?.url) {
      push(c.file.name || `Sertifika — ${c.name || 'belge'}`, c.file.url, 'certificate')
    }
  }
  return docs
}

function pathLooksLike(url, exts) {
  const path = String(url || '').toLowerCase().split('?')[0]
  return exts.some((ext) => path.endsWith(ext))
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Dosya okunamadı'))
    reader.readAsDataURL(blob)
  })
}

function storagePathFromPublicUrl(url) {
  const marker = `/object/public/${STAFF_DOCS_BUCKET}/`
  const idx = String(url || '').indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(String(url).slice(idx + marker.length).split('?')[0])
}

async function fetchDocBlob(url) {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (res.ok) return await res.blob()
  } catch {
    /* public fetch başarısız — admin storage download dene */
  }
  const path = storagePathFromPublicUrl(url)
  if (!path || !supabase) return null
  const { data, error } = await supabase.storage.from(STAFF_DOCS_BUCKET).download(path)
  if (error || !data) return null
  return data
}

async function pdfBlobToPageDataUrls(blob, maxPages = MAX_PDF_PAGES) {
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const data = new Uint8Array(await blob.arrayBuffer())
  const pdf = await pdfjs.getDocument({ data }).promise
  const pageCount = Math.min(pdf.numPages, maxPages)
  const pages = []
  for (let i = 1; i <= pageCount; i += 1) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.6 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise
    pages.push(canvas.toDataURL('image/jpeg', 0.88))
  }
  return { pages, totalPages: pdf.numPages }
}

async function urlToDataUrl(url) {
  try {
    const blob = await fetchDocBlob(url)
    if (!blob) return null
    return await blobToDataUrl(blob)
  } catch {
    return null
  }
}

/**
 * Belgeleri PDF'e gömülebilecek görsel sayfalara çevir.
 * @returns {Promise<Array<{ name: string, url: string, pages: string[], note?: string }>>}
 */
export async function resolveDocumentPreviews(docs) {
  const resolved = []
  for (const doc of docs) {
    try {
      const blob = await fetchDocBlob(doc.url)
      if (!blob) {
        resolved.push({
          ...doc,
          pages: [],
          note: 'Belge indirilemedi (erişim veya ağ). Orijinal bağlantı aşağıda.',
        })
        continue
      }
      const ct = (blob.type || '').toLowerCase()
      const asImage = pathLooksLike(doc.url, ['.jpg', '.jpeg', '.png', '.webp', '.gif']) || ct.startsWith('image/')
      const asPdf = pathLooksLike(doc.url, ['.pdf']) || ct.includes('pdf')

      if (asImage) {
        resolved.push({ ...doc, pages: [await blobToDataUrl(blob)] })
        continue
      }
      if (asPdf) {
        const { pages, totalPages } = await pdfBlobToPageDataUrls(blob)
        resolved.push({
          ...doc,
          pages,
          note: totalPages > pages.length
            ? `PDF’nin ilk ${pages.length} sayfası gösteriliyor (toplam ${totalPages}).`
            : undefined,
        })
        continue
      }
      const dataUrl = await blobToDataUrl(blob)
      if (dataUrl.startsWith('data:image')) {
        resolved.push({ ...doc, pages: [dataUrl] })
      } else {
        resolved.push({
          ...doc,
          pages: [],
          note: 'Bu dosya türü PDF içinde önizlenemedi. Orijinal bağlantı aşağıda.',
        })
      }
    } catch {
      resolved.push({
        ...doc,
        pages: [],
        note: 'Belge önizlemesi oluşturulamadı. Orijinal bağlantı aşağıda.',
      })
    }
  }
  return resolved
}

function buildDocumentsSection(docPreviews) {
  if (!docPreviews?.length) return ''
  const blocks = docPreviews.map((doc, i) => {
    const pagesHtml = (doc.pages || []).map((src, pi) => (
      `<figure class="doc-page">
        <img src="${src}" alt="${escapeHtml(doc.name)} — sayfa ${pi + 1}" />
        ${(doc.pages.length > 1) ? `<figcaption>Sayfa ${pi + 1}</figcaption>` : ''}
      </figure>`
    )).join('')
    return `
      <article class="doc-block">
        <p class="doc-title">${i + 1}. ${escapeHtml(doc.name)}</p>
        ${doc.note ? `<p class="note">${escapeHtml(doc.note)}</p>` : ''}
        ${pagesHtml || `<p class="muted">Önizleme yok</p>`}
        <p class="doc-link">${escapeHtml(doc.url)}</p>
      </article>
    `
  }).join('')
  return section('Ek Belgeler (görsel önizleme)', blocks)
}

function educationListHtml(d) {
  const fromList = (d.education || []).filter((e) => e.school || e.level || e.degree)
  if (fromList.length) {
    return listItems(fromList, (e) => formatEducationEntry(e))
  }
  // Eski başvuru fallback
  const eduLevel = educationLevelLabel(d.educationLevel) || d.educationLevel
  const eduLine = [eduLevel, d.educationDepartment, d.educationGpa ? `GPA ${d.educationGpa}` : ''].filter(Boolean).join(' · ')
  return eduLine ? `<p>${escapeHtml(eduLine)}</p>` : ''
}

function buildCoachSections(d) {
  const hours = formatAvailabilitySummary(d.availability)
  return [
    d.bio ? section('Hakkında', `<p class="bio">${escapeHtml(d.bio).replace(/\n/g, '<br/>')}</p>`) : '',
    hours ? section('Çalışma Saatleri', `<p>${escapeHtml(hours)}</p>`) : '',
    section('Uzmanlık', `
      ${tagList(d.specialties)}
      ${d.specialtyOther ? `<p class="note">Diğer: ${escapeHtml(d.specialtyOther)}</p>` : ''}
      ${row('Deneyim', d.experienceYears != null ? `${d.experienceYears} yıl` : '')}
    `),
    section('Yetkin Olduğu Danışan Grupları', `
      ${tagList(d.competentGroups)}
      ${d.competentGroupOther ? `<p class="note">Diğer: ${escapeHtml(d.competentGroupOther)}</p>` : ''}
      ${d.chronicDiseaseExamples ? `<p class="note">Kronik hastalık örnekleri: ${escapeHtml(d.chronicDiseaseExamples)}</p>` : ''}
    `),
    section('Eğitim', educationListHtml(d)),
    section('GSB Federasyon Antrenörlük', tagList(getOfficialCoachingCertLabels(d))),
    section('Uluslararası Sertifikalar', `
      ${tagList(d.internationalCerts)}
      ${d.certOtherNotes?.international ? `<p class="note">Diğer: ${escapeHtml(d.certOtherNotes.international)}</p>` : ''}
    `),
    section('Branş Sertifikaları', `
      ${tagList(d.branchCerts)}
      ${d.certOtherNotes?.branch ? `<p class="note">Diğer: ${escapeHtml(d.certOtherNotes.branch)}</p>` : ''}
    `),
    section('Çalışma Yaklaşımları', `
      ${tagList(d.workApproaches)}
      ${d.workApproachOther ? `<p class="note">Diğer: ${escapeHtml(d.workApproachOther)}</p>` : ''}
    `),
    section('Hizmet Alanları', `
      ${tagList(d.serviceAreas)}
      ${d.serviceAreaOther ? `<p class="note">Diğer: ${escapeHtml(d.serviceAreaOther)}</p>` : ''}
    `),
  ].join('')
}

function buildDietitianSections(d) {
  const hours = formatAvailabilitySummary(d.availability)
  return [
    d.bio ? section('Hakkında', `<p class="bio">${escapeHtml(d.bio).replace(/\n/g, '<br/>')}</p>`) : '',
    hours ? section('Çalışma Saatleri', `<p>${escapeHtml(hours)}</p>`) : '',
    section('Mezuniyet & Lisans', `
      ${row('Bölüm', d.graduationDepartment)}
    `),
    section('Eğitim', educationListHtml(d)),
    section('Sertifikalar', listItems(
      (d.certificates || []).filter((c) => c.name),
      (c) => [c.name, c.issuer, c.year].filter(Boolean).join(' · '),
    )),
  ].join('')
}

/**
 * @param {object} app
 * @param {{ photoDataUrl?: string|null, docPreviews?: Array }} [assets]
 */
export function buildStaffApplicationCvHtml(app, assets = {}) {
  const d = app.data || {}
  const roleLabel = staffRoleLabel(app.role)
  const isCoach = app.role === 'coach'
  const location = [d.city, d.district].filter(Boolean).join(' / ')
  const gym = isCoach && d.hasGym ? [d.gymName, d.gymCity, d.gymDistrict].filter(Boolean).join(' · ') : ''
  const hasDietitianWorkplace = !isCoach && (d.hasOffice || d.hasGym)
  const officeLine = hasDietitianWorkplace
    ? (d.hasOffice
      ? [d.officeName, d.officeCity, d.officeDistrict].filter(Boolean).join(' · ')
      : [d.gymName, d.gymCity, d.gymDistrict].filter(Boolean).join(' · '))
    : ''
  const officeAddress = d.hasOffice ? (d.officeAddress || '').trim() : ''
  const officeHtml = officeLine
    ? `<p>${escapeHtml(officeLine)}</p>${officeAddress ? `<p>${escapeHtml(officeAddress)}</p>` : ''}`
    : ''
  const appliedAt = app.createdAt
    ? format(new Date(app.createdAt), 'd MMMM yyyy', { locale: tr })
    : '—'
  const statusLabels = { pending: 'Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi' }

  const socialRows = [
    d.linkedin && row('LinkedIn', d.linkedin),
    d.instagram && row('Instagram', d.instagram),
    d.youtube && row('YouTube', d.youtube),
    d.website && row('Web', d.website),
  ].filter(Boolean).join('')

  const photoSrc = assets.photoDataUrl || d.photo
  const photoHtml = photoSrc
    ? `<img src="${photoSrc.startsWith('data:') ? photoSrc : escapeHtml(photoSrc)}" alt="" class="photo" crossorigin="anonymous" />`
    : `<div class="photo photo-placeholder">${escapeHtml((app.name || '?').charAt(0))}</div>`

  const bodySections = isCoach ? buildCoachSections(d) : buildDietitianSections(d)
  const docsSection = buildDocumentsSection(assets.docPreviews || [])

  return `
    <div id="staff-cv-root" class="cv-root">
      <style>
        .cv-root { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; color: #1a2332; padding: 28px; max-width: 800px; font-size: 13px; line-height: 1.5; }
        .cv-header { display: flex; gap: 20px; align-items: flex-start; border-bottom: 3px solid #2478a8; padding-bottom: 18px; margin-bottom: 20px; page-break-inside: avoid; }
        .photo { width: 96px; height: 96px; border-radius: 14px; object-fit: cover; border: 3px solid #e8f4fa; flex-shrink: 0; }
        .photo-placeholder { display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #2478a8, #3d9a6e); color: white; font-size: 36px; font-weight: 700; }
        .brand { margin: 0 0 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #2478a8; }
        h1 { margin: 0 0 4px; font-size: 24px; line-height: 1.2; }
        .role { margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #3d9a6e; }
        .meta { margin: 0; font-size: 12px; color: #4b5563; }
        .cv-section { margin-bottom: 18px; }
        .cv-section h2 { margin: 0 0 8px; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #2478a8; border-bottom: 1px solid #e4eaef; padding-bottom: 4px; }
        .row { margin: 4px 0; }
        .label { font-weight: 600; color: #374151; }
        .tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .tag { display: inline-block; padding: 3px 10px; border-radius: 999px; background: #f0f7fb; border: 1px solid #cfe8f5; font-size: 11px; font-weight: 500; }
        .note { margin: 6px 0 0; font-size: 11px; color: #6b7280; }
        .bio { margin: 0; white-space: pre-wrap; }
        ul { margin: 6px 0 0; padding-left: 18px; }
        li { margin-bottom: 4px; }
        .muted { color: #9ca3af; margin: 0; }
        .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e4eaef; font-size: 10px; color: #9ca3af; }
        .doc-block { margin: 0 0 20px; padding: 12px; border: 1px solid #e4eaef; border-radius: 12px; page-break-inside: avoid; background: #fafbfc; }
        .doc-title { margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #1a2332; }
        .doc-page { margin: 0 0 12px; page-break-inside: avoid; }
        .doc-page img { display: block; width: 100%; max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #dbe4ea; background: #fff; }
        .doc-page figcaption { margin-top: 4px; font-size: 10px; color: #6b7280; }
        .doc-link { margin: 8px 0 0; font-size: 9px; word-break: break-all; color: #9ca3af; }
      </style>

      <header class="cv-header">
        ${photoHtml}
        <div>
          <p class="brand">${escapeHtml(BRAND.name)} · Kadro Başvurusu</p>
          <h1>${escapeHtml(app.name)}</h1>
          <p class="role">${escapeHtml(roleLabel)}${d.title ? ` · ${escapeHtml(d.title)}` : ''}</p>
          <p class="meta">${escapeHtml(app.email)} · ${escapeHtml(app.phone || d.phone || '—')}</p>
          ${location ? `<p class="meta">${escapeHtml(location)}</p>` : ''}
          ${d.gender ? `<p class="meta">Cinsiyet: ${escapeHtml(GENDER_LABELS[d.gender] || d.gender)}</p>` : ''}
        </div>
      </header>

      ${gym ? section('Çalıştığı Salon', `<p>${escapeHtml(gym)}</p>`) : ''}
      ${officeHtml ? section('Çalıştığı Ofis', officeHtml) : ''}
      ${socialRows ? section('Sosyal Medya', socialRows) : ''}
      ${(d.languages || []).length ? section('Diller', tagList(d.languages)) : ''}
      ${bodySections}
      ${docsSection}

      <p class="footer">
        Başvuru tarihi: ${escapeHtml(appliedAt)} · Durum: ${escapeHtml(statusLabels[app.status] || app.status || '—')}
        · Bu belge ${escapeHtml(BRAND.name)} admin panelinden oluşturulmuştur.
      </p>
    </div>
  `
}

function slugifyName(name) {
  return String(name || 'basvuru')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'basvuru'
}

export async function downloadStaffApplicationCvPdf(app) {
  const d = app.data || {}
  const docs = collectApplicationDocuments(d)
  const [photoDataUrl, docPreviews] = await Promise.all([
    d.photo && !String(d.photo).startsWith('data:') ? urlToDataUrl(d.photo) : Promise.resolve(d.photo || null),
    resolveDocumentPreviews(docs),
  ])

  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.width = '800px'
  container.innerHTML = buildStaffApplicationCvHtml(app, {
    photoDataUrl: photoDataUrl || null,
    docPreviews,
  })
  document.body.appendChild(container)

  const element = container.querySelector('#staff-cv-root')
  const datePart = app.createdAt
    ? format(new Date(app.createdAt), 'yyyy-MM-dd')
    : format(new Date(), 'yyyy-MM-dd')
  const filename = `cv-${slugifyName(app.name)}-${datePart}.pdf`

  try {
    const imgs = [...element.querySelectorAll('img')]
    await Promise.all(imgs.map((img) => (
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
          img.onload = resolve
          img.onerror = resolve
        })
    )))

    const { default: html2pdf } = await import('html2pdf.js')
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.92 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(element)
      .save()
  } finally {
    document.body.removeChild(container)
  }

  return filename
}

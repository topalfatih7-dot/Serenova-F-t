import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { BRAND } from '../config/brand'
import { staffRoleLabel } from '../utils/staffRoles'
import { EDUCATION_LEVELS, getOfficialCoachingCertLabels } from '../data/staffApplication'

const GENDER_LABELS = { female: 'Kadın', male: 'Erkek' }

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

function buildCoachSections(d) {
  const eduLevel = EDUCATION_LEVELS.find((l) => l.value === d.educationLevel)?.label || d.educationLevel
  const eduLine = [eduLevel, d.educationDepartment, d.educationGpa ? `GPA ${d.educationGpa}` : ''].filter(Boolean).join(' · ')

  const certLinks = [
    ...(d.certificateFiles || []).map((f) => f.name || f.url),
    ...Object.keys(d.certDocuments || {}),
  ]

  return [
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
    section('Eğitim', eduLine ? `<p>${escapeHtml(eduLine)}</p>` : ''),
    section('GSB Federasyon Antrenörlük', tagList(getOfficialCoachingCertLabels(d))),
    section('Uluslararası Sertifikalar', `
      ${tagList(d.internationalCerts)}
      ${d.certOtherNotes?.international ? `<p class="note">Diğer: ${escapeHtml(d.certOtherNotes.international)}</p>` : ''}
    `),
    section('Branş Sertifikaları', `
      ${tagList(d.branchCerts)}
      ${d.certOtherNotes?.branch ? `<p class="note">Diğer: ${escapeHtml(d.certOtherNotes.branch)}</p>` : ''}
    `),
    certLinks.length ? section('Yüklenen Belgeler', listItems(certLinks)) : '',
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
  return [
    d.bio ? section('Tanıtım', `<p class="bio">${escapeHtml(d.bio).replace(/\n/g, '<br/>')}</p>`) : '',
    section('Mezuniyet & Lisans', `
      ${row('Bölüm', d.graduationDepartment)}
      ${row('Diploma / Oda No', d.licenseNumber)}
    `),
    section('Eğitim', listItems(
      (d.education || []).filter((e) => e.degree || e.school),
      (e) => [e.degree, e.school, e.year].filter(Boolean).join(' · '),
    )),
    section('Sertifikalar', listItems(
      (d.certificates || []).filter((c) => c.name),
      (c) => [c.name, c.issuer, c.year].filter(Boolean).join(' · '),
    )),
  ].join('')
}

export function buildStaffApplicationCvHtml(app) {
  const d = app.data || {}
  const roleLabel = staffRoleLabel(app.role)
  const isCoach = app.role === 'coach'
  const location = [d.city, d.district].filter(Boolean).join(' / ')
  const gym = d.hasGym ? [d.gymName, d.gymCity, d.gymDistrict].filter(Boolean).join(' · ') : ''
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

  const photoHtml = d.photo
    ? `<img src="${escapeHtml(d.photo)}" alt="" class="photo" crossorigin="anonymous" />`
    : `<div class="photo photo-placeholder">${escapeHtml((app.name || '?').charAt(0))}</div>`

  const bodySections = isCoach ? buildCoachSections(d) : buildDietitianSections(d)

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
        .cv-section { margin-bottom: 18px; page-break-inside: avoid; }
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
      ${socialRows ? section('Sosyal Medya', socialRows) : ''}
      ${(d.languages || []).length ? section('Diller', tagList(d.languages)) : ''}
      ${bodySections}

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
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.innerHTML = buildStaffApplicationCvHtml(app)
  document.body.appendChild(container)

  const element = container.querySelector('#staff-cv-root')
  const datePart = app.createdAt
    ? format(new Date(app.createdAt), 'yyyy-MM-dd')
    : format(new Date(), 'yyyy-MM-dd')
  const filename = `cv-${slugifyName(app.name)}-${datePart}.pdf`

  try {
    const { default: html2pdf } = await import('html2pdf.js')
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, allowTaint: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(element)
      .save()
  } finally {
    document.body.removeChild(container)
  }

  return filename
}

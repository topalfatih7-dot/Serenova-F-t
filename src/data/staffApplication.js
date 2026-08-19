/** Koç / diyetisyen başvuru formu — admin onayı sonrası staff kaydına dönüşür */

import { isMeaningfulProfileText, hasAvailabilitySlots, scheduleFromAvailability } from './staffProfile'
import { detectExternalContactInfo } from '../utils/contactInfoGuard'

export const GENDERS = [
  { value: 'female', label: 'Kadın' },
  { value: 'male', label: 'Erkek' },
]

export const EDUCATION_LEVELS = [
  { value: 'onlisans', label: 'Önlisans' },
  { value: 'lisans', label: 'Lisans' },
  { value: 'yukseklisans', label: 'Yüksek Lisans' },
  { value: 'doktora', label: 'Doktora' },
]

/** Eski başvurulardaki düzey değerleri için etiket fallback */
export const EDUCATION_LEVEL_LABELS = {
  lise: 'Lise',
  onlisans: 'Önlisans',
  lisans: 'Lisans',
  yukseklisans: 'Yüksek Lisans',
  doktora: 'Doktora',
}

export function educationLevelLabel(value) {
  if (!value) return ''
  return EDUCATION_LEVEL_LABELS[value]
    || EDUCATION_LEVELS.find((l) => l.value === value)?.label
    || value
}

export const OTHER_OPTION = 'Diğer'

export const COACH_SPECIALTY_GROUPS = [
  {
    id: 'body',
    label: 'Vücut & Kompozisyon',
    tone: 'brand',
    items: ['Kilo Verme', 'Kas Kazanımı (Hipertrofi)', 'Yağ Yakımı', 'Vücut Şekillendirme', 'Obezite Egzersiz Programları'],
  },
  {
    id: 'training',
    label: 'Antrenman & Performans',
    tone: 'sky',
    items: ['Kuvvet Antrenmanı', 'Fonksiyonel Antrenman', 'HIIT', 'Kardiyovasküler Kondisyon', 'Sporcu Performansı', 'Kuvvet ve Kondisyon (Strength & Conditioning)'],
  },
  {
    id: 'wellness',
    label: 'Esneklik & Düzeltici',
    tone: 'emerald',
    items: ['Mobilite & Esneklik', 'Düzeltici Egzersiz (Corrective Exercise)', 'Postür Analizi', 'Pilates', 'Yoga'],
  },
  {
    id: 'populations',
    label: 'Özel Popülasyonlar',
    tone: 'amber',
    items: ['Çocuk ve Ergen Egzersizi', 'Kadın Sağlığı ve Egzersiz', 'Gebelik / Doğum Sonrası Egzersiz', 'İleri Yaş Egzersizleri (65+)', 'Kronik Hastalıklarda Egzersiz'],
  },
  {
    id: 'delivery',
    label: 'Hizmet Biçimi',
    tone: 'violet',
    items: ['Evde Egzersiz Programları', 'Online Koçluk', 'Grup Egzersizleri', 'Kurumsal Wellness'],
  },
]

export const COACH_SPECIALTIES = COACH_SPECIALTY_GROUPS.flatMap((g) => g.items)

export const DIETITIAN_SPECIALTY_GROUPS = [
  {
    id: 'clinical',
    label: 'Klinik Beslenme',
    tone: 'sage',
    items: ['Klinik Beslenme', 'Diyabet Beslenmesi', 'Intolerans / Alerji'],
  },
  {
    id: 'lifestyle',
    label: 'Yaşam & Performans',
    tone: 'brand',
    items: ['Spor Beslenmesi', 'Kilo Yönetimi', 'Plant-Based'],
  },
  {
    id: 'lifestage',
    label: 'Özel Dönemler',
    tone: 'rose',
    items: ['Hamilelik / Emzirme', 'Çocuk Beslenmesi'],
  },
]

export const DIETITIAN_SPECIALTIES = DIETITIAN_SPECIALTY_GROUPS.flatMap((g) => g.items)

export const COMPETENT_GROUPS = {
  lifestyle: {
    label: 'Yaşam Tarzına Göre',
    items: [
      'Sedanter Bireyler (Fiziksel olarak inaktif)',
      'Aktif Yaşam Süren Bireyler',
      'Rekreatif Sporcular',
      'Profesyonel Sporcular',
    ],
  },
  goal: {
    label: 'Hedefe Göre',
    items: [
      'Kilo Yönetimi (Kilo Verme, Kilo Alma)',
      'Kas Kütlesi Artırma',
      'Yağ Kaybı',
      'Performans Geliştirme',
      'Genel Sağlıklı Yaşam',
    ],
  },
  age: {
    label: 'Yaş Grupları',
    items: [
      'Çocuklar (6–12 yaş)',
      'Ergenler (13–17 yaş)',
      'Yetişkinler (18–64 yaş)',
      'İleri Yaş Bireyler (65+)',
    ],
  },
  gender: {
    label: 'Cinsiyete Özel',
    items: ['Kadınlar', 'Erkekler'],
  },
  special: {
    label: 'Özel Popülasyonlar',
    items: [
      'Obezite Tanılı Bireyler',
      'Gebeler',
      'Doğum Sonrası Dönemdeki Bireyler',
      'Kronik Hastalığı Olan Bireyler',
      'Ortopedik Sorunu Olan Bireyler',
      'Masa Başı Çalışanlar',
      'Hareket Kısıtlılığı Bulunan Bireyler',
    ],
  },
}

export const OFFICIAL_COACHING_CERT_NONE = 'Yok'

/** GSB Antrenör Eğitimi Yönetmeliği — 1–3 kademe */
export const COACHING_LICENSE_LEVELS = [
  { value: '1', label: '1. Kademe', short: '1. Kademe' },
  { value: '2', label: '2. Kademe', short: '2. Kademe' },
  { value: '3', label: '3. Kademe', short: '3. Kademe' },
]

/** GSB lisanslı federasyonlar — fitness/wellness koç başvuruları için öncelikli liste */
export const COACHING_FEDERATIONS = [
  { value: 'tvgfbf', label: 'Türkiye Vücut Geliştirme, Fitness ve Bilek Güreşi Federasyonu (TVGFBF)', short: 'TVGFBF' },
  { value: 'cimnastik', label: 'Türkiye Cimnastik Federasyonu', short: 'TCF' },
  { value: 'atletizm', label: 'Türkiye Atletizm Federasyonu', short: 'TAF' },
  { value: 'yuzme', label: 'Türkiye Yüzme Federasyonu', short: 'TYF' },
  { value: 'tenis', label: 'Türkiye Tenis Federasyonu', short: 'TTF' },
  { value: 'basketbol', label: 'Türkiye Basketbol Federasyonu', short: 'TBF' },
  { value: 'futbol', label: 'Türkiye Futbol Federasyonu', short: 'TFF' },
  { value: 'voleybol', label: 'Türkiye Voleybol Federasyonu', short: 'TVF' },
  { value: 'hentbol', label: 'Türkiye Hentbol Federasyonu', short: 'THF' },
  { value: 'boks', label: 'Türkiye Boks Federasyonu', short: 'TBF (Boks)' },
  { value: 'gures', label: 'Türkiye Güreş Federasyonu', short: 'TGF' },
  { value: 'diger', label: 'Diğer GSB lisanslı federasyon', short: 'Diğer' },
]

export function federationLabel(value, other = '') {
  if (!value) return ''
  if (value === 'diger') return other?.trim() || 'Diğer federasyon'
  return COACHING_FEDERATIONS.find((f) => f.value === value)?.short
    || COACHING_FEDERATIONS.find((f) => f.value === value)?.label
    || value
}

export function coachingLevelLabel(value) {
  const level = COACHING_LICENSE_LEVELS.find((l) => l.value === value)
  return level ? level.label : `${value}. Kademe`
}

export function formatFederationCertEntry(entry) {
  if (!entry?.federation || !(entry.levels || []).length) return ''
  const fed = federationLabel(entry.federation, entry.federationOther)
  const levels = [...entry.levels]
    .sort((a, b) => Number(a) - Number(b))
    .map((l) => coachingLevelLabel(l))
    .join(', ')
  return `${fed}: ${levels}`
}

export function federationCertsToLabels(federationCerts) {
  return (federationCerts || []).map(formatFederationCertEntry).filter(Boolean)
}

export function getOfficialCoachingCertLabels(form) {
  if (form?.noOfficialCoachingCert) return []
  const fromFederation = federationCertsToLabels(form?.federationCerts)
  if (fromFederation.length) return fromFederation
  return (form?.officialCoachingCerts || []).filter((c) => c && c !== OFFICIAL_COACHING_CERT_NONE)
}

export const EMPTY_FEDERATION_CERT = { federation: '', federationOther: '', levels: [] }

export const INTERNATIONAL_CERTIFICATES = [
  'NASM CPT', 'ACE CPT', 'ACSM CPT', 'NSCA CPT', 'NSCA CSCS',
  'ISSA CPT', 'ISSA Nutrition Coach', 'Precision Nutrition Level 1',
  'CrossFit Level 1', 'CrossFit Level 2', 'TRX Suspension Training',
  'Functional Movement Screen (FMS)', 'EXOS', 'Animal Flow',
  'Kettlebell Certification', 'Diğer',
]

export const BRANCH_CERTIFICATES = [
  'Pilates Eğitmenliği', 'Reformer Pilates', 'Yoga Eğitmenliği', 'Hamile Pilatesi',
  'Medikal Egzersiz', 'Klinik Pilates', 'Corrective Exercise Specialist',
  'Mobility Specialist', 'Postür Analizi', 'Fonksiyonel Antrenman', 'Diğer',
]

export const WORK_APPROACHES = [
  'Kanıta Dayalı Egzersiz Bilimi (Evidence-Based Practice)',
  'Ulusal / Uluslararası Kılavuzları Takip Ediyorum',
  'Bilimsel Makaleleri Düzenli Okuyorum',
  'Sürekli Mesleki Gelişim Eğitimlerine Katılıyorum',
  'Diğer',
]

export const SERVICE_AREAS = [
  'Yüz Yüze Birebir', 'Online Birebir', 'Grup Dersleri', 'Salon / Stüdyo',
  'Ev Ziyareti', 'Kurumsal Wellness', 'Spor Sahası / Performans Merkezi', OTHER_OPTION,
]

export const APPLICATION_STEPS = [
  { id: 1, label: 'Kişisel Bilgiler', short: 'Kişisel' },
  { id: 2, label: 'Uzmanlık & Deneyim', short: 'Uzmanlık' },
  { id: 3, label: 'Eğitim & Sertifika', short: 'Eğitim' },
  { id: 4, label: 'Yaklaşım & Hizmet', short: 'Hizmet' },
]

export const EMPTY_STAFF_APPLICATION = {
  role: 'coach',
  name: '',
  email: '',
  phone: '',
  photo: null,
  city: '',
  district: '',
  gender: '',
  hasGym: false,
  gymName: '',
  gymCity: '',
  gymDistrict: '',
  hasOffice: false,
  officeName: '',
  officeCity: '',
  officeDistrict: '',
  officeAddress: '',
  instagram: '',
  youtube: '',
  website: '',
  linkedin: '',
  specialties: [],
  specialtyOther: '',
  experienceYears: '',
  competentGroups: [],
  competentGroupOther: '',
  chronicDiseaseExamples: '',
  graduationDocFile: null,
  noOfficialCoachingCert: false,
  federationCerts: [{ ...EMPTY_FEDERATION_CERT }],
  officialCoachingCerts: [],
  internationalCerts: [],
  branchCerts: [],
  certificateFiles: [],
  certOtherNotes: { international: '', branch: '' },
  workApproaches: [],
  workApproachOther: '',
  serviceAreas: [],
  serviceAreaOther: '',
  languages: ['Türkçe'],
  availability: {},
  // Diyetisyen
  graduationDepartment: '',
  education: [{ school: '', level: '' }],
  certificates: [{ name: '', file: null }],
  bio: '',
  title: '',
}

/** Rol değişiminde korunacak ortak alanlar */
export const SHARED_APPLICATION_KEYS = [
  'name', 'email', 'phone', 'photo', 'city', 'district', 'gender',
  'hasGym', 'gymName', 'gymCity', 'gymDistrict',
  'hasOffice', 'officeName', 'officeCity', 'officeDistrict', 'officeAddress',
  'instagram', 'youtube', 'website', 'linkedin',
  'languages', 'experienceYears', 'bio', 'title', 'availability',
]

/** Ortak alanları koruyup rol-özel alanları boş forma döndürür */
export function resetRoleSpecificFields(form, nextRole) {
  const role = nextRole === 'dietitian' ? 'dietitian' : 'coach'
  const shared = {}
  for (const key of SHARED_APPLICATION_KEYS) {
    if (Object.prototype.hasOwnProperty.call(form || {}, key)) {
      shared[key] = form[key]
    }
  }
  return {
    ...EMPTY_STAFF_APPLICATION,
    ...shared,
    role,
    federationCerts: [{ ...EMPTY_FEDERATION_CERT }],
    education: [{ school: '', level: '' }],
    certificates: [{ name: '', file: null }],
    certOtherNotes: { international: '', branch: '' },
    languages: Array.isArray(shared.languages) ? [...shared.languages] : ['Türkçe'],
  }
}

export function hasEducationEntryInfo(edu) {
  return !!(edu?.school?.trim() || edu?.level || edu?.degree?.trim() || edu?.year?.trim())
}

export function hasCertificateEntryInfo(cert) {
  return isMeaningfulProfileText(cert?.name)
}

export function formatEducationEntry(edu) {
  if (!edu) return ''
  const level = educationLevelLabel(edu.level) || edu.degree || ''
  return [edu.school, level, edu.year].filter(Boolean).join(' · ')
}

export function toggleInList(list, item) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

/** Formdaki "Diğer" chip'ini specialtyOther metniyle değiştirir; boş yer tutucuyu public profile'a taşımaz. */
export function resolveSpecialtyTags(specialties = [], specialtyOther = '') {
  const other = String(specialtyOther || '').trim()
  const seen = new Set()
  const resolved = []

  for (const raw of specialties) {
    const tag = String(raw || '').trim()
    if (!tag) continue
    const value = tag === OTHER_OPTION ? other : tag
    if (!value || value === OTHER_OPTION) continue
    const key = value.toLocaleLowerCase('tr')
    if (seen.has(key)) continue
    seen.add(key)
    resolved.push(value)
  }

  if (other) {
    const key = other.toLocaleLowerCase('tr')
    if (!seen.has(key)) resolved.push(other)
  }

  return resolved
}

/**
 * Kart/profil ana uzmanlığı — katalogdaki ilk grup (koçlarda "Kilo Verme" vb.)
 * herkese aynı göründüğü için atlanır.
 */
export function pickPrimarySpecialty(specialties = [], role = 'coach') {
  const list = (Array.isArray(specialties) ? specialties : [])
    .map((s) => String(s).trim())
    .filter((s) => s && s !== OTHER_OPTION)
  if (!list.length) return ''
  if (role !== 'coach') return list[0]
  const generic = new Set(
    (COACH_SPECIALTY_GROUPS[0]?.items || []).map((item) => item.toLocaleLowerCase('tr')),
  )
  return list.find((s) => !generic.has(s.toLocaleLowerCase('tr'))) || list[0]
}

function certNameKey(name) {
  return String(name || '').trim().toLocaleLowerCase('tr')
}

function pushUniqueCert(list, entry) {
  const name = String(entry?.name || '').trim()
  if (!isMeaningfulProfileText(name)) return
  const key = certNameKey(name)
  if (list.some((c) => certNameKey(c.name) === key)) return
  list.push({
    name,
    issuer: entry.issuer || '',
    year: entry.year || '',
  })
}

function certEntriesFromChipList(chips, issuer, otherNote = '') {
  const other = String(otherNote || '').trim()
  const entries = []
  for (const raw of chips || []) {
    const chip = String(raw || '').trim()
    if (!chip || chip === OFFICIAL_COACHING_CERT_NONE) continue
    if (chip === OTHER_OPTION) {
      if (isMeaningfulProfileText(other)) entries.push({ name: other, issuer, year: '' })
      continue
    }
    entries.push({ name: chip, issuer, year: '' })
  }
  return entries
}

function humanizeCertFileName(fileName) {
  const raw = String(fileName || '').replace(/\.[a-z0-9]+$/i, '').trim()
  if (!raw) return ''
  if (/^SAVE_\d+/i.test(raw)) return ''
  if (/^[\d_-]+$/.test(raw)) return ''
  const stripped = raw.replace(/^\d{6,}[_-]*/, '').replace(/[_-]+/g, ' ').trim()
  if (!isMeaningfulProfileText(stripped) || stripped.length < 4) return ''
  if (!/\s/.test(stripped) && /^[a-z0-9]+$/i.test(stripped)) return ''
  return stripped
}

function certEntriesFromUploadedFiles(files) {
  return (Array.isArray(files) ? files : [])
    .filter((f) => f?.url && (f.kind || 'certificate') === 'certificate')
    .map((f, i) => {
      const fromName = humanizeCertFileName(f.name)
      return {
        name: fromName || `Sertifika ${i + 1}`,
        issuer: '',
        year: '',
      }
    })
}

/** Başvuru JSONB → public kadro sertifika listesi (Diğer notu + yüklenen belgeler dahil) */
export function certificatesFromApplicationData(d = {}, role = 'coach') {
  const named = []

  if (role === 'coach') {
    for (const name of federationCertsToLabels(d.federationCerts)) {
      pushUniqueCert(named, { name, issuer: 'GSB Federasyon Antrenörlük', year: '' })
    }
    for (const entry of certEntriesFromChipList(d.officialCoachingCerts, 'Resmi Antrenörlük')) {
      pushUniqueCert(named, entry)
    }
    for (const entry of certEntriesFromChipList(
      d.internationalCerts,
      'Uluslararası',
      d.certOtherNotes?.international,
    )) {
      pushUniqueCert(named, entry)
    }
    for (const entry of certEntriesFromChipList(
      d.branchCerts,
      'Branş Sertifikası',
      d.certOtherNotes?.branch,
    )) {
      pushUniqueCert(named, entry)
    }
  }

  for (const raw of Array.isArray(d.certificates) ? d.certificates : []) {
    const name = isMeaningfulProfileText(raw?.name)
      ? String(raw.name).trim()
      : humanizeCertFileName(raw?.file?.name)
    if (!name) continue
    pushUniqueCert(named, {
      name,
      issuer: isMeaningfulProfileText(raw?.issuer) ? String(raw.issuer).trim() : '',
      year: isMeaningfulProfileText(raw?.year) ? String(raw.year).trim() : '',
    })
  }

  if (named.length) return named
  return certEntriesFromUploadedFiles(d.certificateFiles)
}

export function applicationToStaffPayload(app, tempPassword) {
  const d = app.data || {}
  const specialties = resolveSpecialtyTags(d.specialties, d.specialtyOther)
  const primarySpecialty = pickPrimarySpecialty(specialties, app.role)

  let education = (Array.isArray(d.education) ? d.education : [])
    .filter(hasEducationEntryInfo)
    .map((e) => ({
      degree: educationLevelLabel(e.level) || e.degree || '',
      school: e.school || '',
      year: e.year || '',
    }))
  const certificates = certificatesFromApplicationData(d, app.role)

  if (app.role === 'coach') {
    // Eski başvuru fallback: tekil eğitim alanları
    if (!education.length && d.educationLevel && d.educationDepartment) {
      const levelLabel = educationLevelLabel(d.educationLevel)
      education.unshift({
        degree: `${levelLabel} — ${d.educationDepartment}`,
        school: d.educationGpa ? `GPA: ${d.educationGpa}` : '',
        year: '',
      })
    }
  } else if (d.graduationDepartment && !education.some((e) => e.degree === d.graduationDepartment)) {
    education.unshift({
      degree: d.graduationDepartment,
      school: '',
      year: '',
    })
  }

  const bio = d.bio || ''
  const title = String(d.title || '').trim()
  const schedule = scheduleFromAvailability(d.availability)

  return {
    role: app.role,
    name: app.name,
    email: app.email,
    phone: app.phone || d.phone || '',
    password: tempPassword,
    title,
    specialty: primarySpecialty,
    specialties,
    bio,
    photo: d.photo || null,
    city: d.city || '',
    district: d.district || '',
    gender: d.gender || '',
    instagram: d.instagram || '',
    youtube: d.youtube || '',
    website: d.website || '',
    linkedin: d.linkedin || '',
    education,
    experienceYears: Number(d.experienceYears) || 0,
    experiences: d.experiences || [],
    certificates,
    languages: d.languages || ['Türkçe'],
    ...schedule,
  }
}

function baseErrors(form) {
  const errors = []
  if (!form.name?.trim()) errors.push('Ad soyad gerekli')
  if (!form.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.push('Geçerli e-posta gerekli')
  if (!form.phone?.trim()) errors.push('Telefon gerekli')
  if (!form.city?.trim()) errors.push('İl seçin')
  if (!form.district?.trim()) errors.push('İlçe seçin')
  if (!form.gender) errors.push('Cinsiyet seçin')
  if (form.role === 'dietitian') {
    if (form.hasOffice) {
      if (!form.officeName?.trim()) errors.push('Ofis adı gerekli')
      if (!form.officeCity?.trim()) errors.push('Ofis ili gerekli')
      if (!form.officeDistrict?.trim()) errors.push('Ofis ilçesi gerekli')
      if (!form.officeAddress?.trim()) errors.push('Ofis adresi gerekli')
    }
  } else if (form.hasGym) {
    if (!form.gymName?.trim()) errors.push('Salon adı gerekli')
    if (!form.gymCity?.trim()) errors.push('Salon ili gerekli')
    if (!form.gymDistrict?.trim()) errors.push('Salon ilçesi gerekli')
  }
  return errors
}

function coachStep2Errors(form) {
  const errors = []
  const hasSpecialty = (form.specialties || []).some((s) => s !== OTHER_OPTION) || (form.specialties || []).includes(OTHER_OPTION) && form.specialtyOther?.trim()
  if (!hasSpecialty) errors.push('En az bir uzmanlık alanı seçin')
  if ((form.specialties || []).includes(OTHER_OPTION) && !form.specialtyOther?.trim()) errors.push('Diğer uzmanlık alanını yazın')
  if (!form.experienceYears && form.experienceYears !== 0) errors.push('Deneyim yılı gerekli')
  const hasGroup = (form.competentGroups || []).some((g) => g !== OTHER_OPTION) || ((form.competentGroups || []).includes(OTHER_OPTION) && form.competentGroupOther?.trim())
  if (!hasGroup) errors.push('Yetkin olduğunuz en az bir danışan grubu seçin')
  if ((form.competentGroups || []).includes(OTHER_OPTION) && !form.competentGroupOther?.trim()) errors.push('Diğer danışan grubunu yazın')
  if ((form.competentGroups || []).includes('Kronik Hastalığı Olan Bireyler') && !form.chronicDiseaseExamples?.trim()) {
    errors.push('Kronik hastalık örneklerini belirtin')
  }
  return errors
}

function dietitianStep2Errors(form) {
  const errors = []
  const hasSpecialty = (form.specialties || []).some((s) => s !== OTHER_OPTION)
    || ((form.specialties || []).includes(OTHER_OPTION) && form.specialtyOther?.trim())
  if (!hasSpecialty) errors.push('En az bir uzmanlık alanı seçin')
  if ((form.specialties || []).includes(OTHER_OPTION) && !form.specialtyOther?.trim()) {
    errors.push('Diğer uzmanlık alanını yazın')
  }
  if (!form.experienceYears && form.experienceYears !== 0) errors.push('Deneyim yılı gerekli')
  if (!form.graduationDepartment?.trim()) errors.push('Mezuniyet bölümü gerekli')
  return errors
}

function graduationDocError(form) {
  if (!form.graduationDocFile?.url) return 'e-Devlet mezuniyet belgenizi yükleyin'
  return null
}

function coachStep3Errors(form) {
  const errors = []
  const gradErr = graduationDocError(form)
  if (gradErr) errors.push(gradErr)

  if (!form.noOfficialCoachingCert) {
    const entries = form.federationCerts || []
    // Boş bırakmak serbest; kısmen doldurulmuş kayıt varsa tamamlanması istenir
    entries.forEach((fc, i) => {
      const started = !!(fc.federation || (fc.levels || []).length || fc.federationOther?.trim())
      if (!started) return
      if (!fc.federation) errors.push(`${i + 1}. federasyon kaydı için federasyon seçin`)
      else if (fc.federation === 'diger' && !fc.federationOther?.trim()) errors.push(`${i + 1}. federasyon için federasyon adını yazın`)
      else if (!(fc.levels || []).length) errors.push(`${i + 1}. federasyon kaydı için en az bir kademe seçin`)
    })
  }
  if ((form.internationalCerts || []).includes(OTHER_OPTION) && !form.certOtherNotes?.international?.trim()) {
    errors.push('Diğer uluslararası sertifikayı yazın')
  }
  if ((form.branchCerts || []).includes(OTHER_OPTION) && !form.certOtherNotes?.branch?.trim()) {
    errors.push('Diğer branş sertifikasını yazın')
  }
  return errors
}

function dietitianStep3Errors(form) {
  const errors = []
  const gradErr = graduationDocError(form)
  if (gradErr) errors.push(gradErr)
  return errors
}

export const BIO_MIN_LENGTH = 80

function step4Errors(form) {
  const errors = []
  const bio = form.bio?.trim() || ''
  if (bio.length < BIO_MIN_LENGTH) {
    errors.push(`Hakkında metni en az ${BIO_MIN_LENGTH} karakter olmalı`)
  }
  const bioGuard = detectExternalContactInfo(form.bio)
  if (bioGuard.blocked) {
    errors.push(`Hakkında metninde ${bioGuard.reason} paylaşılamaz. İletişim uygulama içinden yürütülür.`)
  }
  if (!hasAvailabilitySlots(form.availability)) {
    errors.push('En az bir gün için çalışma saati seçin')
  }
  if (form.role === 'coach') {
    const hasApproach = (form.workApproaches || []).some((a) => a !== OTHER_OPTION) || ((form.workApproaches || []).includes(OTHER_OPTION) && form.workApproachOther?.trim())
    const hasService = (form.serviceAreas || []).some((a) => a !== OTHER_OPTION) || ((form.serviceAreas || []).includes(OTHER_OPTION) && form.serviceAreaOther?.trim())
    if (!hasApproach) errors.push('En az bir çalışma yaklaşımı seçin')
    if ((form.workApproaches || []).includes(OTHER_OPTION) && !form.workApproachOther?.trim()) errors.push('Diğer çalışma yaklaşımını yazın')
    if (!hasService) errors.push('En az bir hizmet alanı seçin')
    if ((form.serviceAreas || []).includes(OTHER_OPTION) && !form.serviceAreaOther?.trim()) errors.push('Diğer hizmet alanını yazın')
  }
  return errors
}

export function validateStaffApplicationStep(step, form) {
  if (step === 1) return baseErrors(form)
  if (step === 2) return form.role === 'dietitian' ? dietitianStep2Errors(form) : coachStep2Errors(form)
  if (step === 3) return form.role === 'dietitian' ? dietitianStep3Errors(form) : coachStep3Errors(form)
  if (step === 4) return [...step4Errors(form), ...baseErrors(form), ...(form.role === 'dietitian' ? dietitianStep2Errors(form) : coachStep2Errors(form)), ...(form.role === 'dietitian' ? dietitianStep3Errors(form) : coachStep3Errors(form))]
  return []
}

export function validateStaffApplication(form) {
  return validateStaffApplicationStep(4, form)
}

export function buildStaffApplicationPayload(form) {
  const common = {
    // Base64 data URL gönderme — storage URL beklenir (yükleme submit / PhotoUpload persistUpload ile yapılır)
    photo: (typeof form.photo === 'string' && form.photo && !form.photo.startsWith('data:'))
      ? form.photo
      : null,
    city: form.city || '',
    district: form.district || '',
    gender: form.gender || '',
    instagram: form.instagram || '',
    youtube: form.youtube || '',
    website: form.website || '',
    linkedin: form.linkedin || '',
    specialties: form.specialties || [],
    specialtyOther: form.specialtyOther || '',
    experienceYears: Number(form.experienceYears) || 0,
    languages: form.languages || ['Türkçe'],
    bio: form.bio || '',
    availability: form.availability && typeof form.availability === 'object' ? form.availability : {},
  }

  const graduationDocFile = form.graduationDocFile?.url
    ? { name: form.graduationDocFile.name || 'e-Devlet mezuniyet belgesi', url: form.graduationDocFile.url, kind: 'graduation' }
    : null

  const education = (form.education || [])
    .filter(hasEducationEntryInfo)
    .map((e) => ({
      school: e.school || '',
      level: e.level || '',
      // Eski alan adları fallback (admin/CV okuma)
      degree: educationLevelLabel(e.level) || e.degree || '',
      year: e.year || '',
    }))

  if (form.role === 'dietitian') {
    const certificates = (form.certificates || [])
      .filter(hasCertificateEntryInfo)
      .map((c) => ({
        name: c.name || '',
        issuer: c.issuer || '',
        year: c.year || '',
        file: c.file?.url ? { name: c.file.name || '', url: c.file.url } : null,
      }))
    const certificateFiles = [
      ...(graduationDocFile ? [graduationDocFile] : []),
      ...certificates.filter((c) => c.file?.url).map((c) => ({ name: c.file.name || `Sertifika — ${c.name}`, url: c.file.url, kind: 'certificate' })),
    ]
    return {
      ...common,
      hasOffice: !!form.hasOffice,
      officeName: form.officeName || '',
      officeCity: form.officeCity || '',
      officeDistrict: form.officeDistrict || '',
      officeAddress: form.officeAddress || '',
      graduationDepartment: form.graduationDepartment || '',
      graduationDocFile,
      education,
      certificates,
      certificateFiles,
      bio: form.bio || '',
      title: form.title || '',
    }
  }

  return {
    ...common,
    hasGym: !!form.hasGym,
    gymName: form.gymName || '',
    gymCity: form.gymCity || '',
    gymDistrict: form.gymDistrict || '',
    competentGroups: form.competentGroups || [],
    competentGroupOther: form.competentGroupOther || '',
    chronicDiseaseExamples: form.chronicDiseaseExamples || '',
    graduationDocFile,
    education,
    noOfficialCoachingCert: !!form.noOfficialCoachingCert,
    federationCerts: (form.federationCerts || []).map((fc) => ({
      federation: fc.federation || '',
      federationOther: fc.federationOther || '',
      levels: fc.levels || [],
    })),
    officialCoachingCerts: form.officialCoachingCerts || [],
    internationalCerts: form.internationalCerts || [],
    branchCerts: form.branchCerts || [],
    certificateFiles: [
      ...(graduationDocFile ? [graduationDocFile] : []),
      ...(form.certificateFiles || []).map((f) => ({
        name: f.name || '',
        url: f.url,
        kind: f.kind || 'certificate',
      })),
    ],
    certOtherNotes: form.certOtherNotes || {},
    workApproaches: form.workApproaches || [],
    workApproachOther: form.workApproachOther || '',
    serviceAreas: form.serviceAreas || [],
    serviceAreaOther: form.serviceAreaOther || '',
  }
}

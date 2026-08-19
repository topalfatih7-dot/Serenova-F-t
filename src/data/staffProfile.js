/** Kadro profili — admin form, başvuru onayı, Supabase JSONB ve public sayfalar için ortak şema */

export const EMPTY_EDUCATION = { degree: '', school: '', year: '' }
export const EMPTY_EXPERIENCE = { title: '', organization: '', period: '', description: '' }
export const EMPTY_CERTIFICATE = { name: '', issuer: '', year: '' }

/** Başvuru formu ve admin panelinde ortak profil alanları */
export const EMPTY_STAFF_FORM = {
  role: 'coach',
  name: '',
  email: '',
  phone: '',
  password: '',
  title: '',
  specialty: '',
  specialties: [],
  bio: '',
  photo: null,
  city: '',
  district: '',
  gender: '',
  instagram: '',
  youtube: '',
  website: '',
  linkedin: '',
  education: [],
  experienceYears: '',
  experiences: [],
  certificates: [],
  languages: ['Türkçe'],
  workDays: [],
  workStart: '',
  workEnd: '',
  availability: {},
  listedOnTeam: true,
}

const PLACEHOLDER_TEXT_RE = /^[\s.·•…\-–—*]+$/u
const AUTO_DEFAULT_WORK_DAYS = [1, 3, 5]

/** Boş, tek karakter veya ".." / "…" gibi doldurulmamış alanları ayıklar */
export function isMeaningfulProfileText(value) {
  const s = String(value || '').trim()
  return s.length > 1 && !PLACEHOLDER_TEXT_RE.test(s)
}

export function publicCertificates(list) {
  return (Array.isArray(list) ? list : []).filter((c) => isMeaningfulProfileText(c?.name))
}

function labelKey(value) {
  return String(value || '').trim().toLocaleLowerCase('tr')
}

/** Unvan, uzmanlık chip'inin kopyasıysa (ör. tüm koçlarda "Kilo Verme") public'te gösterme */
export function isSpecialtyClonedTitle(title, profile = {}) {
  const t = String(title || '').trim()
  if (!t) return true
  const key = labelKey(t)
  const specialty = String(profile.specialty || '').trim()
  if (specialty && key === labelKey(specialty)) return true
  const list = Array.isArray(profile.specialties) ? profile.specialties : []
  return list.some((item) => labelKey(item) === key)
}

/** Gerçek unvan; başvuru onayında uzmanlıktan kopyalanan sahte title'ı ayıklar */
export function publicStaffTitle(profile = {}) {
  const title = String(profile.title || '').trim()
  if (!isMeaningfulProfileText(title)) return ''
  if (isSpecialtyClonedTitle(title, profile)) return ''
  return title
}

export function publicEducation(list) {
  return (Array.isArray(list) ? list : []).filter(
    (e) => isMeaningfulProfileText(e?.degree) || isMeaningfulProfileText(e?.school),
  )
}

export function publicExperiences(list) {
  return (Array.isArray(list) ? list : []).filter(
    (e) => isMeaningfulProfileText(e?.title) || isMeaningfulProfileText(e?.organization),
  )
}

export function formatStaffDisplayName(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase('tr') + word.slice(1).toLocaleLowerCase('tr'))
    .join(' ')
}

function sameDayList(days, expected) {
  const sorted = [...(days || [])].map(Number).sort((a, b) => a - b)
  return sorted.length === expected.length && expected.every((d, i) => d === sorted[i])
}

/** Başvuru/admin formunun eski otomatik Pzt–Çar–Cum 09:00–17:00 şablonu */
export function isAutoDefaultWorkSchedule(profile = {}) {
  if (!sameDayList(profile.workDays, AUTO_DEFAULT_WORK_DAYS)) return false
  const start = profile.workStart || '09:00'
  const end = profile.workEnd || '17:00'
  return start === '09:00' && end === '17:00'
}

export function hasAvailabilitySlots(availability) {
  if (!availability || typeof availability !== 'object') return false
  return Object.values(availability).some((hours) => Array.isArray(hours) && hours.length > 0)
}

export function hasPublicWorkSchedule(profile = {}) {
  if (hasAvailabilitySlots(profile.availability)) return true
  if (!profile.workDays?.length) return false
  return !isAutoDefaultWorkSchedule(profile)
}

/** Randevu müsaitliğinden workDays / workStart / workEnd türetilir (atama eşlemesi). */
export function scheduleFromAvailability(availability = {}) {
  const source = availability && typeof availability === 'object' ? availability : {}
  const days = Object.entries(source)
    .filter(([, hours]) => Array.isArray(hours) && hours.length > 0)
    .map(([day]) => Number(day))
    .filter((d) => Number.isFinite(d))
    .sort((a, b) => a - b)

  const hourNums = Object.values(source)
    .flat()
    .map((h) => parseInt(String(h), 10))
    .filter((n) => Number.isFinite(n))

  const minH = hourNums.length ? Math.min(...hourNums) : null
  const maxH = hourNums.length ? Math.max(...hourNums) : null

  return {
    availability: source,
    workDays: days,
    workStart: minH == null ? '' : `${String(minH).padStart(2, '0')}:00`,
    workEnd: maxH == null ? '' : `${String(maxH + 1).padStart(2, '0')}:00`,
  }
}

export function parseLines(text) {
  return String(text || '')
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function joinLines(items) {
  return (items || []).filter(Boolean).join('\n')
}

/** Başvuru formundaki yer tutucu — public profilde chip olarak gösterilmez */
const PLACEHOLDER_SPECIALTY = 'Diğer'

function isPlaceholderSpecialty(value) {
  return String(value || '').trim() === PLACEHOLDER_SPECIALTY
}

/** Public kadro kartları (/team/coaches vb.). Yoksa veya true ise listelenir. */
export function isListedOnTeam(profile = {}) {
  return profile.listedOnTeam !== false
}

/** Eski `description` alanını bio'ya taşır; dizileri normalize eder */
export function normalizeStaffProfile(raw = {}) {
  const specialties = (Array.isArray(raw.specialties)
    ? raw.specialties
    : raw.specialty
      ? [raw.specialty]
      : [])
    .map((t) => String(t).trim())
    .filter((t) => t && !isPlaceholderSpecialty(t))

  const specialtyRaw = String(raw.specialty || '').trim()
  const specialty = specialtyRaw && !isPlaceholderSpecialty(specialtyRaw)
    ? specialtyRaw
    : (specialties[0] || '')

  return {
    ...raw,
    title: raw.title || '',
    specialty,
    specialties,
    bio: raw.bio || raw.description || '',
    photo: raw.photo || null,
    city: raw.city || '',
    district: raw.district || '',
    gender: raw.gender || '',
    instagram: raw.instagram || '',
    youtube: raw.youtube || '',
    website: raw.website || '',
    linkedin: raw.linkedin || '',
    education: Array.isArray(raw.education) ? raw.education : [],
    experienceYears: raw.experienceYears === '' || raw.experienceYears == null
      ? ''
      : Number(raw.experienceYears) || 0,
    experiences: Array.isArray(raw.experiences) ? raw.experiences : [],
    certificates: Array.isArray(raw.certificates) ? raw.certificates : [],
    languages: Array.isArray(raw.languages) && raw.languages.length ? raw.languages : ['Türkçe'],
    workDays: Array.isArray(raw.workDays) ? raw.workDays : [],
    workStart: raw.workStart || '',
    workEnd: raw.workEnd || '',
    availability: raw.availability && typeof raw.availability === 'object' ? raw.availability : {},
    listedOnTeam: raw.listedOnTeam !== false,
  }
}

/** Supabase staff.data JSONB payload — tek kaynak */
export function staffProfileDataPayload(data) {
  const n = normalizeStaffProfile(data)
  const settings = data?.settings && typeof data.settings === 'object' ? data.settings : undefined
  return {
    phone: n.phone || '',
    title: n.title || '',
    specialty: n.specialty || '',
    specialties: n.specialties || [],
    bio: n.bio || '',
    photo: n.photo || null,
    city: n.city || '',
    district: n.district || '',
    gender: n.gender || '',
    instagram: n.instagram || '',
    youtube: n.youtube || '',
    website: n.website || '',
    linkedin: n.linkedin || '',
    education: n.education || [],
    experienceYears: Number(n.experienceYears) || 0,
    experiences: n.experiences || [],
    certificates: n.certificates || [],
    languages: n.languages || ['Türkçe'],
    workDays: n.workDays || [],
    workStart: n.workStart || '',
    workEnd: n.workEnd || '',
    availability: n.availability && typeof n.availability === 'object' ? n.availability : {},
    listedOnTeam: n.listedOnTeam !== false,
    ...(settings ? { settings } : {}),
  }
}

export function staffPublicSummary(member) {
  const n = normalizeStaffProfile(member)
  return n.bio || ''
}

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
  headline: '',
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
  workDays: [1, 3, 5],
  workStart: '09:00',
  workEnd: '17:00',
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

/** Eski `description` alanını bio'ya taşır; dizileri normalize eder */
export function normalizeStaffProfile(raw = {}) {
  const specialties = Array.isArray(raw.specialties)
    ? raw.specialties.filter(Boolean)
    : raw.specialty
      ? [raw.specialty]
      : []

  return {
    ...raw,
    title: raw.title || '',
    specialty: raw.specialty || specialties[0] || '',
    specialties,
    headline: raw.headline || '',
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
    workStart: raw.workStart || '09:00',
    workEnd: raw.workEnd || '17:00',
  }
}

/** Supabase staff.data JSONB payload — tek kaynak */
export function staffProfileDataPayload(data) {
  const n = normalizeStaffProfile(data)
  return {
    phone: n.phone || '',
    title: n.title || '',
    specialty: n.specialty || '',
    specialties: n.specialties || [],
    headline: n.headline || '',
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
    workStart: n.workStart || '09:00',
    workEnd: n.workEnd || '17:00',
  }
}

export function staffPublicSummary(member) {
  const n = normalizeStaffProfile(member)
  return n.headline || n.bio || ''
}

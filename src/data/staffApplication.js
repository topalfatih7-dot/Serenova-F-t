/** Koç / diyetisyen başvuru formu — admin onayı sonrası staff kaydına dönüşür */

export const COACH_SPECIALTIES = [
  'Güç Antrenmanı', 'Kardiyo', 'Fonksiyonel Antrenman', 'HIIT', 'Pilates', 'Mobilite',
  'Online Koçluk', 'Grup Dersleri', 'Yaşlı Fitness', 'Postür Düzeltme',
]

export const DIETITIAN_SPECIALTIES = [
  'Spor Beslenmesi', 'Klinik Beslenme', 'Kilo Yönetimi', 'Diyabet Beslenmesi',
  'Hamilelik / Emzirme', 'Çocuk Beslenmesi', 'Plant-Based', 'Intolerans / Alerji',
]

export const CERTIFICATION_TYPES = [
  'NASM', 'ACE', 'ISSA', 'ACSM', 'NSCA', 'CrossFit L1/L2', 'TRX', 'Diğer',
]

export const EMPTY_STAFF_APPLICATION = {
  role: 'coach',
  name: '',
  email: '',
  phone: '',
  city: '',
  title: '',
  specialties: [],
  experienceYears: '',
  education: [{ degree: '', school: '', year: '' }],
  certificates: [{ name: '', issuer: '', year: '' }],
  experiences: [{ title: '', organization: '', period: '', description: '' }],
  bio: '',
  linkedin: '',
  languages: ['Türkçe'],
  workDays: [1, 3, 5],
  workStart: '09:00',
  workEnd: '17:00',
  // Koç
  onlineCoachingExperience: false,
  primaryCertification: '',
  // Diyetisyen
  licenseNumber: '',
  graduationDepartment: '',
}

export function applicationToStaffPayload(app, tempPassword) {
  const d = app.data || {}
  return {
    role: app.role,
    name: app.name,
    email: app.email,
    phone: app.phone || d.phone || '',
    password: tempPassword,
    title: d.title || '',
    specialty: (d.specialties || [])[0] || '',
    specialties: d.specialties || [],
    headline: d.headline || d.title || '',
    bio: d.bio || '',
    photo: d.photo || null,
    education: d.education || [],
    experienceYears: d.experienceYears || 0,
    experiences: d.experiences || [],
    certificates: d.certificates || [],
    languages: d.languages || ['Türkçe'],
    workDays: d.workDays || [],
    workStart: d.workStart || '09:00',
    workEnd: d.workEnd || '17:00',
  }
}

export function validateStaffApplication(form) {
  const errors = []
  if (!form.name?.trim()) errors.push('Ad soyad gerekli')
  if (!form.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.push('Geçerli e-posta gerekli')
  if (!form.phone?.trim()) errors.push('Telefon gerekli')
  if (!form.city?.trim()) errors.push('Şehir gerekli')
  if (!form.title?.trim()) errors.push('Ünvan gerekli')
  if (!(form.specialties || []).length) errors.push('En az bir uzmanlık alanı seçin')
  if (!form.experienceYears && form.experienceYears !== 0) errors.push('Deneyim yılı gerekli')
  const edu = (form.education || []).find((e) => e.degree?.trim() && e.school?.trim())
  if (!edu) errors.push('En az bir eğitim bilgisi girin')
  const cert = (form.certificates || []).find((c) => c.name?.trim())
  if (!cert) errors.push('En az bir sertifika / diploma girin')
  if (!form.bio?.trim() || form.bio.trim().length < 40) errors.push('Kendinizi tanıtan metin en az 40 karakter olmalı')
  if (form.role === 'coach' && !form.primaryCertification) errors.push('Birincil sertifika türü seçin')
  if (form.role === 'dietitian' && !form.graduationDepartment?.trim()) errors.push('Mezuniyet bölümü gerekli')
  if (form.role === 'dietitian' && !form.licenseNumber?.trim()) errors.push('Diyetisyen diploma / oda kayıt no gerekli')
  return errors
}

/** Koç / diyetisyen başvuru formu — admin onayı sonrası staff kaydına dönüşür */

export const GENDERS = [
  { value: 'female', label: 'Kadın' },
  { value: 'male', label: 'Erkek' },
]

export const EDUCATION_LEVELS = [
  { value: 'lise', label: 'Lise' },
  { value: 'onlisans', label: 'Önlisans' },
  { value: 'lisans', label: 'Lisans' },
]

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

export const DIETITIAN_SPECIALTIES = [
  'Spor Beslenmesi', 'Klinik Beslenme', 'Kilo Yönetimi', 'Diyabet Beslenmesi',
  'Hamilelik / Emzirme', 'Çocuk Beslenmesi', 'Plant-Based', 'Intolerans / Alerji',
]

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
  educationLevel: '',
  educationDepartment: '',
  educationGpa: '',
  educationFile: null,
  noOfficialCoachingCert: false,
  federationCerts: [{ federation: 'tvgfbf', federationOther: '', levels: [] }],
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
  // Diyetisyen
  graduationDepartment: '',
  education: [{ degree: '', school: '', year: '', file: null }],
  certificates: [{ name: '', issuer: '', year: '', file: null }],
  bio: '',
  title: '',
}

export function hasEducationEntryInfo(edu) {
  return !!(edu?.degree?.trim() || edu?.school?.trim() || edu?.year?.trim())
}

export function hasCertificateEntryInfo(cert) {
  return !!(cert?.name?.trim() || cert?.issuer?.trim() || cert?.year?.trim())
}

export function hasCoachEducationInfo(form) {
  return !!(form?.educationLevel || form?.educationDepartment?.trim() || form?.educationGpa)
}

export function toggleInList(list, item) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

export function applicationToStaffPayload(app, tempPassword) {
  const d = app.data || {}
  const specialties = (d.specialties || []).filter(Boolean)
  const primarySpecialty = specialties.find((s) => s !== OTHER_OPTION) || specialties[0] || ''

  let education = Array.isArray(d.education) ? [...d.education] : []
  let certificates = Array.isArray(d.certificates) ? [...d.certificates] : []

  if (app.role === 'coach') {
    if (d.educationLevel && d.educationDepartment) {
      const levelLabel = EDUCATION_LEVELS.find((l) => l.value === d.educationLevel)?.label || d.educationLevel
      education.unshift({
        degree: `${levelLabel} — ${d.educationDepartment}`,
        school: d.educationGpa ? `GPA: ${d.educationGpa}` : '',
        year: '',
      })
    }
    certificates = [
      ...federationCertsToLabels(d.federationCerts).map((name) => ({ name, issuer: 'GSB Federasyon Antrenörlük', year: '' })),
      ...(d.officialCoachingCerts || []).filter((c) => c && c !== OFFICIAL_COACHING_CERT_NONE).map((name) => ({ name, issuer: 'Resmi Antrenörlük', year: '' })),
      ...(d.internationalCerts || []).filter((c) => c && c !== OTHER_OPTION).map((name) => ({ name, issuer: 'Uluslararası', year: '' })),
      ...(d.branchCerts || []).filter((c) => c && c !== OTHER_OPTION).map((name) => ({ name, issuer: 'Branş Sertifikası', year: '' })),
      ...certificates,
    ]
  } else if (d.graduationDepartment) {
    education.unshift({
      degree: d.graduationDepartment,
      school: '',
      year: '',
    })
  }

  const bio = d.bio || ''
  const title = d.title || primarySpecialty || ''

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
    workDays: d.workDays?.length ? d.workDays : [1, 3, 5],
    workStart: d.workStart || '09:00',
    workEnd: d.workEnd || '17:00',
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
  if (!(form.specialties || []).length) errors.push('En az bir uzmanlık alanı seçin')
  if (!form.experienceYears && form.experienceYears !== 0) errors.push('Deneyim yılı gerekli')
  if (!form.graduationDepartment?.trim()) errors.push('Mezuniyet bölümü gerekli')
  return errors
}

function coachStep3Errors(form) {
  const errors = []
  if (!form.educationLevel) errors.push('Eğitim düzeyi seçin')
  if (!form.educationDepartment?.trim()) errors.push('Bölüm bilgisi gerekli')
  if (hasCoachEducationInfo(form) && !form.educationFile?.url) {
    errors.push('Eğitim belgesi PDF / görselini yükleyin')
  }
  const hasOfficial = !form.noOfficialCoachingCert && (
    (form.federationCerts || []).some((fc) => fc.federation && (fc.levels || []).length)
    || (form.officialCoachingCerts || []).some((c) => c && c !== OFFICIAL_COACHING_CERT_NONE)
  )
  if (!form.noOfficialCoachingCert) {
    const entries = form.federationCerts || []
    if (!entries.length) errors.push('Federasyon antrenörlük bilgisi ekleyin veya “belgem yok” seçeneğini işaretleyin')
    entries.forEach((fc, i) => {
      if (!fc.federation) errors.push(`${i + 1}. federasyon kaydı için federasyon seçin`)
      else if (fc.federation === 'diger' && !fc.federationOther?.trim()) errors.push(`${i + 1}. federasyon için federasyon adını yazın`)
      else if (!(fc.levels || []).length) errors.push(`${i + 1}. federasyon kaydı için en az bir kademe seçin`)
    })
  }
  const hasIntl = (form.internationalCerts || []).some((c) => c !== OTHER_OPTION) || ((form.internationalCerts || []).includes(OTHER_OPTION) && form.certOtherNotes?.international?.trim())
  const hasBranch = (form.branchCerts || []).some((c) => c !== OTHER_OPTION) || ((form.branchCerts || []).includes(OTHER_OPTION) && form.certOtherNotes?.branch?.trim())
  if (!hasOfficial && !hasIntl && !hasBranch) errors.push('En az bir sertifika türü seçin')
  if ((form.internationalCerts || []).includes(OTHER_OPTION) && !form.certOtherNotes?.international?.trim()) errors.push('Diğer uluslararası sertifikayı yazın')
  if ((form.branchCerts || []).includes(OTHER_OPTION) && !form.certOtherNotes?.branch?.trim()) errors.push('Diğer branş sertifikasını yazın')
  const needsFiles = hasOfficial || hasIntl || hasBranch
  if (needsFiles && !(form.certificateFiles || []).length) errors.push('Seçtiğiniz sertifikalar için PDF / görsel yükleyin')
  return errors
}

function dietitianStep3Errors(form) {
  const errors = []
  const edu = (form.education || []).find((e) => e.degree?.trim() && e.school?.trim())
  if (!edu) errors.push('En az bir eğitim bilgisi girin')
  const cert = (form.certificates || []).find((c) => c.name?.trim())
  if (!cert) errors.push('En az bir sertifika / diploma girin')
  ;(form.education || []).forEach((e, i) => {
    if (hasEducationEntryInfo(e) && !e.file?.url) {
      errors.push(`${i + 1}. eğitim kaydı için belge PDF / görselini yükleyin`)
    }
  })
  ;(form.certificates || []).forEach((c, i) => {
    if (hasCertificateEntryInfo(c) && !c.file?.url) {
      errors.push(`${i + 1}. sertifika kaydı için belge PDF / görselini yükleyin`)
    }
  })
  return errors
}

function step4Errors(form) {
  const errors = []
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
    // Base64 data URL'leri payload'a koyma — gövde limitini aşar ("başvuru verisi çok yüksek")
    photo: (typeof form.photo === 'string' && !form.photo.startsWith('data:'))
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
  }

  if (form.role === 'dietitian') {
    const education = (form.education || []).map((e) => ({
      degree: e.degree || '',
      school: e.school || '',
      year: e.year || '',
      file: e.file?.url ? { name: e.file.name || '', url: e.file.url } : null,
    }))
    const certificates = (form.certificates || []).map((c) => ({
      name: c.name || '',
      issuer: c.issuer || '',
      year: c.year || '',
      file: c.file?.url ? { name: c.file.name || '', url: c.file.url } : null,
    }))
    const certificateFiles = [
      ...education.filter((e) => e.file?.url).map((e) => ({ name: e.file.name || `Eğitim — ${e.degree || e.school}`, url: e.file.url, kind: 'education' })),
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
      education,
      certificates,
      certificateFiles,
      bio: form.bio || '',
      title: form.title || '',
    }
  }

  const educationFile = form.educationFile?.url
    ? { name: form.educationFile.name || 'Eğitim belgesi', url: form.educationFile.url, kind: 'education' }
    : null

  return {
    ...common,
    hasGym: !!form.hasGym,
    gymName: form.gymName || '',
    gymCity: form.gymCity || '',
    gymDistrict: form.gymDistrict || '',
    competentGroups: form.competentGroups || [],
    competentGroupOther: form.competentGroupOther || '',
    chronicDiseaseExamples: form.chronicDiseaseExamples || '',
    educationLevel: form.educationLevel || '',
    educationDepartment: form.educationDepartment || '',
    educationGpa: form.educationGpa || '',
    educationFile,
    noOfficialCoachingCert: !!form.noOfficialCoachingCert,
    federationCerts: (form.federationCerts || []).map((fc) => ({
      federation: fc.federation || '',
      federationOther: fc.federationOther || '',
      levels: fc.levels || [],
    })),
    officialCoachingCerts: form.officialCoachingCerts || [],
    internationalCerts: form.internationalCerts || [],
    branchCerts: form.branchCerts || [],
    certificateFiles: (form.certificateFiles || []).map((f) => ({
      name: f.name || '',
      url: f.url,
      kind: f.kind || 'certificate',
    })),
    certOtherNotes: form.certOtherNotes || {},
    workApproaches: form.workApproaches || [],
    workApproachOther: form.workApproachOther || '',
    serviceAreas: form.serviceAreas || [],
    serviceAreaOther: form.serviceAreaOther || '',
  }
}

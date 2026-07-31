import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, UserPlus, Dumbbell, Apple, CheckCircle,
  Plus, Briefcase, GraduationCap, Award,
  Share2, Video, Link2, Globe, MapPin, Building2, Sparkles,
  Target, Users, User,
} from 'lucide-react'
import SeoHead from '../components/seo/SeoHead'
import PhoneField from '../components/ui/PhoneField'
import PhotoUpload from '../components/ui/PhotoUpload'
import PlansAnimatedBackground from '../components/landing/PlansAnimatedBackground'
import { useToast } from '../context/ToastContext'
import TurnstileWidget from '../components/security/TurnstileWidget'
import { useTurnstile } from '../hooks/useTurnstile'
import { submitStaffApplication, uploadStaffApplicationDoc } from '../services/supabaseDb'
import { CITY_NAMES, getDistricts } from '../data/turkeyCities'
import {
  AccordionSection,
  GroupedChipSelect,
  FlatChipSelect,
  ServiceAreaGrid,
  InlineDocUpload,
  ApplicationSummaryModal,
  FederationCertEditor,
} from '../components/staff/StaffApplicationUi'
import {
  EMPTY_STAFF_APPLICATION,
  COACH_SPECIALTY_GROUPS,
  DIETITIAN_SPECIALTIES,
  COMPETENT_GROUPS,
  INTERNATIONAL_CERTIFICATES,
  BRANCH_CERTIFICATES,
  WORK_APPROACHES,
  SERVICE_AREAS,
  APPLICATION_STEPS,
  GENDERS,
  EDUCATION_LEVELS,
  OTHER_OPTION,
  validateStaffApplicationStep,
  getOfficialCoachingCertLabels,
  EMPTY_FEDERATION_CERT,
  hasCoachEducationInfo,
  hasEducationEntryInfo,
  hasCertificateEntryInfo,
} from '../data/staffApplication'
import { staffRoleLabel } from '../utils/staffRoles'

const inputCls = 'w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100'
const selectCls = `${inputCls} appearance-none`

const STEP_DEFAULT_SECTION = {
  coach: { 1: 'basic', 2: 'specialties', 3: 'education', 4: 'approaches' },
  dietitian: { 1: 'basic', 2: 'specialties', 3: 'diet-edu', 4: 'approaches' },
}

const COMPETENT_GROUP_ACCORDIONS = Object.entries(COMPETENT_GROUPS).map(([key, group], i) => ({
  id: key,
  ...group,
  tone: ['brand', 'sky', 'emerald', 'amber', 'rose'][i % 5],
}))

function defaultOpenSection(step, role) {
  return STEP_DEFAULT_SECTION[role]?.[step] ?? null
}

export default function StaffApplicationPage() {
  const [params] = useSearchParams()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [openSection, setOpenSection] = useState('basic')
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [form, setForm] = useState(() => ({
    ...EMPTY_STAFF_APPLICATION,
    role: params.get('role') === 'dietitian' ? 'dietitian' : 'coach',
  }))
  const [submitting, setSubmitting] = useState(false)
  const [uploadingCerts, setUploadingCerts] = useState(false)
  const [done, setDone] = useState(false)
  const [formSessionToken, setFormSessionToken] = useState('')
  const {
    enabled: turnstileEnabled,
    widgetRef,
    setToken: setTurnstileToken,
    getTokenForSubmit,
    reset: resetTurnstile,
  } = useTurnstile()

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const obtainCaptchaIfNeeded = async () => {
    if (formSessionToken || !turnstileEnabled) return ''
    return getTokenForSubmit()
  }
  const dietitianGroups = useMemo(() => [{ id: 'all', label: 'Uzmanlık Alanları', tone: 'sage', items: DIETITIAN_SPECIALTIES }], [])
  const specialtyGroups = form.role === 'dietitian' ? dietitianGroups : COACH_SPECIALTY_GROUPS
  const districts = useMemo(() => getDistricts(form.city), [form.city])
  const gymDistricts = useMemo(() => getDistricts(form.gymCity), [form.gymCity])
  const officeDistricts = useMemo(() => getDistricts(form.officeCity), [form.officeCity])

  const stepErrors = useMemo(() => validateStaffApplicationStep(step, form), [step, form])

  const toggleSection = (id) => {
    setOpenSection((prev) => (prev === id ? null : id))
  }

  const next = () => {
    if (stepErrors.length) {
      toast(stepErrors[0], 'error')
      return
    }
    if (step === 4) {
      setSummaryOpen(true)
      return
    }
    setStep((s) => {
      const nextStep = s + 1
      setOpenSection(defaultOpenSection(nextStep, form.role))
      return nextStep
    })
  }

  const submit = async () => {
    const errors = validateStaffApplicationStep(4, form)
    if (errors.length) {
      toast(errors[0], 'error')
      return
    }
    setSubmitting(true)
    try {
      let captchaToken = ''
      try {
        captchaToken = await obtainCaptchaIfNeeded()
      } catch (err) {
        toast(err?.message || 'Bot doğrulamasını tamamlayın', 'error')
        resetTurnstile()
        return
      }
      const r = await submitStaffApplication(form, { turnstileToken: captchaToken, formSessionToken })
      if (!r.success) {
        resetTurnstile()
        toast(r.error || 'Başvuru gönderilemedi', 'error')
        return
      }
      if (r.formSessionToken) setFormSessionToken(r.formSessionToken)
      if (r.photo && r.photo !== form.photo) update({ photo: r.photo })
      resetTurnstile()
      setSummaryOpen(false)
      setDone(true)
      toast('Başvurunuz alındı! İnceleme sonrası e-posta ile bilgilendirileceksiniz.', 'success')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkCertUpload = async (fileList) => {
    const uploaded = await uploadDocs(fileList)
    if (uploaded.length) {
      setForm((f) => ({ ...f, certificateFiles: [...(f.certificateFiles || []), ...uploaded] }))
    }
  }

  const uploadDocs = async (fileOrList) => {
    const fileList = Array.isArray(fileOrList) ? fileOrList : (fileOrList ? [fileOrList] : [])
    if (!fileList.length) return []
    setUploadingCerts(true)
    try {
      let captchaToken = ''
      try {
        captchaToken = await obtainCaptchaIfNeeded()
      } catch (err) {
        toast(err?.message || 'Belge yüklemeden önce bot doğrulamasını tamamlayın', 'error')
        resetTurnstile()
        return []
      }
      const uploaded = []
      let session = formSessionToken
      let oneShotToken = captchaToken
      for (const file of fileList) {
        const tokenForFile = session ? '' : oneShotToken
        oneShotToken = '' // tek kullanımlık; sonraki dosyalar form session ile
        const r = await uploadStaffApplicationDoc(file, {
          turnstileToken: tokenForFile,
          formSessionToken: session,
        })
        if (!r.success) {
          resetTurnstile()
          toast(r.error || `${file.name} yüklenemedi`, 'error')
          continue
        }
        if (r.formSessionToken) {
          session = r.formSessionToken
          setFormSessionToken(r.formSessionToken)
        }
        uploaded.push({ name: file.name, url: r.url })
      }
      if (uploaded.length) toast(`${uploaded.length} belge yüklendi`, 'success')
      else resetTurnstile()
      return uploaded
    } finally {
      setUploadingCerts(false)
    }
  }

  const handleSingleDocUpload = async (file, onSaved) => {
    const uploaded = await uploadDocs(file)
    if (uploaded[0]) onSaved(uploaded[0])
  }

  const persistApplicationPhoto = async (file) => {
    let captchaToken
    try {
      captchaToken = await obtainCaptchaIfNeeded()
    } catch (err) {
      resetTurnstile()
      const msg = err?.message || 'Fotoğraf yüklemeden önce bot doğrulamasını tamamlayın'
      throw new Error(msg, { cause: err })
    }
    const session = formSessionToken
    const r = await uploadStaffApplicationDoc(file, {
      turnstileToken: session ? '' : (captchaToken || ''),
      formSessionToken: session,
    })
    if (!r.success || !r.url) {
      resetTurnstile()
      throw new Error(r.error || 'Fotoğraf yüklenemedi')
    }
    if (r.formSessionToken) setFormSessionToken(r.formSessionToken)
    return r.url
  }

  const showCoachEducationDoc = hasCoachEducationInfo(form)
  const showOfficialCertDoc = !form.noOfficialCoachingCert && (form.federationCerts || []).some((fc) => fc.federation && (fc.levels || []).length)
  const showIntlCertDoc = (form.internationalCerts || []).some((c) => c !== OTHER_OPTION)
    || ((form.internationalCerts || []).includes(OTHER_OPTION) && form.certOtherNotes?.international?.trim())
  const showBranchCertDoc = (form.branchCerts || []).some((c) => c !== OTHER_OPTION)
    || ((form.branchCerts || []).includes(OTHER_OPTION) && form.certOtherNotes?.branch?.trim())
  const needsAnyDocUpload = form.role === 'coach'
    ? (showCoachEducationDoc || showOfficialCertDoc || showIntlCertDoc || showBranchCertDoc)
    : (form.education || []).some(hasEducationEntryInfo) || (form.certificates || []).some(hasCertificateEntryInfo)

  if (done) {
    return (
      <div className="min-h-screen bg-cream-50/30 px-4 py-16">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-lg rounded-3xl border border-sage-200 bg-white p-8 text-center shadow-lg">
          <CheckCircle className="mx-auto h-14 w-14 text-sage-500" />
          <h1 className="mt-4 font-display text-2xl font-bold text-cream-900">Başvurunuz Alındı</h1>
          <p className="mt-2 text-sm text-cream-800/65">Ekibimiz başvurunuzu inceleyecek. Onaylandığında {form.email} adresine giriş bilgileriniz iletilecektir.</p>
          <Link to="/" className="btn-wellness mt-6 inline-flex !py-3 !px-6">Ana Sayfaya Dön</Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-white to-sage-50/20">
      <SeoHead title="Kadromuza Katıl — Koç & Diyetisyen Başvurusu" description="Yeni Form ekibine koç veya diyetisyen olarak başvurun." canonicalPath="/team/apply" />

      <PlansAnimatedBackground className="!py-14 sm:!py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <span className="section-badge"><UserPlus className="h-3.5 w-3.5" /> Kadromuza Katıl</span>
          <h1 className="section-title mt-4">Uzman Başvuru Formu</h1>
          <p className="section-subtitle mx-auto max-w-2xl">Bölümlere dokunarak açın, bilgilerinizi adım adım tamamlayın.</p>
        </motion.div>
      </PlansAnimatedBackground>

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
        <Link to={form.role === 'dietitian' ? '/team/dietitians' : '/team/coaches'} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-cream-800/60 hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Kadroya dön
        </Link>

        <div className="mb-8 flex justify-center gap-3">
          {['coach', 'dietitian'].map((r) => {
            const Icon = r === 'dietitian' ? Apple : Dumbbell
            const active = form.role === r
            return (
              <motion.button key={r} type="button" whileTap={{ scale: 0.98 }} onClick={() => update({ role: r, specialties: [] })}
                className={`flex items-center gap-2 rounded-2xl border px-6 py-3.5 text-sm font-semibold shadow-sm transition ${active ? 'border-brand-500 bg-gradient-to-r from-brand-500 to-brand-600 text-white' : 'border-cream-200 bg-white text-cream-800 hover:border-brand-200'}`}>
                <Icon className="h-4 w-4" /> {staffRoleLabel(r)}
              </motion.button>
            )
          })}
        </div>

        <div className="mb-8 flex justify-between gap-1">
          {APPLICATION_STEPS.map((s) => (
            <div key={s.id} className={`flex-1 text-center ${step >= s.id ? 'text-brand-600' : 'text-cream-300'}`}>
              <div className={`mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shadow-sm ${step > s.id ? 'bg-sage-500 text-white' : step === s.id ? 'bg-brand-500 text-white ring-4 ring-brand-100' : 'bg-cream-100'}`}>
                {step > s.id ? <CheckCircle className="h-4 w-4" /> : s.id}
              </div>
              <p className="hidden text-[10px] font-semibold sm:block">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            <motion.div key={`${step}-${form.role}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-3">
              {step === 1 && (
                <>
                  <AccordionSection id="basic" title="Temel Bilgiler" subtitle="Ad, iletişim ve cinsiyet" icon={User} tone="brand" open={openSection === 'basic'} onToggle={toggleSection}>
                    <div className="space-y-3">
                      {turnstileEnabled && !formSessionToken && (
                        <TurnstileWidget ref={widgetRef} onToken={setTurnstileToken} />
                      )}
                      <PhotoUpload
                        value={form.photo}
                        onChange={(photo) => update({ photo })}
                        label="Profil Fotoğrafı (isteğe bağlı)"
                        variant="portrait"
                        optional
                        persistUpload={persistApplicationPhoto}
                        hint="Fotoğraf başvurunuza kaydedilir; onay sonrası profilinizde görünür."
                      />
                      <input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Ad Soyad *" className={inputCls} />
                      <input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} placeholder="E-posta *" className={inputCls} />
                      <PhoneField value={form.phone} onValueChange={(phone) => update({ phone })} label="" />
                      <select value={form.gender} onChange={(e) => update({ gender: e.target.value })} className={`${selectCls} ${form.gender ? '' : 'text-cream-800/40'}`}>
                        <option value="">Cinsiyet seçin *</option>
                        {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </div>
                  </AccordionSection>
                  <AccordionSection id="location" title="Konum" subtitle="İl ve ilçe" icon={MapPin} tone="sage" open={openSection === 'location'} onToggle={toggleSection}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select value={form.city} onChange={(e) => update({ city: e.target.value, district: '' })} className={selectCls}><option value="">İl *</option>{CITY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                      <select value={form.district} onChange={(e) => update({ district: e.target.value })} disabled={!form.city} className={selectCls}><option value="">{form.city ? 'İlçe *' : '—'}</option>{districts.map((d) => <option key={d} value={d}>{d}</option>)}</select>
                    </div>
                  </AccordionSection>
                  {form.role === 'dietitian' ? (
                    <AccordionSection id="office" title="Ofis Bilgisi" subtitle="Opsiyonel" icon={Building2} tone="amber" open={openSection === 'office'} onToggle={toggleSection}>
                      <label className="mb-3 flex cursor-pointer items-center gap-2 rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm">
                        <input type="checkbox" checked={form.hasOffice} onChange={(e) => update({ hasOffice: e.target.checked })} className="accent-brand-500" />
                        Çalıştığım / sahibi olduğum bir ofis var
                      </label>
                      {form.hasOffice && (
                        <div className="space-y-3">
                          <input value={form.officeName} onChange={(e) => update({ officeName: e.target.value })} placeholder="Ofis adı *" className={inputCls} />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <select value={form.officeCity} onChange={(e) => update({ officeCity: e.target.value, officeDistrict: '' })} className={selectCls}><option value="">İl *</option>{CITY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                            <select value={form.officeDistrict} onChange={(e) => update({ officeDistrict: e.target.value })} disabled={!form.officeCity} className={selectCls}><option value="">İlçe *</option>{officeDistricts.map((d) => <option key={d} value={d}>{d}</option>)}</select>
                          </div>
                          <textarea
                            value={form.officeAddress}
                            onChange={(e) => update({ officeAddress: e.target.value })}
                            placeholder="Adres *"
                            rows={3}
                            className={`${inputCls} resize-none`}
                          />
                        </div>
                      )}
                    </AccordionSection>
                  ) : (
                    <AccordionSection id="gym" title="Salon Bilgisi" subtitle="Opsiyonel" icon={Building2} tone="amber" open={openSection === 'gym'} onToggle={toggleSection}>
                      <label className="mb-3 flex cursor-pointer items-center gap-2 rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm">
                        <input type="checkbox" checked={form.hasGym} onChange={(e) => update({ hasGym: e.target.checked })} className="accent-brand-500" />
                        Çalıştığım / sahibi olduğum bir salon var
                      </label>
                      {form.hasGym && (
                        <div className="space-y-3">
                          <input value={form.gymName} onChange={(e) => update({ gymName: e.target.value })} placeholder="Salon adı *" className={inputCls} />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <select value={form.gymCity} onChange={(e) => update({ gymCity: e.target.value, gymDistrict: '' })} className={selectCls}><option value="">Salon ili *</option>{CITY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                            <select value={form.gymDistrict} onChange={(e) => update({ gymDistrict: e.target.value })} disabled={!form.gymCity} className={selectCls}><option value="">Salon ilçesi *</option>{gymDistricts.map((d) => <option key={d} value={d}>{d}</option>)}</select>
                          </div>
                        </div>
                      )}
                    </AccordionSection>
                  )}
                  <AccordionSection id="social" title="Sosyal Medya & Web" subtitle="Opsiyonel" icon={Share2} tone="violet" open={openSection === 'social'} onToggle={toggleSection}>
                    <div className="space-y-3">
                      <SocialInput icon={Link2} value={form.linkedin} onChange={(v) => update({ linkedin: v })} placeholder="LinkedIn" />
                      <SocialInput icon={Share2} value={form.instagram} onChange={(v) => update({ instagram: v })} placeholder="Instagram" />
                      <SocialInput icon={Video} value={form.youtube} onChange={(v) => update({ youtube: v })} placeholder="YouTube" />
                      <SocialInput icon={Globe} value={form.website} onChange={(v) => update({ website: v })} placeholder="Kişisel web sitesi" />
                    </div>
                  </AccordionSection>
                </>
              )}

              {step === 2 && form.role === 'coach' && (
                <>
                  <AccordionSection id="specialties" title="Uzmanlık Alanları" subtitle="Kategorilere göre seçin" icon={Briefcase} tone="brand" open={openSection === 'specialties'} onToggle={toggleSection} count={form.specialties.length}>
                    <GroupedChipSelect groups={specialtyGroups} selected={form.specialties} onChange={(specialties) => update({ specialties })} otherValue={form.specialtyOther} onOtherChange={(v) => update({ specialtyOther: v })} />
                  </AccordionSection>
                  <AccordionSection id="experience" title="Deneyim" subtitle="Toplam yıl" icon={Award} tone="sky" open={openSection === 'experience'} onToggle={toggleSection}>
                    <input type="number" min={0} max={50} value={form.experienceYears} onChange={(e) => update({ experienceYears: e.target.value })} placeholder="Toplam deneyim (yıl) *" className={inputCls} />
                  </AccordionSection>
                  {COMPETENT_GROUP_ACCORDIONS.map((group) => (
                    <AccordionSection key={group.id} id={`group-${group.id}`} title={group.label} subtitle="Yetkin olduğunuz gruplar" icon={Users} tone={group.tone} open={openSection === `group-${group.id}`} onToggle={toggleSection} count={group.items.filter((i) => form.competentGroups.includes(i)).length}>
                      <FlatChipSelect items={[...group.items, OTHER_OPTION]} selected={form.competentGroups} onChange={(competentGroups) => update({ competentGroups })} tone={group.tone} showOther={false} />
                    </AccordionSection>
                  ))}
                  <AccordionSection id="group-other" title="Diğer Danışan Grubu" subtitle="Listede yoksa belirtin" icon={Users} tone="violet" open={openSection === 'group-other'} onToggle={toggleSection}>
                    <FlatChipSelect items={[]} selected={form.competentGroups} onChange={(competentGroups) => update({ competentGroups })} tone="violet" otherValue={form.competentGroupOther} onOtherChange={(v) => update({ competentGroupOther: v })} otherPlaceholder="Diğer danışan grubunu yazın" />
                  </AccordionSection>
                  {form.competentGroups.includes('Kronik Hastalığı Olan Bireyler') && (
                    <input value={form.chronicDiseaseExamples} onChange={(e) => update({ chronicDiseaseExamples: e.target.value })} placeholder="Kronik hastalık örnekleri *" className={inputCls} />
                  )}
                </>
              )}

              {step === 2 && form.role === 'dietitian' && (
                <>
                  <AccordionSection id="specialties" title="Uzmanlık Alanları" icon={Briefcase} tone="sage" open={openSection === 'specialties'} onToggle={toggleSection} count={form.specialties.length}>
                    <GroupedChipSelect groups={specialtyGroups} selected={form.specialties} onChange={(specialties) => update({ specialties })} otherValue={form.specialtyOther} onOtherChange={(v) => update({ specialtyOther: v })} />
                  </AccordionSection>
                  <AccordionSection id="diet-info" title="Mesleki Bilgiler" icon={GraduationCap} tone="emerald" open={openSection === 'diet-info'} onToggle={toggleSection}>
                    <div className="space-y-3">
                      <input type="number" min={0} max={50} value={form.experienceYears} onChange={(e) => update({ experienceYears: e.target.value })} placeholder="Deneyim (yıl) *" className={inputCls} />
                      <input value={form.graduationDepartment} onChange={(e) => update({ graduationDepartment: e.target.value })} placeholder="Mezuniyet bölümü *" className={inputCls} />
                      <textarea value={form.bio} onChange={(e) => update({ bio: e.target.value })} rows={3} placeholder="Kendinizi tanıtın (opsiyonel)" className={inputCls} />
                    </div>
                  </AccordionSection>
                </>
              )}

              {step === 3 && form.role === 'coach' && (
                <>
                  {needsAnyDocUpload && turnstileEnabled && !formSessionToken && (
                    <TurnstileWidget ref={widgetRef} onToken={setTurnstileToken} />
                  )}
                  <AccordionSection id="education" title="Eğitim Bilgisi" icon={GraduationCap} tone="brand" open={openSection === 'education'} onToggle={toggleSection}>
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <select value={form.educationLevel} onChange={(e) => update({ educationLevel: e.target.value })} className={selectCls}><option value="">Düzey *</option>{EDUCATION_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</select>
                        <input value={form.educationDepartment} onChange={(e) => update({ educationDepartment: e.target.value })} placeholder="Bölüm *" className={inputCls} />
                        <input type="number" step="0.01" min={0} max={4} value={form.educationGpa} onChange={(e) => update({ educationGpa: e.target.value })} placeholder="GPA" className={inputCls} />
                      </div>
                      <AnimatePresence>
                        {showCoachEducationDoc && (
                          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                            <InlineDocUpload
                              label="Eğitim belgesi PDF / görseli"
                              hint="Girdiğiniz eğitim bilgisine ait diploma veya mezuniyet belgesini yükleyin."
                              file={form.educationFile}
                              uploading={uploadingCerts}
                              onUpload={(file) => handleSingleDocUpload(file, (uploaded) => update({ educationFile: uploaded }))}
                              onRemove={() => update({ educationFile: null })}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </AccordionSection>
                  <AccordionSection id="official-cert" title="GSB Federasyon Antrenörlük Belgesi" subtitle="Federasyon ve kademe seçimi" icon={Award} tone="amber" open={openSection === 'official-cert'} onToggle={toggleSection} count={getOfficialCoachingCertLabels(form).length}>
                    <div className="space-y-3">
                      <FederationCertEditor
                        federationCerts={form.federationCerts}
                        noOfficialCoachingCert={form.noOfficialCoachingCert}
                        onChange={(federationCerts) => update({ federationCerts })}
                        onToggleNone={(checked) => update({
                          noOfficialCoachingCert: checked,
                          federationCerts: checked ? [] : (form.federationCerts?.length ? form.federationCerts : [{ ...EMPTY_FEDERATION_CERT }]),
                        })}
                      />
                      <AnimatePresence>
                        {showOfficialCertDoc && (
                          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                            <InlineDocUpload
                              label="Federasyon belgesi PDF / görseli"
                              hint="Seçtiğiniz federasyon antrenörlük belgesinin PDF veya fotoğrafını yükleyin."
                              files={form.certificateFiles}
                              multiple
                              uploading={uploadingCerts}
                              onUpload={(files) => handleBulkCertUpload(files)}
                              onRemove={(i) => update({ certificateFiles: form.certificateFiles.filter((_, idx) => idx !== i) })}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </AccordionSection>
                  <AccordionSection id="intl-cert" title="Uluslararası Sertifikalar" icon={Award} tone="sky" open={openSection === 'intl-cert'} onToggle={toggleSection} count={form.internationalCerts.length}>
                    <div className="space-y-3">
                      <FlatChipSelect items={INTERNATIONAL_CERTIFICATES} selected={form.internationalCerts} onChange={(internationalCerts) => update({ internationalCerts })} tone="sky" otherValue={form.certOtherNotes?.international} onOtherChange={(v) => update({ certOtherNotes: { ...form.certOtherNotes, international: v } })} otherPlaceholder="Diğer uluslararası sertifika" />
                      <AnimatePresence>
                        {showIntlCertDoc && (
                          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                            <InlineDocUpload
                              label="Uluslararası sertifika PDF / görseli"
                              hint="Seçtiğiniz uluslararası sertifikaların PDF veya fotoğraflarını yükleyin."
                              files={form.certificateFiles}
                              multiple
                              uploading={uploadingCerts}
                              onUpload={(files) => handleBulkCertUpload(files)}
                              onRemove={(i) => update({ certificateFiles: form.certificateFiles.filter((_, idx) => idx !== i) })}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </AccordionSection>
                  <AccordionSection id="branch-cert" title="Branşa Özel Sertifikalar" icon={Award} tone="emerald" open={openSection === 'branch-cert'} onToggle={toggleSection} count={form.branchCerts.length}>
                    <div className="space-y-3">
                      <FlatChipSelect items={BRANCH_CERTIFICATES} selected={form.branchCerts} onChange={(branchCerts) => update({ branchCerts })} tone="emerald" otherValue={form.certOtherNotes?.branch} onOtherChange={(v) => update({ certOtherNotes: { ...form.certOtherNotes, branch: v } })} otherPlaceholder="Diğer branş sertifikası" />
                      <AnimatePresence>
                        {showBranchCertDoc && (
                          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                            <InlineDocUpload
                              label="Branş sertifikası PDF / görseli"
                              hint="Seçtiğiniz branş sertifikalarının PDF veya fotoğraflarını yükleyin."
                              files={form.certificateFiles}
                              multiple
                              uploading={uploadingCerts}
                              onUpload={(files) => handleBulkCertUpload(files)}
                              onRemove={(i) => update({ certificateFiles: form.certificateFiles.filter((_, idx) => idx !== i) })}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </AccordionSection>
                </>
              )}

              {step === 3 && form.role === 'dietitian' && (
                <AccordionSection id="diet-edu" title="Eğitim & Sertifikalar" icon={GraduationCap} tone="sage" open={openSection === 'diet-edu'} onToggle={toggleSection}>
                  <div className="space-y-6">
                    {needsAnyDocUpload && turnstileEnabled && !formSessionToken && (
                      <TurnstileWidget ref={widgetRef} onToken={setTurnstileToken} />
                    )}
                    {form.education.map((edu, i) => (
                      <div key={`edu-${i}`} className="space-y-2">
                        <div className="grid gap-2 sm:grid-cols-3">
                          <input value={edu.degree} onChange={(e) => { const list = [...form.education]; list[i] = { ...edu, degree: e.target.value }; update({ education: list }) }} placeholder="Bölüm" className={inputCls} />
                          <input value={edu.school} onChange={(e) => { const list = [...form.education]; list[i] = { ...edu, school: e.target.value }; update({ education: list }) }} placeholder="Okul" className={inputCls} />
                          <input value={edu.year} onChange={(e) => { const list = [...form.education]; list[i] = { ...edu, year: e.target.value }; update({ education: list }) }} placeholder="Yıl" className={inputCls} />
                        </div>
                        <AnimatePresence>
                          {hasEducationEntryInfo(edu) && (
                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                              <InlineDocUpload
                                label="Eğitim belgesi PDF / görseli"
                                hint="Bu eğitim kaydına ait diploma veya mezuniyet belgesini yükleyin."
                                file={edu.file}
                                uploading={uploadingCerts}
                                onUpload={(file) => handleSingleDocUpload(file, (uploaded) => {
                                  setForm((f) => {
                                    const list = [...(f.education || [])]
                                    list[i] = { ...list[i], file: uploaded }
                                    return { ...f, education: list }
                                  })
                                })}
                                onRemove={() => {
                                  setForm((f) => {
                                    const list = [...(f.education || [])]
                                    list[i] = { ...list[i], file: null }
                                    return { ...f, education: list }
                                  })
                                }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                    <button type="button" onClick={() => update({ education: [...form.education, { degree: '', school: '', year: '', file: null }] })} className="text-xs font-medium text-brand-600"><Plus className="inline h-3 w-3" /> Eğitim ekle</button>
                    {form.certificates.map((cert, i) => (
                      <div key={`cert-${i}`} className="space-y-2">
                        <div className="grid gap-2 sm:grid-cols-3">
                          <input value={cert.name} onChange={(e) => { const list = [...form.certificates]; list[i] = { ...cert, name: e.target.value }; update({ certificates: list }) }} placeholder="Sertifika" className={inputCls} />
                          <input value={cert.issuer} onChange={(e) => { const list = [...form.certificates]; list[i] = { ...cert, issuer: e.target.value }; update({ certificates: list }) }} placeholder="Kurum" className={inputCls} />
                          <input value={cert.year} onChange={(e) => { const list = [...form.certificates]; list[i] = { ...cert, year: e.target.value }; update({ certificates: list }) }} placeholder="Yıl" className={inputCls} />
                        </div>
                        <AnimatePresence>
                          {hasCertificateEntryInfo(cert) && (
                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                              <InlineDocUpload
                                label="Sertifika belgesi PDF / görseli"
                                hint="Bu sertifikaya ait PDF veya fotoğrafı yükleyin."
                                file={cert.file}
                                uploading={uploadingCerts}
                                onUpload={(file) => handleSingleDocUpload(file, (uploaded) => {
                                  setForm((f) => {
                                    const list = [...(f.certificates || [])]
                                    list[i] = { ...list[i], file: uploaded }
                                    return { ...f, certificates: list }
                                  })
                                })}
                                onRemove={() => {
                                  setForm((f) => {
                                    const list = [...(f.certificates || [])]
                                    list[i] = { ...list[i], file: null }
                                    return { ...f, certificates: list }
                                  })
                                }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                    <button type="button" onClick={() => update({ certificates: [...form.certificates, { name: '', issuer: '', year: '', file: null }] })} className="text-xs font-medium text-brand-600"><Plus className="inline h-3 w-3" /> Sertifika ekle</button>
                  </div>
                </AccordionSection>
              )}

              {step === 4 && form.role === 'coach' && (
                <>
                  <AccordionSection id="approaches" title="Çalışma Yaklaşımlarınız" icon={Sparkles} tone="teal" open={openSection === 'approaches'} onToggle={toggleSection} count={form.workApproaches.length}>
                    <FlatChipSelect items={WORK_APPROACHES} selected={form.workApproaches} onChange={(workApproaches) => update({ workApproaches })} tone="teal" otherValue={form.workApproachOther} onOtherChange={(v) => update({ workApproachOther: v })} otherPlaceholder="Diğer yaklaşımınızı yazın" />
                  </AccordionSection>
                  <AccordionSection id="service-areas" title="Hizmet Verdiğiniz Alanlar" icon={Target} tone="amber" open={openSection === 'service-areas'} onToggle={toggleSection} count={form.serviceAreas.length}>
                    <ServiceAreaGrid items={SERVICE_AREAS} selected={form.serviceAreas} onChange={(serviceAreas) => update({ serviceAreas })} otherValue={form.serviceAreaOther} onOtherChange={(v) => update({ serviceAreaOther: v })} />
                  </AccordionSection>
                </>
              )}

              {step === 4 && form.role === 'dietitian' && (
                <div className="rounded-2xl border border-sage-200 bg-sage-50/50 p-5 text-center text-sm text-cream-800/70">
                  Diyetisyen başvurunuz tamamlandı. Devam ederek özeti görüntüleyip gönderebilirsiniz.
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex gap-3 rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => {
                  const prevStep = s - 1
                  setOpenSection(defaultOpenSection(prevStep, form.role))
                  return prevStep
                })}
                className="btn-wellness-outline flex-1 !py-3"
              >
                <ArrowLeft className="h-4 w-4" /> Geri
              </button>
            )}
            <button type="button" onClick={next} className="btn-wellness flex-1 !py-3">
              {step === 4 ? 'Özeti Gör & Gönder' : 'Devam'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <ApplicationSummaryModal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        form={form}
        submitting={submitting}
        onSubmit={submit}
        turnstileSlot={
          turnstileEnabled && !formSessionToken
            ? <TurnstileWidget ref={widgetRef} onToken={setTurnstileToken} />
            : null
        }
      />
    </div>
  )
}

function SocialInput({ icon: Icon, value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-400" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputCls} pl-10`} />
    </div>
  )
}

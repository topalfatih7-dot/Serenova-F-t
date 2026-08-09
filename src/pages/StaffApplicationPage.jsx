import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, CheckCircle, Lock,
  Plus, Briefcase, GraduationCap, Award,
  Share2, Video, Link2, Globe, MapPin, Building2, Sparkles,
  Target, Users, User, Dumbbell, Apple,
} from 'lucide-react'
import SeoHead from '../components/seo/SeoHead'
import PhoneField from '../components/ui/PhoneField'
import PhotoUpload from '../components/ui/PhotoUpload'
import StaffApplicationHero from '../components/staff/StaffApplicationHero'
import StaffApplySelectOverview from '../components/staff/StaffApplySelectOverview'
import { useToast } from '../context/ToastContext'
import TurnstileWidget from '../components/security/TurnstileWidget'
import { useTurnstile } from '../hooks/useTurnstile'
import {
  submitStaffApplication,
  uploadStaffApplicationDoc,
  precheckStaffApplicationEmail,
} from '../services/supabaseDb'
import { CITY_NAMES, getDistricts } from '../data/turkeyCities'
import {
  AccordionSection,
  GroupedChipSelect,
  FlatChipSelect,
  ServiceAreaGrid,
  InlineDocUpload,
  ApplicationSummaryModal,
  FederationCertEditor,
  RoleChangeConfirmModal,
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
  hasCertificateEntryInfo,
  resetRoleSpecificFields,
} from '../data/staffApplication'
import { staffRoleLabel } from '../utils/staffRoles'

function roleFromSearchParams(params) {
  const r = params.get('role')
  if (r === 'dietitian' || r === 'coach') return r
  return null
}

const inputCls = 'w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100'
const selectCls = `${inputCls} appearance-none`

const STEP_DEFAULT_SECTION = {
  coach: { 1: 'basic', 2: 'specialties', 3: 'graduation-doc', 4: 'approaches' },
  dietitian: { 1: 'basic', 2: 'specialties', 3: 'graduation-doc', 4: 'approaches' },
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
  const [params, setSearchParams] = useSearchParams()
  const { toast } = useToast()
  const [phase, setPhase] = useState('select')
  const [gateRole, setGateRole] = useState(() => roleFromSearchParams(params))
  const [roleChangeOpen, setRoleChangeOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [openSection, setOpenSection] = useState('basic')
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [form, setForm] = useState(() => {
    const role = roleFromSearchParams(params) || 'coach'
    return { ...EMPTY_STAFF_APPLICATION, role }
  })
  const [submitting, setSubmitting] = useState(false)
  const [uploadingCerts, setUploadingCerts] = useState(false)
  const [precheckingEmail, setPrecheckingEmail] = useState(false)
  const [emailFieldError, setEmailFieldError] = useState('')
  const [done, setDone] = useState(false)
  const [formSessionToken, setFormSessionToken] = useState('')
  const {
    enabled: turnstileEnabled,
    widgetRef,
    setToken: setTurnstileToken,
    getTokenForSubmit,
    reset: resetTurnstile,
  } = useTurnstile()

  const update = (patch) => {
    if (Object.prototype.hasOwnProperty.call(patch, 'email')) setEmailFieldError('')
    setForm((f) => ({ ...f, ...patch }))
  }

  const handleSelectGateRole = (role) => {
    setGateRole(role)
    setForm((f) => (f.role === role ? { ...f, role } : resetRoleSpecificFields(f, role)))
    setSearchParams({ role }, { replace: true })
  }

  const handleStartApplication = () => {
    if (!gateRole) {
      toast('Devam etmek için Koç veya Diyetisyen seçin', 'error')
      return
    }
    setForm((f) => ({ ...f, role: gateRole }))
    setStep(1)
    setOpenSection(defaultOpenSection(1, gateRole))
    setSummaryOpen(false)
    setSearchParams({ role: gateRole }, { replace: true })
    setPhase('form')
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }

  const confirmRoleChange = () => {
    const next = resetRoleSpecificFields(form, form.role)
    setForm(next)
    setGateRole(next.role)
    setStep(1)
    setOpenSection('basic')
    setSummaryOpen(false)
    setRoleChangeOpen(false)
    setPhase('select')
    setSearchParams({ role: next.role }, { replace: true })
  }

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

  const advanceStep = () => {
    setStep((s) => {
      const nextStep = s + 1
      setOpenSection(defaultOpenSection(nextStep, form.role))
      return nextStep
    })
  }

  const next = async () => {
    if (stepErrors.length) {
      toast(stepErrors[0], 'error')
      return
    }
    if (step === 4) {
      setSummaryOpen(true)
      return
    }

    if (step === 1) {
      setPrecheckingEmail(true)
      setEmailFieldError('')
      try {
        let captchaToken = ''
        try {
          captchaToken = await obtainCaptchaIfNeeded()
        } catch (err) {
          toast(err?.message || 'Bot doğrulamasını tamamlayın', 'error')
          resetTurnstile()
          return
        }
        const r = await precheckStaffApplicationEmail(form.email, {
          turnstileToken: captchaToken,
          formSessionToken,
        })
        if (r.formSessionToken) setFormSessionToken(r.formSessionToken)
        if (!r.available) {
          const msg = r.error || 'Bu e-posta kullanılamaz'
          setEmailFieldError(msg)
          toast(msg, 'error')
          if (!r.formSessionToken) resetTurnstile()
          return
        }
        if (!r.failOpen) resetTurnstile()
      } finally {
        setPrecheckingEmail(false)
      }
    }

    advanceStep()
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

  if (done) {
    return (
      <div className="min-h-screen staff-apply-page px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="staff-apply-success mx-auto max-w-lg"
        >
          <div className="staff-apply-success__icon" aria-hidden>
            <CheckCircle className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <p className="staff-apply-brand staff-apply-brand--sm mt-5">Yeni Form</p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-cream-900 sm:text-[1.75rem]">
            Başvurunuz alındı
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-cream-800/65">
            Ekibimiz başvurunuzu inceleyecek. Onaylandığında{' '}
            <span className="font-medium text-cream-900">{form.email}</span> adresine giriş bilgileriniz iletilecektir.
          </p>
          <Link to="/" className="btn-wellness mt-7 inline-flex !px-7 !py-3">
            Ana Sayfaya Dön
          </Link>
        </motion.div>
      </div>
    )
  }

  const RoleIcon = form.role === 'dietitian' ? Apple : Dumbbell
  const stepProgress = Math.max(0, Math.min(1, (step - 1) / (APPLICATION_STEPS.length - 1)))

  return (
    <div className="staff-apply-page">
      <SeoHead title="Kadromuza Katıl — Koç & Diyetisyen Başvurusu" description="Yeni Form ekibine koç veya diyetisyen olarak başvurun." canonicalPath="/team/apply" />

      <StaffApplicationHero
        phase={phase}
        selectedRole={gateRole}
        onSelectRole={handleSelectGateRole}
        onStart={handleStartApplication}
        lockedRole={form.role}
      />

      <div className={`staff-apply-shell relative mx-auto px-4 pb-20 pt-7 sm:px-6 ${phase === 'select' ? 'max-w-5xl' : 'max-w-3xl'}`}>
        <Link
          to={form.role === 'dietitian' ? '/team/dietitians' : '/team/coaches'}
          className="relative z-[1] mb-7 inline-flex items-center gap-1.5 text-sm font-medium text-cream-800/50 transition hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" /> Kadroya dön
        </Link>

        {phase === 'select' && (
          <div className="mb-4">
            <StaffApplySelectOverview />
          </div>
        )}

        {phase === 'form' && (
          <>
            <div className="staff-apply-role-chip relative z-[1] mb-7">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm ${
                  form.role === 'dietitian'
                    ? 'bg-gradient-to-br from-sage-500 to-sage-700'
                    : 'bg-gradient-to-br from-brand-500 to-brand-700'
                }`}>
                  <RoleIcon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-cream-900">
                    <Lock className="h-3.5 w-3.5 text-cream-800/35" aria-hidden />
                    {staffRoleLabel(form.role)} başvurusu
                  </p>
                  <p className="mt-0.5 text-[11px] text-cream-800/45">Adım {step} / {APPLICATION_STEPS.length}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRoleChangeOpen(true)}
                className="text-xs font-semibold text-brand-600 underline-offset-2 hover:underline"
              >
                Rolü değiştir
              </button>
            </div>

            <div className="staff-apply-stepper relative z-[1] mb-8" aria-label="Başvuru adımları">
              <div className="staff-apply-stepper__track" aria-hidden>
                <div className="staff-apply-stepper__fill" style={{ width: `${stepProgress * 100}%` }} />
              </div>
              {APPLICATION_STEPS.map((s) => {
                const state = step > s.id ? 'is-done' : step === s.id ? 'is-current' : ''
                return (
                  <div key={s.id} className={`staff-apply-step ${state}`}>
                    <div className="staff-apply-step__dot">
                      {step > s.id ? <CheckCircle className="h-4 w-4" /> : s.id}
                    </div>
                    <p className="staff-apply-step__label">{s.label}</p>
                  </div>
                )
              })}
            </div>

            <div className="relative z-[1] space-y-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${step}-${form.role}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-3"
                >
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
                      <div>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => update({ email: e.target.value })}
                          placeholder="E-posta *"
                          className={`${inputCls} ${emailFieldError ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100' : ''}`}
                          aria-invalid={Boolean(emailFieldError)}
                          aria-describedby={emailFieldError ? 'staff-email-error' : undefined}
                        />
                        {emailFieldError ? (
                          <p id="staff-email-error" className="mt-1.5 text-xs font-medium text-rose-600">
                            {emailFieldError}
                          </p>
                        ) : (
                          <p className="mt-1.5 text-[11px] text-cream-800/50">
                            Bu e-posta henüz kayıtlı bir hesaba ait olmamalı. Onay sonrası giriş bilgileri buraya gönderilir.
                          </p>
                        )}
                      </div>
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
                  <AccordionSection id="diet-info" title="Mesleki Bilgiler" subtitle="Bu bilgiler halka açık profilinizde görünür" icon={GraduationCap} tone="emerald" open={openSection === 'diet-info'} onToggle={toggleSection}>
                    <div className="space-y-3">
                      <p className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-2.5 text-[11px] leading-relaxed text-emerald-900/80">
                        Bu bölümdeki bilgiler onay sonrası halka açık diyetisyen profilinizde yayınlanır.
                      </p>
                      <input type="number" min={0} max={50} value={form.experienceYears} onChange={(e) => update({ experienceYears: e.target.value })} placeholder="Deneyim (yıl) *" className={inputCls} />
                      <input value={form.graduationDepartment} onChange={(e) => update({ graduationDepartment: e.target.value })} placeholder="Mezuniyet bölümü *" className={inputCls} />
                      <textarea value={form.bio} onChange={(e) => update({ bio: e.target.value })} rows={3} placeholder="Kendinizi tanıtın (opsiyonel)" className={inputCls} />
                    </div>
                  </AccordionSection>
                </>
              )}

              {step === 3 && (
                <>
                  {turnstileEnabled && !formSessionToken && (
                    <TurnstileWidget ref={widgetRef} onToken={setTurnstileToken} />
                  )}
                  <AccordionSection id="graduation-doc" title="e-Devlet Mezuniyet Belgesi" subtitle="Zorunlu" icon={GraduationCap} tone="amber" open={openSection === 'graduation-doc'} onToggle={toggleSection}>
                    <InlineDocUpload
                      label="e-Devlet mezuniyet belgesi PDF / görseli"
                      hint="e-Devlet'ten aldığınız mezuniyet belgesini yükleyin (PDF, JPG, PNG)."
                      file={form.graduationDocFile}
                      uploading={uploadingCerts}
                      required
                      onUpload={(file) => handleSingleDocUpload(file, (uploaded) => update({ graduationDocFile: uploaded }))}
                      onRemove={() => update({ graduationDocFile: null })}
                    />
                  </AccordionSection>
                </>
              )}

              {step === 3 && form.role === 'coach' && (
                <>
                  <AccordionSection id="education" title="Eğitim Bilgisi" subtitle="Opsiyonel" icon={GraduationCap} tone="brand" open={openSection === 'education'} onToggle={toggleSection}>
                    <div className="space-y-3">
                      {form.education.map((edu, i) => (
                        <div key={`edu-${i}`} className="grid gap-2 sm:grid-cols-2">
                          <input
                            value={edu.school || ''}
                            onChange={(e) => {
                              const list = [...form.education]
                              list[i] = { ...edu, school: e.target.value }
                              update({ education: list })
                            }}
                            placeholder="Okul adı (opsiyonel)"
                            className={inputCls}
                          />
                          <select
                            value={edu.level || ''}
                            onChange={(e) => {
                              const list = [...form.education]
                              list[i] = { ...edu, level: e.target.value }
                              update({ education: list })
                            }}
                            className={`${selectCls} ${edu.level ? '' : 'text-cream-800/40'}`}
                          >
                            <option value="">Düzey (opsiyonel)</option>
                            {EDUCATION_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                          </select>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => update({ education: [...form.education, { school: '', level: '' }] })}
                        className="text-xs font-medium text-brand-600"
                      >
                        <Plus className="inline h-3 w-3" /> Eğitim ekle
                      </button>
                    </div>
                  </AccordionSection>
                  <AccordionSection id="official-cert" title="GSB Federasyon Antrenörlük Belgesi" subtitle="Opsiyonel" icon={Award} tone="amber" open={openSection === 'official-cert'} onToggle={toggleSection} count={getOfficialCoachingCertLabels(form).length}>
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
                      <InlineDocUpload
                        label="Federasyon belgesi PDF / görseli"
                        hint="Varsa federasyon antrenörlük belgenizin PDF veya fotoğrafını yükleyin."
                        files={form.certificateFiles}
                        multiple
                        required={false}
                        uploading={uploadingCerts}
                        onUpload={(files) => handleBulkCertUpload(files)}
                        onRemove={(i) => update({ certificateFiles: form.certificateFiles.filter((_, idx) => idx !== i) })}
                      />
                    </div>
                  </AccordionSection>
                  <AccordionSection id="intl-cert" title="Uluslararası Sertifikalar" subtitle="Opsiyonel" icon={Award} tone="sky" open={openSection === 'intl-cert'} onToggle={toggleSection} count={form.internationalCerts.length}>
                    <div className="space-y-3">
                      <FlatChipSelect items={INTERNATIONAL_CERTIFICATES} selected={form.internationalCerts} onChange={(internationalCerts) => update({ internationalCerts })} tone="sky" otherValue={form.certOtherNotes?.international} onOtherChange={(v) => update({ certOtherNotes: { ...form.certOtherNotes, international: v } })} otherPlaceholder="Diğer uluslararası sertifika" />
                      <InlineDocUpload
                        label="Uluslararası sertifika PDF / görseli"
                        hint="Varsa uluslararası sertifikalarınızın PDF veya fotoğraflarını yükleyin."
                        files={form.certificateFiles}
                        multiple
                        required={false}
                        uploading={uploadingCerts}
                        onUpload={(files) => handleBulkCertUpload(files)}
                        onRemove={(i) => update({ certificateFiles: form.certificateFiles.filter((_, idx) => idx !== i) })}
                      />
                    </div>
                  </AccordionSection>
                  <AccordionSection id="branch-cert" title="Branşa Özel Sertifikalar" subtitle="Opsiyonel" icon={Award} tone="emerald" open={openSection === 'branch-cert'} onToggle={toggleSection} count={form.branchCerts.length}>
                    <div className="space-y-3">
                      <FlatChipSelect items={BRANCH_CERTIFICATES} selected={form.branchCerts} onChange={(branchCerts) => update({ branchCerts })} tone="emerald" otherValue={form.certOtherNotes?.branch} onOtherChange={(v) => update({ certOtherNotes: { ...form.certOtherNotes, branch: v } })} otherPlaceholder="Diğer branş sertifikası" />
                      <InlineDocUpload
                        label="Branş sertifikası PDF / görseli"
                        hint="Varsa branş sertifikalarınızın PDF veya fotoğraflarını yükleyin."
                        files={form.certificateFiles}
                        multiple
                        required={false}
                        uploading={uploadingCerts}
                        onUpload={(files) => handleBulkCertUpload(files)}
                        onRemove={(i) => update({ certificateFiles: form.certificateFiles.filter((_, idx) => idx !== i) })}
                      />
                    </div>
                  </AccordionSection>
                </>
              )}

              {step === 3 && form.role === 'dietitian' && (
                <AccordionSection id="diet-edu" title="Eğitim & Sertifikalar" subtitle="Opsiyonel" icon={GraduationCap} tone="sage" open={openSection === 'diet-edu'} onToggle={toggleSection}>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-cream-800/70">Eğitim (opsiyonel)</p>
                      {form.education.map((edu, i) => (
                        <div key={`edu-${i}`} className="grid gap-2 sm:grid-cols-2">
                          <input
                            value={edu.school || ''}
                            onChange={(e) => {
                              const list = [...form.education]
                              list[i] = { ...edu, school: e.target.value }
                              update({ education: list })
                            }}
                            placeholder="Okul adı"
                            className={inputCls}
                          />
                          <select
                            value={edu.level || ''}
                            onChange={(e) => {
                              const list = [...form.education]
                              list[i] = { ...edu, level: e.target.value }
                              update({ education: list })
                            }}
                            className={`${selectCls} ${edu.level ? '' : 'text-cream-800/40'}`}
                          >
                            <option value="">Düzey</option>
                            {EDUCATION_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                          </select>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => update({ education: [...form.education, { school: '', level: '' }] })}
                        className="text-xs font-medium text-brand-600"
                      >
                        <Plus className="inline h-3 w-3" /> Eğitim ekle
                      </button>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-cream-800/70">Sertifikalar (opsiyonel)</p>
                      {form.certificates.map((cert, i) => (
                        <div key={`cert-${i}`} className="space-y-2">
                          <input
                            value={cert.name || ''}
                            onChange={(e) => {
                              const list = [...form.certificates]
                              list[i] = { ...cert, name: e.target.value }
                              update({ certificates: list })
                            }}
                            placeholder="Sertifika adı"
                            className={inputCls}
                          />
                          {hasCertificateEntryInfo(cert) && (
                            <InlineDocUpload
                              label="Sertifika belgesi PDF / görseli"
                              hint="İsterseniz bu sertifikaya ait PDF veya fotoğrafı yükleyin."
                              file={cert.file}
                              required={false}
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
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => update({ certificates: [...form.certificates, { name: '', file: null }] })}
                        className="text-xs font-medium text-brand-600"
                      >
                        <Plus className="inline h-3 w-3" /> Sertifika ekle
                      </button>
                    </div>
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
                <div className="rounded-2xl border border-sage-200/80 bg-gradient-to-br from-sage-50/80 to-white p-6 text-center">
                  <p className="font-display text-base font-semibold text-cream-900">Hazırsınız</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-cream-800/65">
                    Diyetisyen başvurunuz tamamlandı. Devam ederek özeti görüntüleyip gönderebilirsiniz.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="staff-apply-nav mt-6">
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
            <button
              type="button"
              onClick={next}
              disabled={precheckingEmail}
              className="btn-wellness flex-1 !py-3 disabled:opacity-60"
            >
              {precheckingEmail
                ? 'E-posta kontrol ediliyor…'
                : step === 4
                  ? 'Özeti Gör & Gönder'
                  : 'Devam'}
              {!precheckingEmail && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
            </div>
          </>
        )}
      </div>

      <ApplicationSummaryModal
        open={summaryOpen && phase === 'form'}
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

      <RoleChangeConfirmModal
        open={roleChangeOpen}
        onClose={() => setRoleChangeOpen(false)}
        onConfirm={confirmRoleChange}
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

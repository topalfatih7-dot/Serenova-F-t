import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, UserPlus, Dumbbell, Apple, CheckCircle,
  Plus, Trash2, Briefcase, GraduationCap, Award, Clock,
} from 'lucide-react'
import SeoHead from '../components/seo/SeoHead'
import PhoneField from '../components/ui/PhoneField'
import { AVAILABILITY_WEEKDAYS } from '../services/availability'
import { useToast } from '../context/ToastContext'
import { submitStaffApplication } from '../services/supabaseDb'
import {
  EMPTY_STAFF_APPLICATION,
  COACH_SPECIALTIES,
  DIETITIAN_SPECIALTIES,
  CERTIFICATION_TYPES,
  validateStaffApplication,
} from '../data/staffApplication'
import { staffRoleLabel } from '../utils/staffRoles'

const STEPS = [
  { id: 1, label: 'Rol & İletişim' },
  { id: 2, label: 'Uzmanlık' },
  { id: 3, label: 'Eğitim & Sertifika' },
  { id: 4, label: 'Özet & Gönder' },
]

function toggleInList(list, item) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

export default function StaffApplicationPage() {
  const [params] = useSearchParams()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(() => ({
    ...EMPTY_STAFF_APPLICATION,
    role: params.get('role') === 'dietitian' ? 'dietitian' : 'coach',
  }))
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))
  const specialties = form.role === 'dietitian' ? DIETITIAN_SPECIALTIES : COACH_SPECIALTIES
  const RoleIcon = form.role === 'dietitian' ? Apple : Dumbbell

  const stepErrors = useMemo(() => {
    if (step === 1) {
      const e = []
      if (!form.name?.trim()) e.push('Ad soyad gerekli')
      if (!form.email?.trim()) e.push('E-posta gerekli')
      if (!form.phone?.trim()) e.push('Telefon gerekli')
      if (!form.city?.trim()) e.push('Şehir gerekli')
      return e
    }
    if (step === 2) {
      const e = []
      if (!form.title?.trim()) e.push('Ünvan gerekli')
      if (!form.specialties.length) e.push('Uzmanlık seçin')
      if (form.experienceYears === '' || form.experienceYears == null) e.push('Deneyim yılı gerekli')
      if (!form.bio?.trim() || form.bio.trim().length < 40) e.push('Tanıtım metni en az 40 karakter')
      if (form.role === 'coach' && !form.primaryCertification) e.push('Sertifika türü seçin')
      if (form.role === 'dietitian' && !form.graduationDepartment?.trim()) e.push('Mezuniyet bölümü gerekli')
      if (form.role === 'dietitian' && !form.licenseNumber?.trim()) e.push('Diploma / oda no gerekli')
      return e
    }
    if (step === 3) {
      const e = []
      if (!form.education.some((x) => x.degree?.trim() && x.school?.trim())) e.push('Eğitim bilgisi girin')
      if (!form.certificates.some((x) => x.name?.trim())) e.push('Sertifika / diploma girin')
      return e
    }
    return validateStaffApplication(form)
  }, [step, form])

  const next = () => {
    if (stepErrors.length) {
      toast(stepErrors[0], 'error')
      return
    }
    setStep((s) => Math.min(4, s + 1))
  }

  const submit = async () => {
    const errors = validateStaffApplication(form)
    if (errors.length) {
      toast(errors[0], 'error')
      return
    }
    setSubmitting(true)
    try {
      const r = await submitStaffApplication(form)
      if (!r.success) {
        toast(r.error || 'Başvuru gönderilemedi', 'error')
        return
      }
      setDone(true)
      toast('Başvurunuz alındı! İnceleme sonrası e-posta ile bilgilendirileceksiniz.', 'success')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-cream-50/30 px-4 py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-sage-200 bg-white p-8 text-center shadow-lg">
          <CheckCircle className="mx-auto h-14 w-14 text-sage-500" />
          <h1 className="mt-4 font-display text-2xl font-bold text-cream-900">Başvurunuz Alındı</h1>
          <p className="mt-2 text-sm text-cream-800/65">
            Ekibimiz başvurunuzu inceleyecek. Onaylandığında {form.email} adresine giriş bilgileriniz iletilecektir.
          </p>
          <Link to="/" className="btn-wellness mt-6 inline-flex !py-3 !px-6">Ana Sayfaya Dön</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white">
      <SeoHead
        title="Kadromuza Katıl — Koç & Diyetisyen Başvurusu"
        description="Yeni Form ekibine koç veya diyetisyen olarak başvurun. Uzman kadromuza katılın."
        canonicalPath="/team/apply"
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link to={form.role === 'dietitian' ? '/team/dietitians' : '/team/coaches'} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-cream-800/60 hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Kadroya dön
        </Link>

        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600">
            <UserPlus className="h-3.5 w-3.5" /> Kadromuza Katıl
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold text-cream-900 sm:text-4xl">Uzman Başvuru Formu</h1>
          <p className="mt-2 text-sm text-cream-800/60">Koç veya diyetisyen olarak ekibimize katılmak için bilgilerinizi paylaşın</p>
        </div>

        {/* Rol seçimi */}
        <div className="mb-6 flex justify-center gap-3">
          {['coach', 'dietitian'].map((r) => {
            const Icon = r === 'dietitian' ? Apple : Dumbbell
            const active = form.role === r
            return (
              <button
                key={r}
                type="button"
                onClick={() => update({ role: r, specialties: [] })}
                className={`flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                  active ? 'border-brand-500 bg-brand-500 text-white shadow-md' : 'border-cream-200 bg-white text-cream-800 hover:border-brand-200'
                }`}
              >
                <Icon className="h-4 w-4" /> {staffRoleLabel(r)}
              </button>
            )
          })}
        </div>

        {/* Adım göstergesi */}
        <div className="mb-8 flex justify-between gap-1">
          {STEPS.map((s) => (
            <div key={s.id} className={`flex-1 text-center ${step >= s.id ? 'text-brand-600' : 'text-cream-300'}`}>
              <div className={`mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step >= s.id ? 'bg-brand-500 text-white' : 'bg-cream-100'}`}>
                {step > s.id ? <CheckCircle className="h-4 w-4" /> : s.id}
              </div>
              <p className="hidden text-[10px] font-medium sm:block">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-sm sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="flex items-center gap-2 font-semibold text-cream-900"><RoleIcon className="h-5 w-5 text-brand-500" /> Kişisel Bilgiler</h2>
                  <input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Ad Soyad *" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
                  <input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} placeholder="E-posta *" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
                  <PhoneField value={form.phone} onValueChange={(phone) => update({ phone })} label="" />
                  <input value={form.city} onChange={(e) => update({ city: e.target.value })} placeholder="Şehir *" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="flex items-center gap-2 font-semibold text-cream-900"><Briefcase className="h-5 w-5 text-brand-500" /> Uzmanlık & Deneyim</h2>
                  <input value={form.title} onChange={(e) => update({ title: e.target.value })} placeholder="Ünvan (ör. Performans Koçu) *" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
                  <div>
                    <p className="mb-2 text-xs font-semibold text-cream-800/70">Uzmanlık alanları *</p>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((s) => (
                        <button key={s} type="button" onClick={() => update({ specialties: toggleInList(form.specialties, s) })}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${form.specialties.includes(s) ? 'bg-brand-500 text-white' : 'bg-cream-100 text-cream-800'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input type="number" min={0} max={50} value={form.experienceYears} onChange={(e) => update({ experienceYears: e.target.value })} placeholder="Toplam deneyim (yıl) *" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
                  {form.role === 'coach' && (
                    <>
                      <select value={form.primaryCertification} onChange={(e) => update({ primaryCertification: e.target.value })} className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm">
                        <option value="">Birincil sertifika türü *</option>
                        {CERTIFICATION_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.onlineCoachingExperience} onChange={(e) => update({ onlineCoachingExperience: e.target.checked })} className="accent-brand-500" />
                        Online koçluk deneyimim var
                      </label>
                    </>
                  )}
                  {form.role === 'dietitian' && (
                    <>
                      <input value={form.graduationDepartment} onChange={(e) => update({ graduationDepartment: e.target.value })} placeholder="Mezuniyet bölümü (Beslenme ve Diyetetik vb.) *" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
                      <input value={form.licenseNumber} onChange={(e) => update({ licenseNumber: e.target.value })} placeholder="Diploma / TDD oda kayıt no *" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
                    </>
                  )}
                  <textarea value={form.bio} onChange={(e) => update({ bio: e.target.value })} rows={4} placeholder="Kendinizi tanıtın — deneyiminiz, yaklaşımınız, neden Yeni Form? (min. 40 karakter) *" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
                  <input value={form.linkedin} onChange={(e) => update({ linkedin: e.target.value })} placeholder="LinkedIn / portfolyo (opsiyonel)" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="mb-3 flex items-center gap-2 font-semibold text-cream-900"><GraduationCap className="h-5 w-5 text-brand-500" /> Eğitim</h2>
                    {form.education.map((edu, i) => (
                      <div key={i} className="mb-2 grid gap-2 sm:grid-cols-3">
                        <input value={edu.degree} onChange={(e) => { const list = [...form.education]; list[i] = { ...edu, degree: e.target.value }; update({ education: list }) }} placeholder="Bölüm / Derece" className="rounded-xl border border-cream-200 px-3 py-2 text-sm" />
                        <input value={edu.school} onChange={(e) => { const list = [...form.education]; list[i] = { ...edu, school: e.target.value }; update({ education: list }) }} placeholder="Okul" className="rounded-xl border border-cream-200 px-3 py-2 text-sm" />
                        <input value={edu.year} onChange={(e) => { const list = [...form.education]; list[i] = { ...edu, year: e.target.value }; update({ education: list }) }} placeholder="Yıl" className="rounded-xl border border-cream-200 px-3 py-2 text-sm" />
                      </div>
                    ))}
                    <button type="button" onClick={() => update({ education: [...form.education, { degree: '', school: '', year: '' }] })} className="text-xs font-medium text-brand-600"><Plus className="inline h-3 w-3" /> Eğitim ekle</button>
                  </div>
                  <div>
                    <h2 className="mb-3 flex items-center gap-2 font-semibold text-cream-900"><Award className="h-5 w-5 text-brand-500" /> Sertifikalar</h2>
                    {form.certificates.map((cert, i) => (
                      <div key={i} className="mb-2 grid gap-2 sm:grid-cols-3">
                        <input value={cert.name} onChange={(e) => { const list = [...form.certificates]; list[i] = { ...cert, name: e.target.value }; update({ certificates: list }) }} placeholder="Sertifika adı" className="rounded-xl border border-cream-200 px-3 py-2 text-sm" />
                        <input value={cert.issuer} onChange={(e) => { const list = [...form.certificates]; list[i] = { ...cert, issuer: e.target.value }; update({ certificates: list }) }} placeholder="Kurum" className="rounded-xl border border-cream-200 px-3 py-2 text-sm" />
                        <input value={cert.year} onChange={(e) => { const list = [...form.certificates]; list[i] = { ...cert, year: e.target.value }; update({ certificates: list }) }} placeholder="Yıl" className="rounded-xl border border-cream-200 px-3 py-2 text-sm" />
                      </div>
                    ))}
                    <button type="button" onClick={() => update({ certificates: [...form.certificates, { name: '', issuer: '', year: '' }] })} className="text-xs font-medium text-brand-600"><Plus className="inline h-3 w-3" /> Sertifika ekle</button>
                  </div>
                  <div>
                    <h2 className="mb-2 flex items-center gap-2 font-semibold text-cream-900"><Clock className="h-5 w-5 text-brand-500" /> Müsaitlik</h2>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {AVAILABILITY_WEEKDAYS.map((d) => (
                        <button key={d.value} type="button" onClick={() => update({ workDays: toggleInList(form.workDays, d.value) })}
                          className={`rounded-lg px-2 py-1 text-xs font-semibold ${form.workDays.includes(d.value) ? 'bg-brand-500 text-white' : 'bg-cream-100'}`}>
                          {d.short}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="time" value={form.workStart} onChange={(e) => update({ workStart: e.target.value })} className="rounded-xl border border-cream-200 px-3 py-2 text-sm" />
                      <input type="time" value={form.workEnd} onChange={(e) => update({ workEnd: e.target.value })} className="rounded-xl border border-cream-200 px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 text-sm">
                  <h2 className="font-semibold text-cream-900">Başvuru Özeti</h2>
                  <div className="rounded-2xl bg-cream-50 p-4 space-y-2">
                    <p><span className="text-cream-800/50">Rol:</span> <strong>{staffRoleLabel(form.role)}</strong></p>
                    <p><span className="text-cream-800/50">Ad:</span> {form.name}</p>
                    <p><span className="text-cream-800/50">E-posta:</span> {form.email}</p>
                    <p><span className="text-cream-800/50">Telefon:</span> {form.phone}</p>
                    <p><span className="text-cream-800/50">Şehir:</span> {form.city}</p>
                    <p><span className="text-cream-800/50">Uzmanlık:</span> {form.specialties.join(', ')}</p>
                    <p><span className="text-cream-800/50">Deneyim:</span> {form.experienceYears} yıl</p>
                  </div>
                  <p className="text-xs text-cream-800/55">Göndererek bilgilerinizin incelenmesini kabul edersiniz. Onay sonrası personel paneli erişimi açılır.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-wellness-outline flex-1 !py-3">
                <ArrowLeft className="h-4 w-4" /> Geri
              </button>
            )}
            {step < 4 ? (
              <button type="button" onClick={next} className="btn-wellness flex-1 !py-3">
                Devam <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={submitting} className="btn-wellness flex-1 !py-3 disabled:opacity-60">
                <UserPlus className="h-4 w-4" />
                {submitting ? 'Gönderiliyor…' : 'Başvuruyu Gönder'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

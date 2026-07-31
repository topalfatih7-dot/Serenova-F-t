import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CheckCircle, Send, ArrowLeft } from 'lucide-react'
import SeoHead from '../components/seo/SeoHead'
import PhoneField from '../components/ui/PhoneField'
import TurnstileWidget from '../components/security/TurnstileWidget'
import { useTurnstile } from '../hooks/useTurnstile'
import { useToast } from '../context/ToastContext'
import { submitCorporateApplication } from '../services/supabaseDb'
import {
  EMPTY_CORPORATE_APPLICATION,
  CORPORATE_INDUSTRIES,
  EMPLOYEE_RANGES,
  CORPORATE_SERVICES,
  validateCorporateApplication,
} from '../data/corporateApplication'

function toggle(list, item) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

export default function CorporateApplicationPage() {
  const { toast } = useToast()
  const [form, setForm] = useState(EMPTY_CORPORATE_APPLICATION)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const {
    enabled: turnstileEnabled,
    widgetRef,
    setToken: setTurnstileToken,
    getTokenForSubmit,
    reset: resetTurnstile,
  } = useTurnstile()

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const submit = async (e) => {
    e.preventDefault()
    const errors = validateCorporateApplication(form)
    if (errors.length) {
      toast(errors[0], 'error')
      return
    }
    setSubmitting(true)
    try {
      let captchaToken = ''
      try {
        captchaToken = await getTokenForSubmit()
      } catch (err) {
        toast(err?.message || 'Bot doğrulamasını tamamlayın', 'error')
        resetTurnstile()
        return
      }
      const r = await submitCorporateApplication(form, captchaToken)
      if (!r.success) {
        resetTurnstile()
        toast(r.error || 'Başvuru gönderilemedi', 'error')
        return
      }
      resetTurnstile()
      setDone(true)
      toast('Kurumsal başvurunuz alındı', 'success')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="max-w-lg rounded-3xl border border-sage-200 bg-white p-8 text-center shadow-lg">
          <CheckCircle className="mx-auto h-14 w-14 text-sage-500" />
          <h1 className="mt-4 font-display text-2xl font-bold text-cream-900">Başvurunuz Alındı</h1>
          <p className="mt-2 text-sm text-cream-800/65">Kurumsal satış ekibimiz {form.email} adresinden sizinle iletişime geçecek.</p>
          <Link to="/corporate" className="btn-wellness mt-6 inline-flex">Kurumsal Sayfaya Dön</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white py-10 sm:py-14">
      <SeoHead title="Kurumsal Başvuru" description="Şirketiniz için wellness programı başvurusu." canonicalPath="/corporate/apply" />
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <Link to="/corporate" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-cream-800/60 hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Kurumsal
        </Link>
        <div className="mb-8 text-center">
          <Building2 className="mx-auto h-10 w-10 text-brand-500" />
          <h1 className="mt-3 font-display text-3xl font-bold text-cream-900">Kurumsal Başvuru Formu</h1>
          <p className="mt-2 text-sm text-cream-800/60">Çalışan wellness ihtiyaçlarınızı paylaşın, size özel teklif hazırlayalım</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-cream-200 bg-white p-6 shadow-sm sm:p-8">
          <input value={form.companyName} onChange={(e) => update({ companyName: e.target.value })} placeholder="Şirket / Kurum adı *" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" required />
          <input value={form.contactName} onChange={(e) => update({ contactName: e.target.value })} placeholder="Yetkili ad soyad *" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" required />
          <input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} placeholder="Kurumsal e-posta *" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" required />
          <PhoneField value={form.phone} onValueChange={(phone) => update({ phone })} label="Telefon *" />
          <input value={form.city} onChange={(e) => update({ city: e.target.value })} placeholder="Şehir *" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" required />
          <select value={form.industry} onChange={(e) => update({ industry: e.target.value })} className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" required>
            <option value="">Sektör seçin *</option>
            {CORPORATE_INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={form.employeeRange} onChange={(e) => update({ employeeRange: e.target.value })} className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" required>
            <option value="">Çalışan sayısı *</option>
            {EMPLOYEE_RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          <div>
            <p className="mb-2 text-xs font-semibold text-cream-800/70">İlgilendiğiniz hizmetler *</p>
            <div className="flex flex-wrap gap-2">
              {CORPORATE_SERVICES.map((s) => (
                <button key={s} type="button" onClick={() => update({ services: toggle(form.services, s) })}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${form.services.includes(s) ? 'bg-brand-500 text-white' : 'bg-cream-100 text-cream-800'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <textarea value={form.message} onChange={(e) => update({ message: e.target.value })} rows={4} placeholder="Şirketinizin ihtiyaçları, hedefler, mevcut programlar… *" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" required />
          <input type="date" value={form.preferredStart} onChange={(e) => update({ preferredStart: e.target.value })} className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
          <p className="text-xs text-cream-800/45">Tercih edilen başlangıç tarihi (opsiyonel)</p>
          {turnstileEnabled && (
            <TurnstileWidget ref={widgetRef} onToken={setTurnstileToken} />
          )}
          <button type="submit" disabled={submitting} className="btn-wellness w-full !py-3 disabled:opacity-60">
            <Send className="h-4 w-4" />
            {submitting ? 'Gönderiliyor…' : 'Kurumsal Başvuruyu Gönder'}
          </button>
        </form>
      </div>
    </div>
  )
}

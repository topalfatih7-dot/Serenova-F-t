import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, User, MessageSquare, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { submitContactForm } from '../../services/contactForm'
import TurnstileWidget from '../security/TurnstileWidget'
import { isTurnstileEnabled } from '../../config/turnstile'

const SUBJECTS = [
  { value: 'general', label: 'Genel bilgi' },
  { value: 'membership', label: 'Üyelik & kayıt' },
  { value: 'premium', label: 'Premium paket' },
  { value: 'support', label: 'Teknik destek' },
  { value: 'partnership', label: 'İş birliği' },
  { value: 'other', label: 'Diğer' },
]

const EMPTY = { name: '', email: '', phone: '', subject: 'general', message: '', consent: false, website: '' }

export default function ContactSection() {
  const { toast } = useToast()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Ad soyad gerekli'
    if (!form.email.includes('@')) e.email = 'Geçerli e-posta girin'
    if (form.phone && form.phone.replace(/\D/g, '').length < 10) e.phone = 'Geçerli telefon girin'
    if (!form.message.trim() || form.message.trim().length < 10) e.message = 'Mesaj en az 10 karakter olmalı'
    if (!form.consent) e.consent = 'Devam etmek için onay gerekli'
    if (isTurnstileEnabled() && !turnstileToken) e.turnstile = 'Bot doğrulamasını tamamlayın'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (form.website) return
    if (!validate()) return

    setLoading(true)
    try {
      const result = await submitContactForm({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject,
        message: form.message.trim(),
        turnstileToken,
        website: form.website,
      })
      if (!result.ok) {
        toast(result.error || 'Mesaj gönderilemedi', 'error')
        return
      }
      setSent(true)
      setForm(EMPTY)
      toast('Mesajınız alındı, en kısa sürede dönüş yapacağız', 'success')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (key) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 ${
      errors[key] ? 'border-red-300' : 'border-cream-200'
    }`

  return (
    <section id="bize-ulasin" className="relative scroll-mt-24 overflow-hidden py-16 sm:py-20">
      {/* Arka plan: hero görseli, filtreli (Üyelerimiz Ne Diyor bölümüyle aynı görsel dil) */}
      <div className="absolute inset-0">
        <img
          src="/hero-bg.png"
          alt=""
          aria-hidden
          className="h-full w-full object-cover object-center"
          style={{ filter: 'brightness(0.3) saturate(0.85) blur(1px)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/75 via-cream-900/65 to-sage-900/55" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur">İletişim</span>
          <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">Bize Ulaşın</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/70 sm:text-base">
            Üyelik, paket veya teknik konular için yazın. Mesajınız ekibimize ulaşır;
            en kısa sürede size dönüş yaparız.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mt-12 max-w-2xl"
        >
            {sent ? (
              <div className="glass-card-solid flex flex-col items-center justify-center px-6 py-16 text-center">
                <CheckCircle2 className="h-14 w-14 text-sage-500" />
                <h3 className="mt-4 font-display text-xl font-bold text-cream-900">Teşekkürler!</h3>
                <p className="mt-2 max-w-sm text-sm text-cream-800/65">Mesajınız ekibimize ulaştı. En kısa sürede size dönüş yapacağız.</p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-6 text-sm font-semibold text-brand-600 hover:underline"
                >
                  Yeni mesaj gönder
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass-card-solid space-y-4 p-6 sm:p-8">
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={(e) => update({ website: e.target.value })}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-cream-900">
                      <User className="h-3.5 w-3.5 text-brand-500" /> Ad Soyad *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => update({ name: e.target.value })}
                      className={inputClass('name')}
                      placeholder="Adınız Soyadınız"
                      autoComplete="name"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-cream-900">
                      <Mail className="h-3.5 w-3.5 text-brand-500" /> E-posta *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update({ email: e.target.value })}
                      className={inputClass('email')}
                      placeholder="ornek@email.com"
                      autoComplete="email"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-cream-900">
                      <Phone className="h-3.5 w-3.5 text-brand-500" /> Telefon
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update({ phone: e.target.value })}
                      className={inputClass('phone')}
                      placeholder="05XX XXX XX XX"
                      autoComplete="tel"
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-cream-900">Konu *</label>
                    <select
                      value={form.subject}
                      onChange={(e) => update({ subject: e.target.value })}
                      className={inputClass('subject')}
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-cream-900">
                    <MessageSquare className="h-3.5 w-3.5 text-brand-500" /> Mesajınız *
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => update({ message: e.target.value })}
                    rows={5}
                    className={`${inputClass('message')} resize-y min-h-[120px]`}
                    placeholder="Size nasıl yardımcı olabiliriz?"
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cream-200 bg-cream-50/50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => update({ consent: e.target.checked })}
                    className="mt-0.5 accent-brand-500"
                  />
                  <span className="text-xs leading-relaxed text-cream-800/70">
                    Kişisel verilerimin iletişim talebime yanıt verilmesi amacıyla işlenmesini kabul ediyorum. *
                  </span>
                </label>
                {errors.consent && <p className="text-xs text-red-500">{errors.consent}</p>}

                <TurnstileWidget onToken={setTurnstileToken} className="flex justify-center" />
                {errors.turnstile && <p className="text-xs text-red-500">{errors.turnstile}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-wellness w-full !rounded-xl disabled:opacity-60 sm:w-auto sm:!px-10"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {loading ? 'Gönderiliyor…' : 'Mesaj Gönder'}
                </button>
              </form>
            )}
        </motion.div>
      </div>
    </section>
  )
}

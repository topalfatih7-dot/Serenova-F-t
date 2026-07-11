import { useState } from 'react'
import { CheckCircle2, Send } from 'lucide-react'

const CATEGORIES = [
  'Genel soru',
  'Teknik sorun',
  'Sağlık bildirimi',
  'Ödeme',
]

const FIELD =
  'w-full rounded-2xl border-2 bg-white/90 px-4 py-3.5 text-sm font-medium text-cream-900 outline-none transition placeholder:font-normal placeholder:text-cream-800/40 focus:bg-white focus:ring-4'

export default function SupportForm({ onSubmit, defaultCategory }) {
  const [form, setForm] = useState({
    category: defaultCategory || 'Genel soru',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [prevDefaultCategory, setPrevDefaultCategory] = useState(defaultCategory)

  if (defaultCategory !== prevDefaultCategory) {
    setPrevDefaultCategory(defaultCategory)
    if (defaultCategory) {
      setForm((prev) => ({ ...prev, category: defaultCategory }))
    }
  }

  const validate = () => {
    const e = {}
    if (!form.subject.trim()) e.subject = 'Konu gerekli'
    if (!form.message.trim()) e.message = 'Mesaj gerekli'
    else if (form.message.length < 10) e.message = 'En az 10 karakter'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit?.(form)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-sage-200/80 bg-gradient-to-br from-sage-50 via-white to-emerald-50/60 p-8 text-center shadow-sm">
        <div aria-hidden className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-sage-200/40 blur-2xl" />
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-500 to-emerald-600 text-white shadow-lg shadow-sage-500/30">
          <CheckCircle2 className="h-8 w-8" strokeWidth={2.2} />
        </div>
        <h3 className="relative mt-5 font-display text-lg font-bold text-cream-900">Talebiniz alındı</h3>
        <p className="relative mt-2 text-sm leading-relaxed text-cream-800/65">
          Destek ekibimiz en kısa sürede size dönüş yapacak.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-violet-800/80">
          Kategori
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = form.category === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, category: c })}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold transition active:scale-[0.98] ${
                  active
                    ? 'bg-gradient-to-r from-violet-500 to-brand-500 text-white shadow-md shadow-violet-500/25'
                    : 'border border-violet-100 bg-white text-cream-800/70 hover:border-violet-200 hover:bg-violet-50/80'
                }`}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label htmlFor="support-subject" className="mb-2 block text-xs font-bold uppercase tracking-wide text-violet-800/80">
          Konu
        </label>
        <input
          id="support-subject"
          type="text"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className={`${FIELD} ${
            errors.subject
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-violet-100 focus:border-violet-400 focus:ring-violet-100/80'
          }`}
          placeholder="Kısa bir konu başlığı"
        />
        {errors.subject && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.subject}</p>}
      </div>

      <div>
        <label htmlFor="support-message" className="mb-2 block text-xs font-bold uppercase tracking-wide text-violet-800/80">
          Mesaj
        </label>
        <textarea
          id="support-message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={5}
          className={`${FIELD} resize-y min-h-[8rem] ${
            errors.message
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-violet-100 focus:border-violet-400 focus:ring-violet-100/80'
          }`}
          placeholder="Sorununuzu veya sorunuzu detaylı yazın..."
        />
        {errors.message && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.message}</p>}
      </div>

      <button
        type="submit"
        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-brand-500 to-sage-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition hover:brightness-105 active:scale-[0.99]"
      >
        <Send className="h-4 w-4 transition group-hover:translate-x-0.5" />
        Talebi Gönder
      </button>
    </form>
  )
}

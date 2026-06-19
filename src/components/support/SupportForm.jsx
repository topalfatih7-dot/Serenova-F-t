import { useState } from 'react'
import { Send } from 'lucide-react'

const CATEGORIES = [
  'Genel soru',
  'Teknik sorun',
  'Sağlık bildirimi',
  'Ödeme',
]

export default function SupportForm({ onSubmit, defaultCategory }) {
  const [form, setForm] = useState({
    category: defaultCategory || 'Genel soru',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.subject.trim()) e.subject = 'Konu gerekli'
    if (!form.message.trim()) e.message = 'Mesaj gerekli'
    if (form.message.length < 10) e.message = 'En az 10 karakter'
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
      <div className="rounded-2xl border border-sage-200 bg-sage-50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-100 text-sage-600">
          <Send className="h-6 w-6" />
        </div>
        <h3 className="mt-4 font-semibold text-cream-900">Talebiniz alındı</h3>
        <p className="mt-2 text-sm text-cream-800/60">24 saat içinde size dönüş yapacağız.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-cream-900">Kategori</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm outline-none focus:border-brand-300"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-cream-900">Konu</label>
        <input
          type="text"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-brand-300 ${errors.subject ? 'border-red-300' : 'border-cream-200'}`}
          placeholder="Kısa bir konu başlığı"
        />
        {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-cream-900">Mesaj</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={5}
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-brand-300 ${errors.message ? 'border-red-300' : 'border-cream-200'}`}
          placeholder="Sorununuzu detaylı açıklayın..."
        />
        {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
      </div>
      <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white hover:bg-brand-600">
        <Send className="h-4 w-4" /> Gönder
      </button>
    </form>
  )
}

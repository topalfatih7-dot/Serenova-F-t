import { useState } from 'react'
import { motion } from 'framer-motion'
import SuccessStoryCard from '../components/social/SuccessStoryCard'
import Modal from '../components/ui/Modal'
import { useToast } from '../context/ToastContext'
import { useApp } from '../context/AppContext'
import { Star } from 'lucide-react'

export default function SuccessStoriesPage() {
  const { toast } = useToast()
  const { successStories, submitSuccessStory, isAuthenticated } = useApp()
  const [submitOpen, setSubmitOpen] = useState(false)
  const [consent, setConsent] = useState(false)
  const [story, setStory] = useState('')
  const [duration, setDuration] = useState('')
  const [saving, setSaving] = useState(false)

  const approvedStories = successStories.filter((s) => s.approved)

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast('Hikaye göndermek için giriş yapın', 'warning')
      return
    }
    if (!story.trim()) {
      toast('Lütfen hikayenizi yazın', 'warning')
      return
    }
    if (!consent) {
      toast('Paylaşım onayı gerekli', 'warning')
      return
    }
    setSaving(true)
    const r = await submitSuccessStory({ story: story.trim(), highlight: story.trim().slice(0, 80), duration: duration.trim() })
    setSaving(false)
    if (r?.success === false) {
      toast(r.error || 'Gönderilemedi', 'error')
      return
    }
    setSubmitOpen(false)
    setStory('')
    setDuration('')
    setConsent(false)
    toast('Hikayeniz incelemeye alındı', 'success')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-cream-900">Başarı Hikayeleri</h1>
        <p className="mt-3 text-cream-800/60">
          Topluluğumuzun ilham verici yolculukları. Sonuçlar kişiden kişiye değişir.
        </p>
      </div>

      {approvedStories.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {approvedStories.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
              <SuccessStoryCard story={item} />
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-cream-200 bg-white/60 p-8 text-center text-sm text-cream-800/60">
          Henüz paylaşılan bir hikaye yok. İlk hikayeyi sen paylaş!
        </p>
      )}

      <div className="rounded-2xl border border-cream-200 bg-gradient-to-r from-brand-50 to-sage-50 p-8 text-center">
        <Star className="mx-auto h-8 w-8 text-gold-500" />
        <h2 className="mt-4 font-display text-xl font-bold text-cream-900">Hikayenizi Paylaşın</h2>
        <p className="mt-2 text-sm text-cream-800/60">
          Deneyiminizi paylaşarak başkalarına ilham verin. Aşırı iddialardan kaçınıyoruz.
        </p>
        <button type="button" onClick={() => setSubmitOpen(true)} className="mt-6 rounded-full bg-brand-500 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-600">
          Hikaye Gönder
        </button>
      </div>

      <Modal open={submitOpen} onClose={() => setSubmitOpen(false)} title="Başarı Hikayesi Gönder" size="lg">
        <div className="space-y-4">
          <textarea value={story} onChange={(e) => setStory(e.target.value)} rows={4} placeholder="Yolculuğunuzu kısaca anlatın..." className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
          <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Program süreniz (ör. 12 hafta)" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
          <label className="flex items-start gap-3 rounded-xl bg-cream-50 p-4">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
            <span className="text-sm text-cream-800/70">
              Hikayemin platformda paylaşılmasına onay veriyorum. Tıbbi sonuç veya garanti iddiası içermeyeceğini kabul ediyorum.
            </span>
          </label>
          <button type="button" onClick={handleSubmit} disabled={saving} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? 'Gönderiliyor…' : 'Gönder'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

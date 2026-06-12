import { useState } from 'react'
import { motion } from 'framer-motion'
import SuccessStoryCard from '../components/social/SuccessStoryCard'
import Modal from '../components/ui/Modal'
import { useToast } from '../context/ToastContext'
import { mockSuccessStories } from '../data/mockData'
import { Star } from 'lucide-react'

export default function SuccessStoriesPage() {
  const { toast } = useToast()
  const [submitOpen, setSubmitOpen] = useState(false)
  const [consent, setConsent] = useState(false)

  const handleSubmit = () => {
    if (!consent) {
      toast('Paylaşım onayı gerekli', 'warning')
      return
    }
    setSubmitOpen(false)
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

      <div className="grid gap-6 md:grid-cols-2">
        {mockSuccessStories.filter((s) => s.approved).map((story, i) => (
          <motion.div key={story.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
            <SuccessStoryCard story={story} />
          </motion.div>
        ))}
      </div>

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
          <textarea rows={4} placeholder="Yolculuğunuzu kısaca anlatın..." className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
          <input placeholder="Program süreniz (ör. 12 hafta)" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
          <label className="flex items-start gap-3 rounded-xl bg-cream-50 p-4">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
            <span className="text-sm text-cream-800/70">
              Hikayemin platformda paylaşılmasına onay veriyorum. Tıbbi sonuç veya garanti iddiası içermeyeceğini kabul ediyorum.
            </span>
          </label>
          <button type="button" onClick={handleSubmit} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white">
            Gönder
          </button>
        </div>
      </Modal>
    </div>
  )
}

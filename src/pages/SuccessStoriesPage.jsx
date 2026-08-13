import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import SuccessStoryCard from '../components/social/SuccessStoryCard'
import SuccessStorySubmitModal from '../components/social/SuccessStorySubmitModal'
import PlansAnimatedBackground from '../components/landing/PlansAnimatedBackground'
import JsonLd from '../components/seo/JsonLd'
import { useToast } from '../context/ToastContext'
import { useApp } from '../context/AppContext'
import { Star } from 'lucide-react'
import { buildItemListSchema } from '../config/seo'

export default function SuccessStoriesPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { successStories, isAuthenticated } = useApp()
  const [submitOpen, setSubmitOpen] = useState(false)

  const approvedStories = successStories.filter((s) => s.approved)

  const handleShareClick = () => {
    if (!isAuthenticated) {
      toast('Hikaye göndermek için giriş yapın', 'warning')
      navigate('/login', { state: { from: '/stories', message: 'Hikaye göndermek için giriş yapın' } })
      return
    }
    setSubmitOpen(true)
  }

  return (
    <div>
      <JsonLd
        data={buildItemListSchema({
          name: 'Başarı Hikayeleri',
          path: '/stories',
          items: approvedStories.slice(0, 20).map((s) => ({ name: s.name || s.highlight, path: '/stories' })),
        })}
      />
      <PlansAnimatedBackground className="!py-14 sm:!py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-4xl px-4 text-center sm:px-6"
        >
          <span className="section-badge">Topluluk</span>
          <h1 className="section-title mt-4">Başarı Hikayeleri</h1>
          <p className="section-subtitle mx-auto max-w-2xl">
            Topluluğumuzun ilham verici yolculukları. Sonuçlar kişiden kişiye değişir.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/online-diyetisyen" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-200">Online diyetisyen</Link>
            <Link to="/online-kocluk" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-200">Online koçluk</Link>
            <Link to="/membership" className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Paketleri incele</Link>
          </div>
        </motion.div>
      </PlansAnimatedBackground>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
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
          <button type="button" onClick={handleShareClick} className="mt-6 rounded-full bg-brand-500 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-600">
            Hikaye Gönder
          </button>
        </div>

        <SuccessStorySubmitModal open={submitOpen} onClose={() => setSubmitOpen(false)} />
      </div>
    </div>
  )
}

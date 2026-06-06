import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Users, Calendar, Shield, Star } from 'lucide-react'
import PricingCard from '../components/landing/PricingCard'
import FAQAccordion from '../components/landing/FAQAccordion'
import { FREE_PLAN, PREMIUM_PLAN } from '../data/membershipPlans'
import { BRAND } from '../config/brand'
import { mockTestimonials, mockFAQs, howItWorks } from '../data/mockData'

const features = [
  { icon: Heart, title: 'Kişiye Özel Koçluk', desc: 'Hedeflerinize uygun egzersiz ve yaşam tarzı rehberliği' },
  { icon: Users, title: 'Destekleyici Topluluk', desc: 'Motivasyon ve bağlılık için güvenli bir alan' },
  { icon: Calendar, title: 'Akıllı Takvim', desc: 'Randevular, hatırlatıcılar ve ilerleme takibi' },
  { icon: Shield, title: 'Güvenli & Uyumlu', desc: 'KVKK uyumlu, şeffaf ve etik yaklaşım' },
]

export default function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-100/40 via-cream-50 to-sage-50" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full bg-brand-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
              Herkes İçin Wellness Platformu
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-cream-900 sm:text-5xl lg:text-6xl">
              Dönüşümünüz{' '}
              <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                sizin ritminizde
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-cream-800/70">
              Ücretsiz başlayın veya Premium ile birebir koç ve diyetisyen desteği alın.
              Evde, güvenle, kendi hızınızda.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/register" className="rounded-full bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-200 hover:bg-brand-600">
                Ücretsiz Başla
              </Link>
              <Link to="/builder" className="rounded-full border border-cream-200 bg-white px-8 py-3.5 text-sm font-semibold text-cream-900 hover:shadow-md">
                Premium Paket Oluştur
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-cream-900">Üyelik Seçenekleri</h2>
          <p className="mt-3 text-cream-800/60">İhtiyacınıza uygun planı seçin</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <PricingCard plan={FREE_PLAN} ctaTo="/register" ctaLabel="Ücretsiz Başla" />
          <PricingCard plan={PREMIUM_PLAN} featured ctaTo="/builder" ctaLabel="Paketini Oluştur" />
        </div>
      </section>

      <section className="bg-white/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center font-display text-3xl font-bold text-cream-900">Neden {BRAND.shortName}?</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-cream-100 bg-white p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-cream-900">{f.title}</h3>
                <p className="mt-2 text-sm text-cream-800/60">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-display text-3xl font-bold text-cream-900">Nasıl Çalışır?</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white">
                {s.step}
              </div>
              <h3 className="mt-4 font-semibold text-cream-900">{s.title}</h3>
              <p className="mt-2 text-sm text-cream-800/60">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-b from-brand-50 to-cream-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center font-display text-3xl font-bold text-cream-900">Üyelerimiz Ne Diyor?</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {mockTestimonials.map((t) => (
              <div key={t.id} className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-gold-400 text-gold-400" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-cream-800/80">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-4 text-sm font-medium text-cream-900">{t.name}</p>
                <p className="text-xs text-cream-800/50">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-display text-3xl font-bold text-cream-900">Sık Sorulan Sorular</h2>
        <div className="mt-10">
          <FAQAccordion items={mockFAQs} />
        </div>
      </section>

    </div>
  )
}

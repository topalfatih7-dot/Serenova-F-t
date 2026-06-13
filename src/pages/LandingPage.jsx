import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Users, Calendar, Shield, ArrowRight, Sparkles } from 'lucide-react'
import PricingCard from '../components/landing/PricingCard'
import FAQAccordion from '../components/landing/FAQAccordion'
import TeamCarousel from '../components/landing/TeamCarousel'
import TestimonialCarousel from '../components/landing/TestimonialCarousel'
import { FREE_PLAN, PREMIUM_PLAN } from '../data/membershipPlans'
import { BRAND } from '../config/brand'
import { useApp } from '../context/AppContext'

const features = [
  { icon: Heart, title: 'Kişiye Özel Koçluk', desc: 'Hedeflerinize uygun egzersiz ve yaşam tarzı rehberliği' },
  { icon: Users, title: 'Destekleyici Topluluk', desc: 'Motivasyon ve bağlılık için güvenli bir alan' },
  { icon: Calendar, title: 'Akıllı Takvim', desc: 'Randevular, hatırlatıcılar ve ilerleme takibi' },
  { icon: Shield, title: 'Güvenli & Uyumlu', desc: 'KVKK uyumlu, şeffaf ve etik yaklaşım' },
]

const stats = [
  { value: '2.500+', label: 'Aktif üye' },
  { value: '%94', label: 'Memnuniyet' },
  { value: '7/24', label: 'Destek' },
]

export default function LandingPage() {
  const { staff, testimonials, faqs } = useApp()
  // Admin panelinden eklenen aktif kadro
  const teamMembers = (staff || []).filter((s) => s.active !== false)

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Arka plan fotoğrafı - filtreli / sönük */}
        <div className="absolute inset-0">
          <img src="/hero-bg.png" alt="" aria-hidden className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-cream-50 via-cream-50/85 to-cream-50/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-cream-50 via-transparent to-cream-50/60" />
        </div>
        <motion.div
          aria-hidden
          animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-300/25 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl text-center lg:text-left">
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700 shadow-sm backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Herkes İçin Wellness Platformu
            </motion.span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-cream-900 sm:text-5xl lg:text-6xl">
              Dönüşümünüz{' '}
              <span className="bg-gradient-to-r from-brand-600 via-brand-400 to-sage-500 bg-clip-text text-transparent">
                sizin ritminizde
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-cream-800/70 lg:mx-0">
              Ücretsiz başlayın veya Premium ile birebir koç ve diyetisyen desteği alın.
              Evde, güvenle, kendi hızınızda.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link to="/onboarding?plan=free" className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-sage-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-200/70 transition hover:shadow-xl">
                  Ücretsiz Başla
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link to="/builder" className="flex items-center gap-2 rounded-full border border-cream-200 bg-white/80 px-8 py-3.5 text-sm font-semibold text-cream-900 backdrop-blur transition hover:border-brand-200 hover:shadow-md">
                  <Sparkles className="h-4 w-4 text-brand-500" />
                  Premium Paket Oluştur
                </Link>
              </motion.div>
            </div>

            <div className="mt-10 flex justify-center gap-8 lg:justify-start">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="text-center lg:text-left"
                >
                  <p className="font-display text-2xl font-bold text-cream-900">{s.value}</p>
                  <p className="text-xs text-cream-800/60">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ÜYELİK SEÇENEKLERİ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="font-display text-3xl font-bold text-cream-900">Üyelik Seçenekleri</h2>
          <p className="mt-3 text-cream-800/60">Planı seçin, sizi doğrudan kayıt adımına götürelim</p>
        </motion.div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <PricingCard plan={FREE_PLAN} ctaTo="/onboarding?plan=free" ctaLabel="Ücretsiz Başla" />
          <PricingCard plan={PREMIUM_PLAN} featured ctaTo="/onboarding?plan=premium" ctaLabel="Premium ile Kayıt Ol" />
        </div>
      </section>

      {/* NEDEN SERENOVA */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white/60 to-sage-50/60 py-16">
        <motion.div
          aria-hidden
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -left-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-brand-200/30 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <motion.h2 initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center font-display text-3xl font-bold text-cream-900">
            Neden {BRAND.shortName}?
          </motion.h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -6 }}
                className="group rounded-2xl border border-cream-100 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-sage-50 text-brand-500 transition-transform group-hover:scale-110 group-hover:rotate-3">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-cream-900">{f.title}</h3>
                <p className="mt-2 text-sm text-cream-800/60">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* KADROMUZ */}
      {teamMembers.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
                <Users className="h-3.5 w-3.5" />
                Uzman Ekip
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold text-cream-900">Kadromuz</h2>
              <p className="mt-3 text-cream-800/60">Deneyimli koç ve diyetisyenlerimizle tanışın</p>
            </motion.div>
          </div>
          <div className="mt-10">
            <TeamCarousel members={teamMembers} />
          </div>
        </section>
      )}

      {/* YORUMLAR - MANUEL GEÇİŞLİ */}
      {testimonials.length > 0 && (
        <section className="overflow-hidden bg-gradient-to-b from-brand-50 to-cream-50 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.h2 initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center font-display text-3xl font-bold text-cream-900">
              Üyelerimiz Ne Diyor?
            </motion.h2>
            <p className="mt-3 text-center text-cream-800/60">Gerçek deneyimler, gerçek dönüşümler</p>
          </div>
          <div className="mt-12">
            <TestimonialCarousel testimonials={testimonials} />
          </div>
        </section>
      )}

      {/* SSS */}
      {faqs.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <motion.h2 initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center font-display text-3xl font-bold text-cream-900">
            Sık Sorulan Sorular
          </motion.h2>
          <div className="mt-10">
            <FAQAccordion items={faqs} />
          </div>
        </section>
      )}
    </div>
  )
}

import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, ArrowRight, Sparkles } from 'lucide-react'
import PricingCard from '../components/landing/PricingCard'
import FAQAccordion from '../components/landing/FAQAccordion'
import TeamCarousel from '../components/landing/TeamCarousel'
import TestimonialCarousel from '../components/landing/TestimonialCarousel'
import WhyUsSection from '../components/landing/WhyUsSection'
import ContactSection from '../components/landing/ContactSection'
import { scrollToContactSection } from '../utils/scrollToContact'
import { ALL_PLANS } from '../data/membershipPlans'
import { useApp } from '../context/AppContext'

const stats = [
  { value: '2.500+', label: 'Aktif üye' },
  { value: '%94', label: 'Memnuniyet' },
  { value: '7/24', label: 'Destek' },
]

export default function LandingPage() {
  const { staff, testimonials, faqs, plans } = useApp()
  const location = useLocation()
  const displayPlans = plans?.length ? plans : ALL_PLANS
  // Admin panelinden eklenen aktif kadro
  const teamMembers = (staff || []).filter((s) => s.active !== false)

  useEffect(() => {
    if (location.pathname === '/' && location.hash === '#bize-ulasin') {
      const t = setTimeout(scrollToContactSection, 150)
      return () => clearTimeout(t)
    }
    return undefined
  }, [location.pathname, location.hash])

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
                <Link to="/onboarding?plan=free" className="btn-wellness group">
                  Ücretsiz Başla
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link to="/membership" className="btn-wellness-outline">
                  <Sparkles className="h-4 w-4 text-brand-500" />
                  Ücretli Planları İncele
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
      <section className="section-trust mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <span className="section-badge">Planlar</span>
          <h2 className="section-title mt-4">Üyelik Seçenekleri</h2>
          <p className="section-subtitle">Size en uygun planı seçin — kayıt anında başlasın</p>
        </motion.div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {displayPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
            >
              <PricingCard
                plan={plan}
                featured={plan.id === 'altin'}
                ctaTo={`/onboarding?plan=${plan.id}`}
                ctaLabel={plan.price === 0 ? 'Ücretsiz Başla' : `${plan.name} ile Kayıt Ol`}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* NEDEN YENİ FORM */}
      <WhyUsSection />

      {/* KADROMUZ */}
      {teamMembers.length > 0 && (
        <section id="kadromuz" className="section-warm py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
              <span className="section-badge">
                <Users className="h-3.5 w-3.5" />
                Uzman Ekip
              </span>
              <h2 className="section-title mt-4">Kadromuz</h2>
              <p className="section-subtitle">Deneyimli koç ve diyetisyenlerimizle tanışın</p>
            </motion.div>
          </div>
          <div className="mt-10">
            <TeamCarousel members={teamMembers} />
          </div>
        </section>
      )}

      {/* YORUMLAR - MANUEL GEÇİŞLİ */}
      {testimonials.length > 0 && (
        <section className="section-trust overflow-hidden py-16">
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

      {/* BİZE ULAŞIN */}
      <ContactSection />
    </div>
  )
}

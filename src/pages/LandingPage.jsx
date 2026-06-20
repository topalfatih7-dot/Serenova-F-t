import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight, X } from 'lucide-react'
import PricingCard from '../components/landing/PricingCard'
import FAQAccordion from '../components/landing/FAQAccordion'
import TestimonialCarousel from '../components/landing/TestimonialCarousel'
import WhyUsSection from '../components/landing/WhyUsSection'
import ContactSection from '../components/landing/ContactSection'
import SectionBackdrop from '../components/landing/SectionBackdrop'
import TrustStrip from '../components/landing/TrustStrip'
import LiveActiveCounter from '../components/landing/LiveActiveCounter'
import RotatingHeroText from '../components/landing/RotatingHeroText'
import HowItWorksSection from '../components/landing/HowItWorksSection'
import SuccessStoriesPreview from '../components/landing/SuccessStoriesPreview'
import { scrollToContactSection } from '../utils/scrollToContact'
import { ALL_PLANS } from '../data/membershipPlans'
import { useApp } from '../context/AppContext'

const stats = [
  { value: '2.500+', label: 'Aktif üye' },
  { value: '%94', label: 'Memnuniyet' },
  { value: '7/24', label: 'Destek' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.13, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
}

export default function LandingPage() {
  const { testimonials, faqs, plans, successStories } = useApp()
  const location = useLocation()
  const displayPlans = plans?.length ? plans : ALL_PLANS
  const [swipeHint, setSwipeHint] = useState(true)

  useEffect(() => {
    if (location.pathname === '/' && location.hash === '#bize-ulasin') {
      const t = setTimeout(scrollToContactSection, 150)
      return () => clearTimeout(t)
    }
    return undefined
  }, [location.pathname, location.hash])

  return (
    <div className="overflow-x-hidden">

      {/* ═══════════════════════════════════════════
          HERO — Video Arka Plan + Asimetrik Kart
      ═══════════════════════════════════════════ */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden">
        {/* Video arka plan — sessiz, döngüsel, bulanık (spor yapan kadınlar) */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          poster="/hero-bg.png"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'blur(3px) brightness(0.55) saturate(1.2)' }}
        >
          {/* Telifsiz stok video (Mixkit). Kendi videonuzu /public/hero-video.mp4 olarak
              ekleyip aşağıdaki src'yi "/hero-video.mp4" ile değiştirebilirsiniz. */}
          <source
            src="https://assets.mixkit.co/active_storage/video_items/100526/1725383305/100526-video-720.mp4"
            type="video/mp4"
          />
          {/* Video yoksa/oynatılamazsa görsel fallback */}
          <img src="/hero-bg.png" alt="" className="h-full w-full object-cover" />
        </video>

        {/* Gradient overlay — sol koyu, sağ açık */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Animasyonlu orb'lar */}
        <motion.div
          aria-hidden
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl"
        />
        <motion.div
          aria-hidden
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute -right-20 bottom-1/4 h-64 w-64 rounded-full bg-sage-400/25 blur-3xl"
        />

        <div className="relative mx-auto flex w-full max-w-6xl items-center justify-end px-4 py-20 sm:px-6 lg:min-h-[100svh]">
          {/* Asimetrik kart — sağ taraf (kompakt) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm"
          >
            {/* Dekoratif blob'lar */}
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              aria-hidden
              className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-400/30 blur-2xl"
            />
            <motion.div
              animate={{ rotate: [360, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              aria-hidden
              className="absolute -bottom-6 -left-10 h-24 w-24 rounded-full bg-sage-400/25 blur-xl"
            />

            {/* Asimetrik kart gövdesi */}
            <div className="relative overflow-hidden rounded-3xl rounded-tl-[3rem] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
              {/* Renkli çizgi aksanı */}
              <div className="absolute left-0 top-0 h-1 w-2/3 rounded-tr-full bg-gradient-to-r from-brand-400 via-sage-400 to-transparent" />
              <div className="absolute bottom-0 right-0 h-1 w-1/2 rounded-tl-full bg-gradient-to-l from-sage-400 via-brand-300 to-transparent" />

              {/* Badge */}
              <motion.span
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={0}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur"
              >
                <Sparkles className="h-3.5 w-3.5 text-brand-300" />
                Herkes İçin Wellness Platformu
              </motion.span>

              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={1}
                className="mt-4 font-display text-3xl font-bold leading-tight text-white sm:text-4xl"
              >
                Dönüşümünüz{' '}
                <RotatingHeroText />
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={2}
                className="mt-3 text-sm leading-relaxed text-white/80"
              >
                Ücretsiz başlayın veya Premium ile birebir koç ve diyetisyen desteği alın.
                Evde, güvenle, kendi hızınızda.
              </motion.p>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={3}
                className="mt-6 flex flex-wrap gap-2.5"
              >
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/onboarding?plan=free"
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-sage-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-110"
                  >
                    Ücretsiz Başla
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/membership"
                    className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    <Sparkles className="h-4 w-4 text-brand-300" />
                    Ücretli Planları İncele
                  </Link>
                </motion.div>
              </motion.div>

              {/* İstatistikler */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={4}
                className="mt-6 flex gap-5 border-t border-white/15 pt-5"
              >
                {stats.map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="font-display text-xl font-bold text-white">{s.value}</p>
                    <p className="text-[11px] text-white/60">{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CANLI AKTİF ÜYE SAYACI */}
      <LiveActiveCounter />

      {/* GÜVEN ŞERİDİ */}
      <TrustStrip staffCount={0} />

      {/* NASIL ÇALIŞIR */}
      <HowItWorksSection />

      {/* ═══════════════════════════════════════════
          ÜYELİK SEÇENEKLERİ — Mobil Swipe Hint
      ═══════════════════════════════════════════ */}
      <section className="section-trust py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <span className="section-badge">Planlar</span>
            <h2 className="section-title mt-4">Üyelik Seçenekleri</h2>
            <p className="section-subtitle">Size en uygun planı seçin — kayıt anında başlasın</p>
          </motion.div>

          {/* Mobil swipe ipucu */}
          <AnimatePresence>
            {swipeHint && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-6 flex items-center justify-between rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 sm:hidden"
              >
                <div className="flex items-center gap-2.5">
                  <motion.div
                    animate={{ x: [-4, 4, -4] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex items-center gap-0.5 text-brand-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4" />
                  </motion.div>
                  <p className="text-xs font-medium text-brand-700">
                    Tüm planları karşılaştırmak için sola kaydırın
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSwipeHint(false)}
                  className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 transition hover:bg-brand-200"
                  aria-label="Kapat"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Masaüstü: grid; Mobil: yatay kaydırma */}
          <div className="mt-8 hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
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

          {/* Mobil: yatay kaydırma — pt-6: kartların üstündeki "rozet" (Popüler/Premium) kırpılmasın */}
          <div className="mt-4 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pt-6 sm:hidden [scroll-padding:1rem]">
            {displayPlans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="w-[78vw] max-w-xs shrink-0 snap-start"
              >
                <PricingCard
                  plan={plan}
                  featured={plan.id === 'altin'}
                  ctaTo={`/onboarding?plan=${plan.id}`}
                  ctaLabel={plan.price === 0 ? 'Ücretsiz Başla' : `${plan.name} ile Kayıt Ol`}
                />
              </motion.div>
            ))}
            {/* Son elemandan sonra hafif boşluk */}
            <div className="w-4 shrink-0" />
          </div>
        </div>
      </section>

      {/* NEDEN BİZ */}
      <WhyUsSection />

      {/* BAŞARI HİKAYELERİ ÖNİZLEME */}
      <SuccessStoriesPreview stories={successStories} />

      {/* ÜYELER NE DİYOR */}
      {testimonials.length > 0 && (
        <TestimonialCarousel testimonials={testimonials} />
      )}

      {/* SSS */}
      {faqs.length > 0 && (
        <SectionBackdrop variant="faq" className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <FAQAccordion items={faqs} />
          </div>
        </SectionBackdrop>
      )}

      {/* BİZE ULAŞIN */}
      <ContactSection />
    </div>
  )
}

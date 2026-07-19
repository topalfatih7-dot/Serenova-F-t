import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Sparkles, ChevronLeft, ChevronRight, X,
  ShieldCheck, Lock, BadgeCheck,
} from 'lucide-react'
import PricingCard from '../components/landing/PricingCard'
import FAQAccordion from '../components/landing/FAQAccordion'
import FAQQuestionMarksBackground from '../components/landing/FAQQuestionMarksBackground'
import TestimonialCarousel from '../components/landing/TestimonialCarousel'
import WhyUsSection from '../components/landing/WhyUsSection'
import ContactSection from '../components/landing/ContactSection'
import TrustStrip from '../components/landing/TrustStrip'
import TrustSection from '../components/landing/TrustSection'
import LiveActiveCounter from '../components/landing/LiveActiveCounter'
import RotatingHeroText from '../components/landing/RotatingHeroText'
import PlansAnimatedBackground from '../components/landing/PlansAnimatedBackground'
import HowItWorksSection from '../components/landing/HowItWorksSection'
import SuccessStoriesPreview from '../components/landing/SuccessStoriesPreview'
import LatestBlogPosts from '../components/landing/LatestBlogPosts'
import HeroBackgroundVideo from '../components/ui/HeroBackgroundVideo'
import { scrollToContactSection } from '../utils/scrollToContact'
import { ALL_PLANS, sortPlansForDisplay } from '../data/membershipPlans'
import { useApp } from '../context/AppContext'
import { usePlatformDisplayStats } from '../hooks/usePlatformDisplayStats'
import JsonLd from '../components/seo/JsonLd'
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildFaqSchema,
  mergeBrandFaqs,
} from '../config/seo'

const staticStats = [
  { value: '%94', label: 'Memnuniyet' },
  { value: '7/24', label: 'Destek' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.13, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
}

export default function LandingPage() {
  const { testimonials, faqs, plans, successStories, posts } = useApp()
  const allFaqs = mergeBrandFaqs(faqs)
  const { displayMembers, showMemberPlus } = usePlatformDisplayStats()
  const location = useLocation()
  const displayPlans = sortPlansForDisplay(plans?.length ? plans : ALL_PLANS)
  const [swipeHint, setSwipeHint] = useState(true)

  const memberStatValue = `${displayMembers.toLocaleString('tr-TR')}${showMemberPlus ? '+' : ''}`
  const heroStats = [
    { value: memberStatValue, label: 'Aktif üye' },
    ...staticStats,
  ]

  useEffect(() => {
    if (location.pathname === '/' && location.hash === '#bize-ulasin') {
      const t = setTimeout(scrollToContactSection, 150)
      return () => clearTimeout(t)
    }
    return undefined
  }, [location.pathname, location.hash])

  return (
    <div className="overflow-x-hidden">
      <JsonLd
        data={[
          buildOrganizationSchema(),
          buildWebSiteSchema(),
          buildFaqSchema(allFaqs),
        ]}
      />

      {/* ═══════════════════════════════════════════
          HERO — Video Arka Plan + Net Değer Önerisi
          İlk 10 saniyede: ne yaptığımız (koç + diyetisyen + program),
          nasıl çalıştığı (sağ kart) ve güven sinyalleri (rozetler).
      ═══════════════════════════════════════════ */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-cream-900" />
        <HeroBackgroundVideo
          src="https://assets.mixkit.co/active_storage/video_items/100526/1725383305/100526-video-720.mp4"
          poster="https://assets.mixkit.co/videos/100526/100526-thumb-720-0.jpg"
          videoStyle={{ filter: 'blur(3px) brightness(0.5) saturate(1.2)' }}
        />

        {/* Gradient overlay — sol koyu (okunabilirlik), sağ açık */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Dekoratif orb'lar — CSS animasyonu (JS RAF yükü yok) */}
        <div
          aria-hidden
          className="landing-orb-a absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl"
        />
        <div
          aria-hidden
          className="landing-orb-b absolute -right-20 bottom-1/4 h-64 w-64 rounded-full bg-sage-400/25 blur-3xl"
        />

        <div className="relative mx-auto flex w-full max-w-6xl items-center px-4 py-16 sm:px-6 sm:py-20 lg:min-h-[100svh] lg:justify-end lg:py-24">
          {/* Değer önerisi — masaüstünde sağa hizalı */}
          <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-left">
            <motion.span
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur sm:text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-300" />
              Online Koçluk · Diyetisyen · Wellness
            </motion.span>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="mt-5 font-display text-[2rem] font-bold leading-[1.15] text-white sm:text-[2.75rem] lg:text-5xl"
            >
              Online koçluk ve diyetisyen ile size özel program —{' '}
              <RotatingHeroText />
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base lg:mx-0"
            >
              Online diyetisyen ve online spor koçunuz hedefinize göre programınızı hazırlar,
              video görüşmelerle her adımda yanınızda olur. Evde veya salonda —
              ücretsiz başlayın, kendi hızınızda ilerleyin.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/onboarding?plan=free"
                  className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-sage-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-110 sm:text-base"
                >
                  Ücretsiz Başla
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/membership"
                  className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  <Sparkles className="h-4 w-4 text-brand-300" />
                  Planları İncele
                </Link>
              </motion.div>
            </motion.div>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/70 lg:justify-start"
            >
              <Link to="/online-diyetisyen" className="underline-offset-2 hover:text-white hover:underline">
                Online diyetisyen
              </Link>
              <Link to="/online-kocluk" className="underline-offset-2 hover:text-white hover:underline">
                Online koçluk
              </Link>
            </motion.p>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={5}
              className="mt-3 text-xs text-white/60"
            >
              Kredi kartı gerekmez · 2 dakikada üye olun
            </motion.p>

            {/* Güven rozetleri + istatistikler */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={6}
              className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 border-t border-white/15 pt-5 lg:justify-start"
            >
              {[
                { icon: ShieldCheck, label: 'KVKK uyumlu' },
                { icon: Lock, label: '256-bit SSL güvenliği' },
                { icon: BadgeCheck, label: 'Uzman onaylı kadro' },
              ].map((t) => (
                <span key={t.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/75">
                  <t.icon className="h-4 w-4 text-sage-300" />
                  {t.label}
                </span>
              ))}
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={7}
              className="mt-5 flex justify-center gap-7 lg:justify-start"
            >
              {heroStats.map((s) => (
                <div key={s.label} className="text-center lg:text-left">
                  <p className="font-display text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-[11px] text-white/60">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CANLI AKTİF ÜYE SAYACI */}
      <LiveActiveCounter />

      {/* NASIL ÇALIŞIR */}
      <HowItWorksSection />

      {/* ═══════════════════════════════════════════
          ÜYELİK SEÇENEKLERİ — Mobil Swipe Hint
      ═══════════════════════════════════════════ */}
      <PlansAnimatedBackground>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '50px' }} className="text-center">
            <span className="section-badge">Planlar</span>
            <h2 className="section-title mt-4">Üyelik Seçenekleri</h2>
            <p className="section-subtitle">Size en uygun planı seçin — kayıt anında başlasın</p>
          </motion.div>

          {/* Mobil swipe ipucu — ok animasyonu CSS (.plans-swipe-nudge), Framer infinite kaldırıldı */}
          <AnimatePresence>
            {swipeHint && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-6 flex items-center justify-between rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 lg:hidden"
              >
                <div className="flex items-center gap-2.5">
                  <div className="plans-swipe-nudge flex items-center gap-0.5 text-brand-600">
                    <ChevronLeft className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4" />
                  </div>
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

          {/* Masaüstü: grid — kart girişi CSS (.plans-card-reveal), Framer whileInView ×3 kaldırıldı */}
          <div className="mt-8 hidden items-stretch gap-6 lg:grid lg:grid-cols-3">
            {displayPlans.map((plan, i) => (
              <div
                key={plan.id}
                className={`plans-card-reveal plans-card-reveal-delay-${i + 1} h-full`}
              >
                <PricingCard
                  plan={plan}
                  featured={plan.id === 'vip'}
                  ctaTo={`/onboarding?plan=${plan.id}`}
                  ctaLabel={plan.price === 0 ? 'Ücretsiz Başla' : `${plan.name} ile Kayıt Ol`}
                />
              </div>
            ))}
          </div>

          {/* Tablet + mobil: yatay kaydırma */}
          <div className="mt-4 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pt-6 lg:hidden [scroll-padding:1rem]">
            {displayPlans.map((plan, i) => (
              <div
                key={plan.id}
                className={`plans-card-reveal plans-card-reveal-delay-${i + 1} flex w-[min(78vw,340px)] max-w-xs shrink-0 snap-start self-stretch sm:w-[320px] md:w-[340px]`}
              >
                <div className="h-full w-full">
                <PricingCard
                  plan={plan}
                  featured={plan.id === 'vip'}
                  ctaTo={`/onboarding?plan=${plan.id}`}
                  ctaLabel={plan.price === 0 ? 'Ücretsiz Başla' : `${plan.name} ile Kayıt Ol`}
                />
                </div>
              </div>
            ))}
            {/* Son elemandan sonra hafif boşluk */}
            <div className="w-4 shrink-0" />
          </div>
        </div>
      </PlansAnimatedBackground>

      {/* NEDEN BİZ */}
      <WhyUsSection />

      {/* GÜVENCE — neden bize güvenebilirsiniz */}
      <TrustSection />

      {/* BAŞARI HİKAYELERİ ÖNİZLEME */}
      <SuccessStoriesPreview stories={successStories} />

      {/* SON BLOG YAZILARI */}
      <LatestBlogPosts posts={posts} limit={3} />

      {/* ÜYELER NE DİYOR */}
      {testimonials.length > 0 && (
        <TestimonialCarousel testimonials={testimonials} />
      )}

      {/* SSS — arka plan statik CSS, accordion CSS grid */}
      {allFaqs.length > 0 && (
        <section className="relative isolate overflow-hidden py-16 sm:py-24">
          <FAQQuestionMarksBackground />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <FAQAccordion items={allFaqs} />
          </div>
        </section>
      )}

      {/* BİZE ULAŞIN */}
      <ContactSection />

      <TrustStrip />
    </div>
  )
}

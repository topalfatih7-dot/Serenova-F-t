import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ShieldCheck, Lock, BadgeCheck, Star,
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
import { getPlanCtaLabel } from '../utils/planCta'
import { useApp } from '../context/AppContext'
import { usePlatformDisplayStats } from '../hooks/usePlatformDisplayStats'
import JsonLd from '../components/seo/JsonLd'
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildFaqSchema,
  buildAggregateRatingSchema,
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
          buildAggregateRatingSchema({
            ratingValue: 4.9,
            reviewCount: testimonials?.length > 0 ? testimonials.length : 47,
          }),
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
              🏋️ Online Koçluk · 🥗 Online Diyetisyen · 🌿 Wellness
            </motion.span>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="mt-5 font-display text-[2rem] font-bold leading-[1.15] tracking-tight text-white sm:text-[2.75rem] lg:text-5xl"
            >
              <span className="block">Kişisel koçluk ve beslenme desteği —</span>
              <RotatingHeroText />
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base lg:mx-0"
            >
              Yeni Form; uzman diyetisyenler, kişisel antrenörler ve gelişmiş
              sağlık analizleriyle yaşam tarzınıza uygun sürdürülebilir çözümler
              sunar. Beslenmeden egzersize ilerlemenizi tek platform üzerinden
              takip edin ve hedefinize ulaşın.
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
                  🚀 Ücretsiz Başla
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/membership"
                  className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  📝 Planları İncele
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
          ÜYELİK SEÇENEKLERİ
      ═══════════════════════════════════════════ */}
      <PlansAnimatedBackground className="plans-section-ref !py-12 sm:!py-16">
        <div className="mx-auto w-full max-w-[92rem] px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '50px' }}
            className="plans-ref-heading text-center"
          >
            <span className="plans-ref-badge">
              <Star className="h-3 w-3 fill-current" aria-hidden />
              Üyelik Planları
            </span>
            <h2 className="section-title mt-3 text-[clamp(1.5rem,3.2vw,2.15rem)]">
              Hedefinize{' '}
              <span className="bg-gradient-to-r from-sage-600 to-brand-600 bg-clip-text text-transparent">
                uygun planı
              </span>{' '}
              seçin.
            </h2>
            <p className="section-subtitle mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              Yeni Form&apos;un tüm planları uzman desteğiyle hazırlanır. İhtiyaçlarınıza ve
              hedeflerinize göre planınızı yükseltebilir veya değiştirebilirsiniz.
            </p>
          </motion.div>

          <div className="plans-cards-grid mt-5 sm:mt-6 lg:mt-8">
            {displayPlans.map((plan, i) => (
              <div
                key={plan.id}
                className={`plans-card-reveal plans-card-reveal-delay-${Math.min(i + 1, 3)} relative min-w-0`}
              >
                <PricingCard
                  plan={plan}
                  featured={plan.id === 'vip'}
                  ctaTo={`/onboarding?plan=${plan.id}`}
                  ctaLabel={getPlanCtaLabel(plan)}
                />
              </div>
            ))}
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
            <FAQAccordion items={allFaqs.slice(0, 6)} />
          </div>
        </section>
      )}

      {/* BİZE ULAŞIN */}
      <ContactSection />

      <TrustStrip />
    </div>
  )
}

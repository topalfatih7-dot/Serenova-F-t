import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Apple,
  Dumbbell,
  ShieldCheck,
  Lock,
  BadgeCheck,
  Sparkles,
  Video,
  ClipboardList,
  UserRound,
  CalendarCheck,
  LineChart,
} from 'lucide-react'
import JsonLd from '../../components/seo/JsonLd'
import {
  buildServiceSchema,
  buildFaqSchema,
  buildBreadcrumbSchema,
  buildHowToSchema,
  buildSpeakableWebPageSchema,
} from '../../config/seo'
import { BRAND } from '../../config/brand'
import { SERVICE_PAGES } from '../../data/seoServiceContent'
import { ALL_PLANS } from '../../data/membershipPlans'
import FAQAccordion from '../../components/landing/FAQAccordion'

/** Bu sayfalara özel hero görselleri — kadro / About görselleriyle paylaşılmaz */
const SERVICE_HERO_IMAGES = {
  '/online-diyetisyen': {
    src: '/services/online-diyetisyen.webp',
    srcSm: '/services/online-diyetisyen-sm.webp',
    alt: 'Renkli sağlıklı beslenme kasesi — online diyetisyen hizmeti',
  },
  '/online-kocluk': {
    src: '/services/online-kocluk.webp',
    srcSm: '/services/online-kocluk-sm.webp',
    alt: 'Stüdyoda grup fitness antrenmanı — online koçluk hizmeti',
  },
}

const STEP_ICONS = [ClipboardList, UserRound, Video, LineChart]
const STEP_ACCENTS = [
  { card: 'from-brand-50 to-white border-brand-200/80', badge: 'from-brand-500 to-brand-700', glow: 'bg-brand-200/40' },
  { card: 'from-sage-50 to-white border-sage-200/80', badge: 'from-sage-500 to-sage-700', glow: 'bg-sage-200/40' },
  { card: 'from-warm-50 to-white border-warm-200/80', badge: 'from-warm-400 to-warm-500', glow: 'bg-warm-200/40' },
  { card: 'from-mint-50 to-white border-sage-200/70', badge: 'from-brand-400 to-sage-600', glow: 'bg-brand-100/50' },
]

const WHY_BY_PATH = {
  '/online-diyetisyen': [
    {
      icon: Video,
      title: 'Platform içi video görüşme',
      text: 'Ayrı uygulama gerekmez — diyetisyen seanslarınız panelden başlar.',
      accent: 'from-brand-500 to-brand-700',
      card: 'border-brand-200/70 bg-gradient-to-br from-brand-50 via-white to-white',
    },
    {
      icon: CalendarCheck,
      title: 'Kişiye özel beslenme programı',
      text: 'Programınız üye panelinde takip edilir, seanslarla güncellenir.',
      accent: 'from-sage-500 to-sage-700',
      card: 'border-sage-200/70 bg-gradient-to-br from-sage-50 via-white to-white',
    },
    {
      icon: Sparkles,
      title: 'VIP ile birleşik destek',
      text: 'İsterseniz koç ve diyetisyeni aynı pakette birleştirin.',
      accent: 'from-warm-400 to-warm-500',
      card: 'border-warm-200/70 bg-gradient-to-br from-warm-50 via-white to-white',
    },
    {
      icon: ShieldCheck,
      title: 'Güvenli altyapı',
      text: 'KVKK uyumlu sistem ve uzman onaylı kadro.',
      accent: 'from-brand-400 to-sage-600',
      card: 'border-cream-200 bg-gradient-to-br from-cream-50 via-white to-white',
    },
  ],
  '/online-kocluk': [
    {
      icon: Video,
      title: 'Platform içi video görüşme',
      text: 'Ayrı uygulama gerekmez — koç seanslarınız panelden başlar.',
      accent: 'from-brand-500 to-brand-700',
      card: 'border-brand-200/70 bg-gradient-to-br from-brand-50 via-white to-white',
    },
    {
      icon: CalendarCheck,
      title: 'Kişiye özel antrenman programı',
      text: 'Programınız panelde kalır; listedeki hareket videolarıyla teknik netleşir.',
      accent: 'from-sage-500 to-sage-700',
      card: 'border-sage-200/70 bg-gradient-to-br from-sage-50 via-white to-white',
    },
    {
      icon: Sparkles,
      title: 'VIP ile birleşik destek',
      text: 'İsterseniz koç ve diyetisyeni aynı pakette birleştirin.',
      accent: 'from-warm-400 to-warm-500',
      card: 'border-warm-200/70 bg-gradient-to-br from-warm-50 via-white to-white',
    },
    {
      icon: ShieldCheck,
      title: 'Güvenli altyapı',
      text: 'KVKK uyumlu sistem ve uzman onaylı koç kadrosu.',
      accent: 'from-brand-400 to-sage-600',
      card: 'border-cream-200 bg-gradient-to-br from-cream-50 via-white to-white',
    },
  ],
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
}

const THEMES = {
  dietitian: {
    gradientFrom: 'from-sage-900/95',
    gradientVia: 'via-sage-900/75',
    meshA: 'service-mesh-sage',
    meshB: 'service-mesh-cream',
    iconGrad: 'from-sage-500 to-sage-700',
    ctaGrad: 'from-sage-600 to-brand-600',
    badgeIcon: Apple,
  },
  coach: {
    gradientFrom: 'from-brand-950/95',
    gradientVia: 'via-brand-900/75',
    meshA: 'service-mesh-brand',
    meshB: 'service-mesh-cream',
    iconGrad: 'from-brand-500 to-brand-700',
    ctaGrad: 'from-brand-600 to-sage-600',
    badgeIcon: Dumbbell,
  },
}

/** **kalın** işaretlerini React düğümlerine çevirir */
function EmphasizedText({ text }) {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-cream-950">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function ServiceLandingPage({ path }) {
  const page = SERVICE_PAGES[path]
  const theme = THEMES[page?.theme] || THEMES.dietitian
  if (!page) return null

  const hero = SERVICE_HERO_IMAGES[path] || SERVICE_HERO_IMAGES[page.heroFallback] || SERVICE_HERO_IMAGES['/online-diyetisyen']
  const ThemeIcon = theme.badgeIcon
  const whyItems = WHY_BY_PATH[path] || WHY_BY_PATH[page.pillarPath] || WHY_BY_PATH['/online-diyetisyen']
  const isCoach = (page.theme || path) === 'coach' || path === '/online-kocluk' || path.startsWith('/online-kocluk')

  const planOffers = (page.offerPlanIds || []).map((id) => {
    const plan = ALL_PLANS.find((p) => p.id === id)
    if (!plan) return null
    return {
      name: plan.name,
      path: '/membership',
      description: plan.tagline || plan.name,
      price: plan.price,
    }
  }).filter(Boolean)

  const stepsSection = page.sections.find((s) => s.steps?.length)
  const crumbs = [
    { name: 'Ana Sayfa', path: '/' },
    ...(page.pillarPath ? [{ name: page.pillarName || page.pillarPath, path: page.pillarPath }] : []),
    { name: page.serviceName, path: page.path },
  ]
  const schemas = [
    buildSpeakableWebPageSchema({
      name: page.serviceName,
      path: page.path,
      description: page.description,
    }),
    buildServiceSchema({
      name: page.serviceName,
      description: page.description,
      path: page.path,
      serviceType: page.serviceType,
      offers: planOffers.length
        ? planOffers
        : [
            {
              name: isCoach ? 'Spor Paketi' : 'Diyet Paketi',
              path: '/membership',
              description: page.lead.replace(/\*\*/g, ''),
              price: isCoach ? 2499 : 2499,
            },
            {
              name: 'VIP Paket',
              path: '/membership',
              description: 'Koç ve diyetisyen desteğini birleştiren paket',
              price: 4999,
            },
          ],
    }),
    stepsSection
      ? buildHowToSchema({
          name: stepsSection.h2,
          description: page.lead.replace(/\*\*/g, ''),
          steps: stepsSection.steps,
        })
      : null,
    buildFaqSchema(page.faqs),
    buildBreadcrumbSchema(crumbs),
  ]

  return (
    <div className="service-page-shell overflow-x-hidden">
      <JsonLd data={schemas} />

      {/* ═══ HERO — açık panelli koyu metin (aydınlık görsellerde okunur) ═══ */}
      <section className="relative isolate min-h-[min(88svh,720px)] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={hero.src}
            srcSet={`${hero.srcSm} 800w, ${hero.src} 1400w`}
            sizes="100vw"
            alt=""
            aria-hidden
            className={`h-full w-full object-cover ${
              path === '/online-diyetisyen' ? 'object-[55%_center]' : 'object-[60%_center]'
            }`}
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-cream-50/95 via-cream-50/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-cream-100/90 via-transparent to-cream-50/40" />
        </div>

        <div aria-hidden className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-brand-200/35 blur-3xl" />
        <div aria-hidden className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-sage-200/30 blur-3xl" />

        <div className="relative mx-auto flex min-h-[min(88svh,720px)] max-w-6xl flex-col justify-end px-4 pb-14 pt-28 sm:px-6 sm:pb-20 lg:justify-center lg:pb-24 lg:pt-32">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
            className="max-w-2xl rounded-3xl border border-cream-200/80 bg-white/90 p-6 shadow-xl shadow-cream-900/10 backdrop-blur-md sm:p-8 lg:ml-0 lg:mr-auto"
          >
            <p className="font-display text-sm font-bold tracking-wide text-cream-900 sm:text-base">
              {BRAND.name}
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-cream-200 bg-cream-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-cream-800 sm:text-xs">
              <ThemeIcon className={`h-3.5 w-3.5 ${path === '/online-diyetisyen' ? 'text-sage-600' : 'text-brand-600'}`} />
              {page.serviceName}
            </span>
            <h1 className="mt-5 font-display text-[1.85rem] font-bold leading-[1.15] tracking-tight text-cream-950 sm:text-4xl lg:text-[2.75rem]">
              {page.h1}
            </h1>
            <p className="speakable-intro mt-5 max-w-xl text-sm leading-relaxed text-cream-800 sm:text-base">
              <EmphasizedText text={page.lead} />
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={page.primaryCta.to}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-sage-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-900/20 transition hover:brightness-110"
              >
                {page.primaryCta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to={page.secondaryCta.to}
                className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-white px-6 py-3.5 text-sm font-semibold text-cream-900 transition hover:border-brand-300 hover:bg-brand-50"
              >
                <Sparkles className="h-4 w-4 text-brand-600" />
                {page.secondaryCta.label}
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2.5 border-t border-cream-200 pt-5">
              {[
                { icon: ShieldCheck, label: 'KVKK uyumlu' },
                { icon: Lock, label: '256-bit SSL' },
                { icon: Video, label: 'Video görüşme' },
              ].map((t) => (
                <span key={t.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-cream-800">
                  <t.icon className="h-4 w-4 text-sage-600" />
                  {t.label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
        <span className="sr-only">{hero.alt}</span>
      </section>

      {/* ═══ Hızlı geçiş linkleri ═══ */}
      <div className="border-b border-cream-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 text-sm sm:px-6">
          <Link to={page.teamLink.to} className="font-semibold text-brand-700 underline-offset-2 hover:underline">
            {page.teamLink.label}
          </Link>
          <Link to={page.relatedService.to} className="font-medium text-cream-800/70 underline-offset-2 hover:text-brand-700 hover:underline">
            {page.relatedService.label}
          </Link>
          {(page.relatedLinks || []).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="font-medium text-cream-800/70 underline-offset-2 hover:text-brand-700 hover:underline"
            >
              {link.label}
            </Link>
          ))}
          <Link to="/membership" className="font-medium text-cream-800/70 underline-offset-2 hover:text-brand-700 hover:underline">
            Üyelik paketleri
          </Link>
        </div>
      </div>

      {/* ═══ İçerik bölümleri ═══ */}
      {page.sections.map((section, idx) => {
        if (section.steps?.length) {
          return (
            <section key={section.h2} className="about-section-asymmetric relative py-16 sm:py-20">
              <div aria-hidden className="about-mesh about-mesh-guarantees" />
              <div aria-hidden className="about-mesh-dot" />
              <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-40px' }}
                  className="max-w-2xl"
                >
                  <span className="section-badge">Süreç</span>
                  <h2 className="section-title mt-4 text-left">{section.h2}</h2>
                  <p className="section-subtitle mt-3 max-w-xl text-left text-base sm:text-lg">
                    {isCoach
                      ? 'Kayıttan ilk koç görüşmesine kadar net adımlar — program, hareket videoları ve video seansları tek yerde.'
                      : 'Kayıttan ilk görüşmeye kadar net adımlar — panel ve video seansları tek yerde.'}
                  </p>
                </motion.div>

                <ol className="mt-12 grid gap-5 sm:grid-cols-2 sm:gap-6">
                  {section.steps.map((step, i) => {
                    const Icon = STEP_ICONS[i] || ClipboardList
                    const accent = STEP_ACCENTS[i % STEP_ACCENTS.length]
                    return (
                      <motion.li
                        key={step.title}
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        custom={i}
                        viewport={{ once: true, margin: '-40px' }}
                        className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6 ${accent.card}`}
                      >
                        <div aria-hidden className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full ${accent.glow} blur-2xl`} />
                        <div className="relative flex items-start gap-4">
                          <span
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent.badge} text-white shadow-md`}
                          >
                            <Icon className="h-5 w-5" strokeWidth={2.2} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-display text-lg font-bold tracking-tight text-cream-950">
                                {step.title}
                              </p>
                              <span className="font-display text-xl font-bold tabular-nums text-cream-200">
                                {String(i + 1).padStart(2, '0')}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-cream-800/80 sm:text-[15px]">
                              {step.text}
                            </p>
                          </div>
                        </div>
                      </motion.li>
                    )
                  })}
                </ol>
              </div>
            </section>
          )
        }

        const flip = idx % 2 === 1
        return (
          <section key={section.h2} className="about-section-asymmetric relative py-16 sm:py-20">
            <div aria-hidden className={`about-mesh ${idx % 2 === 0 ? theme.meshA : theme.meshB}`} />
            <div aria-hidden className="about-mesh-dot" />
            <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
              <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-60px' }}
                  className={flip ? 'lg:col-span-5 lg:col-start-8 lg:row-start-1' : 'lg:col-span-5'}
                >
                  <span className="section-badge">Hizmet</span>
                  <h2 className="section-title mt-4 text-left">{section.h2}</h2>
                </motion.div>
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  custom={1}
                  viewport={{ once: true, margin: '-60px' }}
                  className={flip ? 'lg:col-span-6 lg:col-start-1 lg:row-start-1' : 'lg:col-span-6 lg:col-start-7'}
                >
                  {(section.paragraphs || []).map((p) => (
                    <p
                      key={p.slice(0, 40)}
                      className="mt-5 text-base leading-relaxed text-cream-800 first:mt-0 sm:text-lg sm:leading-[1.7]"
                    >
                      <EmphasizedText text={p} />
                    </p>
                  ))}
                </motion.div>
              </div>
            </div>
          </section>
        )
      })}

      {/* ═══ Neden Yeni Form ═══ */}
      <section className="about-section-asymmetric relative py-16 sm:py-20">
        <div aria-hidden className={`about-mesh ${theme.meshA}`} />
        <div aria-hidden className="about-mesh-dot" />
        <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <span className="section-badge">Fark</span>
            <h2 className="section-title mt-4 text-left">Neden {BRAND.name}?</h2>
            <p className="section-subtitle mt-3 max-w-xl text-left text-base sm:text-lg">
              {isCoach ? (
                <>
                  Tek seferlik PDF veya mesaj listesi değil — <strong className="font-semibold text-cream-950">video görüşme</strong>, antrenman programı ve hareket videoları tek sistemde.
                </>
              ) : (
                <>
                  Mesaj listesi veya tek seferlik PDF değil — <strong className="font-semibold text-cream-950">video görüşme</strong>, panel ve program tek sistemde.
                </>
              )}
            </p>
          </motion.div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {whyItems.map((item, i) => (
              <motion.li
                key={item.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                custom={i}
                viewport={{ once: true }}
                className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6 ${item.card}`}
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-md transition group-hover:scale-105`}>
                  <item.icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <h3 className="mt-4 font-display text-base font-bold tracking-tight text-cream-950 sm:text-lg">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-cream-800/80 sm:text-[15px]">
                  {item.text}
                </p>
              </motion.li>
            ))}
          </ul>

          <p className="relative z-[1] mt-10 text-sm text-cream-700/75">
            <BadgeCheck className="mr-1.5 inline h-4 w-4 text-brand-600" />
            Hizmet standartları:{' '}
            <Link to="/legal/diyetisyen-hizmet-standartlari" className="font-medium text-brand-700 underline-offset-2 hover:underline">
              Diyetisyen
            </Link>
            {' · '}
            <Link to="/legal/antrenor-hizmet-standartlari" className="font-medium text-brand-700 underline-offset-2 hover:underline">
              Antrenör
            </Link>
            {' · '}
            <Link to="/hakkimizda" className="font-medium text-brand-700 underline-offset-2 hover:underline">
              Hakkımızda
            </Link>
            {' · '}
            <Link to="/stories" className="font-medium text-brand-700 underline-offset-2 hover:underline">
              Başarı hikayeleri
            </Link>
          </p>
        </div>
      </section>

      {page.faqs?.length ? (
        <section className="faq-section about-section-asymmetric relative py-16 sm:py-20">
          <div aria-hidden className={`about-mesh ${theme.meshB}`} />
          <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
            <FAQAccordion items={page.faqs} />
          </div>
        </section>
      ) : null}

      {/* ═══ CTA band ═══ */}
      <section className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.ctaGrad}`} />
        <div aria-hidden className="absolute -left-16 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-black/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Hazır mısınız?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
              {isCoach
                ? 'Spor veya VIP paketle koç desteğine geçin.'
                : 'Uzman destekli bir paket seçerek başlayın.'}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to={page.primaryCta.to}
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-cream-900 shadow-lg transition hover:bg-cream-50"
              >
                {page.primaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/membership"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Paket Seçin
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

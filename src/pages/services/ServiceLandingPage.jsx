import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Apple,
  Dumbbell,
  ShieldCheck,
  Lock,
  BadgeCheck,
  Sparkles,
  Video,
} from 'lucide-react'
import JsonLd from '../../components/seo/JsonLd'
import {
  buildServiceSchema,
  buildFaqSchema,
  buildBreadcrumbSchema,
} from '../../config/seo'
import { BRAND } from '../../config/brand'
import { SERVICE_PAGES } from '../../data/seoServiceContent'
import { TEAM_HERO_IMAGES } from '../../utils/teamHeroImages'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
}

const THEMES = {
  '/online-diyetisyen': {
    role: 'dietitians',
    gradientFrom: 'from-sage-900/95',
    gradientVia: 'via-sage-900/75',
    meshA: 'service-mesh-sage',
    meshB: 'service-mesh-cream',
    iconGrad: 'from-sage-500 to-sage-700',
    ctaGrad: 'from-sage-600 to-brand-600',
    badgeIcon: Apple,
  },
  '/online-kocluk': {
    role: 'coaches',
    gradientFrom: 'from-brand-950/95',
    gradientVia: 'via-brand-900/75',
    meshA: 'service-mesh-brand',
    meshB: 'service-mesh-cream',
    iconGrad: 'from-brand-500 to-brand-700',
    ctaGrad: 'from-brand-600 to-sage-600',
    badgeIcon: Dumbbell,
  },
}

export default function ServiceLandingPage({ path }) {
  const page = SERVICE_PAGES[path]
  const theme = THEMES[path]
  if (!page || !theme) return null

  const hero = TEAM_HERO_IMAGES[theme.role]
  const ThemeIcon = theme.badgeIcon

  const schemas = [
    buildServiceSchema({
      name: page.serviceName,
      description: page.description,
      path: page.path,
      serviceType: page.serviceType,
      offers: [
        {
          name: path === '/online-diyetisyen' ? 'Diyet Paketi' : 'Spor Paketi',
          path: '/membership',
          description: page.lead,
        },
        {
          name: 'VIP Paket',
          path: '/membership',
          description: 'Koç ve diyetisyen desteğini birleştiren paket',
        },
      ],
    }),
    buildFaqSchema(page.faqs),
    buildBreadcrumbSchema([
      { name: 'Ana Sayfa', path: '/' },
      { name: page.serviceName, path: page.path },
    ]),
  ]

  return (
    <div className="service-page-shell overflow-x-hidden">
      <JsonLd data={schemas} />

      {/* ═══ HERO — full-bleed, About / Team dilinde ═══ */}
      <section className="relative isolate min-h-[min(88svh,720px)] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={hero.src}
            srcSet={`${hero.srcSm} 800w, ${hero.src} 1400w`}
            sizes="100vw"
            alt=""
            aria-hidden
            className="h-full w-full object-cover object-center"
            fetchPriority="high"
            decoding="async"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientVia} to-cream-900/35`} />
          <div className="absolute inset-0 bg-gradient-to-t from-cream-950/80 via-transparent to-black/25" />
        </div>

        <div aria-hidden className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-brand-400/25 blur-3xl" />
        <div aria-hidden className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-sage-400/20 blur-3xl" />

        <div className="relative mx-auto flex min-h-[min(88svh,720px)] max-w-6xl flex-col justify-end px-4 pb-14 pt-28 sm:px-6 sm:pb-20 lg:justify-center lg:pb-24 lg:pt-32">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
            className="max-w-2xl lg:ml-0 lg:mr-auto"
          >
            <p className="font-display text-sm font-bold tracking-wide text-white/90 sm:text-base">
              {BRAND.name}
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur sm:text-xs">
              <ThemeIcon className="h-3.5 w-3.5 text-brand-300" />
              {page.serviceName}
            </span>
            <h1 className="mt-5 font-display text-[1.85rem] font-bold leading-[1.15] text-white sm:text-4xl lg:text-[2.75rem]">
              {page.h1}
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
              {page.lead}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={page.primaryCta.to}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-sage-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-900/25 transition hover:brightness-110"
              >
                {page.primaryCta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to={page.secondaryCta.to}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <Sparkles className="h-4 w-4 text-brand-300" />
                {page.secondaryCta.label}
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2.5 border-t border-white/15 pt-5">
              {[
                { icon: ShieldCheck, label: 'KVKK uyumlu' },
                { icon: Lock, label: '256-bit SSL' },
                { icon: Video, label: 'Video görüşme' },
              ].map((t) => (
                <span key={t.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/75">
                  <t.icon className="h-4 w-4 text-sage-300" />
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
          <Link to="/membership" className="font-medium text-cream-800/70 underline-offset-2 hover:text-brand-700 hover:underline">
            Üyelik paketleri
          </Link>
        </div>
      </div>

      {/* ═══ İçerik bölümleri — orijinal sıra, asimetrik mesh ═══ */}
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
                  <p className="section-subtitle mt-3 max-w-xl text-left">
                    Kayıttan ilk görüşmeye kadar net adımlar — paneli ve video seansları tek yerde.
                  </p>
                </motion.div>

                <ol className="mt-12 grid gap-6 sm:grid-cols-2">
                  {section.steps.map((step, i) => (
                    <motion.li
                      key={step.title}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="show"
                      custom={i}
                      viewport={{ once: true, margin: '-40px' }}
                      className={`relative flex gap-4 ${i % 2 === 1 ? 'sm:mt-8' : ''}`}
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.iconGrad} font-display text-sm font-bold text-white shadow-md`}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="font-display text-lg font-bold text-cream-950">{step.title}</p>
                        <p className="mt-2 text-sm leading-relaxed text-cream-800/80">{step.text}</p>
                      </div>
                    </motion.li>
                  ))}
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
                      className="mt-4 text-[15px] leading-relaxed text-cream-800/85 first:mt-0 sm:text-base"
                    >
                      {p}
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
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="lg:col-span-5"
            >
              <span className="section-badge">Fark</span>
              <h2 className="section-title mt-4 text-left">Neden {BRAND.name}?</h2>
              <p className="section-subtitle mt-3 max-w-md text-left">
                WhatsApp listesi veya tek seferlik PDF değil — video görüşme, panel ve program tek sistemde.
              </p>
            </motion.div>
            <ul className="space-y-4 lg:col-span-6 lg:col-start-7">
              {[
                'Platform içi video görüşme — ayrı uygulama gerekmez',
                'Kişiye özel program üye panelinde takip edilir',
                'İsterseniz koç ve diyetisyeni VIP ile birleştirin',
                'KVKK uyumlu altyapı ve uzman onaylı kadro',
              ].map((item, i) => (
                <motion.li
                  key={item}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  custom={i}
                  viewport={{ once: true }}
                  className="flex items-start gap-3 border-b border-cream-200/70 pb-4 last:border-0"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sage-600" />
                  <span className="text-[15px] leading-relaxed text-cream-900/90">{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>
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

      {/* ═══ SSS ═══ */}
      <section className="about-section-asymmetric relative py-16 sm:py-20">
        <div aria-hidden className="about-mesh about-mesh-values" />
        <div aria-hidden className="about-mesh-dot" />
        <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-12">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start"
            >
              <span className="section-badge">SSS</span>
              <h2 className="section-title mt-4 text-left">Sık sorulan sorular</h2>
              <p className="section-subtitle mt-3 text-left">
                Paket, görüşme formatı ve süreç hakkında net yanıtlar.
              </p>
            </motion.div>
            <div className="lg:col-span-7 lg:col-start-6">
              <ServiceFaqList faqs={page.faqs} />
            </div>
          </div>
        </div>
      </section>

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
              Ücretsiz Basic ile başlayın veya doğrudan uzman destekli pakete geçin.
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
                to="/onboarding?plan=free"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ücretsiz Başla
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

function ServiceFaqList({ faqs = [] }) {
  const [open, setOpen] = useState(0)
  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => {
        const isOpen = open === i
        return (
          <div
            key={faq.q}
            className="overflow-hidden rounded-2xl border border-cream-200/90 bg-white/90 shadow-sm shadow-cream-900/5 backdrop-blur"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-cream-50/50"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-cream-950 sm:text-[15px]">{faq.q}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-cream-500 transition duration-300 ${isOpen ? 'rotate-180 text-brand-600' : ''}`}
              />
            </button>
            {isOpen && (
              <p className="border-t border-cream-100 px-5 py-4 text-sm leading-relaxed text-cream-800/85">
                {faq.a}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

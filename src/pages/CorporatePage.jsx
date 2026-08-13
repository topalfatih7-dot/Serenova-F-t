import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Users,
  HeartPulse,
  Apple,
  Dumbbell,
  ArrowRight,
  Sparkles,
  TrendingDown,
  BadgeCheck,
  BarChart3,
  Laptop,
} from 'lucide-react'
import HeroBackgroundVideo from '../components/ui/HeroBackgroundVideo'

/**
 * Mixkit — Mixkit Video Free License (ticari kullanım, atıf gerekmez)
 * @see https://mixkit.co/license/#videoFree
 */
const CORPORATE_VIDEOS = {
  /** Hero: ofiste toplantı, laptop ve dokümanlarla iş ekibi */
  hero: {
    src: 'https://assets.mixkit.co/videos/4809/4809-720.mp4',
    poster: 'https://assets.mixkit.co/videos/4809/4809-thumb-720-0.jpg',
    page: 'https://mixkit.co/free-stock-video/business-people-at-work-meeting-4809/',
    label: 'İş ekibi ofis toplantısı',
  },
  /** Neden kurumsal wellness: küçük grup yoga / esneme seansı */
  wellness: {
    src: 'https://assets.mixkit.co/videos/43732/43732-720.mp4',
    poster: 'https://assets.mixkit.co/videos/43732/43732-thumb-720-0.jpg',
    page: 'https://mixkit.co/free-stock-video/yoga-practice-of-a-small-group-of-people-43732/',
    label: 'Grup wellness ve yoga seansı',
  },
}

const ROTATING_PHRASES = [
  'verimliliği artırır',
  'bağlılığı güçlendirir',
  'devamsızlığı azaltır',
  'takım ruhunu besler',
  'sürdürülebilir büyüme sağlar',
]

const benefits = [
  { icon: HeartPulse, title: 'Çalışan Sağlığı', text: 'Ölçülebilir wellness KPI’ları ile bağlılık ve verimlilik artışı', accent: 'from-rose-400 to-brand-500' },
  { icon: Dumbbell, title: 'Koçluk & Antrenman', text: 'Online grup seansları ve birebir koç desteği', accent: 'from-brand-400 to-brand-600' },
  { icon: Apple, title: 'Beslenme Programları', text: 'Kurumsal diyetisyen danışmanlığı ve atölyeler', accent: 'from-sage-400 to-emerald-600' },
  { icon: Users, title: 'Ölçeklenebilir Paketler', text: '10 kişiden 500+ çalışana kadar esnek planlar', accent: 'from-warm-400 to-brand-500' },
]

const whyPoints = [
  { icon: TrendingDown, text: 'Stres ve tükenmişlik kaynaklı devamsızlığı azaltır' },
  { icon: BadgeCheck, text: 'Çalışan bağlılığını ve işe dönüş oranını yükseltir' },
  { icon: BarChart3, text: 'Yönetim paneli ile katılım ve ilerleme raporlanır' },
  { icon: Laptop, text: 'Hibrit ve uzaktan ekipler için tamamen online uygulanır' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
}

function RotatingCorporateText() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % ROTATING_PHRASES.length), 3200)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="relative inline-block min-h-[1.2em] align-bottom">
      <AnimatePresence mode="wait">
        <motion.span
          key={ROTATING_PHRASES[index]}
          initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block bg-gradient-to-r from-brand-300 via-sage-300 to-gold-300 bg-clip-text text-transparent"
        >
          {ROTATING_PHRASES[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function CorporateWellnessVideo() {
  return (
    <div className="corporate-video-showcase">
      <div aria-hidden className="corporate-video-showcase-glow" />
      <div aria-hidden className="corporate-video-showcase-blob corporate-video-showcase-blob-a" />
      <div aria-hidden className="corporate-video-showcase-blob corporate-video-showcase-blob-b" />
      <div aria-hidden className="corporate-video-showcase-ring" />
      <div aria-hidden className="corporate-video-showcase-dots" />
      <div aria-hidden className="corporate-video-showcase-shadow" />

      <div className="corporate-video-frame">
        <div className="corporate-video-frame-inner relative overflow-hidden">
          <HeroBackgroundVideo
            layout="inline"
            src={CORPORATE_VIDEOS.wellness.src}
            poster={CORPORATE_VIDEOS.wellness.poster}
            videoClassName="corporate-video-media"
          />
          <div className="corporate-video-vignette" />
          <div className="corporate-video-caption">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-white/75">Grup seansı</p>
            <p className="mt-0.5 text-sm font-semibold leading-snug text-white">Wellness & yoga atölyeleri</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CorporatePage() {
  return (
    <div className="overflow-x-hidden bg-cream-50/30">
      {/* ── HERO: iş insanları video + sağda cam kart ── */}
      <section className="relative flex min-h-[92svh] items-center overflow-hidden sm:min-h-[100svh]">
        <HeroBackgroundVideo
          src={CORPORATE_VIDEOS.hero.src}
          poster={CORPORATE_VIDEOS.hero.poster}
          videoStyle={{ filter: 'blur(2px) brightness(0.5) saturate(1.15)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />

        <motion.div
          aria-hidden
          animate={{ scale: [1, 1.18, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl"
        />
        <motion.div
          aria-hidden
          animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -right-16 bottom-1/3 h-56 w-56 rounded-full bg-sage-400/20 blur-3xl"
        />

        <div className="relative mx-auto flex w-full max-w-6xl items-center justify-end px-4 py-20 sm:px-6 lg:min-h-[92svh]">
          <motion.div
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
              aria-hidden
              className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-brand-400/25 blur-2xl"
            />

            <div className="relative overflow-hidden rounded-3xl rounded-tr-[3.5rem] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="absolute left-0 top-0 h-1 w-2/3 rounded-tr-full bg-gradient-to-r from-brand-400 via-sage-400 to-transparent" />
              <div className="absolute bottom-0 right-0 h-1 w-1/2 rounded-tl-full bg-gradient-to-l from-gold-400/80 via-brand-300 to-transparent" />

              <motion.span
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={0}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur"
              >
                <Building2 className="h-3.5 w-3.5 text-brand-300" />
                Kurumsal Wellness
              </motion.span>

              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={1}
                className="mt-4 font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.65rem]"
              >
                Sağlıklı ekip{' '}
                <RotatingCorporateText />
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={2}
                className="mt-4 text-sm leading-relaxed text-white/85 sm:text-base"
              >
                Koçluk, beslenme ve mental wellness — tek platformda, ölçülebilir sonuçlarla.
                İK ekipleri için hazır paketler, çalışanlar için kişisel deneyim.
              </motion.p>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={3}
                className="mt-6 flex flex-wrap gap-3"
              >
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/corporate/apply"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-sage-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30"
                  >
                    Kurumsal Başvuru
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <a
                    href="#neden-kurumsal"
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    Neden wellness?
                  </a>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/online-kocluk"
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    Online koçluk
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={4}
                className="mt-8 grid grid-cols-3 gap-2 border-t border-white/15 pt-6"
              >
                {[
                  { value: '500+', label: 'Çalışana kadar' },
                  { value: '%94', label: 'Memnuniyet' },
                  { value: '7/24', label: 'Platform' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="font-display text-lg font-bold text-white sm:text-xl">{s.value}</p>
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-white/60 sm:text-xs">{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Faydalar ── */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          className="text-center"
        >
          <span className="section-badge inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Kurumsal paketler
          </span>
          <h2 className="section-title mt-3">Şirketinize özel wellness çözümleri</h2>
          <p className="section-subtitle mx-auto mt-2 max-w-2xl">
            Küçük ekiplerden büyük organizasyonlara — ihtiyacınıza göre ölçeklenen programlar.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative overflow-hidden rounded-2xl border border-cream-200/90 bg-white p-6 shadow-sm ring-1 ring-black/[0.02] transition-shadow hover:shadow-lg"
            >
              <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${b.accent} p-3 text-white shadow-md`}>
                <b.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-cream-900">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream-800/65">{b.text}</p>
              <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-brand-100/40 blur-2xl transition group-hover:bg-brand-200/50" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Neden kurumsal wellness: video sol, metin sağ ── */}
      <section id="neden-kurumsal" className="relative overflow-hidden bg-gradient-to-b from-white via-brand-50/30 to-sage-50/40 py-16 sm:py-24">
        <div aria-hidden className="wellness-orb -left-32 top-0 h-64 w-64 bg-brand-300/20" />
        <div aria-hidden className="wellness-orb -right-24 bottom-0 h-72 w-72 bg-sage-300/15" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
          {/* Video — sol (mobilde üst) */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="relative order-1 px-1 sm:px-2 lg:order-none lg:px-0"
          >
            <CorporateWellnessVideo />
          </motion.div>

          {/* Metin — sağ */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="order-2 lg:order-none"
          >
            <span className="section-badge inline-flex items-center gap-1.5">
              <HeartPulse className="h-3.5 w-3.5" />
              Neden kurumsal wellness?
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-cream-900 sm:text-4xl">
              Çalışan sağlığı artık{' '}
              <span className="bg-gradient-to-r from-brand-600 to-sage-600 bg-clip-text text-transparent">
                rekabet avantajı
              </span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-cream-800/70">
              Modern iş dünyasında tükenmişlik, hareketsizlik ve stres; hem çalışan refahını hem de
              şirket performansını doğrudan etkiler. Kurumsal wellness programları yalnızca “yan hak”
              değil — ölçülebilir ROI sunan stratejik bir yatırımdır.
            </p>
            <p className="mt-3 text-base leading-relaxed text-cream-800/70">
              Yeni Form ile uzman koç ve diyetisyen desteği, online grup seansları ve kişisel
              ilerleme takibi tek panelde birleşir. İK ekipleri katılımı izler; çalışanlar kendi
              ritimlerinde dönüşüm yaşar.
            </p>

            <ul className="mt-8 space-y-3">
              {whyPoints.map((item, i) => (
                <motion.li
                  key={item.text}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="flex items-start gap-3 rounded-xl border border-cream-200/80 bg-white/80 px-4 py-3.5 shadow-sm backdrop-blur-sm"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-100 to-sage-100 text-brand-600">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium leading-snug text-cream-800">{item.text}</span>
                </motion.li>
              ))}
            </ul>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35 }}
              className="mt-8"
            >
              <Link to="/corporate/apply" className="btn-wellness inline-flex gap-2">
                Ücretsiz kurumsal teklif alın
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-brand-200/80 bg-gradient-to-br from-brand-600 via-brand-700 to-sage-800 p-8 text-center sm:p-12"
        >
          <motion.div
            aria-hidden
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/10"
          />
          <motion.div
            aria-hidden
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/5 blur-2xl"
          />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Ekibiniz için özel teklif</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">
              Şirket büyüklüğünüze ve hedeflerinize göre paket ve fiyatlandırma önerisi hazırlıyoruz.
              Başvurunuz 2 iş günü içinde yanıtlanır.
            </p>
            <motion.div whileHover={{ scale: 1.03 }} className="mt-8 inline-block">
              <Link
                to="/corporate/apply"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-700 shadow-lg"
              >
                Başvuru Formunu Doldur
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

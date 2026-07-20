import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShieldCheck, Lock, BadgeCheck, Video, MessageCircle,
  ArrowRight, Star,
} from 'lucide-react'

/** Unsplash CDN — bu görsel sitenin başka hiçbir yerinde kullanılmaz (benzersiz). */
const TRUST_IMAGE = {
  url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1100&q=80',
  alt: 'Gün doğumunda birlikte koşan sporcular — birlikte daha güçlü',
}

const GUARANTEES = [
  {
    icon: ShieldCheck,
    title: 'KVKK uyumlu gizlilik',
    desc: 'Sağlık ve profil verileriniz şifreli altyapıda tutulur. İzni olmadan üçüncü taraflarla paylaşılmaz.',
    accent: 'from-brand-500 to-brand-600',
    rail: 'bg-brand-500',
  },
  {
    icon: BadgeCheck,
    title: 'Doğrulanmış uzman kadro',
    desc: 'Koç, diyetisyen ve doktor eşleşmeleri diploma ve deneyim kontrolüyle yapılır; rastgele atama yoktur.',
    accent: 'from-sage-500 to-sage-600',
    rail: 'bg-sage-500',
  },
  {
    icon: Video,
    title: 'Birebir video görüşme',
    desc: 'Uzmanınızla yüz yüze bağlanın. Programınız görüşme sonrası ihtiyaçlarınıza göre güncellenir.',
    accent: 'from-warm-400 to-warm-500',
    rail: 'bg-warm-400',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function TrustSection() {
  return (
    <section className="relative overflow-hidden py-14 sm:py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-cream-50/80 to-brand-50/30" />
      <div
        aria-hidden
        className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-100/40 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -right-16 bottom-8 h-64 w-64 rounded-full bg-sage-100/45 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '50px' }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-brand-900/15 ring-1 ring-brand-900/5">
              <div className="aspect-[4/3] w-full">
                <img
                  src={TRUST_IMAGE.url}
                  alt={TRUST_IMAGE.alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-t from-brand-900/30 via-transparent to-transparent" />
            </div>
            <div
              aria-hidden
              className="absolute -bottom-5 -right-5 -z-10 h-[92%] w-[92%] rounded-[1.75rem] bg-gradient-to-br from-brand-200/60 via-sage-100/70 to-warm-100/50"
            />

            <div className="absolute -bottom-5 left-4 flex items-center gap-2.5 rounded-2xl border border-cream-100 bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:left-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-warm-400 to-warm-500 text-white shadow-md">
                <Star className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </span>
              <div>
                <p className="text-xs font-bold text-cream-900">%94 üye memnuniyeti</p>
                <p className="text-[10px] text-cream-800/55">Gerçek üye geri bildirimleri</p>
              </div>
            </div>

            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-white/40 bg-white/90 px-3.5 py-1.5 shadow-lg backdrop-blur sm:right-6 sm:top-6">
              <Lock className="h-3.5 w-3.5 text-sage-600" />
              <span className="text-[11px] font-semibold text-cream-900">256-bit SSL</span>
            </div>
          </motion.div>

          <div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '50px' }}>
              <span className="section-badge">Güvence</span>
              <h2 className="section-title mt-4 tracking-tight">Güven, sistemle kurulur</h2>
              <p className="section-subtitle max-w-xl">
                Söz değil, ölçülebilir güvenceler: veri güvenliği, doğrulanmış uzmanlık ve gerçek görüşme deneyimi.
              </p>
            </motion.div>

            {/* Dikey liste — renkli sol şerit, eşit hizalı satırlar */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-cream-200/90 bg-white/90 shadow-sm ring-1 ring-black/[0.02] backdrop-blur-sm">
              {GUARANTEES.map((g, i) => (
                <motion.div
                  key={g.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  custom={i}
                  viewport={{ once: true, margin: '-40px' }}
                  className={`group relative flex gap-4 p-4 transition hover:bg-cream-50/80 sm:gap-5 sm:p-5 ${
                    i < GUARANTEES.length - 1 ? 'border-b border-cream-100' : ''
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute inset-y-3 left-0 w-1 rounded-full ${g.rail} opacity-80 transition group-hover:opacity-100`}
                  />
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${g.accent} text-white shadow-md transition group-hover:scale-105`}>
                    <g.icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="font-display text-sm font-bold tracking-tight text-cream-900 sm:text-[15px]">
                      {g.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-cream-800/70 sm:text-[13px]">
                      {g.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              custom={4}
              viewport={{ once: true, margin: '50px' }}
              className="mt-7 flex flex-wrap items-center gap-4"
            >
              <Link
                to="/hakkimizda"
                className="group inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
              >
                Bizi Daha Yakından Tanıyın
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-cream-800/60">
                <MessageCircle className="h-4 w-4 text-sage-600" />
                Sorularınız için buradayız
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

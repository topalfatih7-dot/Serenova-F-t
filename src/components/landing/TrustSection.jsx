import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShieldCheck, Lock, BadgeCheck, CreditCard, HeartHandshake, MessageCircle,
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
    title: 'KVKK Uyumlu Veri Güvenliği',
    desc: 'Sağlık verileriniz şifreli altyapıda saklanır, üçüncü taraflarla asla paylaşılmaz.',
    accent: 'from-brand-400 to-brand-600',
  },
  {
    icon: BadgeCheck,
    title: 'Uzman Onaylı Kadro',
    desc: 'Koç, diyetisyen ve doktorlarımız diploma ve deneyim kontrolünden geçer.',
    accent: 'from-sage-400 to-sage-600',
  },
  {
    icon: CreditCard,
    title: 'Güvenli Ödeme',
    desc: 'Ödemeler uluslararası Stripe altyapısıyla alınır; kart bilgileriniz bizde saklanmaz.',
    accent: 'from-warm-400 to-warm-500',
  },
  {
    icon: HeartHandshake,
    title: 'Taahhüt Yok',
    desc: 'Uzun süreli sözleşme yok — üyeliğinizi istediğiniz an tek tıkla iptal edin.',
    accent: 'from-rose-400 to-brand-500',
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
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-cream-50/60 py-14 sm:py-20">
      <div aria-hidden className="wellness-orb -right-24 top-12 h-72 w-72 bg-brand-200/30" />
      <div aria-hidden className="wellness-orb -left-16 bottom-0 h-64 w-64 bg-sage-200/30" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Sol: fotoğraf + yüzen güven kartları */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '50px' }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-3xl shadow-2xl shadow-brand-900/15 ring-1 ring-black/5">
              <div className="aspect-[4/3] w-full">
                <img
                  src={TRUST_IMAGE.url}
                  alt={TRUST_IMAGE.alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900/30 via-transparent to-transparent" />
            </div>
            <div aria-hidden className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-3xl bg-gradient-to-br from-brand-100 to-sage-100" />

            {/* Yüzen memnuniyet kartı */}
            <div className="absolute -bottom-5 left-4 flex items-center gap-2.5 rounded-2xl border border-cream-100 bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:left-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-warm-400 to-warm-500 text-white shadow-md">
                <Star className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </span>
              <div>
                <p className="text-xs font-bold text-cream-900">%94 üye memnuniyeti</p>
                <p className="text-[10px] text-cream-800/55">Gerçek üye geri bildirimleri</p>
              </div>
            </div>

            {/* Yüzen SSL rozeti */}
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-white/30 bg-white/85 px-3.5 py-1.5 shadow-lg backdrop-blur sm:right-6 sm:top-6">
              <Lock className="h-3.5 w-3.5 text-sage-600" />
              <span className="text-[11px] font-semibold text-cream-900">256-bit SSL</span>
            </div>
          </motion.div>

          {/* Sağ: başlık + güvence kartları */}
          <div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '50px' }}>
              <span className="section-badge">Güvence</span>
              <h2 className="section-title mt-4">Neden Bize Güvenebilirsiniz?</h2>
              <p className="section-subtitle max-w-xl">
                Güven, sözle değil sistemle kurulur. Üyelerimize verdiğimiz somut güvenceler:
              </p>
            </motion.div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {GUARANTEES.map((g, i) => (
                <motion.div
                  key={g.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  custom={i}
                  viewport={{ once: true, margin: '-40px' }}
                  className="group flex items-start gap-3.5 rounded-2xl border border-cream-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md sm:p-5"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${g.accent} text-white shadow-md transition group-hover:scale-110`}>
                    <g.icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-cream-900">{g.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-cream-800/65">{g.desc}</p>
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
                className="group inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
              >
                Bizi Daha Yakından Tanıyın
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-cream-800/60">
                <MessageCircle className="h-4 w-4 text-sage-600" />
                Sorularınız için 7/24 buradayız
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { motion } from 'framer-motion'
import {
  Heart, Users, Calendar, Shield, Sparkles, Dumbbell, Apple, TrendingUp, ChevronRight, Star,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { BRAND } from '../../config/brand'

const WHY_ITEMS = [
  {
    icon: Heart,
    title: 'Kişiye özel koçluk',
    accent: 'from-rose-400 to-brand-500',
    cta: { label: 'Koçlarımızı tanıyın', to: '/team/coaches' },
  },
  {
    icon: Dumbbell,
    title: 'Evde ve salonda antrenman rehberliği',
    accent: 'from-brand-400 to-brand-600',
    cta: { label: 'Programları keşfedin', to: '/membership' },
  },
  {
    icon: Apple,
    title: 'Beslenme & diyetisyen desteği',
    accent: 'from-sage-400 to-sage-600',
    cta: { label: 'Diyetisyenlerimizi görün', to: '/team/dietitians' },
  },
  {
    icon: Calendar,
    title: 'Takvim & program takibi',
    accent: 'from-brand-300 to-sage-500',
    cta: { label: 'Üyeliğe başlayın', to: '/onboarding' },
  },
  {
    icon: Users,
    title: 'Destekleyici topluluk',
    accent: 'from-warm-400 to-brand-500',
    cta: { label: 'Başarı hikayelerini oku', to: '/stories' },
  },
  {
    icon: TrendingUp,
    title: 'İlerleme takibi & raporlar',
    accent: 'from-mint-400 to-sage-500',
    cta: { label: 'Planları karşılaştırın', to: '/membership' },
  },
  {
    icon: Sparkles,
    title: 'Premium üyelik çeşitliliği',
    accent: 'from-gold-400 to-warm-500',
    cta: { label: 'Paketleri inceleyin', to: '/membership' },
  },
  {
    icon: Shield,
    title: 'KVKK uyumlu güvenli platform',
    accent: 'from-cream-300 to-brand-400',
    cta: { label: 'Gizlilik politikamız', to: '/legal/gizlilik-politikasi' },
  },
]

export default function WhyUsSection() {
  return (
    <section className="relative isolate min-h-[560px] overflow-hidden sm:min-h-[620px] lg:min-h-[720px]">
      {/* Arka plan — sağda canlı fotoğraf için filtre + keskin sol overlay */}
      <div className="absolute inset-0">
        <picture>
          <source srcSet="/why-us-bg.webp" type="image/webp" />
          <img
            src="/why-us-bg.webp"
            alt=""
            aria-hidden
            className="h-full w-full scale-110 object-cover object-[70%_28%] brightness-125 contrast-115 saturate-[1.35] sm:object-[78%_22%] lg:object-[85%_18%]"
            loading="lazy"
            decoding="async"
          />
        </picture>
        {/* Sol okunabilir · sağ neredeyse tamamen açık (kadın net görünsün) */}
        <div className="absolute inset-0 bg-gradient-to-r from-cream-900/95 via-cream-900/88 to-cream-900/70 sm:via-cream-900/75 sm:to-cream-900/25 lg:from-cream-900/94 lg:via-cream-900/55 lg:to-transparent lg:via-40%" />
        <div className="absolute inset-0 bg-gradient-to-t from-cream-900/50 via-transparent to-transparent lg:from-cream-900/25" />
      </div>

      {/* Sol kolon içerik; sağ yarı bilinçli boş — fotoğraf baskın */}
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
        <div className="w-full max-w-3xl lg:max-w-[52%] xl:max-w-[48%]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '50px' }}
            transition={{ duration: 0.55 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-mint-400/45 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md">
              <Star className="h-3.5 w-3.5 fill-mint-400 text-mint-400" />
              Farkımız
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.75rem]">
              Neden{' '}
              <span className="text-mint-400">{BRAND.shortName}?</span>
            </h2>

            <ul className="mt-8 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:mt-10">
              {WHY_ITEMS.map((item, i) => {
                const Icon = item.icon
                return (
                  <motion.li
                    key={item.title}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '50px' }}
                    transition={{ delay: i * 0.04, duration: 0.35 }}
                    className="group rounded-2xl border border-white/15 bg-white/[0.10] shadow-lg shadow-black/10 backdrop-blur-lg transition hover:border-white/30 hover:bg-white/[0.16]"
                  >
                    <Link
                      to={item.cta.to}
                      className="flex h-full items-center gap-3.5 px-4 py-3.5 text-left sm:px-4 sm:py-4"
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-lg shadow-black/25 transition group-hover:scale-110`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2.2} />
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-white sm:text-[0.9375rem]">
                        {item.title}
                      </span>
                      <span className="shrink-0 text-white/45 transition group-hover:translate-x-0.5 group-hover:text-white/80">
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </motion.li>
                )
              })}
            </ul>
          </motion.div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 bg-gradient-to-tl from-mint-400/20 via-brand-500/15 to-transparent blur-2xl lg:hidden"
      />
    </section>
  )
}

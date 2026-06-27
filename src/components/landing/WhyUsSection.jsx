import { motion } from 'framer-motion'
import {
  Heart, Users, Calendar, Shield, Sparkles, Dumbbell, Apple, TrendingUp,
} from 'lucide-react'
import { BRAND } from '../../config/brand'

const WHY_ITEMS = [
  { icon: Heart, title: 'Kişiye özel koçluk', accent: 'from-rose-400 to-brand-500' },
  { icon: Dumbbell, title: 'Evde antrenman rehberliği', accent: 'from-brand-400 to-brand-600' },
  { icon: Apple, title: 'Beslenme & diyetisyen desteği', accent: 'from-sage-400 to-sage-600' },
  { icon: Calendar, title: 'Takvim & hatırlatıcılar', accent: 'from-brand-300 to-sage-500' },
  { icon: Users, title: 'Destekleyici topluluk', accent: 'from-warm-400 to-brand-500' },
  { icon: TrendingUp, title: 'İlerleme takibi & raporlar', accent: 'from-mint-400 to-sage-500' },
  { icon: Sparkles, title: 'Ücretsiz veya Premium esneklik', accent: 'from-gold-400 to-warm-500' },
  { icon: Shield, title: 'KVKK uyumlu güvenli platform', accent: 'from-cream-300 to-brand-400' },
]

export default function WhyUsSection() {
  return (
    <section className="relative isolate min-h-[520px] overflow-hidden sm:min-h-[580px] lg:min-h-[640px]">
      {/* Spor yapan kadın — tam genişlik arka plan */}
      <div className="absolute inset-0">
        <img
          src="/why-us-bg.jpg"
          alt=""
          aria-hidden
          className="h-full w-full scale-105 object-cover object-[65%_25%] sm:object-[70%_20%] lg:object-[75%_15%]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cream-900/95 via-cream-900/82 to-cream-900/25 lg:from-cream-900/92 lg:via-brand-900/78 lg:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-cream-900/70 via-transparent to-brand-900/20" />
      </div>

      <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-4 py-14 sm:px-6 sm:py-20 lg:max-w-3xl lg:py-24 lg:pl-2 xl:max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55 }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-warm-400" />
            Farkımız
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.75rem]">
            Neden {BRAND.shortName}?
          </h2>

          <ul className="mt-8 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:mt-10">
            {WHY_ITEMS.map((item, i) => {
              const Icon = item.icon
              return (
                <motion.li
                  key={item.title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="group flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3.5 backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.14] sm:px-4 sm:py-4"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-lg shadow-black/20 transition group-hover:scale-110`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <span className="text-sm font-semibold leading-snug text-white sm:text-[0.9375rem]">
                    {item.title}
                  </span>
                </motion.li>
              )
            })}
          </ul>
        </motion.div>
      </div>

      {/* Mobilde görsel hissi — sağ alt köşe vurgu */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 bg-gradient-to-tl from-brand-500/30 to-transparent blur-2xl lg:hidden"
      />
    </section>
  )
}

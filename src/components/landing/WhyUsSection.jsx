import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Users, Calendar, Shield, Sparkles, Dumbbell, Apple, TrendingUp, ChevronRight, X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { BRAND } from '../../config/brand'

const WHY_ITEMS = [
  {
    icon: Heart,
    title: 'Kişiye özel koçluk',
    accent: 'from-rose-400 to-brand-500',
    description: 'Hedeflerinize, beden yapınıza ve yaşam tarzınıza göre tasarlanmış birebir koçluk. Sizi tanıyan bir uzman, her adımda yanınızda.',
    cta: { label: 'Koçlarımızı tanıyın', to: '/team/coaches' },
  },
  {
    icon: Dumbbell,
    title: 'Evde ve salonda antrenman rehberliği',
    accent: 'from-brand-400 to-brand-600',
    description: 'Salon programınızı veya ev antrenmanınızı koçunuzla birlikte planlayın. Video rehberli hareketler ve haftalık güncellemeler.',
    cta: { label: 'Programları keşfedin', to: '/membership' },
  },
  {
    icon: Apple,
    title: 'Beslenme & diyetisyen desteği',
    accent: 'from-sage-400 to-sage-600',
    description: 'Alanında uzman diyetisyenlerimiz kişiye özel beslenme planı hazırlar. Aylık görüşmelerle ilerlemenizi birlikte takip ederiz.',
    cta: { label: 'Diyetisyenlerimizi görün', to: '/team/dietitians' },
  },
  {
    icon: Calendar,
    title: 'Takvim & hatırlatıcılar',
    accent: 'from-brand-300 to-sage-500',
    description: 'Randevularınızı, antrenman günlerinizi ve öğün zamanlarınızı tek panelde görün. Kaçırmamak için otomatik hatırlatıcılar.',
    cta: { label: 'Üyeliğe başlayın', to: '/onboarding' },
  },
  {
    icon: Users,
    title: 'Destekleyici topluluk',
    accent: 'from-warm-400 to-brand-500',
    description: 'Aynı dönüşüm yolculuğundaki binlerce üye ile bağlantı kurun. Başarı hikayeleri, motivasyon ve ortak hedefler.',
    cta: { label: 'Başarı hikayelerini oku', to: '/stories' },
  },
  {
    icon: TrendingUp,
    title: 'İlerleme takibi & raporlar',
    accent: 'from-mint-400 to-sage-500',
    description: 'Kilo, ölçü ve antrenman verilerinizi haftalık grafiklerde izleyin. Koçunuz da aynı verilere bakarak planınızı günceller.',
    cta: { label: 'Planları karşılaştırın', to: '/membership' },
  },
  {
    icon: Sparkles,
    title: 'Ücretsiz veya Premium esneklik',
    accent: 'from-gold-400 to-warm-500',
    description: 'Ücretsiz paketle başlayın, hazır olduğunuzda yükseltin. Koç, diyetisyen veya her ikisini birden içeren esnek paketler.',
    cta: { label: 'Paketleri inceleyin', to: '/membership' },
  },
  {
    icon: Shield,
    title: 'KVKK uyumlu güvenli platform',
    accent: 'from-cream-300 to-brand-400',
    description: 'Sağlık verileriniz uçtan uca şifreli, KVKK tam uyumlu altyapıda saklanır. Verileriniz üçüncü taraflarla asla paylaşılmaz.',
    cta: { label: 'Gizlilik politikamız', to: '/legal/gizlilik-politikasi' },
  },
]

export default function WhyUsSection() {
  const [activeItem, setActiveItem] = useState(null)

  const toggle = (title) => setActiveItem((prev) => (prev === title ? null : title))

  return (
    <section className="relative isolate min-h-[520px] overflow-hidden sm:min-h-[580px] lg:min-h-[640px]">
      {/* Arka plan görseli */}
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
        {/* margin:'50px' → elemanlar görünür alana 50px kala animasyon başlar (pop-in engellenir) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '50px' }}
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
              const isOpen = activeItem === item.title
              return (
                <motion.li
                  key={item.title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '50px' }}
                  transition={{ delay: i * 0.04, duration: 0.35 }}
                  className="group rounded-2xl border border-white/10 bg-white/[0.08] backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.14]"
                >
                  <button
                    type="button"
                    onClick={() => toggle(item.title)}
                    className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left sm:px-4 sm:py-4"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-lg shadow-black/20 transition group-hover:scale-110`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </span>
                    <span className="flex-1 text-sm font-semibold leading-snug text-white sm:text-[0.9375rem]">
                      {item.title}
                    </span>
                    <span className="shrink-0 text-white/50 transition group-hover:text-white/80">
                      {isOpen
                        ? <X className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      // height:'auto' animasyonu burada kullanıcı tıklamasıyla tetiklenir
                      // (scroll sırasında değil), kabul edilebilir performans. Süre kısa tutuldu.
                      <motion.div
                        key="detail"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/10 px-4 pb-4 pt-3">
                          <p className="text-sm leading-relaxed text-white/75">{item.description}</p>
                          {item.cta && (
                            <Link
                              to={item.cta.to}
                              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 transition hover:text-white hover:underline"
                            >
                              {item.cta.label}
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              )
            })}
          </ul>
        </motion.div>
      </div>

      {/* Mobil vurgu efekti */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 bg-gradient-to-tl from-brand-500/30 to-transparent blur-2xl lg:hidden"
      />
    </section>
  )
}

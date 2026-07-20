import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardList, Sparkles, Video, ArrowRight } from 'lucide-react'

const STEPS = [
  {
    step: '01',
    icon: ClipboardList,
    title: 'Profilinizi netleştirin',
    desc: 'Hedef, yaşam tarzı ve sağlık bilgilerinizi paylaşın. Birkaç dakikada size özel başlangıç için sağlam bir temel oluşur.',
    accent: 'from-brand-500 to-brand-600',
  },
  {
    step: '02',
    icon: Sparkles,
    title: 'Planınız şekillensin',
    desc: 'Ücretsiz sağlık analiziyle başlayın. Premium planda koç ve diyetisyen eşleşmesiyle programınız netleşir.',
    accent: 'from-sage-500 to-sage-600',
  },
  {
    step: '03',
    icon: Video,
    title: 'Takip edin, görüşün, güncelleyin',
    desc: 'Panelden ilerlemenizi görün. Randevularınıza video ile katılın; planınız ihtiyaçlarınıza göre birlikte güncellenir.',
    accent: 'from-brand-400 to-sage-500',
  },
]

function StepIcon({ step, className = '' }) {
  const Icon = step.icon
  return (
    <span className={`flex items-center justify-center rounded-2xl bg-gradient-to-br ${step.accent} text-white shadow-lg ${className}`}>
      <Icon className="h-6 w-6" strokeWidth={2.2} />
    </span>
  )
}

export default function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream-50 to-white py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Mobil: fotoğraf üstte tam genişlik */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "50px" }}
          className="relative mb-10 overflow-hidden rounded-3xl shadow-xl shadow-brand-900/10 md:hidden"
        >
          <div className="aspect-[16/10] w-full">
            <img
              src="/how-it-works-bg.jpg"
              alt="Evde wellness egzersizi yapan kadın"
              className="h-full w-full object-cover object-[65%_center]"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className="section-badge !bg-white/90 !text-brand-700">Süreç</span>
          </div>
        </motion.div>

        <div className="grid items-start gap-10 md:grid-cols-12 md:gap-8 lg:gap-12">
          {/* Tablet+: sol panel — fotoğraf net görünür */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "50px" }}
            transition={{ duration: 0.6 }}
            className="relative hidden md:col-span-5 md:block"
          >
            <div className="sticky top-24 overflow-hidden rounded-3xl shadow-2xl shadow-brand-900/15 ring-1 ring-black/5">
              <div className="aspect-[4/5] w-full">
                <img
                  src="/how-it-works-bg.jpg"
                  alt="Evde wellness egzersizi yapan kadın"
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900/20 via-transparent to-transparent" />
            </div>
            <div
              aria-hidden
              className="absolute -bottom-4 -left-4 -z-10 h-full w-full rounded-3xl bg-gradient-to-br from-brand-100 to-sage-100"
            />
          </motion.div>

          {/* Sağ: başlık + adımlar */}
          <div className="md:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "50px" }}
              className="text-center md:text-left"
            >
              <span className="section-badge hidden md:inline-flex">Süreç</span>
              <h2 className="section-title mt-4">Nasıl Çalışır?</h2>
              <p className="section-subtitle mx-auto max-w-xl md:mx-0">
                Üç net adım. Karmaşık süreç yok — kayıt, plan ve takip; her aşamada ne yapacağınız belli.
              </p>
            </motion.div>

            <div className="relative mt-10 md:space-y-5">
              <div
                aria-hidden
                className="absolute bottom-8 left-6 top-8 hidden w-0.5 bg-gradient-to-b from-brand-200 via-sage-300 to-brand-200 md:block"
              />

              {STEPS.map((s, i) => (
                <div key={s.step} className="flex flex-col items-center md:block">
                  {i > 0 && (
                    <div
                      aria-hidden
                      className="how-it-works-connector mb-0 h-8 w-1 rounded-full md:hidden"
                    />
                  )}

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: i * 0.1, duration: 0.45 }}
                    className="relative flex w-full gap-4 sm:gap-5"
                  >
                    <StepIcon step={s} className="relative z-10 hidden h-12 w-12 shrink-0 md:flex lg:h-14 lg:w-14" />

                    <div className="relative w-full flex-1">
                      <StepIcon
                        step={s}
                        className="absolute left-1/2 top-0 z-10 h-12 w-12 -translate-x-1/2 -translate-y-1/2 md:hidden"
                      />
                      <div className="rounded-2xl border border-cream-200/80 bg-white p-5 pt-9 shadow-sm transition hover:border-brand-200 hover:shadow-md sm:p-6 sm:pt-10 md:pt-6">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-display text-base font-bold leading-snug tracking-tight text-cream-900 sm:text-lg">
                            {s.title}
                          </h3>
                          <span className="font-display text-2xl font-bold tabular-nums text-cream-100">{s.step}</span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-cream-800/70">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "50px" }}
              className="mt-10 text-center md:text-left"
            >
              <Link to="/onboarding?plan=free" className="btn-wellness group inline-flex">
                Ücretsiz Başla
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

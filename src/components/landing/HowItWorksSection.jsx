import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ClipboardList,
  Sparkles,
  TrendingUp,
  ArrowRight,
  CreditCard,
  Timer,
} from 'lucide-react'
import MemberPanelPhoneScene from './MemberPanelPhoneScene'

const STEPS = [
  {
    step: '01',
    icon: ClipboardList,
    title: 'Sağlık profilinizi oluşturun',
    desc: 'Hedef, yaşam tarzı ve sağlık bilgilerinizi paylaşın. Birkaç dakikada size özel başlangıç için sağlam bir temel oluşur.',
    card: 'from-brand-50 via-white to-brand-100/60 border-brand-200/70 hover:border-brand-300',
    rail: 'from-brand-400 to-brand-600',
    iconWrap: 'from-brand-500 to-brand-600 shadow-brand-500/30',
    num: 'from-brand-500 via-brand-400 to-sage-500 shadow-brand-500/35 ring-brand-200/80',
    numGlow: 'bg-brand-400/40',
  },
  {
    step: '02',
    icon: Sparkles,
    title: 'Size özel plan oluşturulsun',
    desc: 'Sağlık analizinizle başlayın. Paketinizde koç ve diyetisyen eşleşmesiyle programınız netleşir.',
    card: 'from-sage-50 via-white to-emerald-50/70 border-sage-200/70 hover:border-sage-300',
    rail: 'from-sage-400 to-emerald-500',
    iconWrap: 'from-sage-500 to-emerald-500 shadow-sage-500/30',
    num: 'from-sage-500 via-sage-400 to-brand-500 shadow-sage-500/35 ring-sage-200/80',
    numGlow: 'bg-sage-400/40',
  },
  {
    step: '03',
    icon: TrendingUp,
    title: 'Takip edin, gelişin, hedefinize ulaşın',
    desc: 'Panelden ilerlemenizi görün. Randevularınıza video ile katılın; planınız ihtiyaçlarınıza göre birlikte güncellenir.',
    card: 'from-warm-50 via-white to-brand-50/70 border-warm-200/60 hover:border-brand-200',
    rail: 'from-warm-400 to-brand-500',
    iconWrap: 'from-warm-400 to-brand-500 shadow-brand-500/25',
    num: 'from-warm-400 via-brand-500 to-sage-500 shadow-warm-400/30 ring-warm-200/70',
    numGlow: 'bg-warm-400/35',
  },
]

const TRUST = [
  { icon: CreditCard, label: 'Kredi kartı gerekmez' },
  { icon: Timer, label: '2 dakikada üye olun' },
]

export default function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden py-14 sm:py-20">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-white via-cream-50/90 to-brand-50/30"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage:
            'radial-gradient(circle, color-mix(in srgb, var(--color-brand-400) 12%, transparent) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        }}
      />

      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 md:grid-cols-12 md:gap-8 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '50px' }}
            className="text-center md:col-span-7 md:col-start-6 md:row-start-1 md:text-left"
          >
            <span className="section-badge">NASIL BAŞLIYOR?</span>
            <h2 className="section-title mt-4">
              Sağlığınıza giden yol, yalnızca{' '}
              <span className="bg-gradient-to-r from-sage-600 to-brand-600 bg-clip-text text-transparent">
                3 adım
              </span>
              .
            </h2>
            <p className="section-subtitle mx-auto mt-3 max-w-xl md:mx-0">
              Yeni Form yalnızca bir diyet programı değil — beslenme, hareket ve sağlık
              analizini bir araya getirerek sürdürülebilir bir yaşam tarzı kurmanıza yardımcı olur.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '40px' }}
            transition={{ duration: 0.55 }}
            className="relative md:col-span-5 md:col-start-1 md:row-span-3 md:row-start-1 md:self-start"
          >
            <div className="md:sticky md:top-24 md:self-start">
              <MemberPanelPhoneScene />
            </div>
          </motion.div>

          <div className="md:col-span-7 md:col-start-6 md:row-start-2 md:self-start">
            <div className="relative mt-2 flex flex-col justify-center gap-4 md:mt-6">
              <div
                aria-hidden
                className="absolute bottom-10 left-[19px] top-10 hidden w-px bg-gradient-to-b from-brand-300 via-sage-400 to-warm-300 md:block"
              />

              {STEPS.map((s, i) => {
                const Icon = s.icon
                return (
                  <motion.div
                    key={s.step}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, y: 0, x: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: i * 0.1, duration: 0.45 }}
                    className="relative flex items-center gap-3.5 sm:gap-4"
                  >
                    {/* Numara — dikey ortalı, süslü halka */}
                    <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center sm:h-12 sm:w-12">
                      <span
                        aria-hidden
                        className={`absolute inset-0 rounded-full ${s.numGlow} blur-md`}
                      />
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-white/80 ring-2 ring-white"
                      />
                      <span
                        className={`relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${s.num} font-display text-[11px] font-bold text-white shadow-lg ring-4 sm:h-10 sm:w-10 sm:text-xs`}
                      >
                        {s.step}
                      </span>
                    </span>

                    <div
                      className={`group relative flex-1 overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:p-5 ${s.card}`}
                    >
                      <div
                        aria-hidden
                        className={`absolute inset-y-3 left-0 w-1 rounded-full bg-gradient-to-b ${s.rail}`}
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/50 blur-2xl transition group-hover:bg-white/70"
                      />
                      <div className="relative flex items-start gap-3 pl-2.5">
                        <span
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${s.iconWrap}`}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2.2} />
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-display text-base font-bold leading-snug tracking-tight text-cream-900 sm:text-lg">
                            {s.title}
                          </h3>
                          <p className="mt-1.5 text-sm leading-relaxed text-cream-800/70">
                            {s.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '50px' }}
              className="mt-10 text-center md:text-left"
            >
              <Link to="/membership" className="btn-wellness group inline-flex">
                Ücretsiz Başlayın
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <ul className="mt-5 flex flex-col items-center gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start md:gap-x-5">
                {TRUST.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="flex items-center gap-1.5 text-xs font-medium text-cream-800/65"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-sage-600" strokeWidth={2.2} />
                    {label}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardList, Sparkles, Video, ArrowRight } from 'lucide-react'

const STEPS = [
  {
    step: '01',
    icon: ClipboardList,
    title: 'Kayıt ol & sağlık testini tamamla',
    desc: 'Hedeflerinizi, yaşam tarzınızı ve sağlık profilinizi birkaç dakikada paylaşın.',
    accent: 'from-brand-500 to-brand-600',
  },
  {
    step: '02',
    icon: Sparkles,
    title: 'Size özel programınız hazırlansın',
    desc: 'Ücretsiz otomatik program veya premium planda koç ve diyetisyen eşleşmesi.',
    accent: 'from-sage-500 to-sage-600',
  },
  {
    step: '03',
    icon: Video,
    title: 'Takip edin & görüşmelerinize katılın',
    desc: 'Panelden ilerlemenizi izleyin, randevularınıza video görüşme ile katılın.',
    accent: 'from-brand-400 to-sage-500',
  },
]

export default function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-white via-brand-50/40 to-sage-50/30" />
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="section-badge">Süreç</span>
          <h2 className="section-title mt-4">Nasıl Çalışır?</h2>
          <p className="section-subtitle mx-auto max-w-xl">
            Üç basit adımda dönüşüm yolculuğunuza başlayın — evden, güvenle, kendi ritminizde.
          </p>
        </motion.div>

        <div className="relative mt-12 grid gap-6 md:grid-cols-3 md:gap-8">
          <div
            aria-hidden
            className="pointer-events-none absolute left-[16.666%] right-[16.666%] top-[3.25rem] hidden h-0.5 bg-gradient-to-r from-brand-200 via-sage-300 to-brand-200 md:block"
          />

          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="relative"
              >
                <div className="flex h-full flex-col rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg sm:p-7">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${s.accent} text-white shadow-md`}>
                      <Icon className="h-6 w-6" strokeWidth={2.2} />
                    </span>
                    <span className="font-display text-3xl font-bold text-cream-200">{s.step}</span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold leading-snug text-cream-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-cream-800/65">
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <Link to="/onboarding?plan=free" className="btn-wellness group inline-flex">
            Ücretsiz Başla
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

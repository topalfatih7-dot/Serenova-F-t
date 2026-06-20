import { motion } from 'framer-motion'
import { Shield, Lock, Users, BadgeCheck } from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function TrustStrip({ staffCount = 0, memberCount }) {
  const experts = staffCount > 0 ? `${staffCount}+ Uzman` : 'Uzman Kadro'
  const members = memberCount > 0 ? `${memberCount.toLocaleString('tr-TR')}+ Üye` : '2.500+ Üye'

  const items = [
    { icon: Shield, label: 'KVKK Uyumlu', sub: 'Verileriniz korunur' },
    { icon: Lock, label: '256-bit SSL', sub: 'Güvenli bağlantı' },
    { icon: Users, label: experts, sub: 'Sertifikalı ekip' },
    { icon: BadgeCheck, label: members, sub: '%94 memnuniyet' },
  ]

  return (
    <section className="relative border-y border-cream-200/80 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.label}
                variants={fadeIn}
                initial="hidden"
                whileInView="show"
                custom={i}
                viewport={{ once: true, margin: '-40px' }}
                className="group flex items-center gap-3 rounded-2xl border border-cream-100 bg-gradient-to-br from-white to-cream-50/80 px-3 py-3 transition hover:border-brand-200 hover:shadow-sm sm:px-4 sm:py-3.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-sage-100 text-brand-600 transition group-hover:scale-105">
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-cream-900 sm:text-sm">{item.label}</p>
                  <p className="truncate text-[10px] text-cream-800/55 sm:text-xs">{item.sub}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

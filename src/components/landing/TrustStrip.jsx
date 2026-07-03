import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Lock, FileText, Scale } from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
}

const LEGAL_TRUST_ITEMS = [
  {
    to: '/legal/kvkk',
    icon: Shield,
    label: 'KVKK Uyumlu',
    sub: 'Aydınlatma metni',
    accent: 'from-brand-100 to-brand-50 text-brand-600 group-hover:from-brand-500 group-hover:to-brand-600 group-hover:text-white',
  },
  {
    to: '/legal/gizlilik-politikasi',
    icon: Lock,
    label: 'Gizlilik Politikası',
    sub: '256-bit SSL güvenliği',
    accent: 'from-sage-100 to-sage-50 text-sage-700 group-hover:from-sage-500 group-hover:to-sage-600 group-hover:text-white',
  },
  {
    to: '/legal/uyelik-ve-abonelik-sozlesmesi',
    icon: FileText,
    label: 'Üyelik Sözleşmesi',
    sub: 'Üyelik ve hizmet şartları',
    accent: 'from-amber-100 to-amber-50 text-amber-700 group-hover:from-amber-500 group-hover:to-amber-600 group-hover:text-white',
  },
  {
    to: '/legal/mesafeli-hizmet-sozlesmesi',
    icon: Scale,
    label: 'Mesafeli Hizmet',
    sub: 'Mesafeli satış ve cayma',
    accent: 'from-cream-200 to-cream-100 text-cream-800 group-hover:from-cream-800 group-hover:to-cream-900 group-hover:text-white',
  },
]

export default function TrustStrip() {
  return (
    <section className="relative border-t border-cream-200/80 bg-gradient-to-b from-white to-cream-50/60">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-cream-800/45">
          Yasal Bilgilendirme
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {LEGAL_TRUST_ITEMS.map((item, i) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.label}
                variants={fadeIn}
                initial="hidden"
                whileInView="show"
                custom={i}
                viewport={{ once: true, margin: '-40px' }}
              >
                <Link
                  to={item.to}
                  className="group flex h-full items-center gap-3 rounded-2xl border border-cream-100 bg-white px-3 py-3.5 shadow-sm transition hover:border-brand-200 hover:shadow-md sm:px-4 sm:py-4"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br transition duration-300 group-hover:scale-105 ${item.accent}`}>
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-cream-900 sm:text-sm">{item.label}</p>
                    <p className="truncate text-[10px] text-cream-800/55 sm:text-xs">{item.sub}</p>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

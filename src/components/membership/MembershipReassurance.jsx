import { motion } from 'framer-motion'
import { ShieldCheck, RefreshCw, Headphones } from 'lucide-react'

const ITEMS = [
  {
    icon: ShieldCheck,
    label: 'KVKK uyumlu',
    sub: 'Verileriniz güvende.',
    iconWrap: 'bg-teal-50 text-teal-600 ring-teal-100',
    labelClass: 'text-teal-700',
  },
  {
    icon: RefreshCw,
    label: 'Esnek süre',
    sub: '1, 3 veya 6 ay seçenekleri.',
    iconWrap: 'bg-sky-50 text-sky-600 ring-sky-100',
    labelClass: 'text-teal-700',
  },
  {
    icon: Headphones,
    label: 'Destek ekibi',
    sub: 'Yalnız kalmazsınız.',
    iconWrap: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    labelClass: 'text-teal-700',
  },
]

export default function MembershipReassurance({ compact = false }) {
  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
      {ITEMS.map((item, i) => {
        const Icon = item.icon
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className={`flex items-center gap-3 rounded-2xl border border-slate-100/90 bg-white px-4 py-3.5 shadow-[0_8px_24px_-16px_rgba(30,70,55,0.35)] ${
              compact ? '' : 'sm:px-5 sm:py-4'
            }`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${item.iconWrap}`}>
              <Icon className="h-4 w-4" strokeWidth={2.1} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-bold leading-tight ${item.labelClass}`}>{item.label}</p>
              <p className="mt-0.5 text-xs leading-snug text-slate-500">{item.sub}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

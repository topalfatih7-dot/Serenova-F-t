import { motion } from 'framer-motion'
import { Shield, RefreshCw, Headphones } from 'lucide-react'

const ITEMS = [
  { icon: Shield, label: 'KVKK uyumlu', sub: 'Verileriniz güvende', color: 'from-sage-100 to-emerald-50 text-sage-700' },
  { icon: RefreshCw, label: 'Esnek süre', sub: '1, 3 veya 6 ay', color: 'from-teal-100 to-cyan-50 text-teal-700' },
  { icon: Headphones, label: 'Destek ekibi', sub: 'Yalnız kalmazsınız', color: 'from-brand-100 to-violet-50 text-brand-700' },
]

export default function MembershipReassurance({ compact = false }) {
  return (
    <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'} sm:gap-3`}>
      {ITEMS.map((item, i) => {
        const Icon = item.icon
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className={`flex items-center gap-2.5 rounded-2xl border border-white/80 bg-gradient-to-br ${item.color} px-3 py-2.5 shadow-sm backdrop-blur-sm ${compact ? '' : 'sm:px-4 sm:py-3'}`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm">
              <Icon className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold leading-tight sm:text-xs">{item.label}</p>
              <p className="text-[10px] opacity-75 sm:text-[11px]">{item.sub}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

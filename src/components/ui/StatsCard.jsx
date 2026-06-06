import { motion } from 'framer-motion'

export default function StatsCard({ label, value, sub, icon: Icon, accent = 'brand', onClick }) {
  const accents = {
    brand: 'from-brand-50 to-white border-brand-100',
    sage: 'from-sage-50 to-white border-sage-100',
    gold: 'from-amber-50 to-white border-amber-100',
    cream: 'from-cream-100 to-white border-cream-200',
  }

  const Tag = onClick ? motion.button : motion.div

  return (
    <Tag
      whileHover={onClick ? { y: -2 } : undefined}
      onClick={onClick}
      className={`rounded-2xl border bg-gradient-to-br p-5 text-left shadow-sm ${accents[accent]} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-cream-800/60">{label}</p>
        {Icon && (
          <div className="rounded-lg bg-white/80 p-2 text-brand-500 shadow-sm">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-cream-900">{value}</p>
      {sub && <p className="mt-1 text-sm text-cream-800/60">{sub}</p>}
    </Tag>
  )
}

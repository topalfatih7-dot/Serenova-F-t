import { motion } from 'framer-motion'

export default function StatsCard({ label, value, sub, icon: Icon, accent = 'brand', onClick }) {
  const iconColors = {
    brand: 'text-brand-500',
    sage: 'text-sage-500',
    gold: 'text-warm-500',
    cream: 'text-cream-800',
  }
  const accents = {
    brand: 'from-brand-50 via-white to-brand-50/30',
    sage: 'from-sage-50 via-white to-mint-50/40',
    gold: 'from-warm-50 via-white to-amber-50/40',
    cream: 'from-cream-100 via-white to-cream-50',
  }

  const Tag = onClick ? motion.button : motion.div

  return (
    <Tag
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={`glass-card-solid bg-gradient-to-br p-5 text-left ${accents[accent]} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/55">{label}</p>
        {Icon && (
          <div className={`rounded-xl bg-white/90 p-2.5 shadow-sm ${iconColors[accent]}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-cream-900">{value}</p>
      {sub && <p className="mt-1 text-sm text-cream-800/60">{sub}</p>}
    </Tag>
  )
}

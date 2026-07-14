import { memo } from 'react'
import { motion } from 'framer-motion'

function StatsCard({ label, value, sub, icon: Icon, accent = 'brand', onClick }) {
  const accents = {
    brand: 'from-brand-50 via-white to-violet-50/40',
    sage: 'from-sage-50 via-white to-emerald-50/50',
    gold: 'from-orange-50 via-white to-amber-50/50',
    cream: 'from-cream-100 via-white to-brand-50/30',
  }

  const iconBg = {
    brand: 'from-brand-500 to-violet-500 text-white',
    sage: 'from-sage-500 to-emerald-500 text-white',
    gold: 'from-orange-500 to-amber-500 text-white',
    cream: 'from-cream-700 to-cream-800 text-white',
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
          <div className={`rounded-xl bg-gradient-to-br p-2.5 shadow-md ${iconBg[accent]}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-cream-900">{value}</p>
      {sub && <p className="mt-1 text-sm text-cream-800/60">{sub}</p>}
    </Tag>
  )
}

export default memo(StatsCard)

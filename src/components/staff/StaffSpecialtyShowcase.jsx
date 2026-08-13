import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { groupProfileSpecialties, specialtyGroupVisual } from './staffProfileVisuals'

export default function StaffSpecialtyShowcase({ tags, role }) {
  const groups = groupProfileSpecialties(tags, role)
  if (!groups.length) return null

  return (
    <section>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-sage-500 text-white shadow-md shadow-brand-500/20">
          <Sparkles className="h-4 w-4" />
        </span>
        <h2 className="font-display text-lg font-bold text-cream-900">Uzmanlık Alanları</h2>
      </div>

      <div className={`grid gap-3 ${groups.length === 1 ? '' : 'sm:grid-cols-2'}`}>
        {groups.map((group, i) => {
          const visual = specialtyGroupVisual(group)
          const Icon = visual.Icon
          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.35 }}
              className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 ${visual.panel}`}
            >
              <div aria-hidden className={`absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl ${visual.blob}`} />
              <div aria-hidden className="absolute bottom-0 right-4 h-12 w-12 rounded-full border border-white/60 opacity-40" />

              <div className="relative mb-3 flex items-center gap-2.5">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md ${visual.icon}`}>
                  <Icon className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <h3 className={`font-display text-sm font-bold ${visual.title}`}>{group.label}</h3>
              </div>

              <ul className="relative flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li key={item}>
                    <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${visual.chip}`}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { groupProfileSpecialties, specialtyGroupVisual } from './staffProfileVisuals'

function labelKey(value) {
  return String(value || '').trim().toLocaleLowerCase('tr')
}

function shouldFlattenGroups(groups) {
  const total = groups.reduce((n, group) => n + group.items.length, 0)
  return groups.length < 2 || total <= 3
}

function SpecialtyChips({ items, chipClass, size = 'default' }) {
  if (!items.length) return null
  const chipSize = size === 'lg'
    ? 'px-3.5 py-2 text-sm'
    : 'px-3 py-1.5 text-xs'
  return (
    <ul className="relative flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item}>
          <span className={`inline-flex rounded-full border font-semibold shadow-sm ${chipSize} ${chipClass}`}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function StaffSpecialtyShowcase({ tags, role, specialty = '' }) {
  const groups = groupProfileSpecialties(tags, role)
  if (!groups.length) return null

  const flatten = shouldFlattenGroups(groups)
  const flatItems = groups.flatMap((group) => group.items)
  const primary = String(specialty || '').trim()

  return (
    <section>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-sage-500 text-white shadow-md shadow-brand-500/20">
          <Sparkles className="h-4 w-4" />
        </span>
        <h2 className="font-display text-lg font-bold text-cream-900">Uzmanlık Alanları</h2>
      </div>

      {flatten ? (
        <FlatSpecialtyPanel group={groups[0]} items={flatItems} specialty={primary} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
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

                <SpecialtyChips items={group.items} chipClass={visual.chip} />
              </motion.div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function FlatSpecialtyPanel({ group, items, specialty }) {
  const visual = specialtyGroupVisual(group)
  const Icon = visual.Icon
  const extraItems = specialty
    ? items.filter((item) => labelKey(item) !== labelKey(specialty))
    : items

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 ${visual.panel}`}
    >
      <div aria-hidden className={`absolute -right-8 -top-10 h-32 w-32 rounded-full blur-2xl ${visual.blob}`} />
      <div aria-hidden className="absolute bottom-0 right-6 h-14 w-14 rounded-full border border-white/60 opacity-40" />

      {specialty ? (
        <div className="relative mb-4 flex items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md ${visual.icon}`}>
            <Icon className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${visual.title} opacity-70`}>
              Uzmanlık Alanı
            </p>
            <h3 className={`mt-0.5 font-display text-lg font-bold leading-snug ${visual.title}`}>
              {specialty}
            </h3>
          </div>
        </div>
      ) : null}

      <SpecialtyChips
        items={specialty ? extraItems : items}
        chipClass={visual.chip}
        size="lg"
      />
    </motion.div>
  )
}

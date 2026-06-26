import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Dumbbell, Apple } from 'lucide-react'
import MemberProgramsPanel from './MemberProgramsPanel'

const ROLE_CONFIG = {
  coach: {
    label: 'Antrenman Programları',
    empty: 'Henüz antrenman programı yok',
    icon: Dumbbell,
    type: 'workout',
    header: 'from-brand-500 to-violet-600',
    chip: 'bg-brand-50 text-brand-800',
  },
  dietitian: {
    label: 'Beslenme Listeleri',
    empty: 'Henüz beslenme listesi yok',
    icon: Apple,
    type: 'nutrition',
    header: 'from-sage-500 to-emerald-600',
    chip: 'bg-sage-50 text-sage-800',
  },
}

export function filterProgramsByRole(programs = [], role) {
  const cfg = ROLE_CONFIG[role]
  if (!cfg) return programs
  return programs.filter((p) => p.type === cfg.type)
}

export default function ChatCollapsiblePrograms({
  programs = [],
  role = 'coach',
  memberName,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.coach
  const Icon = cfg.icon
  const filtered = filterProgramsByRole(programs, role)

  return (
    <div className="shrink-0 border-b border-cream-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 px-1 py-2.5 text-left transition ${open ? '' : 'hover:opacity-90'}`}
        aria-expanded={open}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${cfg.header} text-white shadow-sm`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-cream-900">{cfg.label}</span>
          <span className={`text-[10px] font-medium ${filtered.length ? 'text-cream-800/50' : 'text-cream-800/40'}`}>
            {filtered.length ? `${filtered.length} kayıt` : cfg.empty}
          </span>
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.chip}`}>
          {open ? 'Gizle' : 'Göster'}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-cream-400">
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="max-h-44 overflow-y-auto pb-3 pr-1">
              <MemberProgramsPanel programs={filtered} memberName={memberName} compact roleFilter={role} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

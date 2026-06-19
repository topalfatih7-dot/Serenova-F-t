import { motion, AnimatePresence } from 'framer-motion'
import {
  HeartPulse, Stethoscope, Bone, Activity, Moon, Apple, Flower2, Check, AlertCircle,
} from 'lucide-react'

const ICONS = { HeartPulse, Stethoscope, Bone, Activity, Moon, Apple, Flower2 }

// Bölüm renkleri — tam (statik) sınıf dizeleri (Tailwind taraması için zorunlu).
const THEME = {
  general:   { grad: 'from-brand-500 to-brand-600',    soft: 'bg-brand-50',    chip: 'border-brand-400 bg-brand-50 text-brand-700 ring-brand-200',      solid: 'bg-brand-500 border-brand-400',      bar: 'bg-brand-500' },
  medical:   { grad: 'from-rose-500 to-rose-600',       soft: 'bg-rose-50',     chip: 'border-rose-400 bg-rose-50 text-rose-700 ring-rose-200',          solid: 'bg-rose-500 border-rose-400',         bar: 'bg-rose-500' },
  physical:  { grad: 'from-amber-500 to-orange-600',    soft: 'bg-amber-50',    chip: 'border-amber-400 bg-amber-50 text-amber-700 ring-amber-200',      solid: 'bg-amber-500 border-amber-400',       bar: 'bg-amber-500' },
  lifestyle: { grad: 'from-sky-500 to-blue-600',        soft: 'bg-sky-50',      chip: 'border-sky-400 bg-sky-50 text-sky-700 ring-sky-200',              solid: 'bg-sky-500 border-sky-400',           bar: 'bg-sky-500' },
  recovery:  { grad: 'from-violet-500 to-indigo-600',   soft: 'bg-violet-50',   chip: 'border-violet-400 bg-violet-50 text-violet-700 ring-violet-200',  solid: 'bg-violet-500 border-violet-400',     bar: 'bg-violet-500' },
  nutrition: { grad: 'from-sage-500 to-emerald-600',    soft: 'bg-sage-50',     chip: 'border-sage-400 bg-sage-50 text-sage-700 ring-sage-200',          solid: 'bg-sage-500 border-sage-400',         bar: 'bg-sage-500' },
  women:     { grad: 'from-pink-500 to-fuchsia-600',    soft: 'bg-pink-50',     chip: 'border-pink-400 bg-pink-50 text-pink-700 ring-pink-200',          solid: 'bg-pink-500 border-pink-400',         bar: 'bg-pink-500' },
}

function fallbackTheme() {
  return THEME.general
}

export default function HealthTestStep({
  sections,
  sectionIndex,
  section,
  healthTest,
  updateHealthTest,
  showErrors,
}) {
  if (!section) return null
  const theme = THEME[section.id] || fallbackTheme()
  const Icon = ICONS[section.icon] || HeartPulse
  const total = sections.length
  const progress = Math.round(((sectionIndex + 1) / total) * 100)

  const isAnswered = (q) => {
    const v = healthTest?.[q.key]
    if (q.type === 'multi') return Array.isArray(v) && v.length > 0
    return v !== '' && v != null
  }

  const toggleMulti = (key, value) => {
    const arr = Array.isArray(healthTest[key]) ? healthTest[key] : []
    updateHealthTest({ [key]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value] })
  }

  return (
    <div className="space-y-6">
      {/* Başlık + ilerleme */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">
            Sağlık Testi · Bölüm {sectionIndex + 1}/{total}
          </span>
          <span className="text-xs font-bold text-cream-800/60">%{progress}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream-100">
          <motion.div
            className={`h-full rounded-full ${theme.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={section.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          {/* Bölüm başlığı kartı */}
          <div className={`flex items-center gap-4 rounded-2xl ${theme.soft} p-4`}>
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${theme.grad} text-white shadow-md`}>
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-cream-900">{section.title}</h2>
              <p className="text-sm text-cream-800/60">{section.subtitle}</p>
            </div>
          </div>

          {/* Sorular */}
          <div className="space-y-6">
            {section.questions.map((q) => {
              const missing = showErrors && q.required && !isAnswered(q)
              return (
                <div key={q.key}>
                  <p className="mb-1 text-sm font-semibold text-cream-900">
                    {q.label} {q.required && <span className="text-red-500">*</span>}
                  </p>
                  {q.hint && <p className="mb-2.5 text-xs text-cream-800/50">{q.hint}</p>}
                  {!q.hint && <div className="mb-2.5" />}

                  {/* EMOJI ÖLÇEĞİ */}
                  {q.type === 'emoji' && (
                    <div className="flex gap-2">
                      {q.options.map((o) => {
                        const sel = healthTest[q.key] === o.value
                        return (
                          <button
                            key={o.value} type="button"
                            onClick={() => updateHealthTest({ [q.key]: o.value })}
                            className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border py-3 transition-all ${
                              sel ? `${theme.chip} ring-2` : 'border-cream-200 bg-white hover:border-cream-300'
                            }`}
                          >
                            <span className="text-2xl">{o.emoji}</span>
                            <span className={`text-[10px] font-medium ${sel ? '' : 'text-cream-800/55'}`}>{o.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* TEKLİ SEÇİM */}
                  {q.type === 'single' && (
                    <div className={`grid gap-2 ${q.options.length > 3 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
                      {q.options.map((o) => {
                        const sel = healthTest[q.key] === o.value
                        return (
                          <button
                            key={o.value} type="button"
                            onClick={() => updateHealthTest({ [q.key]: o.value })}
                            className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition-all ${
                              sel ? `${theme.solid} text-white shadow-sm` : 'border-cream-200 bg-white text-cream-800 hover:border-cream-300'
                            }`}
                          >
                            <span className="text-sm font-semibold">{o.label}</span>
                            {o.desc && <span className={`text-[11px] ${sel ? 'text-white/80' : 'text-cream-800/55'}`}>{o.desc}</span>}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* ÇOKLU SEÇİM */}
                  {q.type === 'multi' && (
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((o) => {
                        const sel = (healthTest[q.key] || []).includes(o.value)
                        return (
                          <button
                            key={o.value} type="button"
                            onClick={() => toggleMulti(q.key, o.value)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-all ${
                              sel ? `${theme.chip} ring-1` : 'border-cream-200 bg-white text-cream-800 hover:border-cream-300'
                            }`}
                          >
                            {sel && <Check className="h-3 w-3" strokeWidth={3} />}
                            {o.label}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* SERBEST METİN */}
                  {q.type === 'text' && (
                    <input
                      type="text"
                      placeholder={q.placeholder}
                      value={healthTest[q.key] || ''}
                      onChange={(e) => updateHealthTest({ [q.key]: e.target.value })}
                      className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
                    />
                  )}

                  {/* KOŞULLU DETAY ALANI */}
                  {q.detail && healthTest[q.key] === q.detail.when && (
                    <input
                      type="text"
                      placeholder={q.detail.placeholder}
                      value={healthTest[q.detail.key] || ''}
                      onChange={(e) => updateHealthTest({ [q.detail.key]: e.target.value })}
                      className="mt-2.5 w-full rounded-xl border border-cream-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
                    />
                  )}

                  {missing && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" /> Bu alan zorunlu
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

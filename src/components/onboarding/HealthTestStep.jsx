import { motion, AnimatePresence } from 'framer-motion'
import {
  HeartPulse, Stethoscope, Bone, Activity, Moon, Apple, Flower2, Check, AlertCircle, SkipForward,
} from 'lucide-react'

const ICONS = { HeartPulse, Stethoscope, Bone, Activity, Moon, Apple, Flower2 }

const THEME = {
  general:   { grad: 'from-brand-500 to-brand-600',    soft: 'bg-brand-50',    ring: 'ring-brand-300',    solid: 'bg-brand-500 border-brand-400 shadow-brand-500/25',    chip: 'border-brand-400 bg-brand-50 text-brand-800 ring-brand-200',    bar: 'bg-brand-500', text: 'text-brand-700' },
  medical:   { grad: 'from-rose-500 to-rose-600',       soft: 'bg-rose-50',     ring: 'ring-rose-300',     solid: 'bg-rose-500 border-rose-400 shadow-rose-500/25',       chip: 'border-rose-400 bg-rose-50 text-rose-800 ring-rose-200',       bar: 'bg-rose-500', text: 'text-rose-700' },
  physical:  { grad: 'from-amber-500 to-orange-600',      soft: 'bg-amber-50',    ring: 'ring-amber-300',    solid: 'bg-amber-500 border-amber-400 shadow-amber-500/25',      chip: 'border-amber-400 bg-amber-50 text-amber-800 ring-amber-200',    bar: 'bg-amber-500', text: 'text-amber-700' },
  lifestyle: { grad: 'from-sky-500 to-blue-600',         soft: 'bg-sky-50',      ring: 'ring-sky-300',      solid: 'bg-sky-500 border-sky-400 shadow-sky-500/25',          chip: 'border-sky-400 bg-sky-50 text-sky-800 ring-sky-200',            bar: 'bg-sky-500', text: 'text-sky-700' },
  recovery:  { grad: 'from-violet-500 to-indigo-600',     soft: 'bg-violet-50',   ring: 'ring-violet-300',   solid: 'bg-violet-500 border-violet-400 shadow-violet-500/25', chip: 'border-violet-400 bg-violet-50 text-violet-800 ring-violet-200', bar: 'bg-violet-500', text: 'text-violet-700' },
  nutrition: { grad: 'from-sage-500 to-emerald-600',      soft: 'bg-sage-50',     ring: 'ring-sage-300',     solid: 'bg-sage-500 border-sage-400 shadow-sage-500/25',       chip: 'border-sage-400 bg-sage-50 text-sage-800 ring-sage-200',         bar: 'bg-sage-500', text: 'text-sage-700' },
  women:     { grad: 'from-pink-500 to-fuchsia-600',      soft: 'bg-pink-50',     ring: 'ring-pink-300',     solid: 'bg-pink-500 border-pink-400 shadow-pink-500/25',       chip: 'border-pink-400 bg-pink-50 text-pink-800 ring-pink-200',         bar: 'bg-pink-500', text: 'text-pink-700' },
}

function themeFor(sectionId) {
  return THEME[sectionId] || THEME.general
}

export default function HealthTestStep({
  question,
  questionIndex,
  totalQuestions,
  healthTest,
  updateHealthTest,
  showErrors,
}) {
  if (!question) return null

  const theme = themeFor(question.sectionId)
  const SectionIcon = ICONS[question.sectionIcon] || HeartPulse
  const progress = Math.round(((questionIndex + 1) / totalQuestions) * 100)
  const q = question

  const isAnswered = () => {
    const val = healthTest?.[q.key]
    if (q.type === 'multi') return Array.isArray(val) && val.length > 0
    if (q.type === 'text') return typeof val === 'string' && val.trim().length > 0
    return val !== '' && val != null
  }

  const missing = showErrors && q.required && !isAnswered()

  const toggleMulti = (value) => {
    const arr = Array.isArray(healthTest[q.key]) ? healthTest[q.key] : []
    updateHealthTest({
      [q.key]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value],
    })
  }

  const pickSingle = (value) => {
    updateHealthTest({ [q.key]: value })
  }

  const optionCount = q.options?.length || 0
  const gridClass =
    q.type === 'emoji'
      ? 'grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4'
      : optionCount <= 2
        ? 'grid grid-cols-1 gap-3 sm:grid-cols-2'
        : optionCount === 3
          ? 'grid grid-cols-1 gap-3 sm:grid-cols-3'
          : 'grid grid-cols-1 gap-3 sm:grid-cols-2'

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* İlerleme */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-cream-800/50">
          <span>Sağlık Profili</span>
          <span>{questionIndex + 1} / {totalQuestions}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-cream-100">
          <motion.div
            className={`h-full rounded-full ${theme.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-xl shadow-brand-900/[0.06] backdrop-blur-sm"
        >
          {/* Üst renk bandı */}
          <div className={`bg-gradient-to-r ${theme.grad} px-5 py-4 sm:px-7 sm:py-5`}>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur">
                <SectionIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/75">{question.sectionTitle}</p>
                <p className="text-sm font-medium text-white/90">Soru {questionIndex + 1}</p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7 md:p-8">
            <h2 className="font-display text-xl font-bold leading-snug text-cream-900 sm:text-2xl">
              {q.label}
              {q.required && <span className="ml-1 text-red-500">*</span>}
            </h2>
            {q.hint && (
              <p className="mt-2 text-sm leading-relaxed text-cream-800/60">{q.hint}</p>
            )}
            {!q.required && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-3 py-1 text-xs font-medium text-cream-800/55">
                <SkipForward className="h-3.5 w-3.5" />
                İsteğe bağlı — atlayabilirsiniz
              </p>
            )}

            <div className="mt-6 sm:mt-8">
              {q.type === 'emoji' && (
                <div className={gridClass}>
                  {q.options.map((o) => {
                    const sel = healthTest[q.key] === o.value
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => pickSingle(o.value)}
                        className={`flex min-h-[7.5rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 px-3 py-5 transition-all sm:min-h-[8.5rem] ${
                          sel
                            ? `${theme.solid} scale-[1.02] text-white ring-4 ${theme.ring}`
                            : 'border-cream-200 bg-cream-50/50 hover:border-cream-300 hover:bg-white hover:shadow-md'
                        }`}
                      >
                        <span className="text-4xl sm:text-5xl">{o.emoji}</span>
                        <span className={`text-sm font-bold sm:text-base ${sel ? 'text-white' : 'text-cream-900'}`}>{o.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {q.type === 'single' && (
                <div className={gridClass}>
                  {q.options.map((o) => {
                    const sel = healthTest[q.key] === o.value
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => pickSingle(o.value)}
                        className={`flex min-h-[4.5rem] flex-col items-start justify-center rounded-2xl border-2 px-5 py-4 text-left transition-all sm:min-h-[5.25rem] sm:px-6 sm:py-5 ${
                          sel
                            ? `${theme.solid} scale-[1.01] text-white shadow-lg ring-4 ${theme.ring}`
                            : 'border-cream-200 bg-cream-50/40 hover:border-cream-300 hover:bg-white hover:shadow-md'
                        }`}
                      >
                        <span className={`text-base font-bold sm:text-lg ${sel ? 'text-white' : 'text-cream-900'}`}>{o.label}</span>
                        {o.desc && (
                          <span className={`mt-1 text-sm leading-snug ${sel ? 'text-white/85' : 'text-cream-800/60'}`}>{o.desc}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {q.type === 'multi' && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {q.options.map((o) => {
                    const sel = (healthTest[q.key] || []).includes(o.value)
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => toggleMulti(o.value)}
                        className={`flex min-h-[3.75rem] items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left transition-all sm:min-h-[4.25rem] ${
                          sel
                            ? `${theme.chip} ring-2 ${theme.ring} font-semibold`
                            : 'border-cream-200 bg-cream-50/40 hover:border-cream-300 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${
                          sel ? `${theme.solid} border-transparent text-white` : 'border-cream-300 bg-white'
                        }`}>
                          {sel && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </span>
                        <span className="text-base font-semibold text-cream-900 sm:text-[1.05rem]">{o.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {q.type === 'text' && (
                <textarea
                  rows={4}
                  placeholder={q.placeholder}
                  value={healthTest[q.key] || ''}
                  onChange={(e) => updateHealthTest({ [q.key]: e.target.value })}
                  className="w-full rounded-2xl border-2 border-cream-200 bg-cream-50/30 px-5 py-4 text-base leading-relaxed focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100 sm:text-lg"
                />
              )}

              {q.detail && healthTest[q.key] === q.detail.when && (
                <input
                  type="text"
                  placeholder={q.detail.placeholder}
                  value={healthTest[q.detail.key] || ''}
                  onChange={(e) => updateHealthTest({ [q.detail.key]: e.target.value })}
                  className="mt-4 w-full rounded-2xl border-2 border-cream-200 px-5 py-4 text-base focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
                />
              )}
            </div>

            {missing && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                Lütfen bir seçenek belirleyin
              </motion.p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

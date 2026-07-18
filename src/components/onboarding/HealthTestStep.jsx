import { motion, AnimatePresence } from 'framer-motion'
import {
  HeartPulse, Stethoscope, Bone, Activity, Moon, Apple, Flower2, Check, AlertCircle, SkipForward, Clock,
  Sunrise, Sunset, UtensilsCrossed, BedDouble, Dumbbell, Clock3, MoonStar, Venus, Mars,
} from 'lucide-react'
import { isDetailVisible, isDetailFilled, isQuestionFullyAnswered, HEALTH_AUDIENCE_META } from '../../data/healthTest'

const ICONS = {
  HeartPulse, Stethoscope, Bone, Activity, Moon, Apple, Flower2, Clock,
  Dumbbell, Clock3, MoonStar, Venus, Mars,
}

const THEME = {
  safety:    { grad: 'from-rose-500 to-rose-600',       soft: 'bg-rose-50',     ring: 'ring-rose-300',     solid: 'bg-rose-500 border-rose-400 shadow-rose-500/25',       chip: 'border-rose-400 bg-rose-50 text-rose-800 ring-rose-200',       bar: 'bg-rose-500', text: 'text-rose-700' },
  movement:  { grad: 'from-amber-500 to-orange-600',      soft: 'bg-amber-50',    ring: 'ring-amber-300',    solid: 'bg-amber-500 border-amber-400 shadow-amber-500/25',      chip: 'border-amber-400 bg-amber-50 text-amber-800 ring-amber-200',    bar: 'bg-amber-500', text: 'text-amber-700' },
  nutrition: { grad: 'from-sage-500 to-emerald-600',      soft: 'bg-sage-50',     ring: 'ring-sage-300',     solid: 'bg-sage-500 border-sage-400 shadow-sage-500/25',       chip: 'border-sage-400 bg-sage-50 text-sage-800 ring-sage-200',         bar: 'bg-sage-500', text: 'text-sage-700' },
  context:   { grad: 'from-brand-500 to-brand-600',    soft: 'bg-brand-50',    ring: 'ring-brand-300',    solid: 'bg-brand-500 border-brand-400 shadow-brand-500/25',    chip: 'border-brand-400 bg-brand-50 text-brand-800 ring-brand-200',    bar: 'bg-brand-500', text: 'text-brand-700' },
  general:   { grad: 'from-brand-500 to-brand-600',    soft: 'bg-brand-50',    ring: 'ring-brand-300',    solid: 'bg-brand-500 border-brand-400 shadow-brand-500/25',    chip: 'border-brand-400 bg-brand-50 text-brand-800 ring-brand-200',    bar: 'bg-brand-500', text: 'text-brand-700' },
}

function themeFor(sectionId) {
  return THEME[sectionId] || THEME.general
}

export default function HealthTestStep({
  question,
  questionIndex,
  totalQuestions,
  sectionTitle,
  healthTest,
  updateHealthTest,
  showErrors,
  variant = 'wizard',
}) {
  if (!question) return null

  const embedded = variant === 'embedded'
  const theme = themeFor(question.sectionId)
  const SectionIcon = ICONS[question.sectionIcon] || HeartPulse
  const audienceMeta = HEALTH_AUDIENCE_META[question.audience] || HEALTH_AUDIENCE_META.shared
  const progress = Math.round(((questionIndex + 1) / Math.max(totalQuestions, 1)) * 100)
  const q = question
  const parentVal = healthTest?.[q.key]
  const detailVisible = q.detail && isDetailVisible(q.detail, parentVal)

  const missing = showErrors && !isQuestionFullyAnswered(q, healthTest)
  const detailMissing = showErrors && detailVisible && !isDetailFilled(q.detail, healthTest)

  const toggleMulti = (value) => {
    const arr = Array.isArray(healthTest[q.key]) ? healthTest[q.key] : []
    let next
    if (value === 'none') {
      next = arr.includes('none') ? [] : ['none']
    } else if (arr.includes(value)) {
      next = arr.filter((x) => x !== value)
    } else {
      next = [...arr.filter((x) => x !== 'none'), value]
    }
    const patch = { [q.key]: next }
    if (q.detail && !isDetailVisible(q.detail, next)) {
      patch[q.detail.key] = ''
    }
    updateHealthTest(patch)
  }

  const pickSingle = (value) => {
    const patch = { [q.key]: value }
    if (q.detail && !isDetailVisible(q.detail, value)) {
      patch[q.detail.key] = ''
    }
    updateHealthTest(patch)
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

  const fields = (
    <>
      {q.type === 'emoji' && (
        <div className={embedded ? 'grid grid-cols-2 gap-2 sm:grid-cols-5' : gridClass}>
          {q.options.map((o) => {
            const sel = healthTest[q.key] === o.value
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => pickSingle(o.value)}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 transition-all ${
                  embedded
                    ? `min-h-[4.5rem] px-2 py-3 ${sel ? `${theme.solid} text-white ring-2 ${theme.ring}` : 'border-cream-200 bg-cream-50/50 hover:bg-white'}`
                    : `min-h-[7.5rem] px-3 py-5 sm:min-h-[8.5rem] ${sel ? `${theme.solid} scale-[1.02] text-white ring-4 ${theme.ring}` : 'border-cream-200 bg-cream-50/50 hover:border-cream-300 hover:bg-white hover:shadow-md'}`
                }`}
              >
                <span className={embedded ? 'text-2xl' : 'text-4xl sm:text-5xl'}>{o.emoji}</span>
                <span className={`font-bold ${embedded ? 'text-xs' : 'text-sm sm:text-base'} ${sel ? 'text-white' : 'text-cream-900'}`}>{o.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {q.type === 'single' && (
        <div className={embedded ? 'grid grid-cols-1 gap-2 sm:grid-cols-2' : gridClass}>
          {q.options.map((o) => {
            const sel = healthTest[q.key] === o.value
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => pickSingle(o.value)}
                className={`flex flex-col items-start justify-center rounded-2xl border-2 text-left transition-all ${
                  embedded
                    ? `min-h-[3.25rem] px-4 py-3 ${sel ? `${theme.solid} text-white ring-2 ${theme.ring}` : 'border-cream-200 bg-cream-50/40 hover:bg-white'}`
                    : `min-h-[4.5rem] px-5 py-4 sm:min-h-[5.25rem] sm:px-6 sm:py-5 ${sel ? `${theme.solid} scale-[1.01] text-white shadow-lg ring-4 ${theme.ring}` : 'border-cream-200 bg-cream-50/40 hover:border-cream-300 hover:bg-white hover:shadow-md'}`
                }`}
              >
                <span className={`font-bold ${embedded ? 'text-sm' : 'text-base sm:text-lg'} ${sel ? 'text-white' : 'text-cream-900'}`}>{o.label}</span>
                {o.desc && (
                  <span className={`mt-1 text-sm leading-snug ${sel ? 'text-white/85' : 'text-cream-800/60'}`}>{o.desc}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {q.type === 'multi' && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {q.options.map((o) => {
            const sel = (healthTest[q.key] || []).includes(o.value)
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggleMulti(o.value)}
                className={`flex items-center gap-3 rounded-2xl border-2 text-left transition-all ${
                  embedded ? 'min-h-[3rem] px-4 py-3' : 'min-h-[3.75rem] px-5 py-4 sm:min-h-[4.25rem]'
                } ${
                  sel
                    ? `${theme.chip} ring-2 ${theme.ring} font-semibold`
                    : 'border-cream-200 bg-cream-50/40 hover:border-cream-300 hover:bg-white hover:shadow-sm'
                }`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                  sel ? `${theme.solid} border-transparent text-white` : 'border-cream-300 bg-white'
                }`}>
                  {sel && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className={`font-semibold text-cream-900 ${embedded ? 'text-sm' : 'text-base sm:text-[1.05rem]'}`}>{o.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {q.type === 'text' && (
        <textarea
          rows={embedded ? 3 : 4}
          placeholder={q.placeholder}
          value={healthTest[q.key] || ''}
          onChange={(e) => updateHealthTest({ [q.key]: e.target.value })}
          className={`w-full rounded-2xl border-2 border-cream-200 bg-cream-50/30 leading-relaxed focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100 ${
            embedded ? 'px-4 py-3 text-sm' : 'px-5 py-4 text-base sm:text-lg'
          }`}
        />
      )}

      {q.type === 'time' && (
        <TimeQuestionInput
          questionKey={q.key}
          value={healthTest[q.key] || ''}
          onChange={(v) => updateHealthTest({ [q.key]: v })}
          theme={theme}
          icon={
            q.key === 'wakeTime' || q.key === 'breakfastTime' ? Sunrise
              : q.key === 'sleepTime' ? BedDouble
                : q.key === 'lunchTime' ? UtensilsCrossed
                  : q.key === 'dinnerTime' ? Sunset
                    : Clock
          }
        />
      )}

      {q.detail && detailVisible && (
        <input
          type="text"
          placeholder={q.detail.placeholder}
          value={healthTest[q.detail.key] || ''}
          onChange={(e) => updateHealthTest({ [q.detail.key]: e.target.value })}
          className={`mt-3 w-full rounded-2xl border-2 focus:outline-none focus:ring-4 ${
            embedded ? 'px-4 py-3 text-sm' : 'mt-4 px-5 py-4 text-base'
          } ${
            detailMissing
              ? 'border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-red-100'
              : 'border-cream-200 focus:border-brand-400 focus:ring-brand-100'
          }`}
        />
      )}

      {missing && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 sm:text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {detailMissing
            ? 'Lütfen açıklama alanını doldurun'
            : (q.required ? 'Lütfen bir seçenek belirleyin' : 'Lütfen seçiminizi tamamlayın')}
        </p>
      )}
    </>
  )

  if (embedded) {
    return (
      <div className={`rounded-2xl border bg-white p-4 sm:p-5 ${missing ? 'border-red-200' : 'border-cream-200'}`}>
        <div className="mb-3 flex items-start gap-3">
          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${theme.soft} ${theme.text}`}>
            <SectionIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-snug text-cream-900 sm:text-[0.95rem]">
              {q.label}
              {q.required && <span className="ml-1 text-red-500">*</span>}
            </p>
            {q.hint && <p className="mt-1 text-xs text-cream-800/55">{q.hint}</p>}
            {!q.required && (
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-cream-800/45">
                <SkipForward className="h-3 w-3" /> İsteğe bağlı
              </p>
            )}
          </div>
        </div>
        <div className="mt-1">{fields}</div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-cream-800/50">
          <span>{sectionTitle || question.sectionTitle || 'Sağlık Profili'}</span>
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
          <div className={`bg-gradient-to-r ${theme.grad} px-5 py-4 sm:px-7 sm:py-5`}>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur">
                <SectionIcon className="h-5 w-5" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/75">{question.sectionTitle}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${audienceMeta.chip}`}>
                    {audienceMeta.label}
                  </span>
                </div>
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
            <div className="mt-6 sm:mt-8">{fields}</div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function TimeQuestionInput({ questionKey, value, onChange, theme, icon: Icon }) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl border-2 border-cream-200 ${theme.soft} px-5 py-4 transition focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-100`}>
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${theme.solid} text-white shadow-md`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <label htmlFor={questionKey} className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">
          Saat seçin
        </label>
        <input
          id={questionKey}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full bg-transparent font-display text-2xl font-bold text-cream-900 focus:outline-none sm:text-3xl"
        />
      </div>
    </div>
  )
}

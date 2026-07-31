import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HeartPulse, Stethoscope, Bone, Activity, Moon, Apple, Flower2, Check, AlertCircle, SkipForward, Clock,
  Sunrise, Sunset, UtensilsCrossed, BedDouble, Dumbbell, Clock3, MoonStar, Venus, Mars, Upload, X, FileText,
} from 'lucide-react'
import {
  isDetailVisible,
  isDetailFilled,
  isFollowUpVisible,
  isQuestionFullyAnswered,
  getSoftWarningMessage,
  toggleExclusiveMulti,
  clearHiddenFollowUps,
  hasStoredAnswer,
  HEALTH_AUDIENCE_META,
} from '../../data/healthTest'
import { uploadHealthLabResult } from '../../services/supabaseDb'
import { useApp } from '../../context/AppContext'

const ICONS = {
  HeartPulse, Stethoscope, Bone, Activity, Moon, Apple, Flower2, Clock,
  Dumbbell, Clock3, MoonStar, Venus, Mars, Sunrise, Sunset, UtensilsCrossed, BedDouble, Upload, X, FileText,
}

const THEME = {
  general:   { grad: 'from-brand-500 to-brand-600',    soft: 'bg-brand-50',    ring: 'ring-brand-300',    solid: 'bg-brand-500 border-brand-400 shadow-brand-500/25',    chip: 'border-brand-400 bg-brand-50 text-brand-800 ring-brand-200',    bar: 'bg-brand-500', text: 'text-brand-700' },
  medical:   { grad: 'from-rose-500 to-rose-600',       soft: 'bg-rose-50',     ring: 'ring-rose-300',     solid: 'bg-rose-500 border-rose-400 shadow-rose-500/25',       chip: 'border-rose-400 bg-rose-50 text-rose-800 ring-rose-200',       bar: 'bg-rose-500', text: 'text-rose-700' },
  physical:  { grad: 'from-amber-500 to-orange-600',      soft: 'bg-amber-50',    ring: 'ring-amber-300',    solid: 'bg-amber-500 border-amber-400 shadow-amber-500/25',      chip: 'border-amber-400 bg-amber-50 text-amber-800 ring-amber-200',    bar: 'bg-amber-500', text: 'text-amber-700' },
  lifestyle: { grad: 'from-sky-500 to-blue-600',         soft: 'bg-sky-50',      ring: 'ring-sky-300',      solid: 'bg-sky-500 border-sky-400 shadow-sky-500/25',          chip: 'border-sky-400 bg-sky-50 text-sky-800 ring-sky-200',            bar: 'bg-sky-500', text: 'text-sky-700' },
  recovery:  { grad: 'from-violet-500 to-indigo-600',     soft: 'bg-violet-50',   ring: 'ring-violet-300',   solid: 'bg-violet-500 border-violet-400 shadow-violet-500/25', chip: 'border-violet-400 bg-violet-50 text-violet-800 ring-violet-200', bar: 'bg-violet-500', text: 'text-violet-700' },
  nutrition: { grad: 'from-sage-500 to-emerald-600',      soft: 'bg-sage-50',     ring: 'ring-sage-300',     solid: 'bg-sage-500 border-sage-400 shadow-sage-500/25',       chip: 'border-sage-400 bg-sage-50 text-sage-800 ring-sage-200',         bar: 'bg-sage-500', text: 'text-sage-700' },
  routine:   { grad: 'from-teal-500 to-cyan-600',        soft: 'bg-teal-50',     ring: 'ring-teal-300',     solid: 'bg-teal-500 border-teal-400 shadow-teal-500/25',       chip: 'border-teal-400 bg-teal-50 text-teal-800 ring-teal-200',         bar: 'bg-teal-500', text: 'text-teal-700' },
  women:     { grad: 'from-pink-500 to-fuchsia-600',      soft: 'bg-pink-50',     ring: 'ring-pink-300',     solid: 'bg-pink-500 border-pink-400 shadow-pink-500/25',       chip: 'border-pink-400 bg-pink-50 text-pink-800 ring-pink-200',         bar: 'bg-pink-500', text: 'text-pink-700' },
  men:       { grad: 'from-slate-600 to-slate-800',       soft: 'bg-slate-50',    ring: 'ring-slate-300',    solid: 'bg-slate-600 border-slate-500 shadow-slate-600/25',    chip: 'border-slate-400 bg-slate-50 text-slate-800 ring-slate-200',     bar: 'bg-slate-600', text: 'text-slate-700' },
}

function themeFor(sectionId) {
  return THEME[sectionId] || THEME.general
}

function BatteryLevelIcon({ level = 1, selected }) {
  const clamped = Math.min(5, Math.max(1, Number(level) || 1))
  const fillClass =
    clamped <= 2 ? (selected ? 'bg-rose-200' : 'bg-rose-400')
      : clamped === 3 ? (selected ? 'bg-amber-200' : 'bg-amber-400')
        : selected ? 'bg-emerald-200' : 'bg-emerald-500'
  const emptyClass = selected ? 'bg-white/25' : 'bg-cream-200'
  const frameClass = selected ? 'bg-white/80' : 'bg-cream-400'
  return (
    <span className="inline-flex flex-col items-center" aria-hidden>
      <span className={`mb-px h-1.5 w-3 rounded-t-sm ${frameClass}`} />
      <span className={`flex h-11 w-7 flex-col-reverse gap-0.5 rounded-md border-2 p-0.5 sm:h-12 sm:w-8 ${
        selected ? 'border-white/80' : 'border-cream-400'
      }`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`min-h-0 flex-1 rounded-[2px] ${n <= clamped ? fillClass : emptyClass}`}
          />
        ))}
      </span>
    </span>
  )
}

function StarLevelIcon({ count = 1, selected }) {
  const filled = Math.min(5, Math.max(1, Number(count) || 1))
  return (
    <span className="grid w-full max-w-[7.5rem] grid-cols-5 place-items-center gap-x-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => {
        const on = i < filled
        return (
          <span
            key={i}
            className={`text-[0.95rem] leading-none sm:text-base ${
              on
                ? selected ? 'text-amber-200' : 'text-amber-400'
                : selected ? 'text-white/25' : 'text-cream-200'
            }`}
          >
            ★
          </span>
        )
      })}
    </span>
  )
}

function EmojiOptionVisual({ option, selected }) {
  if (option.batteryLevel != null) {
    return <BatteryLevelIcon level={option.batteryLevel} selected={selected} />
  }
  if (option.stars != null) {
    return <StarLevelIcon count={option.stars} selected={selected} />
  }
  return <span className="text-4xl sm:text-5xl">{option.emoji}</span>
}

function OptionGrid({ q, theme, healthTest, onPick, onToggle }) {
  const optionCount = q.options?.length || 0
  const emojiGridClass =
    optionCount === 5
      ? 'grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-3'
      : 'grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4'
  // Tek seçimli uzun şıklar dar sütunda kesilmesin: her zaman tam genişlik satır
  const singleGridClass =
    optionCount <= 2
      ? 'grid grid-cols-1 gap-3 sm:grid-cols-2'
      : 'grid grid-cols-1 gap-3'

  if (q.type === 'emoji') {
    return (
      <div className={emojiGridClass}>
        {q.options.map((o) => {
          const sel = healthTest[q.key] === o.value
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onPick(o.value)}
              className={`flex min-h-[7.5rem] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 px-2 py-4 transition-all sm:min-h-[8.5rem] sm:px-2.5 sm:py-5 ${
                sel
                  ? `${theme.solid} scale-[1.02] text-white ring-4 ${theme.ring}`
                  : 'border-cream-200 bg-cream-50/50 hover:border-cream-300 hover:bg-white hover:shadow-md'
              }`}
            >
              <EmojiOptionVisual option={o} selected={sel} />
              <span className={`text-center text-xs font-bold leading-tight sm:text-sm ${sel ? 'text-white' : 'text-cream-900'}`}>{o.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (q.type === 'single') {
    return (
      <div className={singleGridClass}>
        {q.options.map((o) => {
          const sel = healthTest[q.key] === o.value
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onPick(o.value)}
              className={`flex min-h-[3.25rem] w-full flex-col items-start justify-center rounded-2xl border-2 px-4 py-3.5 text-left transition-all sm:min-h-[3.75rem] sm:px-5 sm:py-4 ${
                sel
                  ? `${theme.solid} scale-[1.01] text-white shadow-lg ring-4 ${theme.ring}`
                  : 'border-cream-200 bg-cream-50/40 hover:border-cream-300 hover:bg-white hover:shadow-md'
              }`}
            >
              <span className={`w-full text-sm font-semibold leading-snug break-words hyphens-auto sm:text-base ${sel ? 'text-white' : 'text-cream-900'}`}>
                {o.label}
              </span>
              {o.desc && (
                <span className={`mt-1 w-full text-sm leading-snug break-words ${sel ? 'text-white/85' : 'text-cream-800/60'}`}>{o.desc}</span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  if (q.type === 'multi') {
    return (
      <div className="grid grid-cols-1 gap-3">
        {q.options.map((o) => {
          const selected = Array.isArray(healthTest[q.key])
            ? healthTest[q.key]
            : (healthTest[q.key] ? [healthTest[q.key]] : [])
          const sel = selected.includes(o.value)
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onToggle(o.value)}
              className={`flex min-h-[3.25rem] w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all sm:min-h-[3.75rem] sm:px-5 sm:py-4 ${
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
              <span className="min-w-0 flex-1 text-sm font-semibold leading-snug break-words text-cream-900 sm:text-base">{o.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return null
}

function ScaleInput({ q, value, onChange, theme }) {
  const min = q.min ?? 0
  const max = q.max ?? 10
  const num = value === '' || value == null ? min : Number(value)
  return (
    <div className={`rounded-2xl border-2 border-cream-200 ${theme.soft} px-5 py-6`}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">
          {min} – {max}
        </p>
        <p className={`font-display text-4xl font-bold ${theme.text}`}>{Number.isFinite(num) ? num : min}</p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={Number.isFinite(num) ? num : min}
        onPointerDown={() => {
          if (value === '' || value == null) onChange(min)
        }}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-600"
      />
      <div className="mt-2 flex justify-between text-xs text-cream-800/45">
        <span>{q.minLabel || min}</span>
        <span>{q.maxLabel || max}</span>
      </div>
    </div>
  )
}

function FileUploadInput({ q, value, onChange, theme, userId }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const files = Array.isArray(value) ? value : []

  const handleFiles = async (fileList) => {
    if (!fileList?.length) return
    setError('')
    setUploading(true)
    try {
      const next = [...files]
      for (const file of Array.from(fileList)) {
        const res = await uploadHealthLabResult(file, userId)
        if (!res.success) {
          setError(res.error || 'Yükleme başarısız')
          break
        }
        next.push({ path: res.path, name: file.name, contentType: file.type || '' })
      }
      onChange(next)
    } finally {
      setUploading(false)
    }
  }

  const removeAt = (idx) => {
    onChange(files.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cream-300 ${theme.soft} px-5 py-8 transition hover:border-brand-400`}>
        <Upload className={`h-6 w-6 ${theme.text}`} />
        <span className="text-sm font-semibold text-cream-900">
          {uploading ? 'Yükleniyor…' : 'PDF veya fotoğraf yükleyin'}
        </span>
        <span className="text-xs text-cream-800/50">En fazla 8 MB · PDF, JPG, PNG, WEBP</span>
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          disabled={uploading || !userId}
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </label>
      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, idx) => (
            <li key={`${f.path}-${idx}`} className="flex items-center justify-between gap-2 rounded-xl border border-cream-200 bg-white px-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-cream-800/50" />
                <span className="truncate font-medium text-cream-900">{f.name || f.path}</span>
              </span>
              <button type="button" onClick={() => removeAt(idx)} className="rounded-lg p-1 text-cream-800/50 hover:bg-cream-100 hover:text-cream-900">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function FollowUpBlock({
  followUp,
  healthTest,
  updateHealthTest,
  theme,
  showErrors,
  userId,
}) {
  const parentVal = healthTest?.[followUp.key]
  const detailVisible = followUp.detail && isDetailVisible(followUp.detail, parentVal)
  const missing = showErrors && followUp.required !== false && !isQuestionFullyAnswered(followUp, healthTest)
  const detailMissing = showErrors && detailVisible && !isDetailFilled(followUp.detail, healthTest)

  const pickSingle = (value) => {
    const patch = { [followUp.key]: value, ...clearHiddenFollowUps(followUp, value) }
    updateHealthTest(patch)
  }

  const toggleMulti = (value) => {
    const next = toggleExclusiveMulti(healthTest[followUp.key], value, followUp.options)
    const patch = { [followUp.key]: next, ...clearHiddenFollowUps(followUp, next) }
    updateHealthTest(patch)
  }

  return (
    <div className="mt-4 rounded-2xl border border-cream-200 bg-cream-50/40 p-4 sm:p-5">
      <h3 className="text-base font-bold text-cream-900">
        {followUp.label}
        {followUp.required !== false && <span className="ml-1 text-red-500">*</span>}
      </h3>
      {followUp.hint && <p className="mt-1 text-sm text-cream-800/60">{followUp.hint}</p>}
      <div className="mt-3">
        {(followUp.type === 'emoji' || followUp.type === 'single' || followUp.type === 'multi') && (
          <OptionGrid
            q={followUp}
            theme={theme}
            healthTest={healthTest}
            onPick={pickSingle}
            onToggle={toggleMulti}
          />
        )}
        {followUp.type === 'text' && (
          <textarea
            rows={3}
            placeholder={followUp.placeholder}
            value={healthTest[followUp.key] || ''}
            onChange={(e) => updateHealthTest({ [followUp.key]: e.target.value })}
            className="w-full rounded-2xl border-2 border-cream-200 bg-white px-4 py-3 text-base focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
        )}
        {followUp.type === 'scale' && (
          <ScaleInput
            q={followUp}
            value={healthTest[followUp.key]}
            onChange={(v) => updateHealthTest({ [followUp.key]: v })}
            theme={theme}
          />
        )}
        {followUp.type === 'file' && (
          <FileUploadInput
            q={followUp}
            value={healthTest[followUp.key]}
            onChange={(v) => updateHealthTest({ [followUp.key]: v })}
            theme={theme}
            userId={userId}
          />
        )}
        {followUp.detail && detailVisible && (
          <input
            type="text"
            placeholder={followUp.detail.placeholder}
            value={healthTest[followUp.detail.key] || ''}
            onChange={(e) => updateHealthTest({ [followUp.detail.key]: e.target.value })}
            className={`mt-3 w-full rounded-2xl border-2 px-4 py-3 text-base focus:outline-none focus:ring-4 ${
              detailMissing
                ? 'border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-red-100'
                : 'border-cream-200 focus:border-brand-400 focus:ring-brand-100'
            }`}
          />
        )}
      </div>
      {missing && (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Lütfen bu alanı tamamlayın
        </p>
      )}
      {(followUp.followUps || [])
        .filter((fu) => isFollowUpVisible(fu, parentVal))
        .map((fu) => (
          <FollowUpBlock
            key={fu.key}
            followUp={fu}
            healthTest={healthTest}
            updateHealthTest={updateHealthTest}
            theme={theme}
            showErrors={showErrors}
            userId={userId}
          />
        ))}
    </div>
  )
}

export default function HealthTestStep({
  question,
  questionIndex,
  totalQuestions,
  sectionTitle,
  healthTest,
  updateHealthTest,
  showErrors,
  hideAudienceChip = false,
  /** Çekirdek akış: required bayrağından bağımsız zorunlu göster */
  forceRequired = false,
}) {
  const { user } = useApp()
  if (!question) return null

  const theme = themeFor(hideAudienceChip ? 'general' : question.sectionId)
  const SectionIcon = ICONS[question.sectionIcon] || HeartPulse
  const audienceMeta = HEALTH_AUDIENCE_META[question.audience] || HEALTH_AUDIENCE_META.shared
  const progress = Math.round(((questionIndex + 1) / totalQuestions) * 100)
  const q = forceRequired ? { ...question, required: true } : question
  const parentVal = healthTest?.[q.key]
  const detailVisible = q.detail && isDetailVisible(q.detail, parentVal)
  const visibleFollowUps = (q.followUps || []).filter((fu) => isFollowUpVisible(fu, parentVal))
  const softWarning = getSoftWarningMessage(q, healthTest)

  const missing = showErrors && !isQuestionFullyAnswered(
    forceRequired ? { ...q, required: true } : q,
    healthTest,
  )
  const detailMissing = showErrors && detailVisible && !isDetailFilled(q.detail, healthTest)
  const infoNote = typeof q.infoNote === 'function'
    ? q.infoNote(healthTest)
    : (q.infoNoteWhen && isDetailVisible({ when: q.infoNoteWhen }, parentVal) ? q.infoNote : null)

  const toggleMulti = (value) => {
    const next = toggleExclusiveMulti(healthTest[q.key], value, q.options)
    updateHealthTest({ [q.key]: next, ...clearHiddenFollowUps(q, next) })
  }

  const pickSingle = (value) => {
    updateHealthTest({ [q.key]: value, ...clearHiddenFollowUps(q, value) })
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
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-xl shadow-brand-900/[0.06] backdrop-blur-sm">
          <div className={`bg-gradient-to-r ${theme.grad} px-5 py-4 sm:px-7 sm:py-5`}>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur">
                <SectionIcon className="h-5 w-5" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/75">
                    {hideAudienceChip
                      ? (sectionTitle || 'Genel Sağlık Testi')
                      : (question.sectionTitle || sectionTitle)}
                  </p>
                  {!hideAudienceChip && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${audienceMeta.chip}`}>
                      {audienceMeta.label}
                    </span>
                  )}
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

            <div className="mt-6 sm:mt-8">
              {(q.type === 'emoji' || q.type === 'single' || q.type === 'multi') && (
                <OptionGrid
                  q={q}
                  theme={theme}
                  healthTest={healthTest}
                  onPick={pickSingle}
                  onToggle={toggleMulti}
                />
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

              {q.type === 'scale' && (
                <ScaleInput
                  q={q}
                  value={healthTest[q.key]}
                  onChange={(v) => {
                    updateHealthTest({ [q.key]: v, ...clearHiddenFollowUps(q, v) })
                  }}
                  theme={theme}
                />
              )}

              {q.type === 'file' && (
                <FileUploadInput
                  q={q}
                  value={healthTest[q.key]}
                  onChange={(v) => updateHealthTest({ [q.key]: v })}
                  theme={theme}
                  userId={user?.id}
                />
              )}

              {q.detail && detailVisible && (
                <input
                  type="text"
                  placeholder={q.detail.placeholder}
                  value={healthTest[q.detail.key] || ''}
                  onChange={(e) => updateHealthTest({ [q.detail.key]: e.target.value })}
                  className={`mt-4 w-full rounded-2xl border-2 px-5 py-4 text-base focus:outline-none focus:ring-4 ${
                    detailMissing
                      ? 'border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-red-100'
                      : 'border-cream-200 focus:border-brand-400 focus:ring-brand-100'
                  }`}
                />
              )}

              {visibleFollowUps.map((fu) => (
                <FollowUpBlock
                  key={fu.key}
                  followUp={fu}
                  healthTest={healthTest}
                  updateHealthTest={updateHealthTest}
                  theme={theme}
                  showErrors={showErrors}
                  userId={user?.id}
                />
              ))}
            </div>

            {infoNote && (
              <p className="mt-4 rounded-xl bg-cream-100/80 px-4 py-3 text-sm leading-relaxed text-cream-800/70">
                {infoNote}
              </p>
            )}

            {softWarning && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {softWarning}
              </p>
            )}

            {q.footerNote && (
              <p className="mt-4 text-xs leading-relaxed text-cream-800/45">{q.footerNote}</p>
            )}

            {missing && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {detailMissing
                  ? 'Lütfen açıklama alanını doldurun'
                  : (q.required || hasStoredAnswer(q, healthTest) ? 'Lütfen seçiminizi tamamlayın' : 'Lütfen bir seçenek belirleyin')}
              </motion.p>
            )}
          </div>
        </div>
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

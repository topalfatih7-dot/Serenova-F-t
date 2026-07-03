import { useState } from 'react'
import { ClipboardList, Dumbbell, Apple, UserCheck, PlayCircle, Clock } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import VideoPlayer from '../components/ui/VideoPlayer'
import PanelPageHeader, { PanelChip, PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { AVAILABILITY_WEEKDAYS } from '../services/availability'
import { mealLabel, CYCLE_PLAN_LENGTH, dedupeDailyNutritionEntries, usesLegacyCycleDayRotation } from '../utils/programSchedule'

const FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'workout', label: 'Antrenman' },
  { id: 'nutrition', label: 'Beslenme' },
]

const dayName = (v) => AVAILABILITY_WEEKDAYS.find((d) => d.value === Number(v))?.label || ''
const amountText = (e) => (e.amountType === 'duration' ? `${e.amount} ${e.durationUnit || 'sn'}` : `${e.amount} tekrar`)

function groupKey(e) {
  if (e.cycleDay != null && e.cycleDay !== '') return `cycle:${e.cycleDay}`
  if (e.date) return `date:${e.date}`
  if (e.day != null && e.day !== '') return `day:${e.day}`
  return 'other'
}

function groupLabel(key, program = null) {
  if (key.startsWith('cycle:')) {
    const n = Number(key.slice(6))
    const len = program?.cycleLength || CYCLE_PLAN_LENGTH
    return `Gün ${n + 1} / ${len}`
  }
  if (key.startsWith('date:')) {
    const d = key.slice(5)
    try {
      return format(new Date(`${d}T12:00:00`), 'd MMMM yyyy, EEEE', { locale: tr })
    } catch {
      return d
    }
  }
  if (key.startsWith('day:')) return dayName(key.slice(4))
  return 'Diğer'
}

function groupBySchedule(entries = [], program = null) {
  const sameDailyFixed = (program?.scheduleType === 'cycle14' || program?.scheduleType === 'dateRange')
    && !usesLegacyCycleDayRotation(program)
  if (sameDailyFixed) {
    return [{
      key: 'daily',
      label: program.type === 'nutrition' ? 'Günlük menü (her gün aynı)' : 'Günlük antrenman (her gün aynı)',
      items: program.type === 'nutrition' ? dedupeDailyNutritionEntries(entries) : [...entries].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    }]
  }

  const groups = {}
  entries.forEach((e) => {
    const key = groupKey(e)
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  })

  return Object.keys(groups)
    .sort((a, b) => {
      if (a.startsWith('cycle:') && b.startsWith('cycle:')) return Number(a.slice(6)) - Number(b.slice(6))
      if (a.startsWith('date:') && b.startsWith('date:')) return a.slice(5).localeCompare(b.slice(5))
      if (a.startsWith('day:') && b.startsWith('day:')) return Number(a.slice(4)) - Number(b.slice(4))
      return a.localeCompare(b)
    })
    .map((key) => ({
      key,
      label: groupLabel(key, program),
      items: [...groups[key]].sort((a, b) => (a.start || '').localeCompare(b.start || '')),
    }))
}

export default function ProgramsPage() {
  const { myPrograms } = useApp()
  const [filter, setFilter] = useState('all')
  const [activeExercise, setActiveExercise] = useState(null)

  const filtered = filter === 'all' ? myPrograms : myPrograms.filter((p) => p.type === filter)

  return (
    <PanelPageShell>
      <PanelPageHeader
        title="Programlarım"
        subtitle="Koçunuz ve diyetisyeniniz tarafından hazırlanan programlar"
        icon={ClipboardList}
        accent="brand"
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <PanelChip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)} accent="brand">
            {f.label}
          </PanelChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Henüz program yok"
          description="Koçunuz veya diyetisyeniniz size bir program oluşturduğunda burada görünecek ve bildirim alacaksınız."
        />
      ) : (
        <div className="space-y-5">
          {filtered.map((p) => {
            const isWorkout = p.type === 'workout'
            const Icon = isWorkout ? Dumbbell : Apple
            return (
              <article
                key={p.id}
                className={`overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-lg ${
                  isWorkout
                    ? 'border-brand-200/70 hover:border-brand-300'
                    : 'border-sage-200/70 hover:border-sage-300'
                }`}
              >
                <div
                  className={`relative overflow-hidden px-4 py-4 sm:px-5 sm:py-5 ${
                    isWorkout
                      ? 'bg-gradient-to-br from-brand-600 via-brand-500 to-blue-500'
                      : 'bg-gradient-to-br from-sage-600 via-emerald-500 to-teal-500'
                  }`}
                >
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" aria-hidden />
                  <div className="relative flex items-start gap-3 sm:gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner backdrop-blur-sm sm:h-12 sm:w-12 sm:rounded-2xl">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h3 className="font-display text-base font-bold leading-tight text-white sm:text-lg">{p.title}</h3>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm sm:text-xs">
                          {isWorkout ? 'Antrenman' : 'Beslenme'}
                        </span>
                        {p.scheduleType === 'cycle14' && (
                          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/95 sm:text-xs">
                            14 Gün · Her Gün Aynı
                          </span>
                        )}
                        {p.scheduleType === 'dateRange' && p.cycleStartDate && (
                          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/95 sm:text-xs">
                            {p.cycleLength || 0} Gün · Her Gün Aynı
                          </span>
                        )}
                        {isWorkout && p.sessionDuration && (
                          <span className="flex items-center gap-0.5 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/95 sm:text-xs">
                            <Clock className="h-3 w-3" /> {p.sessionDuration} dk
                          </span>
                        )}
                      </div>
                      {(p.scheduleType === 'cycle14' || p.scheduleType === 'dateRange') && p.cycleStartDate && (
                        <p className="mt-1.5 text-xs leading-relaxed text-white/80">
                          {format(new Date(`${p.cycleStartDate}T12:00:00`), 'd MMMM yyyy', { locale: tr })}
                          {' — '}
                          {format(addDays(new Date(`${p.cycleStartDate}T12:00:00`), (p.cycleLength || CYCLE_PLAN_LENGTH) - 1), 'd MMMM yyyy', { locale: tr })}
                          {' · her gün aynı program'}
                        </p>
                      )}
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-white/75">
                        <UserCheck className="h-3.5 w-3.5 shrink-0" />
                        <span>{p.staffName}</span>
                        <span className="text-white/40">·</span>
                        <span>{format(new Date(p.createdAt), 'd MMMM yyyy', { locale: tr })}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-5">
                {p.description && <p className="text-sm leading-relaxed text-cream-800/70">{p.description}</p>}

                {/* Kütüphane tabanlı program: gün gün, hareketler tıklanabilir */}
                {p.entries?.length > 0 ? (
                  <div className={`space-y-4 ${p.description ? 'mt-4' : ''}`}>
                    {groupBySchedule(p.entries, p).map((g) => (
                      <div key={g.key}>
                        <div className="mb-2.5 flex flex-wrap items-center gap-2">
                          <p className={`text-xs font-bold uppercase tracking-wide ${
                            isWorkout ? 'text-brand-600' : 'text-sage-600'
                          }`}>
                            {g.label}
                          </p>
                          {p.type !== 'nutrition' && g.items[0]?.start && (
                            <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              isWorkout ? 'bg-brand-50 text-brand-600' : 'bg-sage-50 text-sage-600'
                            }`}>
                              <Clock className="h-2.5 w-2.5" />{g.items[0].start}{g.items[0].end ? `–${g.items[0].end}` : ''}
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {g.items.map((e) => {
                            const isNutrition = p.type === 'nutrition' || e.mealType
                            const title = e.exerciseName || e.name || 'Öğün'
                            const hasVideo = !isNutrition && e.videoUrl
                            return (
                            <button
                              key={e.id}
                              type="button"
                              onClick={() => hasVideo && setActiveExercise(e)}
                              className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition sm:px-4 ${
                                isNutrition
                                  ? 'border-sage-100 bg-gradient-to-r from-sage-50/80 to-emerald-50/40 hover:border-sage-200 hover:shadow-sm'
                                  : hasVideo
                                    ? 'border-brand-100 bg-gradient-to-r from-brand-50/80 to-blue-50/40 hover:border-brand-200 hover:shadow-sm'
                                    : 'border-cream-200 bg-cream-50/80'
                              }`}
                            >
                              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm ${
                                isNutrition
                                  ? 'bg-gradient-to-br from-sage-400 to-emerald-500 text-white'
                                  : 'bg-gradient-to-br from-brand-400 to-blue-500 text-white'
                              }`}>
                                {isNutrition ? <Apple className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                              </span>
                              <div className="min-w-0 flex-1">
                                {e.mealType && (
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-sage-600">{mealLabel(e.mealType)}</p>
                                )}
                                <p className="font-medium text-cream-900">
                                  {title}{!isNutrition && e.amount ? ` · ${amountText(e)}` : ''}
                                </p>
                                {isNutrition && (e.start || e.note) && (
                                  <p className="flex flex-wrap items-center gap-1 text-xs text-cream-800/55">
                                    {e.start && <><Clock className="h-3 w-3" /> {e.start}{e.end ? `–${e.end}` : ''}</>}
                                    {e.note ? `${e.start ? ' · ' : ''}${e.note}` : ''}
                                  </p>
                                )}
                                {!isNutrition && e.note && (
                                  <p className="text-xs italic text-cream-800/45">{e.note}</p>
                                )}
                              </div>
                              {hasVideo && (
                                <PlayCircle className="h-5 w-5 shrink-0 text-brand-400" />
                              )}
                            </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  p.items?.length > 0 && (
                    <ul className={`space-y-2 ${p.description ? 'mt-4' : ''}`}>
                      {p.items.map((item, i) => (
                        <li
                          key={i}
                          className={`flex items-start gap-2.5 rounded-xl px-4 py-2.5 text-sm text-cream-800 ${
                            isWorkout ? 'bg-brand-50/60' : 'bg-sage-50/60'
                          }`}
                        >
                          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${isWorkout ? 'bg-brand-400' : 'bg-sage-400'}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )
                )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal open={!!activeExercise} onClose={() => setActiveExercise(null)} title={activeExercise?.exerciseName || activeExercise?.name} size="lg">
        {activeExercise && (
          <div className="space-y-4">
            {activeExercise.videoUrl && <VideoPlayer url={activeExercise.videoUrl} />}
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
                {activeExercise.date
                  ? format(new Date(`${activeExercise.date}T12:00:00`), 'd MMM yyyy', { locale: tr })
                  : dayName(activeExercise.day)}
                {activeExercise.start ? ` · ${activeExercise.start}–${activeExercise.end || ''}` : ''}
              </span>
              <span className="rounded-full bg-cream-100 px-3 py-1 font-medium text-cream-800">{amountText(activeExercise)}</span>
            </div>
            {activeExercise.note && <p className="text-sm text-cream-800/70"><strong>Not:</strong> {activeExercise.note}</p>}
            {activeExercise.description && <p className="whitespace-pre-line text-sm leading-relaxed text-cream-800/80">{activeExercise.description}</p>}
          </div>
        )}
      </Modal>
    </PanelPageShell>
  )
}

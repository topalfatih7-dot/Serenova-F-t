import { useState } from 'react'
import { ClipboardList, Dumbbell, Apple, UserCheck, PlayCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import VideoPlayer from '../components/ui/VideoPlayer'
import PanelPageHeader, { PanelChip, PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { AVAILABILITY_WEEKDAYS } from '../services/availability'
import { mealLabel } from '../utils/programSchedule'

const FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'workout', label: 'Antrenman' },
  { id: 'nutrition', label: 'Beslenme' },
]

const dayName = (v) => AVAILABILITY_WEEKDAYS.find((d) => d.value === Number(v))?.label || ''
const amountText = (e) => (e.amountType === 'duration' ? `${e.amount} ${e.durationUnit || 'sn'}` : `${e.amount} tekrar`)

function groupKey(e) {
  if (e.date) return `date:${e.date}`
  if (e.day != null && e.day !== '') return `day:${e.day}`
  return 'other'
}

function groupLabel(key) {
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

function groupBySchedule(entries = []) {
  const groups = {}
  entries.forEach((e) => {
    const key = groupKey(e)
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  })

  return Object.keys(groups)
    .sort((a, b) => {
      if (a.startsWith('date:') && b.startsWith('date:')) return a.slice(5).localeCompare(b.slice(5))
      if (a.startsWith('day:') && b.startsWith('day:')) return Number(a.slice(4)) - Number(b.slice(4))
      return a.localeCompare(b)
    })
    .map((key) => ({
      key,
      label: groupLabel(key),
      items: [...groups[key]].sort((a, b) => (a.start || '').localeCompare(b.start || '')),
    }))
}

export default function ProgramsPage() {
  const { myPrograms } = useApp()
  const [filter, setFilter] = useState('all')
  const [activeExercise, setActiveExercise] = useState(null)

  const filtered = filter === 'all' ? myPrograms : myPrograms.filter((p) => p.type === filter)

  return (
    <PanelPageShell maxWidth="max-w-3xl">
      <PanelPageHeader
        title="Programlarım"
        subtitle="Koçunuz ve diyetisyeniniz tarafından hazırlanan programlar"
        icon={ClipboardList}
        accent="brand"
        actions={FILTERS.map((f) => (
          <PanelChip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)} accent="brand">
            {f.label}
          </PanelChip>
        ))}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Henüz program yok"
          description="Koçunuz veya diyetisyeniniz size bir program oluşturduğunda burada görünecek ve bildirim alacaksınız."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => {
            const isWorkout = p.type === 'workout'
            const Icon = isWorkout ? Dumbbell : Apple
            return (
              <div key={p.id} className="glass-card-solid p-6">
                <div className="flex items-start gap-4">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isWorkout ? 'bg-brand-100 text-brand-600' : 'bg-sage-100 text-sage-600'}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-cream-900">{p.title}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isWorkout ? 'bg-brand-50 text-brand-700' : 'bg-sage-50 text-sage-700'}`}>
                        {isWorkout ? 'Antrenman' : 'Beslenme'}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-cream-800/50">
                      <UserCheck className="h-3.5 w-3.5" /> {p.staffName} · {format(new Date(p.createdAt), 'd MMMM yyyy', { locale: tr })}
                    </p>
                  </div>
                </div>

                {p.description && <p className="mt-4 text-sm text-cream-800/70">{p.description}</p>}

                {/* Kütüphane tabanlı program: gün gün, hareketler tıklanabilir */}
                {p.entries?.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {groupBySchedule(p.entries).map((g) => (
                      <div key={g.key}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/50">{g.label}</p>
                        <div className="space-y-2">
                          {g.items.map((e) => {
                            const isNutrition = p.type === 'nutrition' || e.mealType
                            const title = e.exerciseName || e.name || 'Öğün'
                            return (
                            <button
                              key={e.id}
                              type="button"
                              onClick={() => !isNutrition && e.videoUrl && setActiveExercise(e)}
                              className={`flex w-full items-center gap-3 rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-left transition ${
                                !isNutrition && e.videoUrl ? 'hover:border-brand-300 hover:bg-white' : ''
                              }`}
                            >
                              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                isNutrition ? 'bg-sage-100 text-sage-600' : 'bg-brand-100 text-brand-600'
                              }`}>
                                {isNutrition ? <Apple className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                              </span>
                              <div className="min-w-0 flex-1">
                                {e.mealType && (
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-sage-600">{mealLabel(e.mealType)}</p>
                                )}
                                <p className="font-medium text-cream-900">
                                  {title}{!isNutrition && e.amount ? ` · ${amountText(e)}` : ''}
                                </p>
                                {(e.start || e.note) && (
                                  <p className="flex items-center gap-1 text-xs text-cream-800/55">
                                    {e.start && <><Clock className="h-3 w-3" /> {e.start}{e.end ? `–${e.end}` : ''}</>}
                                    {e.note ? `${e.start ? ' · ' : ''}${e.note}` : ''}
                                  </p>
                                )}
                              </div>
                            </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  p.items?.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {p.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 rounded-xl bg-cream-50 px-4 py-2.5 text-sm text-cream-800">
                          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${isWorkout ? 'bg-brand-400' : 'bg-sage-400'}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>
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

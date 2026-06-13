import { useState } from 'react'
import { ClipboardList, Dumbbell, Apple, UserCheck, PlayCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import VideoPlayer from '../components/ui/VideoPlayer'
import { useApp } from '../context/AppContext'
import { AVAILABILITY_WEEKDAYS } from '../services/availability'

const FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'workout', label: 'Antrenman' },
  { id: 'nutrition', label: 'Beslenme' },
]

const dayName = (v) => AVAILABILITY_WEEKDAYS.find((d) => d.value === Number(v))?.label || ''
const amountText = (e) => (e.amountType === 'duration' ? `${e.amount} ${e.durationUnit || 'sn'}` : `${e.amount} tekrar`)

function groupByDay(entries) {
  const groups = {}
  entries.forEach((e) => { (groups[e.day] = groups[e.day] || []).push(e) })
  return Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b)
    .map((day) => ({ day, items: groups[day].sort((a, b) => a.start.localeCompare(b.start)) }))
}

export default function ProgramsPage() {
  const { myPrograms } = useApp()
  const [filter, setFilter] = useState('all')
  const [activeExercise, setActiveExercise] = useState(null)

  const filtered = filter === 'all' ? myPrograms : myPrograms.filter((p) => p.type === filter)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Programlarım</h1>
        <p className="mt-1 text-sm text-cream-800/60">Koçunuz ve diyetisyeniniz tarafından hazırlanan programlar</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              filter === f.id ? 'bg-brand-500 text-white' : 'bg-cream-100 text-cream-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

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
              <div key={p.id} className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
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
                    {groupByDay(p.entries).map((g) => (
                      <div key={g.day}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/50">{dayName(g.day)}</p>
                        <div className="space-y-2">
                          {g.items.map((e) => (
                            <button
                              key={e.id}
                              type="button"
                              onClick={() => setActiveExercise(e)}
                              className="flex w-full items-center gap-3 rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-left transition hover:border-brand-300 hover:bg-white"
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                                <PlayCircle className="h-5 w-5" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-cream-900">{e.exerciseName} · {amountText(e)}</p>
                                <p className="flex items-center gap-1 text-xs text-cream-800/55"><Clock className="h-3 w-3" /> {e.start}–{e.end}{e.note ? ` · ${e.note}` : ''}</p>
                              </div>
                            </button>
                          ))}
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

      <Modal open={!!activeExercise} onClose={() => setActiveExercise(null)} title={activeExercise?.exerciseName} size="lg">
        {activeExercise && (
          <div className="space-y-4">
            <VideoPlayer url={activeExercise.videoUrl} />
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">{dayName(activeExercise.day)} · {activeExercise.start}–{activeExercise.end}</span>
              <span className="rounded-full bg-cream-100 px-3 py-1 font-medium text-cream-800">{amountText(activeExercise)}</span>
            </div>
            {activeExercise.note && <p className="text-sm text-cream-800/70"><strong>Not:</strong> {activeExercise.note}</p>}
            {activeExercise.description && <p className="whitespace-pre-line text-sm leading-relaxed text-cream-800/80">{activeExercise.description}</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}

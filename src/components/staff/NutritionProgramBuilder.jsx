import { useMemo, useState } from 'react'
import { format, addDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Plus, Trash2, Apple, CalendarDays, Coffee, Sun, Moon, Cookie } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { MEAL_TYPES, mealLabel, CYCLE_PLAN_LENGTH, dedupeDailyNutritionEntries } from '../../utils/programSchedule'
import { getDateInputBounds } from '../../utils/programPackageScope'
import { WEEKDAYS } from '../package/SupportScheduler'

const MEAL_UI = {
  breakfast: { icon: Coffee, accent: 'bg-amber-100 text-amber-700 ring-amber-200', btn: 'bg-amber-500 hover:bg-amber-600' },
  snack_morning: { icon: Cookie, accent: 'bg-orange-50 text-orange-700 ring-orange-200', btn: 'bg-orange-500 hover:bg-orange-600' },
  lunch: { icon: Sun, accent: 'bg-sage-100 text-sage-700 ring-sage-200', btn: 'bg-sage-500 hover:bg-sage-600' },
  snack_afternoon: { icon: Cookie, accent: 'bg-lime-50 text-lime-800 ring-lime-200', btn: 'bg-lime-600 hover:bg-lime-700' },
  dinner: { icon: Moon, accent: 'bg-indigo-50 text-indigo-700 ring-indigo-200', btn: 'bg-indigo-500 hover:bg-indigo-600' },
  snack_evening: { icon: Cookie, accent: 'bg-violet-50 text-violet-700 ring-violet-200', btn: 'bg-violet-500 hover:bg-violet-600' },
  note: { icon: Apple, accent: 'bg-cream-100 text-cream-800 ring-cream-200', btn: 'bg-cream-700 hover:bg-cream-800' },
}

const SELECTABLE_MEALS = MEAL_TYPES.filter((m) => m.id !== 'note')

const TIME_OPTIONS = (() => {
  const out = []
  for (let h = 6; h <= 23; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`)
    out.push(`${String(h).padStart(2, '0')}:30`)
  }
  return out
})()

const DEFAULT_MEAL_TIMES = {
  breakfast: '08:00',
  snack_morning: '10:30',
  lunch: '13:00',
  snack_afternoon: '16:00',
  dinner: '19:00',
  snack_evening: '21:30',
}

function entryToText(e, scheduleMode) {
  const schedule = scheduleMode === 'cycle14'
    ? '14 gün boyunca her gün'
    : e.date
      ? format(new Date(`${e.date}T12:00:00`), 'd MMM', { locale: tr })
      : e.day != null
        ? WEEKDAYS.find((d) => d.value === Number(e.day))?.label || ''
        : 'Her gün'
  const time = e.start ? ` ${e.start}` : ''
  return `${schedule}${time} ${mealLabel(e.mealType)}: ${e.name}${e.note ? ` (${e.note})` : ''}`
}

function sortEntries(list) {
  return [...list].sort((a, b) => {
    const dateCmp = (a.date || '9999').localeCompare(b.date || '9999')
    if (dateCmp !== 0) return dateCmp
    const dayCmp = (a.day ?? 99) - (b.day ?? 99)
    if (dayCmp !== 0) return dayCmp
    const ai = MEAL_TYPES.findIndex((m) => m.id === a.mealType)
    const bi = MEAL_TYPES.findIndex((m) => m.id === b.mealType)
    if (ai !== bi) return ai - bi
    return (a.start || '').localeCompare(b.start || '')
  })
}

function entryKey(entry) {
  if (entry.date) return `date:${entry.date}:${entry.mealType}:${entry.start || ''}`
  return `day:${entry.day}:${entry.mealType}:${entry.start || ''}`
}

function isDailyMode(mode) {
  return mode === 'cycle14' || mode === 'everyday'
}

export default function NutritionProgramBuilder({ onCreate, packageRange }) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [entries, setEntries] = useState([])
  const [scheduleMode, setScheduleMode] = useState('cycle14')
  const [selectedDay, setSelectedDay] = useState(1)
  const [cycleStartDate, setCycleStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [mealType, setMealType] = useState('breakfast')
  const [draft, setDraft] = useState({ content: '', note: '', start: DEFAULT_MEAL_TIMES.breakfast })

  const dateBounds = useMemo(
    () => getDateInputBounds(packageRange, { cycleLength: CYCLE_PLAN_LENGTH }),
    [packageRange]
  )
  const singleDateBounds = useMemo(() => getDateInputBounds(packageRange), [packageRange])

  const cycleEndDate = useMemo(
    () => format(addDays(new Date(`${cycleStartDate}T12:00:00`), CYCLE_PLAN_LENGTH - 1), 'yyyy-MM-dd'),
    [cycleStartDate]
  )

  const activeEntries = useMemo(() => {
    if (isDailyMode(scheduleMode)) {
      return dedupeDailyNutritionEntries(entries.filter((e) => !e.date && e.cycleDay == null))
    }
    if (scheduleMode === 'date') {
      return sortEntries(entries.filter((e) => e.date === selectedDate))
    }
    return sortEntries(entries.filter((e) => e.day === selectedDay && !e.date))
  }, [entries, selectedDay, selectedDate, scheduleMode])

  const datesWithMeals = useMemo(() => {
    const set = new Set(entries.filter((e) => e.date).map((e) => e.date))
    return Array.from(set).sort()
  }, [entries])

  const daysWithMeals = useMemo(() => {
    const set = new Set(entries.filter((e) => e.day != null && !e.date).map((e) => e.day))
    return Array.from(set).sort((a, b) => a - b)
  }, [entries])

  const activeMeal = SELECTABLE_MEALS.find((m) => m.id === mealType) || SELECTABLE_MEALS[0]
  const activeUi = MEAL_UI[mealType] || MEAL_UI.breakfast
  const ActiveIcon = activeUi.icon

  const selectMealType = (id) => {
    setMealType(id)
    setDraft((d) => ({ ...d, start: DEFAULT_MEAL_TIMES[id] || '08:00' }))
  }

  const buildEntry = (schedulePatch) => ({
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    mealType,
    name: draft.content.trim(),
    note: draft.note.trim(),
    exerciseName: draft.content.trim(),
    start: draft.start,
    ...schedulePatch,
  })

  const addEntry = () => {
    if (!draft.content.trim()) {
      toast('Öğün içeriği girin', 'error')
      return
    }

    setEntries((list) => {
      let next = [...list]
      const upsert = (patch) => {
        const key = entryKey({ ...patch, mealType, start: draft.start })
        next = next.filter((e) => entryKey(e) !== key)
        next.push(buildEntry(patch))
      }

      if (isDailyMode(scheduleMode)) {
        for (let day = 0; day <= 6; day += 1) {
          upsert({ day })
        }
      } else if (scheduleMode === 'date') {
        upsert({ date: selectedDate })
      } else {
        upsert({ day: selectedDay })
      }
      return next
    })
    setDraft((d) => ({ ...d, content: '', note: '' }))
    toast(`${mealLabel(mealType)} eklendi`, 'success')
  }

  const removeEntry = (id) => {
    setEntries((list) => {
      const target = list.find((e) => e.id === id)
      if (!target || !isDailyMode(scheduleMode)) {
        return list.filter((e) => e.id !== id)
      }
      const key = `${target.mealType}:${target.start}:${target.name}`
      return list.filter((e) => `${e.mealType}:${e.start}:${e.name}` !== key)
    })
  }

  const submit = () => {
    if (!title.trim()) { toast('Liste başlığı gerekli', 'error'); return }

    let scoped = entries
    if (isDailyMode(scheduleMode)) {
      scoped = entries.filter((e) => e.day != null && !e.date && e.cycleDay == null)
    } else if (scheduleMode === 'date') {
      scoped = entries.filter((e) => e.date)
    } else {
      scoped = entries.filter((e) => e.day != null && !e.date && e.cycleDay == null)
    }

    if (scoped.length === 0) { toast('En az bir öğün ekleyin', 'error'); return }

    const ordered = sortEntries(scoped)
    const displayEntries = isDailyMode(scheduleMode)
      ? dedupeDailyNutritionEntries(ordered)
      : ordered

    const payload = {
      title: title.trim(),
      description: description.trim(),
      entries: ordered,
      items: displayEntries.map((e) => entryToText(e, scheduleMode)),
    }

    if (scheduleMode === 'cycle14') {
      payload.scheduleType = 'cycle14'
      payload.cycleStartDate = cycleStartDate
      payload.cycleLength = CYCLE_PLAN_LENGTH
      payload.cycleLoop = false
      payload.cycleSameDaily = true
    } else if (scheduleMode === 'everyday') {
      payload.scheduleType = 'everyday'
    } else if (scheduleMode === 'weekly') {
      payload.scheduleType = 'weekly'
    } else if (scheduleMode === 'date') {
      payload.scheduleType = 'date'
    }

    onCreate(payload)
    setTitle('')
    setDescription('')
    setEntries([])
  }

  const scheduleLabel = scheduleMode === 'cycle14'
    ? `Günlük menü · ${CYCLE_PLAN_LENGTH} gün geçerli`
    : scheduleMode === 'date'
      ? format(new Date(`${selectedDate}T12:00:00`), 'd MMMM yyyy, EEEE', { locale: tr })
      : scheduleMode === 'everyday'
        ? 'Haftanın her günü (paket süresince)'
        : `${WEEKDAYS.find((d) => d.value === selectedDay)?.label || '—'} (haftalık tekrar)`

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Beslenme listesi başlığı"
          className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-sage-300"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Genel notlar (su tüketimi, alerjiler vb.)"
          rows={2}
          className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-sage-300"
        />
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl bg-cream-50 p-1">
        {[
          { id: 'cycle14', label: '14 Günlük Liste' },
          { id: 'everyday', label: 'Süresiz her gün' },
          { id: 'weekly', label: 'Güne özel (haftalık)' },
          { id: 'date', label: 'Tarihe özel' },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setScheduleMode(m.id)}
            className={`flex-1 min-w-[calc(50%-0.25rem)] rounded-lg py-2 text-[10px] font-semibold transition sm:min-w-0 sm:text-xs ${
              scheduleMode === m.id ? 'bg-sage-500 text-white shadow' : 'text-cream-800/70 hover:bg-white'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {scheduleMode === 'cycle14' ? (
        <div className="rounded-xl border border-sage-200 bg-sage-50/50 p-3">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sage-700">
            <CalendarDays className="h-3.5 w-3.5" />
            Liste başlangıç tarihi
          </label>
          <input
            type="date"
            value={cycleStartDate}
            min={dateBounds.min}
            max={dateBounds.max}
            onChange={(e) => setCycleStartDate(e.target.value)}
            className="mt-2 w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm"
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-sage-800/70">
            <strong>Her gün aynı menü</strong> {format(new Date(`${cycleStartDate}T12:00:00`), 'd MMMM', { locale: tr })}
            {' — '}
            {format(new Date(`${cycleEndDate}T12:00:00`), 'd MMMM yyyy', { locale: tr })}
            {' '}tarihleri arasında geçerli ({CYCLE_PLAN_LENGTH} gün).
            {packageRange && (
              <> Paket süresi: {packageRange.start}{packageRange.end ? ` — ${packageRange.end}` : ''}.</>
            )}
          </p>
        </div>
      ) : scheduleMode === 'date' ? (
        <div className="rounded-xl border border-sage-200 bg-sage-50/50 p-3">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sage-700">
            <CalendarDays className="h-3.5 w-3.5" />
            Tarih Seç
          </label>
          <input
            type="date"
            value={selectedDate}
            min={singleDateBounds.min}
            max={singleDateBounds.max}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-2 w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm"
          />
          {packageRange && (
            <p className="mt-1.5 text-[11px] text-sage-800/70">
              Paket süresi: {packageRange.start}{packageRange.end ? ` — ${packageRange.end}` : ''}
            </p>
          )}
        </div>
      ) : scheduleMode === 'weekly' ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/50">Gün Seç</p>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => {
              const count = entries.filter((e) => e.day === d.value && !e.date).length
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setSelectedDay(d.value)}
                  className={`flex flex-col items-center rounded-xl py-2 text-[10px] font-semibold transition ${
                    selectedDay === d.value ? 'bg-sage-500 text-white shadow' : 'bg-cream-50 text-cream-800/70 hover:bg-white'
                  }`}
                >
                  <span>{d.label.slice(0, 3)}</span>
                  {count > 0 && <span className="mt-0.5 text-[9px] opacity-80">{count}</span>}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-sage-100 bg-sage-50/50 px-3 py-2 text-xs text-sage-800">
          Eklediğiniz öğünler paket süresince haftanın her günü aynı saatlerle tekrarlanır.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-h-[200px] rounded-xl border border-cream-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold text-cream-800/70">
            {scheduleLabel} — {activeEntries.length} öğün
          </p>
          {activeEntries.length === 0 ? (
            <p className="py-8 text-center text-xs text-cream-800/40">Öğün ekleyin</p>
          ) : (
            <div className="space-y-2">
              {activeEntries.map((e) => {
                const ui = MEAL_UI[e.mealType] || MEAL_UI.breakfast
                const Icon = ui.icon
                return (
                  <div key={e.id} className={`rounded-xl border px-3 py-3 ring-1 ${ui.accent}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ui.btn} text-white`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-cream-900">{mealLabel(e.mealType)}</p>
                            {e.start && (
                              <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-cream-800/70">
                                {e.start}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-cream-800">{e.name}</p>
                          {e.note && <p className="mt-1 text-xs text-cream-800/55">Not: {e.note}</p>}
                        </div>
                      </div>
                      <button type="button" onClick={() => removeEntry(e.id)} className="shrink-0 text-red-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-sage-100 bg-white p-3">
          <p className="mb-3 text-xs font-semibold uppercase text-sage-700">Öğün Ekle</p>
          <div className="mb-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {SELECTABLE_MEALS.map((m) => {
              const ui = MEAL_UI[m.id] || MEAL_UI.breakfast
              const Icon = ui.icon
              const selected = mealType === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectMealType(m.id)}
                  className={`flex items-center gap-1.5 rounded-xl border px-2 py-2 text-left text-[10px] font-semibold transition sm:text-xs ${
                    selected ? `${ui.btn} border-transparent text-white shadow-sm` : 'border-cream-200 bg-cream-50 text-cream-800/70 hover:bg-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="leading-tight">{m.short}</span>
                </button>
              )
            })}
          </div>

          <div className={`mb-3 flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ${activeUi.accent}`}>
            <ActiveIcon className="h-4 w-4 shrink-0" />
            <span className="text-sm font-semibold">{activeMeal.label}</span>
          </div>

          <label className="mb-1 block text-xs font-medium text-cream-800/60">Öğün saati</label>
          <select
            value={draft.start}
            onChange={(e) => setDraft({ ...draft, start: e.target.value })}
            className="mb-3 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <label className="mb-1 block text-xs font-medium text-cream-800/60">Öğün içeriği</label>
          <textarea
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            placeholder="Örn. Yulaf lapası, muz, 10 badem, yeşil çay"
            rows={3}
            className="mb-2 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm"
          />
          <input
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            placeholder="Dikkat edilecekler (opsiyonel)"
            className="mb-3 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addEntry}
            className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold text-white ${activeUi.btn}`}
          >
            <Plus className="h-4 w-4" />
            {mealLabel(mealType)} Ekle
          </button>
        </div>
      </div>

      {datesWithMeals.length > 0 && scheduleMode === 'date' && (
        <div className="flex flex-wrap gap-1.5">
          {datesWithMeals.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDate(d)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                d === selectedDate ? 'bg-sage-500 text-white' : 'bg-sage-100 text-sage-700'
              }`}
            >
              {format(new Date(`${d}T12:00:00`), 'd MMM', { locale: tr })}: {entries.filter((e) => e.date === d).length}
            </button>
          ))}
        </div>
      )}

      {daysWithMeals.length > 0 && scheduleMode === 'weekly' && (
        <div className="flex flex-wrap gap-1.5">
          {daysWithMeals.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDay(d)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                d === selectedDay ? 'bg-sage-500 text-white' : 'bg-sage-100 text-sage-700'
              }`}
            >
              {WEEKDAYS.find((w) => w.value === d)?.label}: {entries.filter((e) => e.day === d && !e.date).length}
            </button>
          ))}
        </div>
      )}

      <button type="button" onClick={submit} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sage-500 py-3 text-sm font-semibold text-white hover:bg-sage-600">
        <Apple className="h-4 w-4" />
        Beslenme Listesini Gönder
      </button>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { format, addDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  Plus, Trash2, Pencil, X, Apple, CalendarDays, Coffee, Sun, Moon, Cookie,
  ArrowRight, Check, Send, Sparkles, Copy,
} from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import {
  MEAL_TYPES,
  mealLabel,
  CYCLE_PLAN_LENGTH,
  dedupeDailyNutritionEntries,
} from '../../utils/programSchedule'
import { getDateInputBounds } from '../../utils/programPackageScope'
import { WEEKDAYS } from '../package/supportScheduleConstants'

const STEPS = [
  { id: 1, label: 'Süre' },
  { id: 2, label: 'Liste' },
  { id: 3, label: 'Gönder' },
]

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

const SCHEDULE_OPTIONS = [
  { id: 'cycle14', label: '14 Günlük Liste' },
  { id: 'weekly', label: 'Güne özel (haftalık)' },
  { id: 'date', label: 'Tarihe özel' },
]

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

function entryToText(e, scheduleMode, cycleSameDaily = true) {
  const schedule = scheduleMode === 'cycle14' && cycleSameDaily
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

function isSameDailyCycle(mode, cycleSameDaily) {
  return mode === 'cycle14' && cycleSameDaily
}

function usesWeekdayPicker(mode, cycleSameDaily) {
  return mode === 'weekly' || (mode === 'cycle14' && !cycleSameDaily)
}

function WizardSteps({ step }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((s, i) => {
        const done = step > s.id
        const active = step === s.id
        return (
          <div key={s.id} className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${
                  active
                    ? 'bg-gradient-to-br from-sage-500 to-teal-500 text-white shadow-md shadow-sage-500/30'
                    : done
                      ? 'bg-teal-500 text-white'
                      : 'bg-cream-100 text-cream-800/45'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span className={`truncate text-[11px] font-semibold sm:text-xs ${active ? 'text-sage-700' : done ? 'text-teal-700' : 'text-cream-800/40'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mb-5 h-0.5 flex-1 rounded-full ${step > s.id ? 'bg-gradient-to-r from-sage-400 to-teal-400' : 'bg-cream-100'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function scopedEntries(entries, scheduleMode) {
  if (scheduleMode === 'date') {
    return entries.filter((e) => e.date)
  }
  return entries.filter((e) => e.day != null && !e.date && e.cycleDay == null)
}

export default function NutritionProgramBuilder({
  onCreate,
  onUpdate,
  initialData = null,
  packageRange,
  memberName = 'Danışan',
  submitLabel,
}) {
  const { toast } = useToast()
  const isEdit = Boolean(initialData) && typeof onUpdate === 'function'
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState(() => initialData?.title || '')
  const [description, setDescription] = useState(() => initialData?.description || '')
  const [entries, setEntries] = useState(() => (
    Array.isArray(initialData?.entries) ? initialData.entries : []
  ))
  const [scheduleMode, setScheduleMode] = useState(() => {
    const t = initialData?.scheduleType
    // Eski "everyday" listeleri 14 günlük günlük menü olarak açılır
    if (t === 'everyday') return 'cycle14'
    if (t === 'cycle14' || t === 'weekly' || t === 'date') return t
    if (Array.isArray(initialData?.entries) && initialData.entries.some((e) => e.date)) return 'date'
    return 'cycle14'
  })
  const [cycleSameDaily, setCycleSameDaily] = useState(() => {
    if (initialData?.scheduleType === 'cycle14' || initialData?.scheduleType === 'everyday') {
      return initialData?.cycleSameDaily !== false
    }
    return true
  })
  const [selectedDay, setSelectedDay] = useState(1)
  const [copyOpen, setCopyOpen] = useState(false)
  const [cycleStartDate, setCycleStartDate] = useState(() => (
    initialData?.cycleStartDate || format(new Date(), 'yyyy-MM-dd')
  ))
  const [selectedDate, setSelectedDate] = useState(() => {
    const dated = Array.isArray(initialData?.entries)
      ? initialData.entries.find((e) => e.date)?.date
      : null
    return dated || format(new Date(), 'yyyy-MM-dd')
  })
  const [mealType, setMealType] = useState('breakfast')
  const [draft, setDraft] = useState({ content: '', note: '', start: DEFAULT_MEAL_TIMES.breakfast })
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const dateBounds = useMemo(
    () => getDateInputBounds(packageRange, { cycleLength: CYCLE_PLAN_LENGTH }),
    [packageRange],
  )
  const singleDateBounds = useMemo(() => getDateInputBounds(packageRange), [packageRange])

  const cycleEndDate = useMemo(
    () => format(addDays(new Date(`${cycleStartDate}T12:00:00`), CYCLE_PLAN_LENGTH - 1), 'yyyy-MM-dd'),
    [cycleStartDate],
  )

  const sameDaily = isSameDailyCycle(scheduleMode, cycleSameDaily)
  const weekdayPicker = usesWeekdayPicker(scheduleMode, cycleSameDaily)

  const activeEntries = useMemo(() => {
    if (sameDaily) {
      return dedupeDailyNutritionEntries(entries.filter((e) => !e.date && e.cycleDay == null))
    }
    if (scheduleMode === 'date') {
      return sortEntries(entries.filter((e) => e.date === selectedDate))
    }
    return sortEntries(entries.filter((e) => e.day === selectedDay && !e.date))
  }, [entries, selectedDay, selectedDate, scheduleMode, sameDaily])

  const allScoped = useMemo(
    () => sortEntries(scopedEntries(entries, scheduleMode)),
    [entries, scheduleMode],
  )

  const displayEntries = useMemo(
    () => (sameDaily ? dedupeDailyNutritionEntries(allScoped) : allScoped),
    [allScoped, sameDaily],
  )

  const mealCount = displayEntries.length

  const datesWithMeals = useMemo(() => {
    const set = new Set(entries.filter((e) => e.date).map((e) => e.date))
    return Array.from(set).sort()
  }, [entries])

  const daysWithMeals = useMemo(() => {
    const set = new Set(entries.filter((e) => e.day != null && !e.date).map((e) => e.day))
    return WEEKDAYS.map((d) => d.value).filter((v) => set.has(v))
  }, [entries])

  const missingWeekdays = useMemo(() => {
    if (!(scheduleMode === 'cycle14' && !cycleSameDaily)) return []
    return WEEKDAYS.filter(
      (d) => !entries.some((e) => e.day === d.value && !e.date && e.cycleDay == null),
    )
  }, [scheduleMode, cycleSameDaily, entries])

  const canGoStep2 = useMemo(() => {
    if (scheduleMode === 'cycle14') {
      if (!cycleStartDate) return false
      if (dateBounds.min && cycleStartDate < dateBounds.min) return false
      if (dateBounds.max && cycleStartDate > dateBounds.max) return false
      return true
    }
    if (scheduleMode === 'date') {
      if (!selectedDate) return false
      if (singleDateBounds.min && selectedDate < singleDateBounds.min) return false
      if (singleDateBounds.max && selectedDate > singleDateBounds.max) return false
      return true
    }
    return true
  }, [scheduleMode, cycleStartDate, selectedDate, dateBounds, singleDateBounds])

  const canGoStep3 = scheduleMode === 'cycle14' && !cycleSameDaily
    ? missingWeekdays.length === 0
    : mealCount > 0

  const activeMeal = SELECTABLE_MEALS.find((m) => m.id === mealType) || SELECTABLE_MEALS[0]
  const activeUi = MEAL_UI[mealType] || MEAL_UI.breakfast
  const ActiveIcon = activeUi.icon

  const scheduleModeLabel = SCHEDULE_OPTIONS.find((m) => m.id === scheduleMode)?.label || ''

  const scheduleSummary = scheduleMode === 'cycle14'
    ? `${format(new Date(`${cycleStartDate}T12:00:00`), 'd MMM', { locale: tr })} — ${format(new Date(`${cycleEndDate}T12:00:00`), 'd MMM yyyy', { locale: tr })} · ${CYCLE_PLAN_LENGTH} gün${cycleSameDaily ? ' · her gün aynı' : ' · güne göre'}`
    : scheduleMode === 'date'
      ? format(new Date(`${selectedDate}T12:00:00`), 'd MMMM yyyy, EEEE', { locale: tr })
      : daysWithMeals.length
        ? `Haftalık · ${daysWithMeals.map((d) => WEEKDAYS.find((w) => w.value === d)?.label?.slice(0, 3)).join(', ')}`
        : 'Haftalık tekrar'

  const scheduleLabel = sameDaily
    ? `Günlük menü · ${CYCLE_PLAN_LENGTH} gün geçerli`
    : scheduleMode === 'date'
      ? format(new Date(`${selectedDate}T12:00:00`), 'd MMMM yyyy, EEEE', { locale: tr })
      : scheduleMode === 'cycle14'
        ? `${WEEKDAYS.find((d) => d.value === selectedDay)?.label || '—'} (14 gün içinde her hafta)`
        : `${WEEKDAYS.find((d) => d.value === selectedDay)?.label || '—'} (haftalık tekrar)`

  const selectMealType = (id) => {
    setMealType(id)
    if (!editingId) {
      setDraft((d) => ({ ...d, start: DEFAULT_MEAL_TIMES[id] || '08:00' }))
    }
  }

  const applyCycleSameDaily = (nextSameDaily) => {
    if (nextSameDaily === cycleSameDaily) return
    if (nextSameDaily) {
      // Güne göre → her gün aynı: seçili günün menüsünü 7 güne yay
      const sourceDay = entries.some((e) => e.day === selectedDay && !e.date)
        ? selectedDay
        : (entries.find((e) => e.day != null && !e.date)?.day ?? selectedDay)
      const template = dedupeDailyNutritionEntries(
        entries.filter((e) => e.day === sourceDay && !e.date && e.cycleDay == null),
      )
      const stamped = []
      template.forEach((e) => {
        for (let day = 0; day <= 6; day += 1) {
          stamped.push({
            ...e,
            id: `n-${Date.now()}-${day}-${Math.random().toString(36).slice(2, 6)}`,
            day,
          })
        }
      })
      setEntries((list) => [
        ...list.filter((e) => e.date || e.cycleDay != null),
        ...stamped,
      ])
    } else {
      // Her gün aynı → güne göre: mevcut tekil menüyü tüm günlere bırak (kullanıcı özelleştirir)
      // entries zaten day:0..6 ise dokunma
      const hasWeekday = entries.some((e) => e.day != null && !e.date)
      if (!hasWeekday) {
        const template = dedupeDailyNutritionEntries(entries.filter((e) => !e.date && e.cycleDay == null))
        const stamped = []
        template.forEach((e) => {
          for (let day = 0; day <= 6; day += 1) {
            stamped.push({
              ...e,
              id: `n-${Date.now()}-${day}-${Math.random().toString(36).slice(2, 6)}`,
              day,
            })
          }
        })
        setEntries((list) => [
          ...list.filter((e) => e.date || e.cycleDay != null),
          ...stamped,
        ])
      }
    }
    setCycleSameDaily(nextSameDaily)
    setCopyOpen(false)
  }

  const copySelectedDayTo = (targetDays) => {
    const source = entries.filter((e) => e.day === selectedDay && !e.date && e.cycleDay == null)
    if (!source.length) {
      toast('Önce bu güne öğün ekleyin', 'error')
      return
    }
    const targets = targetDays.filter((d) => d !== selectedDay)
    if (!targets.length) {
      toast('Kopyalanacak başka gün seçin', 'error')
      return
    }
    setEntries((list) => {
      let next = list.filter(
        (e) => !(targets.includes(e.day) && !e.date && e.cycleDay == null),
      )
      targets.forEach((day) => {
        source.forEach((e) => {
          next.push({
            ...e,
            id: `n-${Date.now()}-${day}-${Math.random().toString(36).slice(2, 6)}`,
            day,
          })
        })
      })
      return next
    })
    setCopyOpen(false)
    toast(`${WEEKDAYS.find((w) => w.value === selectedDay)?.label || 'Gün'} menüsü ${targets.length} güne kopyalandı`, 'success')
  }

  const buildEntry = (schedulePatch, id) => ({
    id: id || `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    mealType,
    name: draft.content.trim(),
    note: draft.note.trim(),
    exerciseName: draft.content.trim(),
    start: draft.start,
    ...schedulePatch,
  })

  const clearDraft = () => {
    setEditingId(null)
    setDraft({ content: '', note: '', start: DEFAULT_MEAL_TIMES[mealType] || '08:00' })
  }

  const startEdit = (entry) => {
    setEditingId(entry.id)
    setMealType(entry.mealType || 'breakfast')
    setDraft({
      content: entry.name || '',
      note: entry.note || '',
      start: entry.start || DEFAULT_MEAL_TIMES[entry.mealType] || '08:00',
    })
    if (entry.date) {
      setSelectedDate(entry.date)
    } else if (entry.day != null && !sameDaily) {
      setSelectedDay(Number(entry.day))
    }
  }

  const cancelEdit = () => {
    clearDraft()
    toast('Düzenleme iptal edildi', 'info')
  }

  const saveEntry = () => {
    if (!draft.content.trim()) {
      toast('Öğün içeriği girin', 'error')
      return
    }

    if (editingId) {
      setEntries((list) => {
        const target = list.find((e) => e.id === editingId)
        if (!target) return list

        const patch = {
          mealType,
          name: draft.content.trim(),
          note: draft.note.trim(),
          exerciseName: draft.content.trim(),
          start: draft.start,
        }

        if (sameDaily) {
          const oldKey = `${target.mealType}:${target.start}:${target.name}`
          return list.map((e) => (
            `${e.mealType}:${e.start}:${e.name}` === oldKey ? { ...e, ...patch } : e
          ))
        }

        const updated = { ...target, ...patch }
        const newKey = entryKey(updated)
        return [
          ...list.filter((e) => e.id !== editingId && entryKey(e) !== newKey),
          updated,
        ]
      })
      clearDraft()
      toast('Öğün güncellendi', 'success')
      return
    }

    setEntries((list) => {
      let next = [...list]
      const upsert = (patch) => {
        const key = entryKey({ ...patch, mealType, start: draft.start })
        next = next.filter((e) => entryKey(e) !== key)
        next.push(buildEntry(patch))
      }

      if (sameDaily) {
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
      if (!target || !sameDaily) {
        return list.filter((e) => e.id !== id)
      }
      const key = `${target.mealType}:${target.start}:${target.name}`
      return list.filter((e) => `${e.mealType}:${e.start}:${e.name}` !== key)
    })
    if (editingId === id) clearDraft()
  }

  const goStep2 = () => {
    if (!canGoStep2) {
      toast('Geçerli bir zamanlama seçin', 'error')
      return
    }
    setStep(2)
  }

  const goStep3 = () => {
    if (scheduleMode === 'cycle14' && !cycleSameDaily && missingWeekdays.length > 0) {
      toast(`Tüm günlere öğün ekleyin: ${missingWeekdays.map((d) => d.label).join(', ')}`, 'error')
      return
    }
    if (!canGoStep3) {
      toast('En az bir öğün ekleyin', 'error')
      return
    }
    clearDraft()
    setCopyOpen(false)
    setStep(3)
  }

  const submit = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      toast('Liste başlığı girin', 'error')
      return
    }
    const scoped = scopedEntries(entries, scheduleMode)
    if (scoped.length === 0) {
      toast('En az bir öğün ekleyin', 'error')
      return
    }
    if (scheduleMode === 'cycle14' && !cycleSameDaily) {
      const missing = WEEKDAYS.filter(
        (d) => !scoped.some((e) => e.day === d.value),
      )
      if (missing.length) {
        toast(`Tüm günlere öğün ekleyin: ${missing.map((d) => d.label).join(', ')}`, 'error')
        return
      }
    }

    const ordered = sortEntries(scoped)
    const forItems = sameDaily
      ? dedupeDailyNutritionEntries(ordered)
      : ordered

    const payload = {
      title: trimmedTitle,
      description: description.trim(),
      entries: ordered,
      items: forItems.map((e) => entryToText(e, scheduleMode, cycleSameDaily)),
    }

    if (scheduleMode === 'cycle14') {
      payload.scheduleType = 'cycle14'
      payload.cycleStartDate = cycleStartDate
      payload.cycleLength = CYCLE_PLAN_LENGTH
      payload.cycleLoop = false
      payload.cycleSameDaily = cycleSameDaily
    } else if (scheduleMode === 'weekly') {
      payload.scheduleType = 'weekly'
    } else if (scheduleMode === 'date') {
      payload.scheduleType = 'date'
    }

    if (isEdit) {
      setSubmitting(true)
      try {
        await onUpdate(payload)
      } finally {
        setSubmitting(false)
      }
      return
    }

    setSubmitting(true)
    try {
      await onCreate?.(payload)
      setTitle('')
      setDescription('')
      setEntries([])
      setCycleSameDaily(true)
      setStep(1)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`space-y-6 ${step === 2 ? 'pb-28' : ''}`}>
      <div className="rounded-3xl border border-cream-100 bg-white p-4 shadow-sm sm:p-5">
        <WizardSteps step={step} />
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-sage-100 bg-gradient-to-br from-sage-50 via-white to-teal-50/40 p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-lg font-bold text-cream-900">
                  <Sparkles className="h-5 w-5 text-sage-500" /> Liste süresi
                </p>
                <p className="mt-1 text-sm text-cream-800/60">
                  Zamanlama seçin — tarihler paket penceresi içinde kalmalıdır
                </p>
              </div>
              {packageRange && (
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-cream-800/70 ring-1 ring-cream-100">
                  Paket: {packageRange.start}{packageRange.end ? ` — ${packageRange.end}` : ' (süresiz)'}
                </span>
              )}
            </div>

            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-cream-900">Zamanlama</p>
              <div className="grid grid-cols-1 gap-2 rounded-2xl bg-white/70 p-1.5 sm:grid-cols-3">
                {SCHEDULE_OPTIONS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setScheduleMode(m.id)}
                    className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                      scheduleMode === m.id ? 'bg-sage-500 text-white shadow' : 'text-cream-800/70 hover:bg-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              {scheduleMode === 'cycle14' ? (
                <div className="space-y-4 rounded-2xl border border-sage-200 bg-white/80 p-5">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sage-700">Menü tipi</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => applyCycleSameDaily(true)}
                        className={`rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                          cycleSameDaily
                            ? 'bg-sage-500 text-white shadow'
                            : 'border border-cream-200 bg-white text-cream-800/70 hover:border-sage-200'
                        }`}
                      >
                        Her gün aynı
                        <span className={`mt-0.5 block text-xs font-medium ${cycleSameDaily ? 'text-white/80' : 'text-cream-800/45'}`}>
                          14 gün boyunca tek menü
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyCycleSameDaily(false)}
                        className={`rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                          !cycleSameDaily
                            ? 'bg-sage-500 text-white shadow'
                            : 'border border-cream-200 bg-white text-cream-800/70 hover:border-sage-200'
                        }`}
                      >
                        Güne göre
                        <span className={`mt-0.5 block text-xs font-medium ${!cycleSameDaily ? 'text-white/80' : 'text-cream-800/45'}`}>
                          Her Pzt / Salı / … ayrı menü
                        </span>
                      </button>
                    </div>
                  </div>
                  <div>
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
                      className="mt-3 w-full max-w-sm rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm"
                    />
                    <p className="mt-3 text-sm leading-relaxed text-sage-800/70">
                      {cycleSameDaily ? (
                        <><strong>Her gün aynı menü</strong>{' '}</>
                      ) : (
                        <><strong>Haftanın gününe göre</strong> (ör. her Pazartesi aynı){' '}</>
                      )}
                      {format(new Date(`${cycleStartDate}T12:00:00`), 'd MMMM', { locale: tr })}
                      {' — '}
                      {format(new Date(`${cycleEndDate}T12:00:00`), 'd MMMM yyyy', { locale: tr })}
                      {' '}tarihleri arasında geçerli ({CYCLE_PLAN_LENGTH} gün).
                    </p>
                  </div>
                </div>
              ) : scheduleMode === 'date' ? (
                <div className="rounded-2xl border border-sage-200 bg-white/80 p-5">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sage-700">
                    <CalendarDays className="h-3.5 w-3.5" />
                    İlk tarih (adım 2&apos;de başka tarihler de ekleyebilirsiniz)
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={singleDateBounds.min}
                    max={singleDateBounds.max}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="mt-3 w-full max-w-sm rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm"
                  />
                </div>
              ) : (
                <p className="rounded-2xl border border-sage-100 bg-white/80 px-4 py-3 text-sm text-sage-800">
                  Sonraki adımda haftanın günlerine özel öğünler ekleyeceksiniz. Aynı gün her hafta tekrarlanır.
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={goStep2}
            disabled={!canGoStep2}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sage-500 via-teal-500 to-sage-600 py-4 text-base font-bold text-white shadow-lg shadow-sage-500/25 disabled:opacity-45"
          >
            İleri — Liste hazırla <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {weekdayPicker && (
            <div className="rounded-2xl border border-cream-100 bg-white p-2.5 shadow-sm sm:p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-cream-800/45">Gün seç</p>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCopyOpen((o) => !o)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sage-200 bg-sage-50 px-2.5 py-1.5 text-xs font-semibold text-sage-700 hover:bg-sage-100"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Kopyala
                  </button>
                  {copyOpen && (
                    <div className="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-cream-200 bg-white p-2 shadow-lg">
                      <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-cream-800/45">
                        Seçili günü kopyala
                      </p>
                      <button
                        type="button"
                        onClick={() => copySelectedDayTo(WEEKDAYS.map((d) => d.value))}
                        className="w-full rounded-lg px-2 py-2 text-left text-xs font-semibold text-cream-900 hover:bg-sage-50"
                      >
                        Tüm günlere kopyala
                      </button>
                      {WEEKDAYS.filter((d) => d.value !== selectedDay).map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => copySelectedDayTo([d.value])}
                          className="w-full rounded-lg px-2 py-2 text-left text-xs font-medium text-cream-800/80 hover:bg-sage-50"
                        >
                          → {d.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {WEEKDAYS.map((d) => {
                  const count = entries.filter((e) => e.day === d.value && !e.date).length
                  const missing = scheduleMode === 'cycle14' && !cycleSameDaily && count === 0
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => { setSelectedDay(d.value); setCopyOpen(false) }}
                      className={`flex flex-col items-center rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                        selectedDay === d.value
                          ? 'bg-sage-500 text-white shadow-md'
                          : missing
                            ? 'border border-amber-300 bg-amber-50 text-amber-800'
                            : 'border border-cream-200 bg-white text-cream-800/70 hover:border-sage-200 hover:bg-sage-50'
                      }`}
                    >
                      <span className="text-base">{d.label.slice(0, 3)}</span>
                      <span className={`mt-1 text-xs ${selectedDay === d.value ? 'text-white/80' : missing ? 'text-amber-700/80' : 'text-cream-800/45'}`}>
                        {count > 0 ? `${count} öğün` : 'boş'}
                      </span>
                    </button>
                  )
                })}
              </div>
              {scheduleMode === 'cycle14' && !cycleSameDaily && missingWeekdays.length > 0 && (
                <p className="mt-2 px-1 text-xs text-amber-700">
                  Eksik günler: {missingWeekdays.map((d) => d.label).join(', ')}
                </p>
              )}
            </div>
          )}

          {scheduleMode === 'date' && (
            <div className="rounded-2xl border border-sage-100 bg-white p-4 shadow-sm">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sage-700">
                <CalendarDays className="h-3.5 w-3.5" />
                Tarih seç
              </label>
              <input
                type="date"
                value={selectedDate}
                min={singleDateBounds.min}
                max={singleDateBounds.max}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-3 w-full max-w-sm rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm"
              />
              {datesWithMeals.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {datesWithMeals.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                        d === selectedDate ? 'bg-sage-500 text-white' : 'bg-sage-100 text-sage-700'
                      }`}
                    >
                      {format(new Date(`${d}T12:00:00`), 'd MMM', { locale: tr })}: {entries.filter((e) => e.date === d).length}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {daysWithMeals.length > 0 && weekdayPicker && (
            <div className="flex flex-wrap gap-2">
              {daysWithMeals.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDay(d)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    d === selectedDay ? 'bg-sage-500 text-white' : 'bg-sage-100 text-sage-700'
                  }`}
                >
                  {WEEKDAYS.find((w) => w.value === d)?.label}: {entries.filter((e) => e.day === d && !e.date).length}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-5 lg:items-start">
            <div className="order-2 min-h-0 rounded-2xl border border-cream-200 bg-cream-50/30 p-4 sm:p-5 lg:order-1 lg:max-h-[min(70vh,720px)] lg:overflow-y-auto lg:overscroll-contain">
              <p className="mb-4 text-base font-bold text-cream-900">
                {scheduleLabel}
                <span className="ml-2 text-sm font-medium text-cream-800/50">· {activeEntries.length} öğün</span>
              </p>
              {activeEntries.length === 0 ? (
                <p className="py-10 text-center text-sm text-cream-800/40 lg:py-16">
                  Öğün ekleyin — formdan başlayın
                </p>
              ) : (
                <div className="space-y-3">
                  {activeEntries.map((e) => {
                    const ui = MEAL_UI[e.mealType] || MEAL_UI.breakfast
                    const Icon = ui.icon
                    const isEditing = editingId === e.id
                    return (
                      <div
                        key={e.id}
                        className={`rounded-2xl border px-4 py-4 ring-1 ${ui.accent} ${isEditing ? 'ring-2 ring-sage-400' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ui.btn} text-white`}>
                              <Icon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-bold text-cream-900">{mealLabel(e.mealType)}</p>
                                {e.start && (
                                  <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-cream-800/70">
                                    {e.start}
                                  </span>
                                )}
                                {isEditing && (
                                  <span className="rounded-full bg-sage-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                    Düzenleniyor
                                  </span>
                                )}
                              </div>
                              <p className="mt-1.5 text-sm leading-relaxed text-cream-800">{e.name}</p>
                              {e.note && <p className="mt-1 text-xs text-cream-800/55">Not: {e.note}</p>}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(e)}
                              className="rounded-lg p-2 text-cream-800/50 hover:bg-white/80 hover:text-sage-700"
                              aria-label="Öğünü düzenle"
                              title="Düzenle"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeEntry(e.id)}
                              className="rounded-lg p-2 text-red-400 hover:bg-white/80 hover:text-red-600"
                              aria-label="Öğünü sil"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="order-1 min-w-0 rounded-2xl border border-sage-100 bg-white p-4 shadow-sm sm:p-5 lg:order-2 lg:sticky lg:top-4">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="text-base font-bold text-sage-800">
                  {editingId ? 'Öğünü düzenle' : 'Öğün ekle'}
                </p>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-cream-800/60 hover:bg-cream-50 hover:text-cream-900"
                  >
                    <X className="h-3.5 w-3.5" /> İptal
                  </button>
                )}
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SELECTABLE_MEALS.map((m) => {
                  const ui = MEAL_UI[m.id] || MEAL_UI.breakfast
                  const Icon = ui.icon
                  const selected = mealType === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => selectMealType(m.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-xs font-semibold transition sm:text-sm ${
                        selected ? `${ui.btn} border-transparent text-white shadow-sm` : 'border-cream-200 bg-cream-50 text-cream-800/70 hover:bg-white'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="leading-tight">{m.short}</span>
                    </button>
                  )
                })}
              </div>

              <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 ring-1 ${activeUi.accent}`}>
                <ActiveIcon className="h-5 w-5 shrink-0" />
                <span className="text-base font-semibold">{activeMeal.label}</span>
              </div>

              <label className="mb-1.5 block text-sm font-medium text-cream-800/60">Öğün saati</label>
              <select
                value={draft.start}
                onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                className="mb-4 w-full rounded-xl border border-cream-200 px-4 py-3 text-sm"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <label className="mb-1.5 block text-sm font-medium text-cream-800/60">Öğün içeriği</label>
              <textarea
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                placeholder="Örn. Yulaf lapası, muz, 10 badem, yeşil çay"
                rows={4}
                className="mb-3 w-full rounded-xl border border-cream-200 px-4 py-3 text-sm"
              />
              <input
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                placeholder="Dikkat edilecekler (opsiyonel)"
                className="mb-4 w-full rounded-xl border border-cream-200 px-4 py-3 text-sm"
              />
              <button
                type="button"
                onClick={saveEntry}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white ${activeUi.btn}`}
              >
                {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? `${mealLabel(mealType)} Güncelle` : `${mealLabel(mealType)} Ekle`}
              </button>
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-white/95 px-3 pt-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto flex max-w-4xl gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm font-semibold text-cream-800"
              >
                Geri
              </button>
              <div className="hidden flex-1 items-center justify-center text-xs font-medium text-cream-800/55 sm:flex">
                {mealCount} öğün · {scheduleModeLabel}
              </div>
              <button
                type="button"
                onClick={goStep3}
                disabled={!canGoStep3}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sage-500 to-teal-500 py-3 text-sm font-bold text-white disabled:opacity-45 sm:flex-none sm:px-8"
              >
                Önizlemeye geç <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-sage-500 via-teal-500 to-sage-600 p-5 text-white shadow-lg shadow-sage-500/20">
            <label className="block text-xs font-semibold uppercase tracking-wide text-white/80">
              Liste başlığı
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${memberName} için beslenme listesi`}
              className="mt-2 w-full rounded-xl border border-white/35 bg-white/95 px-4 py-3 text-base font-semibold text-cream-900 placeholder:text-cream-800/40 outline-none focus:border-white focus:ring-2 focus:ring-white/40"
            />
          </div>

          <div className="overflow-hidden rounded-3xl border border-cream-100 bg-white shadow-sm">
            <div className="border-b border-cream-100 bg-gradient-to-r from-cream-50/80 to-white px-5 py-4">
              <p className="text-sm font-bold text-cream-900">Liste özeti</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-cream-800/65">
                <span>{scheduleModeLabel}</span>
                <span>{scheduleSummary}</span>
                <span>{mealCount} öğün</span>
              </div>
            </div>

            <div className="divide-y divide-cream-100">
              {weekdayPicker ? (
                daysWithMeals.map((day) => {
                  const dayEntries = sortEntries(allScoped.filter((e) => e.day === day))
                  return (
                    <div key={day} className="px-5 py-4">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="rounded-lg bg-sage-100 px-2.5 py-1 text-xs font-bold text-sage-800 ring-1 ring-sage-200">
                          {WEEKDAYS.find((w) => w.value === day)?.label || 'Gün'}
                        </span>
                        <span className="text-xs text-cream-800/50">{dayEntries.length} öğün</span>
                      </div>
                      <ol className="space-y-2">
                        {dayEntries.map((entry, idx) => {
                          const ui = MEAL_UI[entry.mealType] || MEAL_UI.breakfast
                          return (
                            <li key={entry.id} className="flex gap-3 text-sm">
                              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${ui.btn}`}>
                                {idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-cream-900">
                                  {mealLabel(entry.mealType)}
                                  {entry.start ? ` · ${entry.start}` : ''}
                                </p>
                                <p className="mt-0.5 text-xs text-cream-800/60">
                                  {entry.name}
                                  {entry.note ? ` · ${entry.note}` : ''}
                                </p>
                              </div>
                            </li>
                          )
                        })}
                      </ol>
                    </div>
                  )
                })
              ) : scheduleMode === 'date' ? (
                datesWithMeals.map((date) => {
                  const dateEntries = sortEntries(allScoped.filter((e) => e.date === date))
                  return (
                    <div key={date} className="px-5 py-4">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="rounded-lg bg-sage-100 px-2.5 py-1 text-xs font-bold text-sage-800 ring-1 ring-sage-200">
                          {format(new Date(`${date}T12:00:00`), 'd MMMM yyyy, EEEE', { locale: tr })}
                        </span>
                        <span className="text-xs text-cream-800/50">{dateEntries.length} öğün</span>
                      </div>
                      <ol className="space-y-2">
                        {dateEntries.map((entry, idx) => {
                          const ui = MEAL_UI[entry.mealType] || MEAL_UI.breakfast
                          return (
                            <li key={entry.id} className="flex gap-3 text-sm">
                              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${ui.btn}`}>
                                {idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-cream-900">
                                  {mealLabel(entry.mealType)}
                                  {entry.start ? ` · ${entry.start}` : ''}
                                </p>
                                <p className="mt-0.5 text-xs text-cream-800/60">
                                  {entry.name}
                                  {entry.note ? ` · ${entry.note}` : ''}
                                </p>
                              </div>
                            </li>
                          )
                        })}
                      </ol>
                    </div>
                  )
                })
              ) : (
                <div className="px-5 py-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-lg bg-sage-100 px-2.5 py-1 text-xs font-bold text-sage-800 ring-1 ring-sage-200">
                      Günlük menü
                    </span>
                    <span className="text-xs text-cream-800/50">{displayEntries.length} öğün</span>
                  </div>
                  <ol className="space-y-2">
                    {displayEntries.map((entry, idx) => {
                      const ui = MEAL_UI[entry.mealType] || MEAL_UI.breakfast
                      return (
                        <li key={entry.id || `${entry.mealType}-${idx}`} className="flex gap-3 text-sm">
                          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${ui.btn}`}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-cream-900">
                              {mealLabel(entry.mealType)}
                              {entry.start ? ` · ${entry.start}` : ''}
                            </p>
                            <p className="mt-0.5 text-xs text-cream-800/60">
                              {entry.name}
                              {entry.note ? ` · ${entry.note}` : ''}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              )}
            </div>
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Son notlar (su tüketimi, alerjiler vb.)"
            rows={3}
            className="w-full rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm outline-none focus:border-sage-300"
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-2xl border border-cream-200 bg-white px-5 py-3.5 text-sm font-semibold text-cream-800 sm:w-auto"
            >
              Geri
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sage-500 via-teal-500 to-sage-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-sage-500/25 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {submitting
                ? 'Gönderiliyor…'
                : (submitLabel || (isEdit ? 'Beslenme Listesini Kaydet' : 'Beslenme Listesini Gönder'))}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Dumbbell, Plus, Check, Trash2, Send, ShoppingBag, Loader2, PlayCircle,
  ChevronUp, ChevronDown, Minus, Copy, CalendarDays, Eraser, AlertTriangle, Sparkles,
} from 'lucide-react'
import { format, addDays, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import Modal from '../ui/Modal'
import VideoPlayer from '../ui/VideoPlayer'
import ExerciseVideoThumbnail from '../library/ExerciseVideoThumbnail'
import { useToast } from '../../context/ToastContext'
import { useExerciseLibrary } from '../../hooks/useExerciseLibrary'
import ExercisePagination from '../library/ExercisePagination'
import ExerciseLibraryFilters, { DIFFICULTY_ALL, EXERCISE_CATEGORY_ALL, FILTER_ALL } from '../library/ExerciseLibraryFilters'
import { DIFFICULTY_LABELS, formatExerciseLocations } from '../../data/exerciseTurkish'
import CoachApplySameProgramModal from './CoachApplySameProgramModal'
import {
  memberHasWorkoutAvailability,
  getWorkoutWeekdays,
  summarizeRangeAvailability,
  formatRangeSummary,
  cycleLengthFromRange,
} from '../../utils/memberAvailability'
import AvailabilityView from '../package/AvailabilityView'
import {
  findEntriesOutsidePackage,
  getMemberPackageDateRange,
  getPackageWindowsForProgramType,
  getDateInputBounds,
  isDateInPackageWindows,
  memberHasProgramTypePackage,
} from '../../utils/programPackageScope'
import { AVAILABILITY_WEEKDAYS } from '../../services/availability'
import { prefetchExerciseVideo } from '../../utils/exerciseVideoPrefetch'
import { CYCLE_PLAN_LENGTH } from '../../utils/programSchedule'
import {
  DEFAULT_SESSION_TIME,
  buildWeeklyCoachProgramPayload,
  buildCoachProgramTitle,
  cloneCartEntries,
  countDayCartExercises,
  filledWeekdaysFromDayCarts,
  hydrateDayCartsFromEntries,
  weekdayFullLabel,
  weekdayShortLabel,
} from '../../utils/coachProgram'

const STEPS = [
  { id: 1, label: 'Süre' },
  { id: 2, label: 'Günler' },
  { id: 3, label: 'Gönder' },
]

const DAY_UI = {
  1: { accent: 'bg-sky-50 text-sky-800 ring-sky-200', btn: 'bg-sky-500 hover:bg-sky-600', soft: 'from-sky-50 to-white', border: 'border-sky-200', chip: 'bg-sky-100 text-sky-800' },
  2: { accent: 'bg-teal-50 text-teal-800 ring-teal-200', btn: 'bg-teal-500 hover:bg-teal-600', soft: 'from-teal-50 to-white', border: 'border-teal-200', chip: 'bg-teal-100 text-teal-800' },
  3: { accent: 'bg-brand-50 text-brand-800 ring-brand-200', btn: 'bg-brand-500 hover:bg-brand-600', soft: 'from-brand-50 to-white', border: 'border-brand-200', chip: 'bg-brand-100 text-brand-800' },
  4: { accent: 'bg-sky-50 text-sky-900 ring-sky-200', btn: 'bg-sky-600 hover:bg-sky-700', soft: 'from-sky-50/80 to-white', border: 'border-sky-200', chip: 'bg-sky-100 text-sky-900' },
  5: { accent: 'bg-teal-50 text-teal-900 ring-teal-200', btn: 'bg-teal-600 hover:bg-teal-700', soft: 'from-teal-50/80 to-white', border: 'border-teal-200', chip: 'bg-teal-100 text-teal-900' },
  6: { accent: 'bg-brand-50 text-brand-900 ring-brand-200', btn: 'bg-brand-600 hover:bg-brand-700', soft: 'from-brand-50/80 to-white', border: 'border-brand-200', chip: 'bg-brand-100 text-brand-900' },
  0: { accent: 'bg-sky-50 text-sky-800 ring-sky-200', btn: 'bg-sky-500 hover:bg-sky-600', soft: 'from-sky-50 to-white', border: 'border-sky-200', chip: 'bg-sky-100 text-sky-800' },
}

function dayUi(day) {
  return DAY_UI[Number(day)] || DAY_UI[3]
}

function createCartEntry(ex) {
  return {
    id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    exerciseId: ex.id,
    exerciseName: ex.name,
    videoUrl: ex.videoUrl || '',
    videoPending: Boolean(ex.videoPending),
    description: ex.description || '',
    amountType: 'reps',
    amount: 12,
    durationUnit: 'sn',
    note: '',
  }
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
                    ? 'bg-gradient-to-br from-brand-500 to-sky-500 text-white shadow-md shadow-brand-500/30'
                    : done
                      ? 'bg-teal-500 text-white'
                      : 'bg-cream-100 text-cream-800/45'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span className={`truncate text-[11px] font-semibold sm:text-xs ${active ? 'text-brand-700' : done ? 'text-teal-700' : 'text-cream-800/40'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mb-5 h-0.5 flex-1 rounded-full ${step > s.id ? 'bg-gradient-to-r from-brand-400 to-teal-400' : 'bg-cream-100'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function CartEntryCard({ entry, index, isFirst, isLast, onPatch, onRemove, onMove, onPreview, ui }) {
  const iconBtn = 'flex h-9 w-9 items-center justify-center rounded-lg transition active:scale-95 sm:h-8 sm:w-8'
  const hasVideo = Boolean(entry.videoUrl || entry.videoPending)
  const tone = ui || dayUi(3)
  return (
    <div className={`overflow-hidden rounded-2xl border px-1 py-1 shadow-sm ring-1 ${tone.accent}`}>
      <div className="flex gap-3 p-3">
        <button
          type="button"
          disabled={!hasVideo}
          onClick={() => hasVideo && onPreview?.(entry)}
          onPointerEnter={() => hasVideo && prefetchExerciseVideo(entry.videoUrl)}
          onPointerDown={() => hasVideo && prefetchExerciseVideo(entry.videoUrl)}
          className={`relative shrink-0 ${hasVideo ? 'cursor-pointer' : 'cursor-default'}`}
          aria-label={hasVideo ? 'Videoyu önizle' : undefined}
        >
          <ExerciseVideoThumbnail url={entry.videoUrl} videoPending={entry.videoPending} size="list" accent="brand" fallbackIcon={Dumbbell} />
          <span className={`absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white ${tone.btn}`}>
            {index + 1}
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            <p className="min-w-0 flex-1 text-sm font-bold leading-snug text-cream-900">{entry.exerciseName}</p>
            <div className="flex shrink-0 items-center">
              <button type="button" onClick={() => onMove(entry.id, -1)} disabled={isFirst} className={`${iconBtn} text-cream-800/40 hover:bg-white/80 disabled:opacity-20`} aria-label="Yukarı">
                <ChevronUp className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => onMove(entry.id, 1)} disabled={isLast} className={`${iconBtn} text-cream-800/40 hover:bg-white/80 disabled:opacity-20`} aria-label="Aşağı">
                <ChevronDown className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => onRemove(entry.id)} className={`${iconBtn} text-red-400 hover:bg-white/80 hover:text-red-600`} aria-label="Çıkar">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <div className="flex rounded-lg bg-white/70 p-0.5">
              {[
                { id: 'reps', label: 'Tekrar' },
                { id: 'duration', label: 'Süre' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onPatch(entry.id, { amountType: m.id })}
                  className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${entry.amountType === m.id ? 'bg-white text-cream-900 shadow-sm' : 'text-cream-800/50'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex items-center overflow-hidden rounded-lg border border-white/80 bg-white">
              <button type="button" onClick={() => onPatch(entry.id, { amount: Math.max(1, (Number(entry.amount) || 1) - 1) })} className="flex h-8 w-8 items-center justify-center text-cream-800/55" aria-label="Azalt">
                <Minus className="h-3 w-3" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={entry.amount}
                onChange={(ev) => onPatch(entry.id, { amount: Number(ev.target.value) || 1 })}
                className="h-8 w-10 border-x border-cream-100 text-center text-sm font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button type="button" onClick={() => onPatch(entry.id, { amount: (Number(entry.amount) || 0) + 1 })} className="flex h-8 w-8 items-center justify-center text-cream-800/55" aria-label="Artır">
                <Plus className="h-3 w-3" />
              </button>
            </div>
            {entry.amountType === 'duration' ? (
              <div className="flex rounded-lg bg-white/70 p-0.5">
                {['sn', 'dk'].map((u) => (
                  <button key={u} type="button" onClick={() => onPatch(entry.id, { durationUnit: u })} className={`rounded-md px-2 py-1.5 text-[11px] font-semibold ${entry.durationUnit === u ? 'bg-white text-cream-900 shadow-sm' : 'text-cream-800/50'}`}>
                    {u}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-[11px] text-cream-800/45">tekrar</span>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-white/60 px-3 pb-3 pt-2">
        <input
          value={entry.note}
          onChange={(ev) => onPatch(entry.id, { note: ev.target.value })}
          placeholder="Not ekle (ör. 3 set)"
          className="w-full rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-sm outline-none focus:border-cream-300"
        />
      </div>
    </div>
  )
}

function CartList({ cart, onPatch, onRemove, onMove, onPreview, className = '', ui }) {
  const tone = ui || dayUi(3)
  if (!cart.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <span className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white ${tone.btn}`}>
          <Dumbbell className="h-6 w-6" />
        </span>
        <p className="text-base font-semibold text-cream-900">Bu gün boş</p>
        <p className="text-sm text-cream-800/50">Kütüphaneden hareket ekleyin</p>
      </div>
    )
  }
  return (
    <div className={`space-y-3 ${className}`}>
      {cart.map((e, idx) => (
        <CartEntryCard key={e.id} entry={e} index={idx} isFirst={idx === 0} isLast={idx === cart.length - 1} onPatch={onPatch} onRemove={onRemove} onMove={onMove} onPreview={onPreview} ui={tone} />
      ))}
    </div>
  )
}

function clampRangeToBounds(start, end, bounds) {
  let s = start
  let e = end
  if (bounds?.min && s < bounds.min) s = bounds.min
  if (bounds?.max && s > bounds.max) s = bounds.max
  if (bounds?.max && e > bounds.max) e = bounds.max
  if (e < s) e = s
  return { start: s, end: e }
}

/**
 * Koç haftalık program wizard’ı (oluştur / düzenle).
 * onSubmit(payload) → truthy başarı; create/update çağıran taraf yapar.
 */
export default function CoachProgramEditor({
  member,
  initialProgram = null,
  onSubmit,
  backTo = '/staff/clients',
  backLabel = 'Danışanlarım',
  submitLabel = 'Programı Gönder',
  submittingLabel = 'Gönderiliyor…',
  titleSuffix = 'Antrenman programı · haftalık şablon',
  relaxAvailability = false,
}) {
  const { toast } = useToast()
  const isEdit = Boolean(initialProgram)
  const [step, setStep] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [category, setCategory] = useState(EXERCISE_CATEGORY_ALL)
  const [difficulty, setDifficulty] = useState(DIFFICULTY_ALL)
  const [location, setLocation] = useState(FILTER_ALL)
  const [requiresMachine, setRequiresMachine] = useState(FILTER_ALL)
  const [dayCarts, setDayCarts] = useState(() => (
    initialProgram ? hydrateDayCartsFromEntries(initialProgram.entries || []) : {}
  ))
  const [selectedDay, setSelectedDay] = useState(null)
  const [dateMode, setDateMode] = useState(() => {
    if (!initialProgram) return 'fixed14'
    const len = Number(initialProgram.cycleLength) || CYCLE_PLAN_LENGTH
    return len === CYCLE_PLAN_LENGTH ? 'fixed14' : 'custom'
  })
  const [rangeStart, setRangeStart] = useState(() => (
    initialProgram?.cycleStartDate || format(new Date(), 'yyyy-MM-dd')
  ))
  const [rangeEnd, setRangeEnd] = useState(() => {
    if (initialProgram?.cycleStartDate && initialProgram?.cycleLength) {
      return format(
        addDays(parseISO(`${initialProgram.cycleStartDate}T12:00:00`), (Number(initialProgram.cycleLength) || 1) - 1),
        'yyyy-MM-dd',
      )
    }
    return format(addDays(new Date(), CYCLE_PLAN_LENGTH - 1), 'yyyy-MM-dd')
  })
  const [cartOpen, setCartOpen] = useState(false)
  const [applySameOpen, setApplySameOpen] = useState(false)
  const [copyTargetOpen, setCopyTargetOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeExercise, setActiveExercise] = useState(null)
  const [rangeReady, setRangeReady] = useState(Boolean(initialProgram))
  const [description, setDescription] = useState(initialProgram?.description || '')

  const {
    items: filteredExercisesList,
    total,
    page,
    totalPages,
    loading,
    setSearch,
    setCategory: setCategoryFilter,
    setDifficulty: setDifficultyFilter,
    setLocation: setLocationFilter,
    setRequiresMachine: setRequiresMachineFilter,
    setPage,
  } = useExerciseLibrary({ pageSize: 20 })

  const packageRange = useMemo(
    () => (member ? getMemberPackageDateRange(member, 'workout') : null),
    [member],
  )
  const dateBounds = useMemo(
    () => getDateInputBounds(packageRange, { cycleLength: dateMode === 'fixed14' ? CYCLE_PLAN_LENGTH : 0 }),
    [packageRange, dateMode],
  )
  const customBounds = useMemo(() => getDateInputBounds(packageRange), [packageRange])
  const fixedEndDate = useMemo(
    () => format(addDays(parseISO(`${rangeStart}T12:00:00`), CYCLE_PLAN_LENGTH - 1), 'yyyy-MM-dd'),
    [rangeStart],
  )
  const activeStart = rangeStart
  const activeEnd = dateMode === 'fixed14' ? fixedEndDate : rangeEnd

  const memberWeekdays = useMemo(() => getWorkoutWeekdays(member?.availability), [member?.availability])
  const workoutWeekdays = useMemo(() => {
    if (memberWeekdays.length) return memberWeekdays
    if (relaxAvailability || isEdit) {
      const fromCarts = filledWeekdaysFromDayCarts(dayCarts)
      if (fromCarts.length) return fromCarts
      return AVAILABILITY_WEEKDAYS.map((d) => d.value)
    }
    return memberWeekdays
  }, [memberWeekdays, relaxAvailability, isEdit, dayCarts])

  const orderedWorkoutDays = useMemo(
    () => AVAILABILITY_WEEKDAYS.filter((d) => workoutWeekdays.includes(d.value)),
    [workoutWeekdays],
  )
  const hasAvailability = memberHasWorkoutAvailability(member?.availability) || ((relaxAvailability || isEdit) && workoutWeekdays.length > 0)

  useEffect(() => {
    if (!member || rangeReady) return
    const bounds = getDateInputBounds(packageRange, { cycleLength: CYCLE_PLAN_LENGTH })
    const start = bounds.min
    const end = format(addDays(parseISO(`${start}T12:00:00`), CYCLE_PLAN_LENGTH - 1), 'yyyy-MM-dd')
    const customEnd = packageRange?.end && packageRange.end >= start
      ? packageRange.end
      : getDateInputBounds(packageRange).max
    setRangeStart(start)
    setRangeEnd(customEnd >= start ? customEnd : end)
    setRangeReady(true)
  }, [member, packageRange, rangeReady])

  useEffect(() => {
    if (dateMode !== 'fixed14') return
    const nextEnd = format(addDays(parseISO(`${rangeStart}T12:00:00`), CYCLE_PLAN_LENGTH - 1), 'yyyy-MM-dd')
    if (rangeEnd !== nextEnd) setRangeEnd(nextEnd)
  }, [dateMode, rangeStart, rangeEnd])

  useEffect(() => {
    if (!orderedWorkoutDays.length) {
      setSelectedDay(null)
      return
    }
    if (selectedDay == null || !workoutWeekdays.includes(selectedDay)) {
      setSelectedDay(orderedWorkoutDays[0].value)
    }
  }, [orderedWorkoutDays, workoutWeekdays, selectedDay])

  const activeCart = dayCarts[selectedDay] || []
  const cartExerciseIds = useMemo(() => new Set(activeCart.map((e) => e.exerciseId)), [activeCart])
  const totalExercises = countDayCartExercises(dayCarts)
  const filledDays = filledWeekdaysFromDayCarts(dayCarts)
  const activeUi = dayUi(selectedDay)
  const otherCopyTargets = orderedWorkoutDays.filter((d) => d.value !== selectedDay)

  const availabilitySummary = useMemo(
    () => summarizeRangeAvailability(activeStart, activeEnd, member?.availability),
    [activeStart, activeEnd, member?.availability],
  )

  const emptyAvailableLabels = useMemo(() => {
    const filledLabels = new Set(filledDays.map(weekdayFullLabel))
    return (availabilitySummary.workoutWeekdays || []).filter((l) => !filledLabels.has(l))
  }, [availabilitySummary.workoutWeekdays, filledDays])

  const autoTitle = useMemo(
    () => buildCoachProgramTitle(member?.name || 'Danışan', activeStart, activeEnd, dateMode === 'fixed14' ? 'fixed14' : 'weekly'),
    [member?.name, activeStart, activeEnd, dateMode],
  )

  const canGoStep2 = hasAvailability && activeEnd >= activeStart
    && (availabilitySummary.activeCount > 0 || relaxAvailability || isEdit)
  const canGoStep3 = filledDays.length > 0

  if (!member) {
    return (
      <div className="space-y-4">
        <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-medium text-brand-600">
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
        <p className="text-sm text-cream-800/60">Üye bulunamadı.</p>
      </div>
    )
  }

  const patchDayCart = (day, updater) => {
    setDayCarts((prev) => {
      const current = prev[day] || []
      const next = typeof updater === 'function' ? updater(current) : updater
      return { ...prev, [day]: next }
    })
  }

  const addToCart = (ex) => {
    if (selectedDay == null) {
      toast('Önce bir antrenman günü seçin', 'error')
      return
    }
    if (cartExerciseIds.has(ex.id)) {
      toast('Bu hareket bu günde zaten var', 'info')
      return
    }
    patchDayCart(selectedDay, (list) => [...list, createCartEntry(ex)])
  }

  const updateCartItem = (id, patch) => {
    if (selectedDay == null) return
    patchDayCart(selectedDay, (list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  const removeFromCart = (id) => {
    if (selectedDay == null) return
    patchDayCart(selectedDay, (list) => list.filter((e) => e.id !== id))
  }

  const moveCartItem = (id, dir) => {
    if (selectedDay == null) return
    patchDayCart(selectedDay, (list) => {
      const i = list.findIndex((e) => e.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= list.length) return list
      const next = [...list]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const previewCartEntry = (entry) => {
    if (!entry?.videoUrl && !entry?.videoPending) return
    setActiveExercise({
      name: entry.exerciseName,
      videoUrl: entry.videoUrl,
      videoPending: entry.videoPending,
      description: entry.description,
    })
  }

  const clearSelectedDay = () => {
    if (selectedDay == null) return
    patchDayCart(selectedDay, [])
    toast(`${weekdayFullLabel(selectedDay)} temizlendi`, 'info')
  }

  const copyDayTo = (targetDay) => {
    if (selectedDay == null || targetDay === selectedDay) return
    if (!workoutWeekdays.includes(targetDay)) {
      toast('Hedef gün müsait değil', 'error')
      return
    }
    if (!activeCart.length) {
      toast('Kopyalanacak hareket yok', 'error')
      return
    }
    setDayCarts((prev) => ({ ...prev, [targetDay]: cloneCartEntries(activeCart) }))
    setCopyTargetOpen(false)
    toast(`${weekdayFullLabel(selectedDay)} → ${weekdayFullLabel(targetDay)} kopyalandı`, 'success')
  }

  const handleRangeChange = ({ start, end }) => {
    if (dateMode === 'fixed14') {
      const bounds = getDateInputBounds(packageRange, { cycleLength: CYCLE_PLAN_LENGTH })
      let s = start || rangeStart
      if (bounds?.min && s < bounds.min) s = bounds.min
      if (bounds?.max && s > bounds.max) s = bounds.max
      setRangeStart(s)
      setRangeEnd(format(addDays(parseISO(`${s}T12:00:00`), CYCLE_PLAN_LENGTH - 1), 'yyyy-MM-dd'))
      return
    }
    const clamped = clampRangeToBounds(start, end, customBounds)
    setRangeStart(clamped.start)
    setRangeEnd(clamped.end)
  }

  const switchDateMode = (mode) => {
    setDateMode(mode)
    if (mode === 'fixed14') {
      const bounds = getDateInputBounds(packageRange, { cycleLength: CYCLE_PLAN_LENGTH })
      let s = rangeStart
      if (bounds?.min && s < bounds.min) s = bounds.min
      if (bounds?.max && s > bounds.max) s = bounds.max
      setRangeStart(s)
      setRangeEnd(format(addDays(parseISO(`${s}T12:00:00`), CYCLE_PLAN_LENGTH - 1), 'yyyy-MM-dd'))
    }
  }

  const goStep2 = () => {
    if (!canGoStep2) {
      toast(hasAvailability ? 'Seçilen aralıkta antrenman günü yok' : 'Danışan müsaitlik belirtmemiş', 'error')
      return
    }
    setStep(2)
  }

  const goStep3 = () => {
    if (!canGoStep3) {
      toast('En az bir güne hareket ekleyin', 'error')
      return
    }
    setCartOpen(false)
    setStep(3)
  }

  const handleSubmit = async () => {
    if (!filledDays.length) {
      toast('En az bir güne hareket ekleyin', 'error')
      return
    }
    if (activeEnd < activeStart) {
      toast('Bitiş tarihi başlangıçtan önce olamaz', 'error')
      return
    }
    if (!relaxAvailability && !isEdit && !memberHasWorkoutAvailability(member.availability)) {
      toast('Danışan antrenman günü belirtmemiş', 'error')
      return
    }
    if (!memberHasProgramTypePackage(member, 'workout') && !relaxAvailability) {
      toast('Üyenin aktif koç paketi yok', 'error')
      return
    }
    if (!relaxAvailability && !isEdit && availabilitySummary.activeCount === 0) {
      toast('Seçilen tarih aralığında danışanın antrenman günü yok', 'error')
      return
    }

    const daySessionTimes = Object.fromEntries(filledDays.map((day) => [day, DEFAULT_SESSION_TIME]))
    const data = buildWeeklyCoachProgramPayload({
      dayCarts,
      daySessionTimes,
      startDate: activeStart,
      endDate: activeEnd,
      description,
      sessionDuration: initialProgram?.sessionDuration || 45,
      memberName: member.name,
      titleMode: dateMode === 'fixed14' ? 'fixed14' : 'weekly',
    })

    const entryDays = [...new Set((data.entries || []).map((e) => Number(e.day)).filter((d) => !Number.isNaN(d)))]
    const invalidDay = entryDays.find((d) => !workoutWeekdays.includes(d))
    if (invalidDay != null && memberWeekdays.length) {
      toast(`${weekdayFullLabel(invalidDay)} müsait gün değil`, 'error')
      return
    }
    const outside = findEntriesOutsidePackage(data.entries || [], member, 'workout')
    if (outside.length && !relaxAvailability) {
      toast('Program tarihleri paket süresi dışında', 'error')
      return
    }
    if (!relaxAvailability) {
      const windows = getPackageWindowsForProgramType(member, 'workout')
      const start = data.cycleStartDate
      const end = format(addDays(parseISO(`${start}T12:00:00`), (data.cycleLength || 1) - 1), 'yyyy-MM-dd')
      if (!isDateInPackageWindows(start, windows)) {
        toast('Başlangıç tarihi paket süresi içinde olmalı', 'error')
        return
      }
      if (!isDateInPackageWindows(end, windows)) {
        toast('Program bitiş tarihi paket süresini aşıyor', 'error')
        return
      }
    }

    setSubmitting(true)
    try {
      const ok = await onSubmit(data)
      if (!ok) {
        toast('Program kaydedilemedi. Lütfen tekrar deneyin.', 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const dateModeToggle = (
    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/80 p-1.5 ring-1 ring-cream-100">
      {[
        { id: 'fixed14', label: '14 Günlük' },
        { id: 'custom', label: 'Başlangıç – Bitiş' },
      ].map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => switchDateMode(m.id)}
          className={`rounded-xl px-3 py-3 text-sm font-bold transition ${
            dateMode === m.id
              ? 'bg-gradient-to-r from-brand-500 to-sky-500 text-white shadow-md'
              : 'text-cream-800/70 hover:bg-white'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  )

  const dateFields = dateMode === 'fixed14' ? (
    <div className="rounded-2xl border border-sky-100 bg-white p-4">
      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-700">
        <CalendarDays className="h-3.5 w-3.5" /> Başlangıç tarihi
      </label>
      <input
        type="date"
        value={rangeStart}
        min={dateBounds.min}
        max={dateBounds.max}
        onChange={(e) => handleRangeChange({ start: e.target.value, end: rangeEnd })}
        className="mt-2 w-full rounded-xl border border-sky-100 px-4 py-3 text-sm"
      />
      <p className="mt-2 text-sm text-cream-800/65">
        Bitiş: <strong>{format(parseISO(`${fixedEndDate}T12:00:00`), 'd MMMM yyyy', { locale: tr })}</strong>
        {' '}({CYCLE_PLAN_LENGTH} gün)
      </p>
    </div>
  ) : (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block rounded-2xl border border-sky-100 bg-white p-4">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sky-700">
          <CalendarDays className="h-3.5 w-3.5" /> Başlangıç
        </span>
        <input
          type="date"
          value={rangeStart}
          min={customBounds.min}
          max={customBounds.max}
          onChange={(e) => handleRangeChange({ start: e.target.value, end: rangeEnd })}
          className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm"
        />
      </label>
      <label className="block rounded-2xl border border-teal-100 bg-white p-4">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-teal-700">Bitiş</span>
        <input
          type="date"
          value={rangeEnd}
          min={rangeStart || customBounds.min}
          max={customBounds.max}
          onChange={(e) => handleRangeChange({ start: rangeStart, end: e.target.value })}
          className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm"
        />
      </label>
      <p className="sm:col-span-2 text-sm text-cream-800/60">
        {formatRangeSummary(activeStart, activeEnd)} · {cycleLengthFromRange(activeStart, activeEnd)} gün
      </p>
    </div>
  )

  const dayRailItem = (d, variant = 'rail') => {
    const count = dayCarts[d.value]?.length || 0
    const active = selectedDay === d.value
    const ui = dayUi(d.value)
    if (variant === 'chip') {
      return (
        <button
          key={d.value}
          type="button"
          onClick={() => setSelectedDay(d.value)}
          className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition ${
            active
              ? 'bg-gradient-to-r from-brand-500 to-sky-500 text-white shadow-md'
              : `${ui.chip} ring-1 ring-inset`
          }`}
        >
          {d.short}
          <span className={`ml-1.5 text-xs font-semibold ${active ? 'text-white/80' : 'opacity-70'}`}>
            {count || '·'}
          </span>
        </button>
      )
    }
    return (
      <button
        key={d.value}
        type="button"
        onClick={() => setSelectedDay(d.value)}
        className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-3.5 text-left transition ${
          active
            ? 'bg-gradient-to-r from-brand-500 to-sky-500 text-white shadow-lg shadow-brand-500/20'
            : `border bg-gradient-to-br ${ui.soft} ${ui.border} hover:shadow-sm`
        }`}
      >
        <div>
          <p className={`text-sm font-bold ${active ? 'text-white' : 'text-cream-900'}`}>{d.label}</p>
          <p className={`mt-0.5 text-xs ${active ? 'text-white/80' : 'text-cream-800/50'}`}>
            {count > 0 ? `${count} hareket` : 'Boş'}
          </p>
        </div>
        {count > 0 && (
          <span className={`flex h-7 min-w-7 items-center justify-center rounded-full text-xs font-bold ${active ? 'bg-white/20 text-white' : ui.chip}`}>
            {count}
          </span>
        )}
      </button>
    )
  }

  const libraryBlock = (
    <div className="space-y-4">
      <ExerciseLibraryFilters
        searchInput={searchInput}
        onSearchChange={(value) => { setSearchInput(value); setSearch(value) }}
        category={category}
        onCategoryChange={(value) => { setCategory(value); setCategoryFilter(value) }}
        difficulty={difficulty}
        onDifficultyChange={(value) => {
          setDifficulty(value)
          setDifficultyFilter(value === DIFFICULTY_ALL ? 'Tümü' : value)
        }}
        location={location}
        onLocationChange={(value) => { setLocation(value); setLocationFilter(value) }}
        requiresMachine={requiresMachine}
        onRequiresMachineChange={(value) => { setRequiresMachine(value); setRequiresMachineFilter(value) }}
      />
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-brand-400" /></div>
      ) : filteredExercisesList.length === 0 ? (
        <p className="py-10 text-center text-sm text-cream-800/50">Hareket bulunamadı.</p>
      ) : (
        <>
          <div className="grid max-h-[min(52vh,520px)] gap-3 overflow-y-auto pr-0.5 sm:grid-cols-2">
            {filteredExercisesList.map((ex) => {
              const inCart = cartExerciseIds.has(ex.id)
              const hasVideo = Boolean(ex.videoUrl || ex.videoPending)
              return (
                <div
                  key={ex.id}
                  className={`flex flex-col overflow-hidden rounded-2xl border shadow-sm ${
                    inCart ? `${activeUi.border} bg-gradient-to-b ${activeUi.soft}` : 'border-cream-200 bg-white'
                  }`}
                >
                  <button
                    type="button"
                    disabled={!hasVideo}
                    onClick={() => hasVideo && setActiveExercise(ex)}
                    onPointerEnter={() => hasVideo && prefetchExerciseVideo(ex.videoUrl)}
                    className={`relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-brand-100 to-sky-100 ${hasVideo ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center p-3">
                      <ExerciseVideoThumbnail
                        url={ex.videoUrl}
                        videoPending={ex.videoPending}
                        size="card"
                        accent="brand"
                        fallbackIcon={Dumbbell}
                        className="!h-full !w-auto !max-h-full !max-w-full !rounded-xl shadow-md"
                      />
                    </div>
                    {hasVideo && !ex.videoPending && (
                      <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white">
                        <PlayCircle className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="font-semibold text-cream-900">{ex.name}</p>
                    <div className="mt-1 line-clamp-2 text-xs text-cream-800/55">{ex.description || 'Açıklama yok'}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ex.difficulty && (
                        <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-medium text-cream-800/60">
                          {DIFFICULTY_LABELS[ex.difficulty] || ex.difficulty}
                        </span>
                      )}
                      {formatExerciseLocations(ex.locations).slice(0, 2).map((label) => (
                        <span key={label} className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">{label}</span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(ex)}
                      disabled={inCart}
                      className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-white ${activeUi.btn} ${inCart ? 'opacity-80' : ''}`}
                    >
                      {inCart ? <><Check className="h-3.5 w-3.5" /> Bu günde</> : <><Plus className="h-3.5 w-3.5" /> Güne ekle</>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <ExercisePagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  )

  return (
    <div className={`space-y-6 ${step === 2 ? 'pb-28' : 'pb-10'}`}>
      <div>
        <Link to={backTo} className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-tight text-cream-900 sm:text-4xl">{member.name}</h1>
        <p className="mt-2 text-base text-cream-800/65">{isEdit ? 'Programı düzenle · ' : ''}{titleSuffix}</p>
      </div>

      <div className="rounded-3xl border border-cream-100 bg-white p-4 shadow-sm sm:p-5">
        <WizardSteps step={step} />
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-brand-50/40 to-teal-50 p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-lg font-bold text-cream-900">
                  <Sparkles className="h-5 w-5 text-brand-500" /> Program süresi
                </p>
                <p className="mt-1 text-sm text-cream-800/60">14 günlük sabit plan veya özel aralık</p>
              </div>
              {packageRange && (
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-cream-800/70 ring-1 ring-cream-100">
                  Paket: {packageRange.start}{packageRange.end ? ` — ${packageRange.end}` : ''}
                </span>
              )}
            </div>
            <div className="mt-5 space-y-4">
              {dateModeToggle}
              {dateFields}
            </div>
          </div>

          <div className="rounded-3xl border border-cream-200 bg-white p-5 sm:p-6">
            <p className="mb-3 text-base font-bold text-cream-900">Antrenman müsaitliği</p>
            {hasAvailability ? (
              <>
                <div className="mb-3 flex flex-wrap gap-2">
                  {orderedWorkoutDays.map((d) => (
                    <span key={d.value} className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${dayUi(d.value).chip}`}>
                      {d.label}
                    </span>
                  ))}
                </div>
                {member?.availability ? (
                  <AvailabilityView value={member.availability} emptyText="—" />
                ) : (
                  <p className="text-sm text-cream-800/55">Müsaitlik yok — tüm günler düzenlenebilir.</p>
                )}
                {availabilitySummary.activeCount === 0 && !relaxAvailability && !isEdit && (
                  <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    Seçilen aralıkta antrenman günü yok.
                  </p>
                )}
              </>
            ) : (
              <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Danışan müsaitlik belirtmemiş. İleri gidilemez.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={goStep2}
            disabled={!canGoStep2}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 via-sky-500 to-teal-500 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/25 disabled:opacity-45"
          >
            İleri — Gün programları <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {orderedWorkoutDays.map((d) => dayRailItem(d, 'chip'))}
          </div>

          <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-cream-800/50">Günler</p>
              <div className="sticky top-4 space-y-2">
                {orderedWorkoutDays.map((d) => dayRailItem(d, 'rail'))}
              </div>
            </aside>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setApplySameOpen(true)}
                  disabled={!activeCart.length || !workoutWeekdays.length}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 disabled:opacity-40"
                >
                  <Copy className="h-3.5 w-3.5" /> Tüm günlere aynı
                </button>
                <button
                  type="button"
                  onClick={() => setCopyTargetOpen(true)}
                  disabled={!activeCart.length || otherCopyTargets.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800 disabled:opacity-40"
                >
                  <Copy className="h-3.5 w-3.5" /> Günü kopyala
                </button>
                <button
                  type="button"
                  onClick={clearSelectedDay}
                  disabled={!activeCart.length}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-cream-200 bg-white px-3 py-2 text-xs font-semibold text-cream-800 disabled:opacity-40"
                >
                  <Eraser className="h-3.5 w-3.5" /> Temizle
                </button>
              </div>

              {selectedDay != null && (
                <>
                  <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 ring-1 ${activeUi.accent}`}>
                    <Dumbbell className="h-4 w-4" />
                    <span className="text-base font-bold">{weekdayFullLabel(selectedDay)}</span>
                    <span className="text-sm opacity-60">· {activeCart.length} hareket</span>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-2">
                    <div className={`min-h-[260px] rounded-2xl border p-4 bg-gradient-to-br ${activeUi.soft} ${activeUi.border}`}>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="font-bold text-cream-900">{weekdayShortLabel(selectedDay)} akışı</p>
                        <button type="button" onClick={() => setCartOpen(true)} className="text-xs font-semibold text-brand-600 lg:hidden">
                          <ShoppingBag className="mr-1 inline h-3.5 w-3.5" /> Liste
                        </button>
                      </div>
                      <div className="hidden lg:block">
                        <CartList
                          cart={activeCart}
                          onPatch={updateCartItem}
                          onRemove={removeFromCart}
                          onMove={moveCartItem}
                          onPreview={previewCartEntry}
                          ui={activeUi}
                          className="max-h-[min(52vh,500px)] overflow-y-auto"
                        />
                      </div>
                      <p className="text-sm text-cream-800/50 lg:hidden">
                        {activeCart.length ? `${activeCart.length} hareket — listeyi açın` : 'Henüz hareket yok'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-cream-100 bg-white p-4 shadow-sm">
                      <p className="mb-3 font-bold text-cream-900">Kütüphane</p>
                      {libraryBlock}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-white/95 px-3 pt-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto flex max-w-4xl gap-2">
              <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm font-semibold text-cream-800">
                Geri
              </button>
              <div className="hidden flex-1 items-center justify-center text-xs font-medium text-cream-800/55 sm:flex">
                {totalExercises} hareket · {filledDays.length} dolu gün
              </div>
              <button
                type="button"
                onClick={goStep3}
                disabled={!canGoStep3}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-sky-500 py-3 text-sm font-bold text-white disabled:opacity-45 sm:flex-none sm:px-8"
              >
                Önizlemeye geç <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-sky-500 to-teal-500 p-5 text-white shadow-lg shadow-brand-500/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/75">Program başlığı</p>
            <p className="mt-1.5 text-lg font-bold leading-snug">{autoTitle}</p>
          </div>

          <div className="rounded-3xl border border-cream-100 bg-white p-5 shadow-sm sm:p-6">
            <p className="mb-3 text-sm font-bold text-cream-900">Süre (düzenlenebilir)</p>
            <div className="space-y-3">
              {dateModeToggle}
              {dateFields}
            </div>
          </div>

          <div className="rounded-3xl border border-cream-100 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-bold text-cream-900">Dolu günler</p>
            <div className="flex flex-wrap gap-2">
              {filledDays.map((day) => (
                <span key={day} className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${dayUi(day).chip}`}>
                  {weekdayShortLabel(day)} · {dayCarts[day]?.length || 0} hareket
                </span>
              ))}
            </div>
            {emptyAvailableLabels.length > 0 && (
              <p className="mt-3 text-xs text-cream-800/50">Boş bırakılan: {emptyAvailableLabels.join(', ')}</p>
            )}
            {availabilitySummary.blockedCount > 0 && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Aralıkta {availabilitySummary.activeCount} antrenman gününe yazılır.
              </p>
            )}
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Not ekle (opsiyonel)"
            rows={3}
            className="w-full rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300"
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => setStep(2)} className="rounded-2xl border border-cream-200 bg-white px-5 py-3.5 text-sm font-semibold text-cream-800 sm:w-auto">
              Geri
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 via-sky-500 to-teal-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {submitting ? submittingLabel : submitLabel}
            </button>
          </div>
        </div>
      )}

      <Modal open={cartOpen} onClose={() => setCartOpen(false)} title={`${selectedDay != null ? weekdayFullLabel(selectedDay) : 'Gün'} akışı`} size="md">
        <CartList cart={activeCart} onPatch={updateCartItem} onRemove={removeFromCart} onMove={moveCartItem} onPreview={previewCartEntry} ui={activeUi} />
      </Modal>

      <Modal open={copyTargetOpen} onClose={() => setCopyTargetOpen(false)} title="Günü kopyala" size="sm">
        <div className="space-y-2">
          <p className="mb-2 text-sm text-cream-800/70">{weekdayFullLabel(selectedDay)} → hangi gün?</p>
          {otherCopyTargets.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => copyDayTo(d.value)}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold ${dayUi(d.value).border} bg-gradient-to-br ${dayUi(d.value).soft}`}
            >
              {d.label}
              {(dayCarts[d.value]?.length || 0) > 0 && <span className="ml-2 text-xs text-amber-700">(üzerine yazılır)</span>}
            </button>
          ))}
        </div>
      </Modal>

      <CoachApplySameProgramModal
        open={applySameOpen}
        onClose={() => setApplySameOpen(false)}
        workoutWeekdays={workoutWeekdays}
        sourceCart={activeCart}
        onApply={({ dayCarts: next }) => setDayCarts(next)}
      />

      <Modal open={!!activeExercise} onClose={() => setActiveExercise(null)} title={activeExercise?.name} size="lg">
        {activeExercise && (
          <div className="space-y-4">
            <VideoPlayer url={activeExercise.videoUrl} videoPending={activeExercise.videoPending} title={activeExercise.name} />
            {activeExercise.description && (
              <p className="whitespace-pre-line text-sm text-cream-800/80">{activeExercise.description}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

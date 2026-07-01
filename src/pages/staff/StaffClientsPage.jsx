import { useMemo, useState } from 'react'
import {
  Search, Users, Activity, Target, CalendarClock,
  Dumbbell, Apple, Mail, CalendarRange, Plus, Trash2, Video, UserRound, FileText,
  Check, CalendarCheck, Timer, Clock,
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import NutritionProgramBuilder from '../../components/staff/NutritionProgramBuilder'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import AvailabilityView from '../../components/package/AvailabilityView'
import MemberHealthInsights from '../../components/member/MemberHealthInsights'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { calculateBMI, bmiCategory, GOAL_LABELS, FITNESS_LABELS } from '../../services/health'
import { AVAILABILITY_WEEKDAYS } from '../../services/availability'
import { getStaffClients, getStaffAppointments } from './StaffOverviewPage'
import VideoJoinLink from '../../components/video/VideoJoinLink'
import {
  findEntriesOutsidePackage,
  getMemberPackageDateRange,
  getPackageWindowsForProgramType,
  isDateInPackageWindows,
  memberHasProgramTypePackage,
} from '../../utils/programPackageScope'

const weekdayName = (v) => AVAILABILITY_WEEKDAYS.find((d) => d.value === Number(v))?.label || ''

const SESSION_TIME_OPTIONS = (() => {
  const out = []
  for (let h = 5; h <= 23; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`)
    out.push(`${String(h).padStart(2, '0')}:30`)
  }
  return out
})()

const DURATION_PRESETS = [20, 30, 45, 60, 75, 90]

const WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6]

function entryToText(e) {
  const amount = e.amountType === 'duration' ? `${e.amount} ${e.durationUnit || 'sn'}` : `${e.amount} tekrar`
  const sched = e.date
    ? format(new Date(`${e.date}T12:00:00`), 'd MMM yyyy', { locale: tr })
    : e.everyday ? 'Her gün' : weekdayName(e.day)
  return `${sched} ${e.start ? `${e.start} ` : ''}${e.exerciseName} · ${amount}${e.note ? ` (${e.note})` : ''}`
}

function expandEverydayEntries(list) {
  const out = []
  list.forEach((e) => {
    WEEK_DAYS.forEach((day) => {
      const { everyday, ...rest } = e
      out.push({ ...rest, id: `${e.id}-d${day}`, day })
    })
  })
  return out
}

// Koç program oluşturucu — kütüphane kartları + sepet UX
function CoachProgramBuilder({ exercises, onCreate, packageRange }) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [entries, setEntries] = useState([])
  const [scheduleMode, setScheduleMode] = useState('everyday')
  const [selectedDay, setSelectedDay] = useState(1)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [exSearch, setExSearch] = useState('')
  const [sessionDuration, setSessionDuration] = useState(45)
  // Seans saati: 'global' = hepsi aynı, 'perday' = güne özel
  const [timeMode, setTimeMode] = useState('global')
  const [globalTime, setGlobalTime] = useState({ start: '09:00', end: '10:00' })
  const [dayTimes, setDayTimes] = useState({})

  const dateBounds = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    if (!packageRange) {
      return { min: today, max: format(addDays(new Date(), 90), 'yyyy-MM-dd') }
    }
    const min = packageRange.start > today ? packageRange.start : today
    const max = packageRange.end || format(addDays(new Date(), 365), 'yyyy-MM-dd')
    return { min, max: max >= min ? max : min }
  }, [packageRange])

  const currentKey = scheduleMode === 'date'
    ? `date:${selectedDate}`
    : scheduleMode === 'everyday'
      ? 'everyday'
      : String(selectedDay)

  const currentTime = useMemo(() => {
    if (scheduleMode === 'everyday') return globalTime
    if (timeMode === 'perday' && dayTimes[currentKey]) return dayTimes[currentKey]
    return globalTime
  }, [scheduleMode, timeMode, globalTime, dayTimes, currentKey])

  const setCurrentTime = (val) => {
    if (scheduleMode === 'everyday' || timeMode === 'global') {
      setGlobalTime(val)
      return
    }
    setDayTimes((prev) => ({ ...prev, [currentKey]: val }))
  }

  const filteredExercises = useMemo(
    () => exercises.filter((ex) =>
      !exSearch ||
      ex.name.toLowerCase().includes(exSearch.toLowerCase()) ||
      (ex.category || '').toLowerCase().includes(exSearch.toLowerCase())
    ),
    [exercises, exSearch]
  )

  const dayEntries = useMemo(() => {
    if (scheduleMode === 'date') {
      return [...entries.filter((e) => e.date === selectedDate)].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }
    if (scheduleMode === 'everyday') {
      return [...entries.filter((e) => e.everyday)].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }
    return [...entries.filter((e) => e.day === selectedDay)].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [entries, selectedDay, selectedDate, scheduleMode])

  const everydayCount = useMemo(() => entries.filter((e) => e.everyday).length, [entries])

  const entriesPerDay = useMemo(
    () => AVAILABILITY_WEEKDAYS.reduce((acc, d) => {
      acc[d.value] = entries.filter((e) => e.day === d.value).length
      return acc
    }, {}),
    [entries]
  )

  const schedulePatch = () => {
    if (scheduleMode === 'date') return { date: selectedDate }
    if (scheduleMode === 'everyday') return { everyday: true }
    return { day: selectedDay }
  }

  const matchesActiveSchedule = (e) => {
    if (scheduleMode === 'date') return e.date === selectedDate
    if (scheduleMode === 'everyday') return e.everyday === true
    return e.day === selectedDay && !e.everyday
  }

  const addExercise = (ex) => {
    const alreadyIn = dayEntries.some((e) => e.exerciseId === ex.id)
    if (alreadyIn) { toast('Bu hareket zaten eklendi', 'info'); return }
    const t = currentTime
    setEntries((list) => [
      ...list,
      {
        id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...schedulePatch(),
        start: t.start,
        end: t.end,
        exerciseId: ex.id, exerciseName: ex.name, videoUrl: ex.videoUrl || '', description: ex.description || '',
        amountType: 'reps', amount: 12, durationUnit: 'sn', note: '',
        order: list.filter(matchesActiveSchedule).length,
      },
    ])
  }

  const updateEntry = (id, patch) => setEntries((list) => list.map((e) => e.id === id ? { ...e, ...patch } : e))
  const removeEntry = (id) => setEntries((list) => list.filter((e) => e.id !== id))

  const submit = () => {
    if (!title.trim()) { toast('Program başlığı gerekli', 'error'); return }
    let scoped = entries
    if (scheduleMode === 'date') scoped = entries.filter((e) => e.date)
    else if (scheduleMode === 'everyday') scoped = expandEverydayEntries(entries.filter((e) => e.everyday))
    else scoped = entries.filter((e) => e.day != null && !e.everyday && !e.date)
    if (scoped.length === 0) { toast('En az bir hareket ekleyin', 'error'); return }
    const ordered = [...scoped].sort((a, b) =>
      ((a.day ?? 0) - (b.day ?? 0)) || ((a.order ?? 0) - (b.order ?? 0))
    )
    onCreate({
      title: title.trim(),
      description: description.trim(),
      sessionDuration,
      entries: ordered,
      items: ordered.map(entryToText),
    })
    setTitle(''); setDescription(''); setEntries([])
  }

  const selectedDayName = scheduleMode === 'date'
    ? format(new Date(`${selectedDate}T12:00:00`), 'd MMMM', { locale: tr })
    : scheduleMode === 'everyday'
      ? 'Bütün hafta'
      : weekdayName(selectedDay)

  const activeDayCount = scheduleMode === 'everyday'
    ? (everydayCount > 0 ? 7 : 0)
    : AVAILABILITY_WEEKDAYS.filter((d) => (entriesPerDay[d.value] || 0) > 0).length

  return (
    <div className="space-y-4">
      {/* Başlık & Notlar */}
      <div className="space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Program başlığı (ör. 4 Haftalık Güç Programı)"
          className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Genel notlar (opsiyonel)"
          rows={2}
          className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300"
        />
      </div>

      {/* Ortalama antrenman süresi */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3">
        <Timer className="h-4 w-4 shrink-0 text-brand-500" />
        <span className="text-sm font-medium text-cream-800">Ortalama antrenman süresi</span>
        <div className="ml-auto flex flex-wrap gap-1">
          {DURATION_PRESETS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSessionDuration(d)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                sessionDuration === d
                  ? 'bg-brand-500 text-white'
                  : 'border border-cream-200 bg-white text-cream-800 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              {d} dk
            </button>
          ))}
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={5}
              max={300}
              value={sessionDuration}
              onChange={(e) => setSessionDuration(Number(e.target.value) || 45)}
              className="w-16 rounded-lg border border-cream-200 bg-white px-2 py-1 text-center text-xs"
            />
            <span className="text-xs text-cream-800/50">dk</span>
          </div>
        </div>
      </div>

      {/* Planlama modu */}
      <div className="flex flex-wrap gap-2 rounded-xl bg-cream-50 p-1">
        <button
          type="button"
          onClick={() => setScheduleMode('everyday')}
          className={`min-w-[calc(33%-0.35rem)] flex-1 rounded-lg py-2 text-xs font-semibold transition ${
            scheduleMode === 'everyday' ? 'bg-brand-500 text-white shadow' : 'text-cream-800/70 hover:bg-white'
          }`}
        >
          Bütün hafta
        </button>
        <button
          type="button"
          onClick={() => setScheduleMode('weekly')}
          className={`min-w-[calc(33%-0.35rem)] flex-1 rounded-lg py-2 text-xs font-semibold transition ${
            scheduleMode === 'weekly' ? 'bg-brand-500 text-white shadow' : 'text-cream-800/70 hover:bg-white'
          }`}
        >
          Güne özel
        </button>
        <button
          type="button"
          onClick={() => setScheduleMode('date')}
          className={`min-w-[calc(33%-0.35rem)] flex-1 rounded-lg py-2 text-xs font-semibold transition ${
            scheduleMode === 'date' ? 'bg-brand-500 text-white shadow' : 'text-cream-800/70 hover:bg-white'
          }`}
        >
          Belirli tarih
        </button>
      </div>

      {scheduleMode === 'everyday' ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-3">
          <p className="text-sm font-semibold text-brand-800">Haftanın her günü aynı program</p>
          <p className="mt-1 text-xs leading-relaxed text-brand-900/70">
            Hareketleri bir kez ekleyin; Pazartesi–Pazar tüm günlerde danışan takviminde görünür.
          </p>
        </div>
      ) : scheduleMode === 'weekly' ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/50">Gün Seç</p>
          <div className="grid grid-cols-7 gap-1">
            {AVAILABILITY_WEEKDAYS.map((d) => {
              const count = entriesPerDay[d.value] || 0
              const isSelected = selectedDay === d.value
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setSelectedDay(d.value)}
                  className={`flex flex-col items-center justify-center rounded-xl py-2.5 text-center text-xs font-semibold transition ${
                    isSelected ? 'bg-brand-500 text-white shadow-md'
                    : count > 0 ? 'border border-brand-200 bg-brand-50 text-brand-700'
                    : 'bg-cream-50 text-cream-800/60 hover:bg-cream-100'
                  }`}
                >
                  <span>{d.short}</span>
                  {count > 0 && (
                    <span className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                      isSelected ? 'bg-white/30 text-white' : 'bg-brand-500 text-white'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">Tarih Seç</p>
          <input
            type="date"
            value={selectedDate}
            min={dateBounds.min}
            max={dateBounds.max}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm"
          />
          {packageRange && (
            <p className="mt-1.5 text-[11px] text-brand-800/70">
              Paket süresi: {packageRange.start}
              {packageRange.end ? ` — ${packageRange.end}` : ' (süresiz)'}
            </p>
          )}
        </div>
      )}

      {/* Seans saati */}
      <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
            <Clock className="h-3.5 w-3.5" /> Seans saati
          </span>
          {scheduleMode !== 'everyday' && (
          <div className="flex gap-0.5 rounded-lg bg-cream-100 p-0.5">
            <button
              type="button"
              onClick={() => setTimeMode('global')}
              className={`rounded-md px-3 py-1 text-[10px] font-semibold transition ${
                timeMode === 'global' ? 'bg-brand-500 text-white shadow-sm' : 'text-cream-800/70 hover:text-cream-900'
              }`}
            >
              Hepsi aynı
            </button>
            <button
              type="button"
              onClick={() => setTimeMode('perday')}
              className={`rounded-md px-3 py-1 text-[10px] font-semibold transition ${
                timeMode === 'perday' ? 'bg-brand-500 text-white shadow-sm' : 'text-cream-800/70 hover:text-cream-900'
              }`}
            >
              Güne özel
            </button>
          </div>
          )}
        </div>
        {timeMode === 'perday' && scheduleMode !== 'everyday' && (
          <p className="mb-2 text-[11px] text-cream-800/55">
            <span className="font-semibold text-brand-700">{selectedDayName}</span> için saat:
          </p>
        )}
        {scheduleMode === 'everyday' && (
          <p className="mb-2 text-[11px] text-cream-800/55">Tüm hafta için geçerli seans saati:</p>
        )}
        <div className="flex items-center gap-2">
          <select
            value={currentTime.start}
            onChange={(e) => setCurrentTime({ ...currentTime, start: e.target.value })}
            className="flex-1 rounded-lg border border-cream-200 bg-white px-2 py-2 text-sm"
          >
            {SESSION_TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="text-sm text-cream-800/40">–</span>
          <select
            value={currentTime.end}
            onChange={(e) => setCurrentTime({ ...currentTime, end: e.target.value })}
            className="flex-1 rounded-lg border border-cream-200 bg-white px-2 py-2 text-sm"
          >
            {SESSION_TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {timeMode === 'perday' && scheduleMode === 'weekly' && activeDayCount > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {AVAILABILITY_WEEKDAYS.filter((d) => (entriesPerDay[d.value] || 0) > 0).map((d) => {
              const t = dayTimes[String(d.value)] || globalTime
              return (
                <span key={d.value} className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[10px] font-medium text-brand-700">
                  {d.short} {t.start}–{t.end}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* İki sütun: Sepet + Kütüphane */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sol: Sepet (seçili günün hareketleri) */}
        <div className="flex min-h-[280px] flex-col rounded-xl border border-cream-200 bg-white p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-cream-800/70">
            <CalendarCheck className="h-3.5 w-3.5 text-brand-500" />
            {selectedDayName} — {dayEntries.length} hareket
            {dayEntries.length > 0 && (
              <span className="ml-auto rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                {currentTime.start}–{currentTime.end}
              </span>
            )}
          </p>
          {dayEntries.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <Dumbbell className="h-8 w-8 text-cream-200" />
              <p className="mt-2 text-xs text-cream-800/40">Sağ panelden + ile hareket ekleyin</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto">
              {dayEntries.map((e) => (
                <div key={e.id} className="rounded-xl border border-cream-100 bg-cream-50 p-2.5">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-cream-900">{e.exerciseName}</p>
                        {e.videoUrl && <Video className="h-3 w-3 shrink-0 text-brand-400" />}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEntry(e.id)}
                      className="shrink-0 rounded-md p-1 text-red-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <select
                      value={e.amountType}
                      onChange={(ev) => updateEntry(e.id, { amountType: ev.target.value })}
                      className="rounded-md border border-cream-200 bg-white px-2 py-1 text-[11px] text-cream-800"
                    >
                      <option value="reps">Tekrar</option>
                      <option value="duration">Süre</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={e.amount}
                      onChange={(ev) => updateEntry(e.id, { amount: Number(ev.target.value) || 1 })}
                      className="w-16 rounded-md border border-cream-200 bg-white px-2 py-1 text-center text-sm text-cream-900"
                    />
                    {e.amountType === 'duration' && (
                      <select
                        value={e.durationUnit}
                        onChange={(ev) => updateEntry(e.id, { durationUnit: ev.target.value })}
                        className="rounded-md border border-cream-200 bg-white px-2 py-1 text-[11px] text-cream-800"
                      >
                        <option value="sn">sn</option>
                        <option value="dk">dk</option>
                      </select>
                    )}
                    <input
                      value={e.note}
                      onChange={(ev) => updateEntry(e.id, { note: ev.target.value })}
                      placeholder="not (ör. 3 set)…"
                      className="min-w-0 flex-1 rounded-md border border-cream-200 bg-white px-2 py-1 text-xs text-cream-800 placeholder:text-cream-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sağ: Kütüphane kartları */}
        <div className="flex flex-col rounded-xl border border-brand-100 bg-brand-50/30 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
            Kütüphane — {selectedDayName} için ekle
          </p>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream-400" />
            <input
              value={exSearch}
              onChange={(e) => setExSearch(e.target.value)}
              placeholder="Hareket ara…"
              className="w-full rounded-lg border border-cream-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-brand-300"
            />
          </div>
          <div className="max-h-72 min-h-[160px] space-y-1.5 overflow-y-auto">
            {filteredExercises.length === 0 ? (
              <p className="p-4 text-center text-xs text-cream-800/40">Sonuç bulunamadı</p>
            ) : filteredExercises.map((ex) => {
              const inCart = dayEntries.some((e) => e.exerciseId === ex.id)
              return (
                <div
                  key={ex.id}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition ${
                    inCart
                      ? 'border-brand-200 bg-brand-50'
                      : 'border-cream-100 bg-white hover:border-brand-200 hover:bg-brand-50/50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-cream-900">{ex.name}</p>
                    {ex.category && (
                      <p className="text-[10px] text-cream-800/50">{ex.category}</p>
                    )}
                  </div>
                  {ex.videoUrl && <Video className="h-3 w-3 shrink-0 text-brand-300" />}
                  <button
                    type="button"
                    onClick={() => addExercise(ex)}
                    disabled={inCart}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${
                      inCart
                        ? 'cursor-default bg-brand-100 text-brand-500'
                        : 'bg-brand-500 text-white hover:bg-brand-600 active:scale-95'
                    }`}
                  >
                    {inCart ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Program özeti */}
      {entries.length > 0 && (
        <div className="rounded-xl border border-cream-100 bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/50">
            Program Özeti — {scheduleMode === 'everyday' ? everydayCount : entries.length} hareket
            {scheduleMode === 'everyday' ? ' · her gün' : ` · ${activeDayCount} gün`}
            {' · '}{sessionDuration} dk ortalama
          </p>
          {scheduleMode === 'everyday' ? (
            everydayCount > 0 && (
              <span className="inline-flex rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-medium text-white">
                Her gün: {everydayCount} hareket · {globalTime.start}
              </span>
            )
          ) : (
          <div className="flex flex-wrap gap-1.5">
            {AVAILABILITY_WEEKDAYS.filter((d) => (entriesPerDay[d.value] || 0) > 0).map((d) => {
              const t = (timeMode === 'perday' && dayTimes[String(d.value)]) ? dayTimes[String(d.value)] : globalTime
              return (
                <span
                  key={d.value}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    selectedDay === d.value ? 'bg-brand-500 text-white' : 'bg-brand-100 text-brand-700'
                  }`}
                >
                  {d.short}: {entriesPerDay[d.value]} · {t.start}
                </span>
              )
            })}
          </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600"
      >
        Programı Gönder
      </button>
      <p className="text-center text-xs text-cream-800/50">Program danışana bildirim olarak iletilir.</p>
    </div>
  )
}

// Diyetisyen beslenme programı → NutritionProgramBuilder bileşenine taşındı

function ClientInfo({ member, role, isCoach }) {
  const bmi = calculateBMI(member.weight, member.height)
  const cat = bmiCategory(bmi)
  const appts = getStaffAppointments([member], role)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        {member.photo && (
          <img src={member.photo} alt={member.name} className="h-40 w-32 shrink-0 self-center rounded-2xl border border-cream-200 object-cover sm:self-start" />
        )}
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-cream-50 p-3">
            <p className="text-xs text-cream-800/50">Vücut Kitle İndeksi</p>
            <p className="mt-1 font-display text-2xl font-bold text-cream-900">{bmi ?? '—'}</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${cat.color}`}>{cat.label}</span>
          </div>
          <div className="rounded-xl bg-cream-50 p-3">
            <p className="text-xs text-cream-800/50">Ölçüler</p>
            <p className="mt-1 text-sm font-medium text-cream-900">{member.weight ? `${member.weight} kg` : '—'} · {member.height ? `${member.height} cm` : '—'}</p>
            <p className="mt-1 text-xs text-cream-800/50">Bel: {member.waist ? `${member.waist} cm` : '—'}</p>
          </div>
          <div className="rounded-xl bg-cream-50 p-3">
            <p className="text-xs text-cream-800/50">Spor Seviyesi</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-cream-900">
              <Activity className="h-4 w-4 text-brand-500" /> {FITNESS_LABELS[member.fitnessLevel] || '—'}
            </p>
            <p className="mt-1 text-xs text-cream-800/50">Yaş: {member.age || '—'} · {member.gender === 'female' ? 'Kadın' : member.gender === 'male' ? 'Erkek' : '—'}</p>
          </div>
          <div className="rounded-xl bg-cream-50 p-3">
            <p className="text-xs text-cream-800/50">İletişim</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-cream-900 break-all"><Mail className="h-3.5 w-3.5 shrink-0" /> {member.email}</p>
            {member.phone && <p className="mt-1 text-xs text-cream-800/55">{member.phone}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-cream-800/80"><Target className="h-4 w-4 text-brand-500" /> Hedefler</p>
          <Chips values={member.goals} map={GOAL_LABELS} />
        </div>
      </div>

      <MemberHealthInsights member={member} showLocation compact />

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-cream-800/80"><CalendarRange className="h-4 w-4 text-brand-500" /> Haftalık Müsaitlik</p>
        <AvailabilityView value={member.availability} emptyText="Danışan henüz müsait saat belirtmemiş." />
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-cream-800/80"><CalendarClock className="h-4 w-4 text-brand-500" /> Yaklaşan Randevular</p>
        {appts.length === 0 ? (
          <p className="text-sm text-cream-800/40">Yaklaşan randevu yok</p>
        ) : (
          <div className="space-y-1.5">
            {appts.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-cream-50 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-cream-800/70">{a.title}</span>
                <span className="shrink-0 font-medium text-cream-900">{format(new Date(a.date), 'd MMM, HH:mm', { locale: tr })}</span>
                <VideoJoinLink
                  session={a}
                  sessionType={isCoach ? 'coach' : 'dietitian'}
                  audience="staff"
                  size="sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Chips({ values, map }) {
  if (!values?.length) return <span className="text-sm text-cream-800/40">—</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <span key={v} className="rounded-full bg-cream-100 px-2.5 py-1 text-xs font-medium text-cream-800">
          {map[v] || v}
        </span>
      ))}
    </div>
  )
}

export default function StaffClientsPage() {
  const { staffUser, platform, createProgram, exercises } = useApp()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [infoClient, setInfoClient] = useState(null)
  const [programClient, setProgramClient] = useState(null)
  const isCoach = staffUser.role === 'coach'
  const RoleIcon = isCoach ? Dumbbell : Apple

  const clients = useMemo(() => getStaffClients(platform.members, staffUser.role, staffUser.id), [platform.members, staffUser.role, staffUser.id])
  const filtered = clients.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  )

  const programType = isCoach ? 'workout' : 'nutrition'
  const packageRange = useMemo(() => {
    if (!programClient) return null
    return getMemberPackageDateRange(programClient, programType)
  }, [programClient, programType])

  const handleCreate = (data) => {
    if (!programClient) return
    if (!memberHasProgramTypePackage(programClient, programType)) {
      toast('Üyenin bu program türü için aktif paketi yok', 'error')
      return
    }
    const outside = findEntriesOutsidePackage(data.entries || [], programClient, programType)
    if (outside.length) {
      const dates = [...new Set(outside.map((e) => e.date))].join(', ')
      toast(`Paket süresi dışındaki tarihler: ${dates}`, 'error')
      return
    }
    if (data.scheduleType === 'cycle14' && data.cycleStartDate) {
      const windows = getPackageWindowsForProgramType(programClient, programType)
      if (!isDateInPackageWindows(data.cycleStartDate, windows)) {
        toast('Liste başlangıç tarihi üyenin paket süresi içinde olmalı', 'error')
        return
      }
      const endDate = format(addDays(new Date(`${data.cycleStartDate}T12:00:00`), (data.cycleLength || 14) - 1), 'yyyy-MM-dd')
      if (!isDateInPackageWindows(endDate, windows)) {
        toast('14 günlük listenin bitiş tarihi paket süresini aşıyor', 'error')
        return
      }
    }
    createProgram({
      type: isCoach ? 'workout' : 'nutrition',
      memberId: programClient.id,
      memberName: programClient.name,
      staffId: staffUser.id,
      staffName: staffUser.name,
      ...data,
    })
    toast(`${programClient.name} için program oluşturuldu ve bildirildi`, 'success')
    setProgramClient(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Danışanlarım</h1>
        <p className="mt-1 text-sm text-cream-800/60">{clients.length} danışan · bilgileri görüntüleyin veya program oluşturun</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
        <input
          type="text"
          placeholder="İsim veya e-posta ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-cream-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-300"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Danışan bulunamadı" description="Size atanan ücretli üyeler burada görünecek." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => {
            const bmi = calculateBMI(m.weight, m.height)
            const cat = bmiCategory(bmi)
            return (
              <div
                key={m.id}
                className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-600">
                    {m.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-cream-900">{m.name}</p>
                    <p className="truncate text-xs text-cream-800/50">{m.email}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-cream-800/60">
                    <RoleIcon className="h-4 w-4" /> {FITNESS_LABELS[m.fitnessLevel] || '—'}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cat.color}`}>
                    VKİ {bmi ?? '—'}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInfoClient(m)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-cream-200 bg-cream-50 py-2.5 text-xs font-semibold text-cream-800 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <UserRound className="h-3.5 w-3.5" /> Bilgiler
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgramClient(m)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-600"
                  >
                    <FileText className="h-3.5 w-3.5" /> {isCoach ? 'Program Oluştur' : 'Liste Oluştur'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={!!infoClient} onClose={() => setInfoClient(null)} title={infoClient?.name} size="lg">
        {infoClient && <ClientInfo member={infoClient} role={staffUser.role} isCoach={isCoach} />}
      </Modal>

      <Modal open={!!programClient} onClose={() => setProgramClient(null)} title={`${programClient?.name} — ${isCoach ? 'Program' : 'Beslenme Listesi'}`} size="xl">
        {programClient && (
          isCoach
            ? <CoachProgramBuilder exercises={exercises} packageRange={packageRange} onCreate={handleCreate} />
            : <NutritionProgramBuilder packageRange={packageRange} onCreate={handleCreate} />
        )}
      </Modal>
    </div>
  )
}

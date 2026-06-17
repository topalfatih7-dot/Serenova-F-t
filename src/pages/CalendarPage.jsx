import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, addMonths, subMonths,
  startOfWeek, endOfWeek, getDay, isToday,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  ChevronLeft, ChevronRight, X, Dumbbell, Apple,
  PlayCircle, Clock, CheckCircle, Circle, Calendar,
  ClipboardList, Trophy, Zap, ArrowLeft, CalendarRange, ChevronDown, ChevronUp, Save,
} from 'lucide-react'
import VideoPlayer from '../components/ui/VideoPlayer'
import WeeklyAvailability from '../components/package/WeeklyAvailability'
import { useApp } from '../context/AppContext'
import { AVAILABILITY_WEEKDAYS } from '../services/availability'
import { useToast } from '../context/ToastContext'

// ── Yardımcılar ────────────────────────────────────────────────────
const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const dayLabel = (v) => AVAILABILITY_WEEKDAYS.find((d) => d.value === Number(v))?.label || ''
const amountText = (e) => {
  if (!e) return ''
  if (e.amountType === 'duration') return `${e.amount} ${e.durationUnit || 'sn'}`
  return `${e.amount} tekrar`
}

// Tarihin programlardaki gün değerine dönüşümü
// date-fns getDay(): 0=Sun,1=Mon…6=Sat  →  AVAILABILITY_WEEKDAYS ile eşleşiyor
function getDayValue(date) {
  return getDay(date) // 0=Paz, 1=Pzt...
}

// Belirli bir tarih için tüm program girdilerini getir
function getProgramEntriesForDate(programs, date) {
  const dayValue = getDayValue(date)
  const result = []
  programs.forEach((prog) => {
    if (!prog.entries?.length) return
    prog.entries.forEach((entry) => {
      if (Number(entry.day) === dayValue) {
        result.push({ ...entry, programId: prog.id, programTitle: prog.title, programType: prog.type })
      }
    })
  })
  return result.sort((a, b) => (a.start || '').localeCompare(b.start || ''))
}

// Tüm program girdileri hangi gün değerlerine (0-6) sahip?
function getProgramDayValues(programs) {
  const days = new Set()
  programs.forEach((prog) => {
    if (!prog.entries?.length) return
    prog.entries.forEach((e) => days.add(Number(e.day)))
  })
  return days
}

// Completion key formatı: "2026-06-17_entry-id"
const completionKey = (dateStr, entryId) => `${dateStr}_${entryId}`

// ── Ana Bileşen ─────────────────────────────────────────────────────
export default function CalendarPage() {
  const { myPrograms, user, updateProfile } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [current, setCurrent] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [activeVideo, setActiveVideo] = useState(null)
  const [saving, setSaving] = useState(false)
  const [availOpen, setAvailOpen] = useState(false)
  const [availForm, setAvailForm] = useState(user?.availability || {})
  const [availSaving, setAvailSaving] = useState(false)

  const completedActivities = user?.completedActivities || {}

  // Ay takvim günleri
  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  // Program olan gün değerleri (0-6)
  const programDayValues = useMemo(() => getProgramDayValues(myPrograms), [myPrograms])

  // Seçili günün program girdileri
  const selectedEntries = useMemo(() => {
    if (!selectedDate) return []
    return getProgramEntriesForDate(myPrograms, selectedDate)
  }, [myPrograms, selectedDate])

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null

  // Gün için tamamlanma hesabı
  const dayCompletionCount = useMemo(() => {
    if (!selectedDateStr) return { done: 0, total: 0 }
    const keys = completedActivities[selectedDateStr] || []
    const total = selectedEntries.length
    const done = selectedEntries.filter((e) => keys.includes(completionKey(selectedDateStr, e.id))).length
    return { done, total }
  }, [selectedEntries, selectedDateStr, completedActivities])

  // Aktivite tamamla/geri al
  const toggleActivity = useCallback(async (entryId) => {
    if (!selectedDateStr || saving) return
    setSaving(true)
    try {
      const current = user?.completedActivities || {}
      const dayKeys = current[selectedDateStr] || []
      const key = completionKey(selectedDateStr, entryId)
      const newKeys = dayKeys.includes(key)
        ? dayKeys.filter((k) => k !== key)
        : [...dayKeys, key]
      await updateProfile({ completedActivities: { ...current, [selectedDateStr]: newKeys } })
    } finally {
      setSaving(false)
    }
  }, [selectedDateStr, user, updateProfile, saving])

  const isDone = (entryId) => {
    if (!selectedDateStr) return false
    return (completedActivities[selectedDateStr] || []).includes(completionKey(selectedDateStr, entryId))
  }

  const saveAvailability = useCallback(async () => {
    setAvailSaving(true)
    try {
      await updateProfile({ availability: availForm })
      toast('Müsaitlik bilgileriniz kaydedildi', 'success')
      setAvailOpen(false)
    } finally {
      setAvailSaving(false)
    }
  }, [availForm, updateProfile, toast])

  // Gün hücresindeki nokta renkleri
  const getDotsForDay = (day) => {
    const dayValue = getDayValue(day)
    if (!programDayValues.has(dayValue)) return []
    const dots = []
    const hasWorkout = myPrograms.some((p) => p.type === 'workout' && p.entries?.some((e) => Number(e.day) === dayValue))
    const hasNutrition = myPrograms.some((p) => p.type === 'nutrition' && p.entries?.some((e) => Number(e.day) === dayValue))
    if (hasWorkout) dots.push('workout')
    if (hasNutrition) dots.push('nutrition')
    return dots
  }

  // Ay bazında tamamlama yüzdesi
  const monthStats = useMemo(() => {
    let total = 0
    let done = 0
    days.forEach((day) => {
      if (!isSameMonth(day, current)) return
      const dateStr = format(day, 'yyyy-MM-dd')
      const entries = getProgramEntriesForDate(myPrograms, day)
      total += entries.length
      const keys = completedActivities[dateStr] || []
      done += entries.filter((e) => keys.includes(completionKey(dateStr, e.id))).length
    })
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
  }, [days, current, myPrograms, completedActivities])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* GERİ BUTONU */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm font-medium text-cream-800 shadow-sm transition hover:bg-cream-50 hover:border-cream-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Geri Dön
      </button>

      {/* SAYFA BAŞLIĞI */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream-900">Program Takvimi</h1>
          <p className="mt-1 text-sm text-cream-800/60">
            Koçunuz ve diyetisyeninizin hazırladığı günlük programlar
          </p>
        </div>
        {monthStats.total > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-white px-4 py-2.5 shadow-sm">
            <Trophy className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-xs text-cream-800/50">Bu Ay</p>
              <p className="text-sm font-bold text-cream-900">{monthStats.done}/{monthStats.total} tamamlandı</p>
            </div>
            <div className="relative h-8 w-8">
              <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="13" fill="none" stroke="#f0ebe3" strokeWidth="4" />
                <circle
                  cx="16" cy="16" r="13" fill="none" stroke="#4a8aad" strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 13}`}
                  strokeDashoffset={`${2 * Math.PI * 13 * (1 - monthStats.pct / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-brand-600">
                {monthStats.pct}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* HAFTALIK MÜSAİTLİK */}
      <div className="overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/60 to-white shadow-sm">
        <button
          type="button"
          onClick={() => { setAvailOpen((v) => !v); setAvailForm(user?.availability || {}) }}
          className="flex w-full items-center justify-between px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
              <CalendarRange className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-cream-900">Haftalık Müsaitliğim</p>
              <p className="text-xs text-cream-800/55">
                {Object.values(user?.availability || {}).filter((v) => v?.length > 0).length > 0
                  ? `${Object.values(user?.availability || {}).filter((v) => v?.length > 0).length} gün seçili`
                  : 'Müsait olduğunuz günleri ve saatleri belirleyin'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 sm:block">
              Koç & Diyetisyen Randevuları İçin
            </span>
            {availOpen ? <ChevronUp className="h-4 w-4 text-cream-400" /> : <ChevronDown className="h-4 w-4 text-cream-400" />}
          </div>
        </button>

        <AnimatePresence>
          {availOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t border-brand-100"
            >
              <div className="p-5">
                <WeeklyAvailability value={availForm} onChange={setAvailForm} />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAvailOpen(false)}
                    className="rounded-xl border border-cream-200 px-4 py-2 text-sm font-medium text-cream-800 hover:bg-cream-50"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={saveAvailability}
                    disabled={availSaving}
                    className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {availSaving ? 'Kaydediliyor…' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* TAKVİM */}
      <div className="rounded-2xl border border-cream-200 bg-white shadow-sm overflow-hidden">
        {/* Ay navigasyonu */}
        <div className="flex items-center justify-between border-b border-cream-100 bg-gradient-to-r from-brand-50/40 to-white px-5 py-4">
          <button type="button" onClick={() => setCurrent(subMonths(current, 1))} className="rounded-xl p-2 hover:bg-cream-100 transition">
            <ChevronLeft className="h-5 w-5 text-cream-800" />
          </button>
          <h2 className="font-display text-lg font-bold capitalize text-cream-900">
            {format(current, 'MMMM yyyy', { locale: tr })}
          </h2>
          <button type="button" onClick={() => setCurrent(addMonths(current, 1))} className="rounded-xl p-2 hover:bg-cream-100 transition">
            <ChevronRight className="h-5 w-5 text-cream-800" />
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {/* Gün başlıkları */}
          <div className="mb-2 grid grid-cols-7">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-cream-800/40">
                {d}
              </div>
            ))}
          </div>

          {/* Gün hücreleri */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = isSameMonth(day, current)
              const today = isToday(day)
              const selected = selectedDate && isSameDay(day, selectedDate)
              const dots = inMonth ? getDotsForDay(day) : []
              const dateStr = format(day, 'yyyy-MM-dd')
              const dayEntries = getProgramEntriesForDate(myPrograms, day)
              const dayDone = dayEntries.length > 0
                ? (completedActivities[dateStr] || []).filter((k) => k.startsWith(dateStr + '_')).length
                : 0
              const allDone = dayEntries.length > 0 && dayDone === dayEntries.length

              return (
                <motion.button
                  key={day.toISOString()}
                  type="button"
                  whileHover={inMonth && dots.length > 0 ? { scale: 1.05 } : {}}
                  whileTap={inMonth && dots.length > 0 ? { scale: 0.97 } : {}}
                  onClick={() => inMonth && setSelectedDate(day)}
                  className={`relative flex min-h-[60px] sm:min-h-[72px] flex-col items-center rounded-xl p-1.5 transition-all ${
                    !inMonth
                      ? 'opacity-25 cursor-default'
                      : selected
                        ? 'bg-brand-500 shadow-lg shadow-brand-500/30'
                        : today
                          ? 'bg-brand-50 ring-2 ring-brand-300'
                          : dots.length > 0
                            ? 'hover:bg-cream-100 cursor-pointer'
                            : 'cursor-pointer hover:bg-cream-50'
                  }`}
                >
                  <span className={`text-xs font-bold ${
                    selected ? 'text-white' : today ? 'text-brand-600' : 'text-cream-900'
                  }`}>
                    {format(day, 'd')}
                  </span>

                  {/* Tamamlanma göstergesi */}
                  {allDone && !selected && (
                    <CheckCircle className="mt-0.5 h-3 w-3 text-sage-500" />
                  )}

                  {/* Program noktaları */}
                  {dots.length > 0 && !allDone && (
                    <div className="mt-1 flex gap-1">
                      {dots.map((dot) => (
                        <span
                          key={dot}
                          className={`h-1.5 w-1.5 rounded-full ${
                            selected ? 'bg-white/80' : dot === 'workout' ? 'bg-brand-400' : 'bg-sage-400'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* İlerleme mini-bar */}
                  {inMonth && dayEntries.length > 0 && dayDone > 0 && !allDone && (
                    <div className="mt-auto w-full">
                      <div className="h-0.5 overflow-hidden rounded-full bg-cream-200">
                        <div
                          className={`h-0.5 rounded-full ${selected ? 'bg-white/60' : 'bg-brand-400'}`}
                          style={{ width: `${(dayDone / dayEntries.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Renk açıklamaları */}
        <div className="flex flex-wrap items-center gap-4 border-t border-cream-100 bg-cream-50/50 px-5 py-3">
          <span className="flex items-center gap-1.5 text-xs text-cream-800/60">
            <span className="h-2 w-2 rounded-full bg-brand-400" /> Antrenman
          </span>
          <span className="flex items-center gap-1.5 text-xs text-cream-800/60">
            <span className="h-2 w-2 rounded-full bg-sage-400" /> Beslenme
          </span>
          <span className="flex items-center gap-1.5 text-xs text-cream-800/60">
            <CheckCircle className="h-3 w-3 text-sage-500" /> Tamamlandı
          </span>
        </div>
      </div>

      {/* BOŞ DURUM */}
      {myPrograms.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-white py-16 text-center"
        >
          <ClipboardList className="h-12 w-12 text-cream-300" />
          <p className="mt-4 font-display text-lg font-bold text-cream-900">Henüz program yok</p>
          <p className="mt-2 max-w-sm text-sm text-cream-800/55">
            Koçunuz veya diyetisyeniniz size bir program oluşturduğunda burada takvimde görünecek.
          </p>
        </motion.div>
      )}

      {/* GÜN DETAY MODAL */}
      <AnimatePresence>
        {selectedDate && (
          <DayDetailPanel
            date={selectedDate}
            entries={selectedEntries}
            completion={dayCompletionCount}
            isDone={isDone}
            onToggle={toggleActivity}
            onVideoOpen={setActiveVideo}
            onClose={() => setSelectedDate(null)}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {/* VİDEO MODAL */}
      <AnimatePresence>
        {activeVideo && (
          <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Gün Detay Paneli ────────────────────────────────────────────────
function DayDetailPanel({ date, entries, completion, isDone, onToggle, onVideoOpen, onClose, saving }) {
  const workoutEntries = entries.filter((e) => e.programType === 'workout')
  const nutritionEntries = entries.filter((e) => e.programType === 'nutrition')

  const today = isToday(date)
  const isPast = date < new Date() && !today
  const progressPct = completion.total > 0 ? Math.round((completion.done / completion.total) * 100) : 0

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.97 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="fixed inset-x-4 bottom-0 top-[10vh] z-50 mx-auto max-w-xl overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
      >
        {/* Header */}
        <div className={`relative px-6 py-5 ${today ? 'bg-gradient-to-r from-brand-500 to-brand-600' : 'bg-gradient-to-r from-cream-50 to-white'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`absolute right-4 top-4 rounded-xl p-2 transition ${today ? 'hover:bg-white/20 text-white' : 'hover:bg-cream-100 text-cream-800'}`}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-end gap-4">
            <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${today ? 'bg-white/20' : 'bg-brand-50'}`}>
              <span className={`text-2xl font-bold ${today ? 'text-white' : 'text-brand-600'}`}>
                {format(date, 'd')}
              </span>
            </div>
            <div>
              <p className={`font-display text-xl font-bold capitalize ${today ? 'text-white' : 'text-cream-900'}`}>
                {format(date, 'EEEE', { locale: tr })}
              </p>
              <p className={`text-sm ${today ? 'text-white/75' : 'text-cream-800/60'}`}>
                {format(date, 'd MMMM yyyy', { locale: tr })}
                {today && <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">Bugün</span>}
              </p>
            </div>
          </div>

          {/* İlerleme barı */}
          {completion.total > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className={today ? 'text-white/80' : 'text-cream-800/60'}>
                  {completion.done}/{completion.total} tamamlandı
                </span>
                <span className={`font-bold ${today ? 'text-white' : 'text-brand-600'}`}>
                  {progressPct}%
                </span>
              </div>
              <div className={`mt-1.5 h-2 rounded-full overflow-hidden ${today ? 'bg-white/20' : 'bg-cream-200'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-2 rounded-full ${today ? 'bg-white' : 'bg-brand-500'}`}
                />
              </div>
            </div>
          )}
        </div>

        {/* İçerik */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100% - 180px)' }}>
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="h-10 w-10 text-cream-300" />
              <p className="mt-3 font-semibold text-cream-800/60">Bu gün için program yok</p>
              <p className="mt-1 text-sm text-cream-800/40">Koçunuz veya diyetisyeniniz program ekledikçe burada görünecek.</p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-cream-100">
              {/* Antrenman bölümü */}
              {workoutEntries.length > 0 && (
                <ProgramSection
                  icon={Dumbbell}
                  title="Antrenman Programı"
                  color="brand"
                  entries={workoutEntries}
                  isDone={isDone}
                  onToggle={onToggle}
                  onVideoOpen={onVideoOpen}
                  saving={saving}
                />
              )}

              {/* Beslenme bölümü */}
              {nutritionEntries.length > 0 && (
                <ProgramSection
                  icon={Apple}
                  title="Beslenme Programı"
                  color="sage"
                  entries={nutritionEntries}
                  isDone={isDone}
                  onToggle={onToggle}
                  onVideoOpen={onVideoOpen}
                  saving={saving}
                />
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}

// ── Program Bölümü ──────────────────────────────────────────────────
function ProgramSection({ icon: Icon, title, color, entries, isDone, onToggle, onVideoOpen, saving }) {
  const headerColors = {
    brand: 'bg-brand-50 text-brand-700 border-brand-100',
    sage:  'bg-sage-50 text-sage-700 border-sage-100',
  }
  const iconColors = {
    brand: 'bg-brand-100 text-brand-600',
    sage:  'bg-sage-100 text-sage-600',
  }

  return (
    <div>
      <div className={`flex items-center gap-2.5 border-b px-6 py-3 ${headerColors[color]}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-semibold">{title}</span>
        <span className="ml-auto rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium">
          {entries.length} aktivite
        </span>
      </div>
      <div className="divide-y divide-cream-50">
        {entries.map((entry) => (
          <ActivityRow
            key={entry.id}
            entry={entry}
            done={isDone(entry.id)}
            onToggle={() => onToggle(entry.id)}
            onVideoOpen={onVideoOpen}
            saving={saving}
            iconColor={iconColors[color]}
          />
        ))}
      </div>
    </div>
  )
}

// ── Aktivite Satırı ─────────────────────────────────────────────────
function ActivityRow({ entry, done, onToggle, onVideoOpen, saving, iconColor }) {
  return (
    <motion.div
      layout
      className={`px-6 py-4 transition-colors ${done ? 'bg-sage-50/60' : 'bg-white hover:bg-cream-50/50'}`}
    >
      <div className="flex items-start gap-3">
        {/* Tamamlandı butonu */}
        <button
          type="button"
          onClick={onToggle}
          disabled={saving}
          className={`mt-0.5 shrink-0 rounded-full transition ${saving ? 'opacity-50' : ''}`}
          title={done ? 'Tamamlanmadı olarak işaretle' : 'Tamamlandı olarak işaretle'}
        >
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
                <CheckCircle className="h-6 w-6 text-sage-500" />
              </motion.div>
            ) : (
              <motion.div key="undone" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
                <Circle className="h-6 w-6 text-cream-300" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Aktivite içeriği */}
        <div className="min-w-0 flex-1">
          <p className={`font-semibold leading-snug ${done ? 'text-cream-800/40 line-through' : 'text-cream-900'}`}>
            {entry.exerciseName || entry.name || 'Aktivite'}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {(entry.start || entry.end) && (
              <span className="flex items-center gap-1 text-xs text-cream-800/55">
                <Clock className="h-3 w-3" />
                {entry.start}{entry.end ? `–${entry.end}` : ''}
              </span>
            )}
            {(entry.amount || entry.amountType) && (
              <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs font-medium text-cream-800">
                {entry.sets ? `${entry.sets} set × ` : ''}{amountText(entry)}
              </span>
            )}
            {entry.note && (
              <span className="text-xs text-cream-800/50">{entry.note}</span>
            )}
          </div>

          {entry.description && (
            <p className="mt-1.5 text-xs leading-relaxed text-cream-800/60">{entry.description}</p>
          )}
        </div>

        {/* Video butonu */}
        {entry.videoUrl && (
          <button
            type="button"
            onClick={() => onVideoOpen(entry)}
            className="shrink-0 flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            Video
          </button>
        )}
      </div>

      {/* Tamamlandı mesajı */}
      {done && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 flex items-center gap-2 pl-9"
        >
          <Zap className="h-3 w-3 text-sage-500" />
          <span className="text-xs font-medium text-sage-600">Harika! Bu aktiviteyi tamamladınız.</span>
        </motion.div>
      )}
    </motion.div>
  )
}

// ── Video Modal ─────────────────────────────────────────────────────
function VideoModal({ video, onClose }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-x-4 top-1/2 z-[70] mx-auto max-w-2xl -translate-y-1/2 overflow-hidden rounded-3xl bg-gray-950 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="font-semibold text-white">{video.exerciseName || 'Video'}</p>
            {(video.start || video.end) && (
              <p className="mt-0.5 text-xs text-white/50">{video.start}{video.end ? `–${video.end}` : ''} · {amountText(video)}</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-white/10 text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <VideoPlayer url={video.videoUrl} />
          {video.description && (
            <p className="mt-4 text-sm leading-relaxed text-white/70">{video.description}</p>
          )}
        </div>
      </motion.div>
    </>
  )
}

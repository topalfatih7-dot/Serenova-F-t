import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, addMonths, subMonths,
  startOfWeek, endOfWeek, isToday,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  ChevronLeft, ChevronRight, X, Dumbbell, Apple,
  PlayCircle, Clock, CheckCircle, Circle, Calendar,
  ClipboardList, Trophy, Zap, ArrowLeft, CalendarRange, ChevronDown, ChevronUp, Save,
} from 'lucide-react'
import VideoPlayer from '../components/ui/VideoPlayer'
import ExerciseDetailModal from '../components/library/ExerciseDetailModal'
import ExerciseVideoThumbnail from '../components/library/ExerciseVideoThumbnail'
import WeeklyAvailability from '../components/package/WeeklyAvailability'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { fetchExerciseById } from '../services/exerciseLibrary'
import { prefetchExerciseVideo } from '../utils/exerciseVideoPrefetch'
import { PANEL_IMAGES } from '../utils/panelImages'
import {
  getProgramEntriesForDate,
  completionKey,
  mealLabel,
  groupEntriesByMeal,
  isMealCompleted,
  splitEntriesByType,
  mealContentText,
} from '../utils/programSchedule'

// ── Yardımcılar ────────────────────────────────────────────────────
const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const amountText = (e) => {
  if (!e) return ''
  if (e.amountType === 'duration') return `${e.amount} ${e.durationUnit || 'sn'}`
  return `${e.amount} tekrar`
}

function entryToExerciseDetail(entry) {
  return {
    exerciseId: entry.exerciseId,
    name: entry.exerciseName || entry.name,
    exerciseName: entry.exerciseName || entry.name,
    videoUrl: entry.videoUrl,
    videoPending: entry.videoPending,
    description: entry.description || '',
    category: entry.category || entry.bodyPart,
    equipment: entry.equipment,
    difficulty: entry.difficulty,
    locations: entry.locations,
    requiresMachine: entry.requiresMachine,
  }
}

export default function CalendarPage() {
  const { myPrograms, user, updateProfile, toggleActivityCompletion, toggleMealCompletion } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [current, setCurrent] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(isToday(new Date()) ? new Date() : null)
  const [expandedEntryId, setExpandedEntryId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [availOpen, setAvailOpen] = useState(false)
  const [availForm, setAvailForm] = useState(user?.availability || {})
  const [availSaving, setAvailSaving] = useState(false)

  useEffect(() => {
    if (searchParams.get('avail') !== '1') return
    setAvailOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('avail')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (availOpen) setAvailForm(user?.availability || {})
  }, [availOpen, user?.availability])

  const completedActivities = user?.completedActivities || {}

  // Ay takvim günleri
  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  // Program olan günler (takvimde nokta göstergesi)
  const daysWithPrograms = useMemo(() => {
    const set = new Set()
    days.forEach((day) => {
      if (!isSameMonth(day, current)) return
      if (getProgramEntriesForDate(myPrograms, day, user).length > 0) {
        set.add(format(day, 'yyyy-MM-dd'))
      }
    })
    return set
  }, [days, current, myPrograms, user])

  // Seçili günün program girdileri
  const selectedEntries = useMemo(() => {
    if (!selectedDate) return []
    return getProgramEntriesForDate(myPrograms, selectedDate, user)
  }, [myPrograms, selectedDate, user])

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null

  // Gün için tamamlanma hesabı
  const dayCompletionCount = useMemo(() => {
    if (!selectedDateStr) return { done: 0, total: 0 }
    const { workout, nutrition } = splitEntriesByType(selectedEntries)
    const keys = completedActivities[selectedDateStr] || []
    const workoutDone = workout.filter((e) => keys.includes(completionKey(selectedDateStr, e.id))).length
    const mealGroups = groupEntriesByMeal(nutrition)
    const mealDone = mealGroups.filter((g) =>
      isMealCompleted(completedActivities, selectedDateStr, g.mealType, g.entries)
    ).length
    return { done: workoutDone + mealDone, total: workout.length + mealGroups.length }
  }, [selectedEntries, selectedDateStr, completedActivities])

  // Aktivite tamamla/geri al
  const toggleActivity = useCallback(async (entryId) => {
    if (!selectedDateStr || saving) return
    setSaving(true)
    try {
      await toggleActivityCompletion(selectedDateStr, entryId)
    } finally {
      setSaving(false)
    }
  }, [selectedDateStr, saving, selectedDate, toggleActivityCompletion])

  const openDay = useCallback((day) => {
    if (!isSameMonth(day, current)) return
    setSelectedDate(day)
    setExpandedEntryId(null)
  }, [current])

  const toggleMeal = useCallback(async (mealType, entryIds) => {
    if (!selectedDateStr || saving) return
    setSaving(true)
    try {
      await toggleMealCompletion(selectedDateStr, mealType, entryIds)
    } finally {
      setSaving(false)
    }
  }, [selectedDateStr, saving, selectedDate, toggleMealCompletion])

  const isMealDone = (mealType, mealEntries) => {
    if (!selectedDateStr) return false
    return isMealCompleted(completedActivities, selectedDateStr, mealType, mealEntries)
  }

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
    const dateStr = format(day, 'yyyy-MM-dd')
    if (!daysWithPrograms.has(dateStr)) return []
    const entries = getProgramEntriesForDate(myPrograms, day, user)
    const dots = []
    if (entries.some((e) => e.programType === 'workout')) dots.push('workout')
    if (entries.some((e) => e.programType === 'nutrition')) dots.push('nutrition')
    return dots
  }

  // Ay bazında tamamlama yüzdesi
  const monthStats = useMemo(() => {
    let total = 0
    let done = 0
    days.forEach((day) => {
      if (!isSameMonth(day, current)) return
      const dateStr = format(day, 'yyyy-MM-dd')
      const entries = getProgramEntriesForDate(myPrograms, day, user)
      const { workout, nutrition } = splitEntriesByType(entries)
      const mealGroups = groupEntriesByMeal(nutrition)
      const keys = completedActivities[dateStr] || []
      total += workout.length + mealGroups.length
      done += workout.filter((e) => keys.includes(completionKey(dateStr, e.id))).length
      done += mealGroups.filter((g) =>
        isMealCompleted(completedActivities, dateStr, g.mealType, g.entries)
      ).length
    })
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
  }, [days, current, myPrograms, completedActivities, user])

  return (
    <PanelPageShell>
      <button type="button" onClick={() => navigate(-1)} className="panel-back-btn">
        <ArrowLeft className="h-4 w-4" />
        Geri Dön
      </button>

      <PanelPageHeader
        title="Program Takvimi"
        subtitle="Koçunuz ve diyetisyeninizin hazırladığı günlük programlar"
        icon={Calendar}
        accent="brand"
        image={PANEL_IMAGES.calendar}
        actions={monthStats.total > 0 ? (
          <div className="flex w-full items-center justify-between gap-3 rounded-xl bg-white/15 px-3 py-2.5 backdrop-blur-sm sm:w-auto sm:justify-start sm:rounded-2xl sm:px-4 sm:py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <Trophy className="h-4 w-4 shrink-0 text-amber-300" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide text-white/70 sm:text-xs sm:normal-case sm:tracking-normal">Bu Ay</p>
                <p className="truncate text-sm font-bold">{monthStats.done}/{monthStats.total} tamamlandı</p>
              </div>
            </div>
            <div className="relative h-9 w-9 shrink-0 sm:h-8 sm:w-8">
              <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
                <circle
                  cx="16" cy="16" r="13" fill="none" stroke="white" strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 13}`}
                  strokeDashoffset={`${2 * Math.PI * 13 * (1 - monthStats.pct / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">
                {monthStats.pct}%
              </span>
            </div>
          </div>
        ) : null}
      />

      {/* ANTRENMAN MÜSAİTLİĞİ */}
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
              <p className="font-semibold text-cream-900">Antrenman Müsaitliğim</p>
              <p className="text-xs text-cream-800/55">
                {Object.values(user?.availability || {}).filter((v) => v?.length > 0).length > 0
                  ? `${Object.values(user?.availability || {}).filter((v) => v?.length > 0).length} antrenman günü seçili`
                  : 'Antrenman yapabileceğiniz gün ve saatleri belirleyin'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 sm:block">
              Koç programı için
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
              const dayEntries = getProgramEntriesForDate(myPrograms, day, user)
              const { workout: dayWorkout, nutrition: dayNutrition } = splitEntriesByType(dayEntries)
              const dayMealGroups = groupEntriesByMeal(dayNutrition)
              const dayTaskTotal = dayWorkout.length + dayMealGroups.length
              const dayKeys = completedActivities[dateStr] || []
              const dayDone = dayTaskTotal > 0
                ? dayWorkout.filter((e) => dayKeys.includes(completionKey(dateStr, e.id))).length
                  + dayMealGroups.filter((g) =>
                    isMealCompleted(completedActivities, dateStr, g.mealType, g.entries)
                  ).length
                : 0
              const allDone = dayTaskTotal > 0 && dayDone === dayTaskTotal

              return (
                <motion.button
                  key={day.toISOString()}
                  type="button"
                  whileHover={inMonth && dots.length > 0 ? { scale: 1.05 } : {}}
                  whileTap={inMonth ? { scale: 0.97 } : {}}
                  onClick={() => openDay(day)}
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
                  {inMonth && dayTaskTotal > 0 && dayDone > 0 && !allDone && (
                    <div className="mt-auto w-full">
                      <div className="h-0.5 overflow-hidden rounded-full bg-cream-200">
                        <div
                          className={`h-0.5 rounded-full ${selected ? 'bg-white/60' : 'bg-brand-400'}`}
                          style={{ width: `${(dayDone / dayTaskTotal) * 100}%` }}
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
            <CheckCircle className="h-3 w-3 text-sage-500" /> Tamamlanan gün
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
            isMealDone={isMealDone}
            onToggle={toggleActivity}
            onToggleMeal={toggleMeal}
            expandedEntryId={expandedEntryId}
            onExpandEntry={setExpandedEntryId}
            onClose={() => { setSelectedDate(null); setExpandedEntryId(null) }}
            saving={saving}
            canComplete
          />
        )}
      </AnimatePresence>
    </PanelPageShell>
  )
}

// ── Gün Detay Paneli (tam ekran modal) ──────────────────────────────
function DayDetailPanel({ date, entries, completion, isDone, isMealDone, onToggle, onToggleMeal, expandedEntryId, onExpandEntry, onClose, saving, canComplete }) {
  const { workout: workoutEntries, nutrition: nutritionEntries } = splitEntriesByType(entries)
  const mealGroups = groupEntriesByMeal(nutritionEntries)
  const [detailExercise, setDetailExercise] = useState(null)

  const today = isToday(date)
  const progressPct = completion.total > 0 ? Math.round((completion.done / completion.total) * 100) : 0

  const openExerciseDetail = useCallback((entry) => {
    const base = entryToExerciseDetail(entry)
    setDetailExercise(base)
    if (entry.videoUrl) prefetchExerciseVideo(entry.videoUrl)
    if (entry.exerciseId) {
      fetchExerciseById(entry.exerciseId).then((ex) => {
        if (!ex) return
        setDetailExercise((prev) => (prev ? {
          ...prev,
          ...ex,
          name: ex.name || prev.name,
          exerciseName: ex.name || prev.exerciseName,
          videoUrl: prev.videoUrl || ex.videoUrl,
          videoPending: prev.videoPending ?? ex.videoPending,
        } : ex))
      })
    }
  }, [])

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
      />

      <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="pointer-events-auto flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        >
        <div className={`relative shrink-0 px-6 py-5 ${today ? 'bg-gradient-to-r from-brand-500 to-sage-600' : 'bg-gradient-to-r from-cream-50 to-white'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`absolute right-4 top-4 rounded-xl p-2 transition ${today ? 'text-white hover:bg-white/20' : 'text-cream-800 hover:bg-cream-100'}`}
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

          {completion.total > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className={today ? 'text-white/80' : 'text-cream-800/60'}>
                  {completion.done}/{completion.total} görev tamamlandı
                </span>
                <span className={`font-bold ${today ? 'text-white' : 'text-brand-600'}`}>{progressPct}%</span>
              </div>
              <div className={`mt-1.5 h-2 overflow-hidden rounded-full ${today ? 'bg-white/20' : 'bg-cream-200'}`}>
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

        <div className="min-h-0 flex-1 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="h-10 w-10 text-cream-300" />
              <p className="mt-3 font-semibold text-cream-800/60">Bu gün için program yok</p>
              <p className="mt-1 text-sm text-cream-800/40">Koç programı ve diyet listesi eklendikçe burada görünür.</p>
            </div>
          ) : (
            <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-cream-100">
              <div className="min-h-[200px]">
                <div className="flex items-center gap-2.5 border-b border-brand-100 bg-brand-50 px-5 py-3 text-brand-700">
                  <Apple className="h-4 w-4" />
                  <span className="text-sm font-semibold">Diyet Listesi</span>
                  <span className="ml-auto text-xs font-medium">{mealGroups.length} öğün</span>
                </div>
                {mealGroups.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-cream-800/45">Bu gün için diyet listesi yok</p>
                ) : (
                  <div className="divide-y divide-cream-50">
                    {mealGroups.map((group) => (
                      <MealGroupRow
                        key={group.mealType}
                        group={group}
                        done={isMealDone(group.mealType, group.entries)}
                        onToggle={() => onToggleMeal(group.mealType, group.entries.map((e) => e.id))}
                        saving={saving}
                        canComplete={canComplete}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="min-h-[200px]">
                <div className="flex items-center gap-2.5 border-b border-brand-100 bg-brand-50/80 px-5 py-3 text-brand-800">
                  <Dumbbell className="h-4 w-4" />
                  <span className="text-sm font-semibold">Koç Programı</span>
                  <span className="ml-auto text-xs font-medium">{workoutEntries.length} hareket</span>
                </div>
                {workoutEntries.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-cream-800/45">Bu gün için antrenman yok</p>
                ) : (
                  <div className="divide-y divide-cream-50">
                    {workoutEntries.map((entry) => (
                      <ActivityRow
                        key={entry.id}
                        entry={entry}
                        done={isDone(entry.id)}
                        onToggle={() => onToggle(entry.id)}
                        expanded={expandedEntryId === entry.id}
                        onExpand={() => onExpandEntry(expandedEntryId === entry.id ? null : entry.id)}
                        onOpenDetail={() => openExerciseDetail(entry)}
                        saving={saving}
                        canComplete={canComplete}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        </motion.div>
      </div>

      <ExerciseDetailModal
        open={!!detailExercise}
        onClose={() => setDetailExercise(null)}
        exercise={detailExercise}
        zClass="z-[70]"
      />
    </>
  )
}

function MealGroupRow({ group, done, onToggle, saving, canComplete }) {
  const content = mealContentText(group.entries)
  const note = group.entries.find((e) => e.note)?.note

  return (
    <div className={`px-5 py-4 ${done ? 'bg-sage-50/60' : 'bg-white'}`}>
      <div className="flex items-start gap-3">
        {canComplete ? (
          <button type="button" onClick={onToggle} disabled={saving} className="mt-0.5 shrink-0">
            {done ? <CheckCircle className="h-6 w-6 text-sage-500" /> : <Circle className="h-6 w-6 text-cream-300" />}
          </button>
        ) : (
          <Circle className="mt-0.5 h-6 w-6 shrink-0 text-cream-300" />
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-bold ${done ? 'text-sage-700 line-through' : 'text-sage-800'}`}>
            {group.label}
          </p>
          {content && (
            <div className="mt-2 rounded-xl bg-sage-50/80 px-3 py-2.5 ring-1 ring-sage-100">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-sage-600/80">Öğün içeriği</p>
              <p className={`mt-1 text-sm leading-relaxed ${done ? 'text-cream-800/50' : 'text-cream-900'}`}>{content}</p>
            </div>
          )}
          {note && (
            <p className="mt-2 text-xs text-cream-800/55">
              <span className="font-medium text-cream-800/70">Not: </span>{note}
            </p>
          )}
          {done && (
            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-sage-600">
              <Zap className="h-3 w-3" /> Öğün tamamlandı
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Aktivite Satırı ─────────────────────────────────────────────────
function ActivityRow({ entry, done, onToggle, expanded, onExpand, onOpenDetail, saving, canComplete }) {
  const displayName = entry.exerciseName || entry.name || 'Aktivite'
  const isNutrition = entry.programType === 'nutrition' || entry.mealType
  const hasVideo = Boolean(entry.videoUrl)

  return (
    <motion.div
      layout
      className={`px-6 py-4 transition-colors ${done ? 'bg-sage-50/60' : 'bg-white hover:bg-cream-50/50'}`}
    >
      <div className="flex items-start gap-3">
        {canComplete ? (
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
        ) : (
          <Circle className="mt-0.5 h-6 w-6 shrink-0 text-cream-300" />
        )}

        {hasVideo && !isNutrition && (
          <button
            type="button"
            onClick={onOpenDetail}
            onMouseEnter={() => prefetchExerciseVideo(entry.videoUrl)}
            onFocus={() => prefetchExerciseVideo(entry.videoUrl)}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            title="Hareket detayı"
          >
            <ExerciseVideoThumbnail
              url={entry.videoUrl}
              videoPending={entry.videoPending}
              size="xs"
              accent="brand"
            />
          </button>
        )}

        <div className="min-w-0 flex-1">
          {isNutrition && entry.mealType && (
            <p className="text-[10px] font-bold uppercase tracking-wide text-sage-600">{mealLabel(entry.mealType)}</p>
          )}
          <p className={`font-semibold leading-snug ${done ? 'text-cream-800/40 line-through' : 'text-cream-900'}`}>
            {displayName}
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

          <AnimatePresence>
            {expanded && entry.videoUrl && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 overflow-hidden rounded-xl border border-cream-200 bg-cream-50 p-2"
              >
                <VideoPlayer url={entry.videoUrl} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {hasVideo && (
          <button
            type="button"
            onClick={onExpand}
            className={`shrink-0 flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
              expanded
                ? 'border-brand-400 bg-brand-100 text-brand-800'
                : 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100'
            }`}
          >
            <PlayCircle className="h-3.5 w-3.5" />
            {expanded ? 'Gizle' : 'İzle'}
          </button>
        )}
      </div>

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

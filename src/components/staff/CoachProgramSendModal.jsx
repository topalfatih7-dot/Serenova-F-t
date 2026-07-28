import { useMemo, useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CalendarDays, Send, AlertTriangle, Sparkles } from 'lucide-react'
import Modal from '../ui/Modal'
import { useToast } from '../../context/ToastContext'
import { getDateInputBounds } from '../../utils/programPackageScope'
import {
  summarizeRangeAvailability,
  formatRangeSummary,
  cycleLengthFromRange,
} from '../../utils/memberAvailability'
import { CYCLE_PLAN_LENGTH } from '../../utils/programSchedule'
import {
  buildWeeklyCoachProgramPayload,
  buildCoachProgramTitle,
  filledWeekdaysFromDayCarts,
  weekdayFullLabel,
  weekdayShortLabel,
  DEFAULT_SESSION_TIME,
} from '../../utils/coachProgram'

const DAY_CHIP = {
  1: 'bg-sky-100 text-sky-800 ring-sky-200',
  2: 'bg-teal-100 text-teal-800 ring-teal-200',
  3: 'bg-amber-100 text-amber-900 ring-amber-200',
  4: 'bg-brand-100 text-brand-800 ring-brand-200',
  5: 'bg-sage-100 text-sage-800 ring-sage-200',
  6: 'bg-orange-100 text-orange-900 ring-orange-200',
  0: 'bg-rose-100 text-rose-800 ring-rose-200',
}

/** Haftalık şablon önizleme + gönderim */
export default function CoachProgramSendModal({
  open,
  onClose,
  member,
  dayCarts,
  dateMode = 'fixed14',
  onDateModeChange,
  rangeStart,
  rangeEnd,
  onRangeChange,
  packageRange,
  onSubmit,
  submitting = false,
}) {
  const { toast } = useToast()
  const [description, setDescription] = useState('')

  const dateBounds = useMemo(
    () => getDateInputBounds(packageRange, { cycleLength: dateMode === 'fixed14' ? CYCLE_PLAN_LENGTH : 0 }),
    [packageRange, dateMode],
  )
  const customBounds = useMemo(() => getDateInputBounds(packageRange), [packageRange])
  const filledDays = useMemo(() => filledWeekdaysFromDayCarts(dayCarts), [dayCarts])

  const availabilitySummary = useMemo(
    () => summarizeRangeAvailability(rangeStart, rangeEnd, member?.availability),
    [rangeStart, rangeEnd, member?.availability],
  )

  const autoTitle = useMemo(
    () => buildCoachProgramTitle(
      member?.name || 'Danışan',
      rangeStart,
      rangeEnd,
      dateMode === 'fixed14' ? 'fixed14' : 'weekly',
    ),
    [member?.name, rangeStart, rangeEnd, dateMode],
  )

  const emptyAvailableDays = useMemo(() => {
    const workout = availabilitySummary.workoutWeekdays || []
    const filledLabels = new Set(filledDays.map(weekdayFullLabel))
    return workout.filter((label) => !filledLabels.has(label))
  }, [availabilitySummary.workoutWeekdays, filledDays])

  useEffect(() => {
    if (!open) setDescription('')
  }, [open])

  const handleSubmit = () => {
    if (!filledDays.length) {
      toast('En az bir güne hareket ekleyin', 'error')
      return
    }
    if (rangeEnd < rangeStart) {
      toast('Bitiş tarihi başlangıçtan önce olamaz', 'error')
      return
    }
    if (!availabilitySummary.hasWorkoutDays) {
      toast('Danışan antrenman günü belirtmemiş. Önce müsaitlik doldurmasını isteyin.', 'error')
      return
    }
    if (availabilitySummary.activeCount === 0) {
      toast('Seçilen tarih aralığında danışanın antrenman günü yok', 'error')
      return
    }

    const daySessionTimes = Object.fromEntries(
      filledDays.map((day) => [day, DEFAULT_SESSION_TIME]),
    )

    const payload = buildWeeklyCoachProgramPayload({
      dayCarts,
      daySessionTimes,
      startDate: rangeStart,
      endDate: rangeEnd,
      description,
      sessionDuration: 45,
      memberName: member?.name || 'Danışan',
      titleMode: dateMode === 'fixed14' ? 'fixed14' : 'weekly',
    })

    onSubmit(payload, availabilitySummary)
  }

  return (
    <Modal open={open} onClose={onClose} title="Programı Gönder" size="lg">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-sky-500 to-teal-500 p-4 text-white shadow-lg shadow-brand-500/20">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/80">
            <Sparkles className="h-3.5 w-3.5" /> Program başlığı
          </p>
          <p className="mt-1.5 text-base font-bold leading-snug">{autoTitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-cream-50 p-1.5">
          {[
            { id: 'fixed14', label: '14 Günlük' },
            { id: 'custom', label: 'Başlangıç – Bitiş' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onDateModeChange?.(m.id)}
              className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                dateMode === m.id
                  ? 'bg-gradient-to-r from-brand-500 to-sky-500 text-white shadow'
                  : 'text-cream-800/70 hover:bg-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {dateMode === 'fixed14' ? (
          <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-700">
              <CalendarDays className="h-3.5 w-3.5" /> Başlangıç tarihi
            </label>
            <input
              type="date"
              value={rangeStart}
              min={dateBounds.min}
              max={dateBounds.max}
              onChange={(e) => onRangeChange?.({ start: e.target.value, end: rangeEnd })}
              className="mt-2 w-full rounded-xl border border-sky-100 bg-white px-3 py-2.5 text-sm"
            />
            <p className="mt-2 text-sm text-sky-900/70">
              Bitiş:{' '}
              <strong>{format(parseISO(`${rangeEnd}T12:00:00`), 'd MMMM yyyy', { locale: tr })}</strong>
              {' '}({CYCLE_PLAN_LENGTH} gün)
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-700">
                <CalendarDays className="h-3.5 w-3.5" /> Başlangıç
              </label>
              <input
                type="date"
                value={rangeStart}
                min={customBounds.min}
                max={customBounds.max}
                onChange={(e) => onRangeChange?.({ start: e.target.value, end: rangeEnd })}
                className="mt-2 w-full rounded-xl border border-sky-100 bg-white px-3 py-2.5 text-sm"
              />
            </div>
            <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-teal-700">Bitiş</label>
              <input
                type="date"
                value={rangeEnd}
                min={rangeStart || customBounds.min}
                max={customBounds.max}
                onChange={(e) => onRangeChange?.({ start: rangeStart, end: e.target.value })}
                className="mt-2 w-full rounded-xl border border-teal-100 bg-white px-3 py-2.5 text-sm"
              />
            </div>
            <p className="sm:col-span-2 text-sm text-cream-800/60">
              {formatRangeSummary(rangeStart, rangeEnd)}
              {' · '}
              {cycleLengthFromRange(rangeStart, rangeEnd)} gün
              {packageRange?.end ? ` · paket ${packageRange.end}` : ''}
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-cream-100 bg-gradient-to-br from-cream-50 to-white p-4">
          <p className="mb-3 text-sm font-bold text-cream-900">Dolu günler</p>
          <div className="flex flex-wrap gap-2">
            {filledDays.map((day) => {
              const count = dayCarts[day]?.length || 0
              return (
                <span
                  key={day}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${DAY_CHIP[day] || DAY_CHIP[4]}`}
                >
                  {weekdayShortLabel(day)} · {count} hareket
                </span>
              )
            })}
          </div>
          {emptyAvailableDays.length > 0 && (
            <p className="mt-3 text-xs text-cream-800/50">
              Boş: {emptyAvailableDays.join(', ')}
            </p>
          )}
        </div>

        {!availabilitySummary.hasWorkoutDays && (
          <div className="flex gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="leading-relaxed">Danışan henüz antrenman günü belirtmemiş. Program gönderilemez.</p>
          </div>
        )}

        {availabilitySummary.hasWorkoutDays && availabilitySummary.blockedCount > 0 && (
          <div className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="leading-relaxed">
              Aralıkta {availabilitySummary.activeCount} antrenman gününe yazılır;
              müsait olmayan {availabilitySummary.blockedCount} gün atlanır.
            </p>
          </div>
        )}

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Not ekle (opsiyonel)"
          rows={2}
          className="w-full rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 via-sky-500 to-teal-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 hover:brightness-105 disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {submitting ? 'Gönderiliyor…' : 'Programı Gönder'}
        </button>
      </div>
    </Modal>
  )
}

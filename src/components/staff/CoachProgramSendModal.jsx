import { useMemo, useState } from 'react'
import { format, addDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CalendarDays, Clock, Timer, Send, AlertTriangle } from 'lucide-react'
import Modal from '../ui/Modal'
import { useToast } from '../../context/ToastContext'
import { CYCLE_PLAN_LENGTH } from '../../utils/programSchedule'
import { getDateInputBounds } from '../../utils/programPackageScope'
import {
  summarizeRangeAvailability,
  formatRangeSummary,
  cycleLengthFromRange,
} from '../../utils/memberAvailability'
import {
  buildCoachProgramPayload,
  buildCoachProgramTitle,
  COACH_DURATION_PRESETS,
  COACH_SESSION_TIME_OPTIONS,
} from '../../utils/coachProgram'

export default function CoachProgramSendModal({
  open,
  onClose,
  member,
  cartEntries,
  packageRange,
  onSubmit,
  submitting = false,
}) {
  const { toast } = useToast()
  const [dateMode, setDateMode] = useState('fixed14')
  const [cycleStartDate, setCycleStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [rangeStart, setRangeStart] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [rangeEnd, setRangeEnd] = useState(format(addDays(new Date(), 6), 'yyyy-MM-dd'))
  const [description, setDescription] = useState('')
  const [sessionDuration, setSessionDuration] = useState(45)
  const [sessionTime, setSessionTime] = useState({ start: '09:00', end: '10:00' })

  const fixedEndDate = useMemo(
    () => format(addDays(new Date(`${cycleStartDate}T12:00:00`), CYCLE_PLAN_LENGTH - 1), 'yyyy-MM-dd'),
    [cycleStartDate],
  )

  const activeStart = dateMode === 'fixed14' ? cycleStartDate : rangeStart
  const activeEnd = dateMode === 'fixed14' ? fixedEndDate : rangeEnd

  const dateBounds = useMemo(
    () => getDateInputBounds(packageRange, { cycleLength: dateMode === 'fixed14' ? CYCLE_PLAN_LENGTH : 0 }),
    [packageRange, dateMode],
  )

  const singleBounds = useMemo(() => getDateInputBounds(packageRange), [packageRange])

  const availabilitySummary = useMemo(
    () => summarizeRangeAvailability(activeStart, activeEnd, member?.availability),
    [activeStart, activeEnd, member?.availability],
  )

  const autoTitle = useMemo(
    () => buildCoachProgramTitle(member?.name || 'Danışan', activeStart, activeEnd, dateMode),
    [member?.name, activeStart, activeEnd, dateMode],
  )

  const handleSubmit = () => {
    if (!cartEntries.length) {
      toast('En az bir hareket ekleyin', 'error')
      return
    }
    if (dateMode === 'custom' && rangeEnd < rangeStart) {
      toast('Bitiş tarihi başlangıçtan önce olamaz', 'error')
      return
    }
    if (sessionTime.end <= sessionTime.start) {
      toast('Seans bitiş saati başlangıçtan sonra olmalı', 'error')
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

    const payload = buildCoachProgramPayload({
      cartEntries,
      startDate: activeStart,
      endDate: activeEnd,
      description,
      sessionDuration,
      sessionTime,
      memberName: member?.name || 'Danışan',
      dateMode,
    })

    onSubmit(payload, availabilitySummary)
  }

  return (
    <Modal open={open} onClose={onClose} title="Programı Gönder" size="lg">
      <div className="space-y-4">
        <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Otomatik başlık</p>
          <p className="mt-1 text-sm font-medium text-cream-900">{autoTitle}</p>
        </div>

        <div className="flex gap-2 rounded-xl bg-cream-50 p-1">
          {[
            { id: 'fixed14', label: '14 Günlük' },
            { id: 'custom', label: 'Başlangıç – Bitiş' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setDateMode(m.id)}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                dateMode === m.id ? 'bg-brand-500 text-white shadow' : 'text-cream-800/70 hover:bg-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {dateMode === 'fixed14' ? (
          <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
              <CalendarDays className="h-3.5 w-3.5" />
              Başlangıç tarihi
            </label>
            <input
              type="date"
              value={cycleStartDate}
              min={dateBounds.min}
              max={dateBounds.max}
              onChange={(e) => setCycleStartDate(e.target.value)}
              className="mt-2 w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm"
            />
            <p className="mt-1.5 text-[11px] text-brand-800/70">
              Bitiş: <strong>{format(new Date(`${fixedEndDate}T12:00:00`), 'd MMMM yyyy', { locale: tr })}</strong>
              {' '}(14 gün)
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-brand-700">Başlangıç</label>
              <input
                type="date"
                value={rangeStart}
                min={singleBounds.min}
                max={singleBounds.max}
                onChange={(e) => setRangeStart(e.target.value)}
                className="mt-2 w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-brand-700">Bitiş</label>
              <input
                type="date"
                value={rangeEnd}
                min={rangeStart || singleBounds.min}
                max={singleBounds.max}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="mt-2 w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <p className="sm:col-span-2 text-[11px] text-brand-800/70">
              {formatRangeSummary(rangeStart, rangeEnd)}
              {' · '}
              {cycleLengthFromRange(rangeStart, rangeEnd)} gün
            </p>
          </div>
        )}

        {packageRange && (
          <p className="text-[11px] text-cream-800/55">
            Paket süresi: {packageRange.start}{packageRange.end ? ` — ${packageRange.end}` : ' (süresiz)'}
          </p>
        )}

        {!availabilitySummary.hasWorkoutDays && (
          <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="leading-relaxed">
              Danışan henüz antrenman günü belirtmemiş. Program gönderilemez; danışandan takvimde
              <strong> Antrenman Müsaitliği </strong>
              bölümünü doldurmasını isteyin.
            </p>
          </div>
        )}

        {availabilitySummary.hasWorkoutDays && availabilitySummary.blockedCount > 0 && (
          <div className="flex gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-xs text-brand-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Yalnızca antrenman günlerine yazılacak</p>
              <p className="mt-0.5 leading-relaxed text-brand-900/85">
                Danışanın antrenman günleri: <strong>{availabilitySummary.workoutWeekdays.join(', ')}</strong>.
                {' '}Seçilen aralıkta {availabilitySummary.blockedCount} gün atlanır;
                program {availabilitySummary.activeCount} antrenman gününe yansır.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-3">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Timer className="h-4 w-4 text-brand-500" />
            <span className="text-sm font-medium text-cream-800">Ortalama antrenman süresi</span>
            <div className="ml-auto flex flex-wrap gap-1">
              {COACH_DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSessionDuration(d)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    sessionDuration === d ? 'bg-brand-500 text-white' : 'border border-cream-200 bg-white text-cream-800'
                  }`}
                >
                  {d} dk
                </button>
              ))}
            </div>
          </div>

          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
            <Clock className="h-3.5 w-3.5" /> Seans saati
          </p>
          <div className="flex items-center gap-2">
            <select
              value={sessionTime.start}
              onChange={(e) => setSessionTime({ ...sessionTime, start: e.target.value })}
              className="flex-1 rounded-lg border border-cream-200 bg-white px-2 py-2 text-sm"
            >
              {COACH_SESSION_TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className="text-sm text-cream-800/40">–</span>
            <select
              value={sessionTime.end}
              onChange={(e) => setSessionTime({ ...sessionTime, end: e.target.value })}
              className="flex-1 rounded-lg border border-cream-200 bg-white px-2 py-2 text-sm"
            >
              {COACH_SESSION_TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Genel notlar (opsiyonel)"
          rows={2}
          className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {submitting ? 'Gönderiliyor…' : 'Programı Gönder'}
        </button>
      </div>
    </Modal>
  )
}

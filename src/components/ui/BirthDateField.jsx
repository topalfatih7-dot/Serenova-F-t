import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import Modal from './Modal'
import { ageFromBirthDate } from '../../utils/birthDate'

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']

function toISODate(d) {
  return format(d, 'yyyy-MM-dd')
}

/**
 * Doğum tarihi seçici — ayrı modal (üst form kapanmaz).
 */
export default function BirthDateField({
  label = 'Doğum Tarihi',
  value = '',
  onChange,
  error,
  hint,
}) {
  const [open, setOpen] = useState(false)

  const selected = useMemo(() => {
    if (!value) return null
    try {
      const d = parseISO(value)
      return Number.isNaN(d.getTime()) ? null : d
    } catch {
      return null
    }
  }, [value])

  const [viewMonth, setViewMonth] = useState(() => (selected || new Date(2000, 0, 1)).getMonth())
  const [viewYear, setViewYear] = useState(() => (selected || new Date(2000, 0, 1)).getFullYear())
  const view = useMemo(() => new Date(viewYear, viewMonth, 1), [viewYear, viewMonth])

  const openCalendar = () => {
    const base = selected || new Date(2000, 0, 1)
    setViewMonth(base.getMonth())
    setViewYear(base.getFullYear())
    setOpen(true)
  }

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(view), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(view), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [view])

  const today = startOfDay(new Date())
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
  const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())

  const display = selected
    ? format(selected, 'd MMMM yyyy', { locale: tr })
    : 'Tarih seçin'
  const age = selected ? ageFromBirthDate(toISODate(selected)) : null

  const pick = (day) => {
    if (isAfter(day, maxDate) || isBefore(day, minDate)) return
    onChange?.(toISODate(day))
    setOpen(false)
  }

  const shiftMonth = (delta) => {
    const next = addMonths(view, delta)
    setViewMonth(next.getMonth())
    setViewYear(next.getFullYear())
  }

  return (
    <div>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">
        {label}
      </span>
      <button
        type="button"
        onClick={openCalendar}
        className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
          error
            ? 'border-red-400 bg-red-50/50'
            : open
              ? 'border-brand-400 bg-white ring-4 ring-brand-100'
              : 'border-brand-200/80 bg-gradient-to-br from-brand-50/80 via-white to-sage-50/40 hover:border-brand-300'
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm shadow-brand-200/50">
          <CalendarDays className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-sm font-semibold ${selected ? 'text-cream-900' : 'text-cream-800/45'}`}>
            {display}
          </span>
          {age != null && (
            <span className="mt-0.5 block text-[11px] font-medium text-brand-600/80">{age} yaş</span>
          )}
        </span>
      </button>

      {error ? (
        <span className="mt-2 block text-xs font-medium text-red-500">{error}</span>
      ) : hint ? (
        <span className="mt-2 block text-xs text-cream-800/50">{hint}</span>
      ) : null}

      <Modal open={open} onClose={() => setOpen(false)} title="Doğum Tarihi Seç" size="sm" zClass="z-[70]">
        <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-3 text-white">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25"
              aria-label="Önceki ay"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="font-display text-sm font-bold capitalize sm:text-base">
              {format(view, 'MMMM yyyy', { locale: tr })}
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25"
              aria-label="Sonraki ay"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-cream-100 px-3 py-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-cream-800/45">Ay</span>
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="w-full rounded-xl border border-brand-100 bg-brand-50/50 px-2.5 py-2 text-sm font-semibold text-cream-900 outline-none focus:border-brand-400"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {format(new Date(2000, i, 1), 'MMMM', { locale: tr })}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-cream-800/45">Yıl</span>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="w-full rounded-xl border border-brand-100 bg-brand-50/50 px-2.5 py-2 text-sm font-semibold text-cream-900 outline-none focus:border-brand-400"
              >
                {Array.from({ length: maxDate.getFullYear() - minDate.getFullYear() + 1 }, (_, i) => {
                  const y = maxDate.getFullYear() - i
                  return (
                    <option key={y} value={y}>{y}</option>
                  )
                })}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-7 gap-0.5 px-2 pb-1 pt-3">
            {WEEKDAYS.map((d) => (
              <span key={d} className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-brand-600/60">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 px-2 pb-4">
            {days.map((day) => {
              const inMonth = isSameMonth(day, view)
              const isSelected = selected && isSameDay(day, selected)
              const disabled = isAfter(day, maxDate) || isBefore(day, minDate)
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(day)}
                  className={`flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition ${
                    isSelected
                      ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-200/50'
                      : disabled
                        ? 'cursor-not-allowed text-cream-300'
                        : inMonth
                          ? 'text-cream-900 hover:bg-brand-50 hover:text-brand-800'
                          : 'text-cream-800/30 hover:bg-cream-50'
                  }`}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
        </div>

        {selected && (
          <p className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-sage-200 bg-sage-50 px-3 py-2 text-xs font-medium text-sage-800">
            <Check className="h-3.5 w-3.5" />
            Seçili: {display} · {age} yaş
          </p>
        )}
      </Modal>
    </div>
  )
}

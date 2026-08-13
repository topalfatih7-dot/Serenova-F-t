import { CalendarRange, Eraser, Check } from 'lucide-react'
import { AVAILABILITY_WEEKDAYS, countAvailabilitySlots } from '../../services/availability'

const DAY_START = 8
const DAY_END = 22
const DEFAULT_RANGE = { start: 9, end: 17 }

const START_OPTIONS = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i) // 8..21
const fmt = (h) => `${String(h).padStart(2, '0')}:00`

function hoursToRange(hours) {
  if (!hours || !hours.length) return null
  const nums = hours.map((h) => parseInt(h, 10)).sort((a, b) => a - b)
  return { start: nums[0], end: nums[nums.length - 1] + 1 }
}

function rangeToHours(start, end) {
  const out = []
  for (let h = start; h < end; h++) out.push(fmt(h))
  return out
}

const HINTS = {
  member: 'Antrenman yapabileceğiniz gün ve saatleri seçin; koçunuz programı yalnızca bu günlere yazar.',
  staff: 'Danışanlar yalnızca seçtiğiniz gün ve saatlerden randevu alır. Onay sonrası halka açık profilinizde ve randevu takviminde görünür.',
}

export default function WeeklyAvailability({ value = {}, onChange, variant = 'member', hint }) {
  const total = countAvailabilitySlots(value)
  const help = hint || HINTS[variant] || HINTS.member

  const toggleDay = (day) => {
    const updated = { ...value }
    if (updated[day]?.length) {
      delete updated[day]
    } else {
      updated[day] = rangeToHours(DEFAULT_RANGE.start, DEFAULT_RANGE.end)
    }
    onChange(updated)
  }

  const setRange = (day, patch) => {
    const current = hoursToRange(value[day]) || { ...DEFAULT_RANGE }
    let start = patch.start ?? current.start
    let end = patch.end ?? current.end
    if (end <= start) end = start + 1
    onChange({ ...value, [day]: rangeToHours(start, end) })
  }

  const clearAll = () => onChange({})

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const updated = { ...value }
            ;[1, 2, 3, 4, 5].forEach((d) => { updated[d] = rangeToHours(9, 17) })
            onChange(updated)
          }}
          className="min-h-10 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-medium text-cream-800 transition hover:border-brand-300 hover:bg-brand-50"
        >
          Hafta içi 09:00–17:00
        </button>
        <button
          type="button"
          onClick={() => {
            const updated = { ...value }
            ;[1, 2, 3, 4, 5, 6, 0].forEach((d) => { updated[d] = rangeToHours(18, 22) })
            onChange(updated)
          }}
          className="min-h-10 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-medium text-cream-800 transition hover:border-brand-300 hover:bg-brand-50"
        >
          Her gün akşam 18:00–22:00
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="ml-auto flex min-h-10 items-center gap-1.5 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-medium text-cream-800/70 transition hover:border-red-200 hover:text-red-500"
        >
          <Eraser className="h-3.5 w-3.5" /> Temizle
        </button>
      </div>

      <div className="space-y-2.5">
        {AVAILABILITY_WEEKDAYS.map((d) => {
          const range = hoursToRange(value[d.value])
          const active = !!range
          const cur = range || DEFAULT_RANGE
          return (
            <div
              key={d.value}
              className={`rounded-2xl border p-3 transition sm:p-3.5 ${active ? 'border-brand-200 bg-brand-50/40' : 'border-cream-200 bg-white'}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className="flex min-h-11 min-w-[8.5rem] items-center gap-2.5 text-left text-sm font-semibold text-cream-900"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
                      active ? 'border-brand-500 bg-brand-500 text-white' : 'border-cream-300 text-transparent'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  {d.label}
                </button>

                {active ? (
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-1 sm:items-center sm:gap-2">
                    <label className="block sm:flex-1">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-cream-800/45 sm:sr-only">Başlangıç</span>
                      <select
                        value={cur.start}
                        onChange={(e) => setRange(d.value, { start: Number(e.target.value) })}
                        className="h-11 w-full rounded-xl border border-cream-200 bg-white px-2.5 text-sm sm:h-auto sm:rounded-lg sm:py-1.5"
                      >
                        {START_OPTIONS.map((h) => (
                          <option key={h} value={h}>{fmt(h)}</option>
                        ))}
                      </select>
                    </label>
                    <span className="hidden text-cream-800/50 sm:inline">—</span>
                    <label className="block sm:flex-1">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-cream-800/45 sm:sr-only">Bitiş</span>
                      <select
                        value={cur.end}
                        onChange={(e) => setRange(d.value, { end: Number(e.target.value) })}
                        className="h-11 w-full rounded-xl border border-cream-200 bg-white px-2.5 text-sm sm:h-auto sm:rounded-lg sm:py-1.5"
                      >
                        {START_OPTIONS.filter((h) => h >= cur.start).map((h) => h + 1).map((h) => (
                          <option key={h} value={h}>{fmt(h)}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : (
                  <span className="text-xs text-cream-800/40">Bu gün uygun değilim</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-1 rounded-xl bg-cream-50 p-3 text-xs text-cream-800/60 sm:flex-row sm:items-center sm:gap-2">
        <CalendarRange className="h-4 w-4 shrink-0 text-brand-400" />
        <span>{help}</span>
        {total > 0 && <span className="font-semibold text-brand-600 sm:ml-auto">{total} saat seçildi</span>}
      </div>
    </div>
  )
}

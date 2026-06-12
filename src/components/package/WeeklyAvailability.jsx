import { CalendarRange, Sun, Moon, Eraser, Check } from 'lucide-react'
import { AVAILABILITY_HOURS, AVAILABILITY_WEEKDAYS, countAvailabilitySlots } from '../../services/availability'

const WEEKDAY_HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']
const EVENING_HOURS = ['18:00', '19:00', '20:00', '21:00']

export default function WeeklyAvailability({ value = {}, onChange }) {
  const total = countAvailabilitySlots(value)

  const toggle = (day, hour) => {
    const current = value[day] || []
    const next = current.includes(hour)
      ? current.filter((h) => h !== hour)
      : [...current, hour].sort()
    const updated = { ...value, [day]: next }
    if (!next.length) delete updated[day]
    onChange(updated)
  }

  const toggleDayAll = (day) => {
    const current = value[day] || []
    const updated = { ...value }
    if (current.length === AVAILABILITY_HOURS.length) {
      delete updated[day]
    } else {
      updated[day] = [...AVAILABILITY_HOURS]
    }
    onChange(updated)
  }

  const applyPreset = (days, hours) => {
    const updated = { ...value }
    days.forEach((d) => {
      const merged = new Set([...(updated[d] || []), ...hours])
      updated[d] = [...merged].sort()
    })
    onChange(updated)
  }

  const clearAll = () => onChange({})

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => applyPreset([1, 2, 3, 4, 5], WEEKDAY_HOURS)}
          className="flex items-center gap-1.5 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-medium text-cream-800 transition hover:border-brand-300 hover:bg-brand-50"
        >
          <Sun className="h-3.5 w-3.5 text-gold-500" /> Hafta içi gündüz
        </button>
        <button
          type="button"
          onClick={() => applyPreset([1, 2, 3, 4, 5, 6, 0], EVENING_HOURS)}
          className="flex items-center gap-1.5 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-medium text-cream-800 transition hover:border-brand-300 hover:bg-brand-50"
        >
          <Moon className="h-3.5 w-3.5 text-brand-500" /> Akşamlar
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="ml-auto flex items-center gap-1.5 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-medium text-cream-800/70 transition hover:border-red-200 hover:text-red-500"
        >
          <Eraser className="h-3.5 w-3.5" /> Temizle
        </button>
      </div>

      <div className="space-y-2.5">
        {AVAILABILITY_WEEKDAYS.map((d) => {
          const selected = value[d.value] || []
          const allOn = selected.length === AVAILABILITY_HOURS.length
          return (
            <div key={d.value} className="rounded-2xl border border-cream-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleDayAll(d.value)}
                  className="flex items-center gap-2 text-sm font-semibold text-cream-900"
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                      allOn ? 'border-brand-500 bg-brand-500 text-white' : 'border-cream-300 text-transparent'
                    }`}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {d.label}
                </button>
                {selected.length > 0 && (
                  <span className="text-[11px] font-medium text-brand-600">{selected.length} saat</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABILITY_HOURS.map((h) => {
                  const on = selected.includes(h)
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => toggle(d.value, h)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                        on
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'bg-cream-100 text-cream-800/70 hover:bg-brand-50 hover:text-brand-700'
                      }`}
                    >
                      {h}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-cream-50 p-3 text-xs text-cream-800/60">
        <CalendarRange className="h-4 w-4 shrink-0 text-brand-400" />
        Seçtiğiniz müsait saatler koçunuz ve diyetisyeniniz tarafından görüntülenir; görüşmeleriniz bu saatlere göre planlanır.
        {total > 0 && <span className="ml-auto font-semibold text-brand-600">{total} saat seçildi</span>}
      </div>
    </div>
  )
}

import { Dumbbell, Apple, CalendarClock } from 'lucide-react'

export const WEEKDAYS = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
  { value: 0, label: 'Pazar' },
]

export const DEFAULT_SUPPORT_SCHEDULE = {
  coachDay: 1,
  coachTime: '10:00',
  dietitianDay: 3,
  dietitianTime: '14:00',
}

export function weekdayLabel(value) {
  return WEEKDAYS.find((d) => d.value === Number(value))?.label || '—'
}

export default function SupportScheduler({ schedule, packageConfig, onChange }) {
  const value = { ...DEFAULT_SUPPORT_SCHEDULE, ...(schedule || {}) }
  const perWeek = Number(packageConfig?.coachMeetingsPerWeek) || 0
  const perMonth = Number(packageConfig?.dietitianMeetingsPerMonth) || 0

  const update = (patch) => onChange({ ...value, ...patch })

  if (perWeek === 0 && perMonth === 0) {
    return (
      <div className="rounded-2xl border border-cream-200 bg-cream-50 p-6 text-center text-sm text-cream-800/60">
        Seçtiğiniz pakette koç veya diyetisyen desteği bulunmuyor.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {perWeek > 0 && (
        <div className="rounded-2xl border border-cream-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <Dumbbell className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-cream-900">Koç Görüşmeleri</p>
              <p className="text-xs text-cream-800/60">Haftada {perWeek} görüşme · tercih ettiğiniz gün ve saat</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-cream-800/70">Gün</span>
              <select
                value={value.coachDay}
                onChange={(e) => update({ coachDay: Number(e.target.value) })}
                className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm"
              >
                {WEEKDAYS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-cream-800/70">Saat</span>
              <input
                type="time"
                value={value.coachTime}
                onChange={(e) => update({ coachTime: e.target.value })}
                className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm"
              />
            </label>
          </div>
        </div>
      )}

      {perMonth > 0 && (
        <div className="rounded-2xl border border-cream-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
              <Apple className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-cream-900">Diyetisyen Görüşmeleri</p>
              <p className="text-xs text-cream-800/60">Ayda {perMonth} görüşme · tercih ettiğiniz gün ve saat</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-cream-800/70">Gün</span>
              <select
                value={value.dietitianDay}
                onChange={(e) => update({ dietitianDay: Number(e.target.value) })}
                className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm"
              >
                {WEEKDAYS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-cream-800/70">Saat</span>
              <input
                type="time"
                value={value.dietitianTime}
                onChange={(e) => update({ dietitianTime: e.target.value })}
                className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm"
              />
            </label>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl bg-cream-50 p-3 text-xs text-cream-800/60">
        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
        Randevularınız program süresi boyunca seçtiğiniz gün ve saate göre otomatik oluşturulur. Bu tercihleri istediğiniz zaman profilinizden değiştirebilirsiniz.
      </div>
    </div>
  )
}

import { useEffect } from 'react'
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

export const TIME_OPTIONS = (() => {
  const out = []
  for (let h = 8; h <= 21; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 21) out.push(`${String(h).padStart(2, '0')}:30`)
  }
  return out
})()

export const DEFAULT_SUPPORT_SCHEDULE = { coachSlots: [], dietitianSlots: [] }

export function weekdayLabel(value) {
  return WEEKDAYS.find((d) => d.value === Number(value))?.label || '—'
}

const DEFAULT_COACH_SLOT = { day: 1, time: '10:00' }
const DEFAULT_DIET_SLOT = { day: 3, time: '14:00' }

// Slot dizisini istenen uzunluğa getirir
function normalizeSlots(slots, count, fallback) {
  const result = []
  for (let i = 0; i < count; i++) {
    result.push(slots?.[i] ? { ...slots[i] } : { ...fallback })
  }
  return result
}

export default function SupportScheduler({ schedule, packageConfig, onChange }) {
  const perMonthCoach = Number(packageConfig?.coachMeetingsPerMonth) || (Number(packageConfig?.coachMeetingsPerWeek) || 0) * 4
  const perWeek = perMonthCoach
  const perMonth = Number(packageConfig?.dietitianMeetingsPerMonth) || 0

  const coachSlots = normalizeSlots(schedule?.coachSlots, perWeek, DEFAULT_COACH_SLOT)
  const dietitianSlots = normalizeSlots(schedule?.dietitianSlots, perMonth, DEFAULT_DIET_SLOT)

  const emit = (nextCoach, nextDiet) => {
    const c = nextCoach || coachSlots
    const d = nextDiet || dietitianSlots
    onChange({
      coachSlots: c,
      dietitianSlots: d,
      // Geriye dönük uyumluluk (ilk slot)
      coachDay: c[0]?.day ?? null,
      coachTime: c[0]?.time ?? null,
      dietitianDay: d[0]?.day ?? null,
      dietitianTime: d[0]?.time ?? null,
    })
  }

  const updateCoach = (i, patch) => {
    const next = coachSlots.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    emit(next, null)
  }

  const updateDiet = (i, patch) => {
    const next = dietitianSlots.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    emit(null, next)
  }

  // Paket sayıları değiştiğinde slotları normalleştirip parent'a bildir
  useEffect(() => {
    const coachMismatch = (schedule?.coachSlots?.length || 0) !== perWeek
    const dietMismatch = (schedule?.dietitianSlots?.length || 0) !== perMonth
    if (coachMismatch || dietMismatch) {
      emit(coachSlots, dietitianSlots)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perWeek, perMonth])

  if (perWeek === 0 && perMonth === 0) {
    return (
      <div className="rounded-2xl border border-cream-200 bg-cream-50 p-6 text-center text-sm text-cream-800/60">
        Seçtiğiniz pakette koç veya diyetisyen desteği bulunmuyor.
      </div>
    )
  }

  const SlotRow = ({ slot, idx, onUpdate, accent }) => (
    <div className="grid gap-3 rounded-xl border border-cream-200 bg-cream-50/50 p-3 sm:grid-cols-[auto_1fr_1fr] sm:items-center">
      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${accent === 'coach' ? 'bg-brand-500' : 'bg-sage-500'}`}>
        {idx + 1}
      </span>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-cream-800/70">Gün</span>
        <select
          value={slot.day}
          onChange={(e) => onUpdate(idx, { day: Number(e.target.value) })}
          className="w-full rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-sm"
        >
          {WEEKDAYS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-cream-800/70">Saat</span>
        <select
          value={slot.time}
          onChange={(e) => onUpdate(idx, { time: e.target.value })}
          className="w-full rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-sm"
        >
          {TIME_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
    </div>
  )

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
              <p className="text-xs text-cream-800/60">Haftada {perWeek} görüşme · her görüşme için gün ve saat seçin</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {coachSlots.map((slot, i) => (
              <SlotRow key={i} slot={slot} idx={i} onUpdate={updateCoach} accent="coach" />
            ))}
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
              <p className="text-xs text-cream-800/60">Ayda {perMonth} görüşme · her görüşme için gün ve saat seçin</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {dietitianSlots.map((slot, i) => (
              <SlotRow key={i} slot={slot} idx={i} onUpdate={updateDiet} accent="diet" />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl bg-cream-50 p-3 text-xs text-cream-800/60">
        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
        Randevularınız program süresi boyunca seçtiğiniz gün ve saatlere göre otomatik oluşturulur. Bu tercihleri istediğiniz zaman profilinizden değiştirebilirsiniz.
      </div>
    </div>
  )
}

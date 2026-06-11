import { CalendarRange } from 'lucide-react'
import { formatAvailabilityRanges } from '../../services/availability'

export default function AvailabilityView({ value, emptyText = 'Müsaitlik belirtilmemiş' }) {
  const days = formatAvailabilityRanges(value || {})

  if (!days.length) {
    return <p className="text-sm text-cream-800/40">{emptyText}</p>
  }

  return (
    <div className="space-y-1.5">
      {days.map((d) => (
        <div key={d.value} className="flex items-start gap-3 rounded-lg bg-cream-50 px-3 py-2 text-sm">
          <span className="flex items-center gap-1.5 font-medium text-cream-900">
            <CalendarRange className="h-3.5 w-3.5 text-brand-400" /> {d.label}
          </span>
          <span className="flex flex-wrap gap-1.5">
            {d.ranges.map((r) => (
              <span key={r} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {r}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}

import { memo } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CheckCircle, LineChart, Minus } from 'lucide-react'

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

const ACCENT = {
  brand: {
    bar: 'bg-brand-500',
    barTrack: 'bg-brand-100',
    pct: 'text-brand-700',
    icon: 'text-brand-600',
    partial: 'text-brand-600',
    miss: 'bg-rose-300/80',
  },
  sage: {
    bar: 'bg-sage-500',
    barTrack: 'bg-sage-100',
    pct: 'text-sage-700',
    icon: 'text-sage-600',
    partial: 'text-sage-700',
    miss: 'bg-rose-300/80',
  },
}

function weekRangeLabel(week) {
  if (!week?.start || !week?.end) return ''
  return `${format(week.start, 'd')}–${format(week.end, 'd MMM', { locale: tr })}`
}

function pctOf(done, planned) {
  if (!planned) return null
  return Math.round((done / planned) * 100)
}

function DayCell({ day, metric, accent }) {
  const m = day[metric] || { planned: 0, done: 0 }
  const { planned, done } = m
  const a = ACCENT[accent] || ACCENT.brand

  if (day.isFuture) {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cream-100/80 text-[10px] text-cream-800/35"
        title="Gelecek"
        aria-label={`${DAY_NAMES[day._i] || ''} gelecek`}
      >
        ·
      </span>
    )
  }

  if (planned === 0) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center text-cream-800/30" title="Plan yok" aria-label="Plan yok">
        <Minus className="h-3.5 w-3.5" />
      </span>
    )
  }

  if (done === planned) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center" title={`${done}/${planned}`} aria-label={`Tamamlandı ${done}/${planned}`}>
        <CheckCircle className={`h-5 w-5 ${a.icon}`} />
      </span>
    )
  }

  if (done > 0 && done < planned) {
    return (
      <span
        className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${a.partial} ${a.barTrack}`}
        title={`${done}/${planned}`}
        aria-label={`Kısmi ${done}/${planned}`}
      >
        {done}/{planned}
      </span>
    )
  }

  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${a.miss}`}
      title={`0/${planned}`}
      aria-label={`Eksik 0/${planned}`}
    />
  )
}

function WeekSummary({ label, range, totals, accent }) {
  const a = ACCENT[accent] || ACCENT.brand
  const pct = pctOf(totals.done, totals.planned)
  const width = pct == null ? 0 : Math.min(100, pct)

  return (
    <div className="rounded-xl border border-cream-200/80 bg-cream-50/50 px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-cream-900">{label}</p>
        <p className="text-[10px] text-cream-800/50">{range}</p>
      </div>
      <p className="mt-1 font-display text-lg font-bold text-cream-900">
        {totals.done}
        <span className="text-sm font-medium text-cream-800/45"> / {totals.planned}</span>
        {pct != null && <span className={`ml-2 text-sm font-semibold ${a.pct}`}>%{pct}</span>}
      </p>
      <div className={`mt-2 h-1.5 overflow-hidden rounded-full ${a.barTrack}`}>
        <div className={`h-full rounded-full ${a.bar} transition-all`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function WeeklyAdherenceTable({ title, icon: Icon, accent = 'brand', metric = 'workout', data, emptyMessage }) {
  const prev = data?.prevWeek
  const curr = data?.thisWeek
  const prevTotals = prev?.[metric] || { planned: 0, done: 0 }
  const currTotals = curr?.[metric] || { planned: 0, done: 0 }
  const isEmpty = prevTotals.planned === 0 && currTotals.planned === 0

  if (isEmpty) {
    return (
      <div>
        <h3 className="flex items-center gap-2 font-semibold text-cream-900">
          {Icon && <Icon className={`h-4 w-4 ${accent === 'sage' ? 'text-sage-600' : 'text-brand-600'}`} />}
          {title}
        </h3>
        <div className="mt-4 flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-cream-800/50">
          <LineChart className="h-7 w-7 text-cream-800/30" />
          {emptyMessage || 'Veriniz burada görünecek'}
        </div>
      </div>
    )
  }

  const days = (curr?.days || []).map((d, i) => ({ ...d, _i: i }))
  const prevDays = (prev?.days || []).map((d, i) => ({ ...d, _i: i }))

  return (
    <div>
      <h3 className="flex items-center gap-2 font-semibold text-cream-900">
        {Icon && <Icon className={`h-4 w-4 ${accent === 'sage' ? 'text-sage-600' : 'text-brand-600'}`} />}
        {title}
      </h3>
      <p className="mt-0.5 text-xs text-cream-800/50">Geçen hafta ve bu hafta karşılaştırması</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <WeekSummary label="Geçen Hafta" range={weekRangeLabel(prev)} totals={prevTotals} accent={accent} />
        <WeekSummary label="Bu Hafta" range={weekRangeLabel(curr)} totals={currTotals} accent={accent} />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse text-center text-xs">
          <thead>
            <tr>
              <th scope="col" className="pb-1.5 pr-2 text-left font-medium text-cream-800/45"> </th>
              {DAY_NAMES.map((name) => (
                <th key={name} scope="col" className="pb-1.5 font-medium text-cream-800/55">{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="pr-2 text-left font-medium text-cream-800/55 whitespace-nowrap">Geçen</th>
              {prevDays.map((day) => (
                <td key={`p-${day.dateStr}`} className="py-1">
                  <div className="flex justify-center">
                    <DayCell day={day} metric={metric} accent={accent} />
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="pr-2 text-left font-medium text-cream-800/55 whitespace-nowrap">Bu hf</th>
              {days.map((day) => (
                <td key={`c-${day.dateStr}`} className="py-1">
                  <div className="flex justify-center">
                    <DayCell day={day} metric={metric} accent={accent} />
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default memo(WeeklyAdherenceTable)

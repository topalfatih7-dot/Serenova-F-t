import { useState, useMemo } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const TYPE_COLORS = {
  coach: 'bg-brand-500',
  dietitian: 'bg-sage-500',
  workout: 'bg-gold-400',
  reminder: 'bg-amber-400',
  checkin: 'bg-brand-300',
  group: 'bg-purple-400',
}

export default function CalendarView({ events = [], view: initialView = 'month' }) {
  const [current, setCurrent] = useState(new Date())
  const [view, setView] = useState(initialView)

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const eventsForDay = (day) => events.filter((e) => isSameDay(new Date(e.date), day))

  const weekDays = useMemo(() => {
    const start = startOfWeek(current, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end: endOfWeek(start, { weekStartsOn: 1 }) })
  }, [current])

  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCurrent(subMonths(current, 1))} className="rounded-lg p-2 hover:bg-cream-100">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="min-w-[140px] text-center font-display text-lg font-semibold capitalize text-cream-900">
            {format(current, 'MMMM yyyy', { locale: tr })}
          </h3>
          <button type="button" onClick={() => setCurrent(addMonths(current, 1))} className="rounded-lg p-2 hover:bg-cream-100">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex rounded-lg border border-cream-200 p-0.5">
          {['week', 'month'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                view === v ? 'bg-brand-500 text-white' : 'text-cream-800'
              }`}
            >
              {v === 'week' ? 'Hafta' : 'Ay'}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' ? (
        <>
          <div className="mb-2 grid grid-cols-7 gap-1">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-cream-800/50">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayEvents = eventsForDay(day)
              const inMonth = isSameMonth(day, current)
              const isToday = isSameDay(day, new Date())
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[72px] rounded-lg border p-1.5 ${
                    inMonth ? 'border-cream-100 bg-cream-50/30' : 'border-transparent bg-transparent opacity-40'
                  } ${isToday ? 'ring-2 ring-brand-300' : ''}`}
                >
                  <span className={`text-xs font-medium ${isToday ? 'text-brand-600' : 'text-cream-800'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={`truncate rounded px-1 py-0.5 text-[9px] text-white ${TYPE_COLORS[ev.type] || 'bg-cream-400'}`}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-cream-800/50">+{dayEvents.length - 2}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          {weekDays.map((day) => {
            const dayEvents = eventsForDay(day)
            const isToday = isSameDay(day, new Date())
            return (
              <div key={day.toISOString()} className={`rounded-xl border p-4 ${isToday ? 'border-brand-200 bg-brand-50/30' : 'border-cream-100'}`}>
                <p className="text-sm font-medium capitalize text-cream-900">
                  {format(day, 'EEEE d MMM', { locale: tr })}
                  {isToday && <span className="ml-2 text-xs text-brand-600">Bugün</span>}
                </p>
                {dayEvents.length === 0 ? (
                  <p className="mt-2 text-xs text-cream-800/40">Etkinlik yok</p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {dayEvents.map((ev) => (
                      <div key={ev.id} className="flex items-center gap-2 text-sm">
                        <span className={`h-2 w-2 rounded-full ${TYPE_COLORS[ev.type] || 'bg-cream-400'}`} />
                        <span>{ev.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3 border-t border-cream-100 pt-4">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5 text-xs text-cream-800/60">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            {type === 'coach' ? 'Koç' : type === 'dietitian' ? 'Diyetisyen' : type === 'workout' ? 'Antrenman' : type}
          </span>
        ))}
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { List, Apple, User } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import EmptyState from '../../components/ui/EmptyState'
import { useApp } from '../../context/AppContext'
import { mealLabel, mealContentText, formatEntrySchedule, dedupeDailyNutritionEntries, usesLegacyCycleDayRotation } from '../../utils/programSchedule'

export default function StaffListsPage() {
  const { staffUser, programs } = useApp()
  const [expanded, setExpanded] = useState(null)

  const mine = useMemo(
    () => (programs || []).filter((p) => p.staffId === staffUser.id && p.type === 'nutrition'),
    [programs, staffUser.id]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Beslenme Listelerim</h1>
        <p className="mt-1 text-sm text-cream-800/60">{mine.length} liste · danışan takviminde görünür</p>
      </div>

      {mine.length === 0 ? (
        <EmptyState
          icon={List}
          title="Henüz liste oluşturulmadı"
          description="Danışanlarım sayfasından bir danışan seçip beslenme listesi oluşturabilirsiniz."
        />
      ) : (
        <div className="space-y-3">
          {mine.map((p) => {
            const open = expanded === p.id
            const mealCount = p.scheduleType === 'cycle14' && !usesLegacyCycleDayRotation(p)
              ? dedupeDailyNutritionEntries(p.entries || []).length
              : new Set(
                  (p.entries || []).map((e) => `${e.cycleDay ?? e.date ?? e.day}_${e.mealType}`)
                ).size
            return (
              <div key={p.id} className="overflow-hidden rounded-2xl border border-cream-200 bg-white">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : p.id)}
                  className="flex w-full items-center gap-4 p-5 text-left"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
                    <Apple className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-cream-900">{p.title}</p>
                    {p.scheduleType === 'cycle14' && (
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-700">14 gün · her gün aynı</p>
                    )}
                    <p className="flex items-center gap-1.5 text-xs text-cream-800/50">
                      <User className="h-3 w-3" /> {p.memberName} · {format(new Date(p.createdAt), 'd MMM yyyy', { locale: tr })}
                    </p>
                  </div>
                  <span className="rounded-full bg-sage-50 px-2.5 py-0.5 text-xs font-semibold text-sage-700">
                    {mealCount} öğün
                  </span>
                </button>
                {open && (
                  <div className="border-t border-cream-100 px-5 pb-5 pt-4">
                    {p.description && <p className="mb-3 text-sm text-cream-800/70">{p.description}</p>}
                    {p.entries?.length > 0 ? (
                      <ul className="space-y-2">
                        {p.entries.map((entry) => (
                          <li key={entry.id} className="rounded-lg bg-sage-50/60 px-3 py-2.5 text-sm text-cream-800">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-700/80">
                              {formatEntrySchedule(entry, p)}
                            </p>
                            <p className="text-sm font-bold text-sage-800">{mealLabel(entry.mealType)}</p>
                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-cream-800/45">Öğün içeriği</p>
                            <p className="text-sm leading-relaxed">{entry.name || mealContentText([entry])}</p>
                            {entry.note ? <p className="mt-1 text-xs text-cream-800/55">Not: {entry.note}</p> : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="space-y-2">
                        {(p.items || []).map((item, i) => (
                          <li key={i} className="flex items-start gap-2 rounded-lg bg-cream-50 px-3 py-2 text-sm text-cream-800">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

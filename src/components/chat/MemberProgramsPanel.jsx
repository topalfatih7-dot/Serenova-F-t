import { useMemo } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Dumbbell, Apple, ClipboardList, Clock, UserCheck } from 'lucide-react'
import { AVAILABILITY_WEEKDAYS } from '../../services/availability'
import { mealLabel } from '../../utils/programSchedule'
import { isLibraryCatalogProgram } from '../../utils/coachProgram'

const dayName = (v) => AVAILABILITY_WEEKDAYS.find((d) => d.value === Number(v))?.label || ''

function groupKey(e) {
  if (e.date) return `date:${e.date}`
  if (e.day != null && e.day !== '') return `day:${e.day}`
  return 'other'
}

function groupLabel(key) {
  if (key.startsWith('date:')) {
    const d = key.slice(5)
    try {
      return format(new Date(`${d}T12:00:00`), 'd MMM yyyy', { locale: tr })
    } catch {
      return d
    }
  }
  if (key.startsWith('day:')) return dayName(key.slice(4))
  return 'Diğer'
}

function groupEntries(entries = []) {
  const groups = {}
  entries.forEach((e) => {
    const key = groupKey(e)
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  })
  return Object.keys(groups)
    .sort()
    .map((key) => ({ key, label: groupLabel(key), items: groups[key] }))
}

function amountText(e) {
  return e.amountType === 'duration' ? `${e.amount} ${e.durationUnit || 'sn'}` : `${e.amount} tekrar`
}

function ProgramBlock({ program }) {
  const groups = useMemo(() => groupEntries(program.entries || []), [program.entries])
  const isWorkout = program.type === 'workout'
  const Icon = isWorkout ? Dumbbell : Apple
  const headerCls = isWorkout
    ? 'from-brand-500 to-violet-600'
    : 'from-sage-500 to-emerald-600'

  return (
    <div className="overflow-hidden rounded-2xl border border-cream-100 bg-white shadow-sm">
      <div className={`bg-gradient-to-r ${headerCls} px-4 py-3 text-white`}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 opacity-90" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{program.title || (isWorkout ? 'Antrenman Programı' : 'Beslenme Listesi')}</p>
            <p className="text-[11px] text-white/75">
              {isWorkout ? 'Koç' : 'Diyetisyen'}: {program.staffName || '—'}
            </p>
          </div>
        </div>
      </div>
      <div className="max-h-64 space-y-3 overflow-y-auto p-3">
        {isLibraryCatalogProgram(program) ? (
          <p className="text-xs font-medium text-cream-800/70">
            Özel kütüphanedeki tüm hareketler açık. Kütüphane sayfasından izleyebilirsiniz.
          </p>
        ) : groups.length === 0 ? (
          <p className="text-xs text-cream-800/50">Henüz içerik eklenmemiş.</p>
        ) : null}
        {groups.map((g) => (
          <div key={g.key}>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-cream-800/45">{g.label}</p>
            <ul className="space-y-1.5">
              {g.items.map((item) => (
                <li key={item.id} className="rounded-xl bg-cream-50 px-3 py-2 text-xs text-cream-900">
                  {isWorkout ? (
                    <>
                      <span className="font-semibold">{item.exerciseName || item.name}</span>
                      {(item.start || item.amount) && (
                        <span className="mt-0.5 flex items-center gap-1 text-cream-800/55">
                          <Clock className="h-3 w-3" />
                          {item.start && item.end ? `${item.start}–${item.end}` : amountText(item)}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-sage-800">{mealLabel(item.mealType)}</span>
                      <p className="mt-0.5 text-cream-800/70">{item.name || item.note}</p>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Üyenin koç + diyetisyen programlarını yan yana gösterir.
 * Personel tarafında ekip koordinasyonu için karşılıklı erişim.
 */
export default function MemberProgramsPanel({ programs = [], memberName, compact = false, roleFilter }) {
  const workouts = programs.filter((p) => p.type === 'workout')
  const nutrition = programs.filter((p) => p.type === 'nutrition')
  const showWorkouts = roleFilter !== 'dietitian'
  const showNutrition = roleFilter !== 'coach'
  const visible = [
    ...(showWorkouts ? workouts : []),
    ...(showNutrition ? nutrition : []),
  ]

  if (!visible.length) {
    const emptyLabel = roleFilter === 'coach'
      ? 'Henüz antrenman programı yok'
      : roleFilter === 'dietitian'
        ? 'Henüz beslenme listesi yok'
        : 'Henüz program veya liste yok'
    return (
      <div className="rounded-xl border border-dashed border-cream-200 bg-cream-50/50 p-3 text-center">
        <ClipboardList className="mx-auto h-6 w-6 text-cream-300" />
        <p className="mt-1.5 text-xs font-medium text-cream-800/55">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      {memberName && !compact && (
        <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-50 to-brand-50 px-3 py-2">
          <UserCheck className="h-4 w-4 text-brand-600" />
          <p className="text-xs font-semibold text-cream-900">{memberName} — program özeti</p>
        </div>
      )}
      {showWorkouts && workouts.map((p) => <ProgramBlock key={p.id} program={p} />)}
      {showNutrition && nutrition.map((p) => <ProgramBlock key={p.id} program={p} />)}
    </div>
  )
}

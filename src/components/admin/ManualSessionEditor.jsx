import { Plus, Trash2, Dumbbell, Apple } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import AvailabilityView from '../package/AvailabilityView'
import {
  packageIncludesCoach,
  packageIncludesDietitian,
  getCoachMeetingsPerMonth,
} from '../../data/membershipPlans'

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function SessionList({ title, icon: Icon, color, sessions, staffName, onChange, maxHint }) {
  const add = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(10, 0, 0, 0)
    onChange([
      ...sessions,
      {
        id: uid('s'),
        type: title.includes('Koç') ? 'coach' : 'dietitian',
        title: title.includes('Koç') ? 'Koç Görüşmesi' : 'Diyetisyen Görüşmesi',
        date: d.toISOString(),
        duration: title.includes('Koç') ? 30 : 40,
        status: 'scheduled',
        coach: staffName || '',
      },
    ])
  }

  const updateDate = (id, localValue) => {
    if (!localValue) return
    const iso = new Date(localValue).toISOString()
    onChange(sessions.map((s) => (s.id === id ? { ...s, date: iso } : s)))
  }

  const remove = (id) => onChange(sessions.filter((s) => s.id !== id))

  const toLocalInput = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  return (
    <div className={`rounded-2xl border p-4 ${color.border} ${color.bg}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-cream-900">
          <Icon className={`h-4 w-4 ${color.icon}`} /> {title}
        </p>
        {maxHint && <span className="text-xs text-cream-800/50">{maxHint}</span>}
      </div>
      {sessions.length === 0 ? (
        <p className="text-xs text-cream-800/45">Henüz randevu eklenmedi</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-cream-200">
              <input
                type="datetime-local"
                value={toLocalInput(s.date)}
                onChange={(e) => updateDate(s.id, e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-cream-200 px-2 py-1.5 text-sm"
              />
              <span className="hidden text-xs text-cream-800/50 sm:inline">
                {format(new Date(s.date), 'd MMM yyyy, HH:mm', { locale: tr })}
              </span>
              <button type="button" onClick={() => remove(s.id)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={add}
        className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold ${color.btn}`}
      >
        <Plus className="h-4 w-4" /> Randevu Ekle
      </button>
    </div>
  )
}

export default function ManualSessionEditor({ member, coachName, dietitianName, coachSessions, dietitianSessions, onCoachChange, onDietitianChange }) {
  const pkg = member?.packageConfig || {}
  const showCoach = packageIncludesCoach(pkg)
  const showDiet = packageIncludesDietitian(pkg)
  const coachPerWeek = Number(pkg.coachMeetingsPerWeek) || 0
  const coachPerMonth = getCoachMeetingsPerMonth(pkg)
  const dietLimit = Number(pkg.dietitianMeetingsPerMonth) || 0

  if (!showCoach && !showDiet) {
    return (
      <section className="rounded-2xl border border-cream-200 bg-cream-50/50 p-4">
        <p className="text-sm text-cream-800/60">Bu pakette birebir koç veya diyetisyen görüşmesi bulunmuyor.</p>
      </section>
    )
  }

  return (
    <section className="space-y-4 rounded-2xl border border-cream-200 p-4">
      <div>
        <p className="text-sm font-semibold text-cream-900">Görüşme Randevuları</p>
        <p className="mt-1 text-xs text-cream-800/55">
          Müşterinin müsaitlik saatlerine ve paket limitlerine göre randevuları elle girin.
          {showCoach && (coachPerWeek > 0 ? ` · Koç: haftada ${coachPerWeek}` : ` · Koç: ayda ${coachPerMonth}`)}
          {showDiet && ` · Diyetisyen: ayda ${dietLimit}`}
        </p>
      </div>

      {member?.availability && Object.keys(member.availability).length > 0 && (
        <div className="rounded-xl bg-cream-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/50">Müşteri Müsaitliği</p>
          <AvailabilityView value={member.availability} />
        </div>
      )}

      {showCoach && (
        <SessionList
          title="Koç Randevuları"
          icon={Dumbbell}
          color={{ border: 'border-brand-200', bg: 'bg-brand-50/40', icon: 'text-brand-600', btn: 'bg-brand-100 text-brand-700 hover:bg-brand-200' }}
          sessions={coachSessions}
          staffName={coachName}
          onChange={onCoachChange}
          maxHint={coachPerWeek > 0 ? `Paket: haftada ${coachPerWeek} görüşme` : `Paket: ayda ${coachPerMonth} görüşme`}
        />
      )}

      {showDiet && (
        <SessionList
          title="Diyetisyen Randevuları"
          icon={Apple}
          color={{ border: 'border-sage-200', bg: 'bg-sage-50/40', icon: 'text-sage-600', btn: 'bg-sage-100 text-sage-700 hover:bg-sage-200' }}
          sessions={dietitianSessions}
          staffName={dietitianName}
          onChange={onDietitianChange}
          maxHint={`Paket: ayda ${dietLimit} görüşme`}
        />
      )}
    </section>
  )
}

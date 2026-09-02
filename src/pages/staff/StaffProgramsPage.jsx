import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ClipboardList, Dumbbell, Apple, User, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import EmptyState from '../../components/ui/EmptyState'
import { useApp } from '../../context/AppContext'
import { normalizeStaffRole } from '../../utils/staffRoles'

export default function StaffProgramsPage() {
  const { staffUser, programs } = useApp()
  const [expanded, setExpanded] = useState(null)

  const mine = useMemo(
    () => (programs || []).filter((p) => p.staffId === staffUser.id),
    [programs, staffUser.id]
  )

  const role = normalizeStaffRole(staffUser?.role)
  if (role === 'dietitian') {
    return <Navigate to="/staff/lists" replace />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Oluşturduğum Programlar</h1>
        <p className="mt-1 text-sm text-cream-800/60">{mine.length} program · danışanlara iletildi</p>
      </div>

      {mine.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Henüz program oluşturulmadı"
          description="Danışanlarım sayfasından bir danışan seçip program oluşturabilirsiniz."
        />
      ) : (
        <div className="space-y-3">
          {mine.map((p) => {
            const isWorkout = p.type === 'workout'
            const Icon = isWorkout ? Dumbbell : Apple
            const open = expanded === p.id
            return (
              <div key={p.id} className="overflow-hidden rounded-2xl border border-cream-200 bg-white">
                <div className="flex items-center gap-3 p-5">
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : p.id)}
                    className="flex min-w-0 flex-1 items-center gap-4 text-left"
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isWorkout ? 'bg-brand-100 text-brand-600' : 'bg-sage-100 text-sage-600'}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-cream-900">{p.title}</p>
                      <p className="flex items-center gap-1.5 text-xs text-cream-800/50">
                        <User className="h-3 w-3" /> {p.memberName} · {format(new Date(p.createdAt), 'd MMM yyyy', { locale: tr })}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isWorkout ? 'bg-brand-50 text-brand-700' : 'bg-sage-50 text-sage-700'}`}>
                      {isWorkout ? 'Antrenman' : 'Beslenme'}
                    </span>
                  </button>
                  <Link
                    to={`/staff/programs/${p.id}/edit`}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${
                      isWorkout
                        ? 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100'
                        : 'border-sage-200 bg-sage-50 text-sage-700 hover:bg-sage-100'
                    }`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Düzenle
                  </Link>
                </div>
                {open && (
                  <div className="border-t border-cream-100 px-5 pb-5 pt-4">
                    {p.description && <p className="mb-3 text-sm text-cream-800/70">{p.description}</p>}
                    {p.items?.length > 0 && (
                      <ul className="space-y-2">
                        {p.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 rounded-lg bg-cream-50 px-3 py-2 text-sm text-cream-800">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
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

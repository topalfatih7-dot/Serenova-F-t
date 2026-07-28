import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO, addDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  Search, Dumbbell, Apple, Eye, Pencil, Trash2, Filter, CalendarDays,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { weekdayShortLabel, entryToDisplayText } from '../../utils/coachProgram'
import { mealLabel } from '../../utils/programSchedule'

const TYPE_FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'workout', label: 'Antrenman' },
  { id: 'nutrition', label: 'Beslenme' },
]

function programType(p) {
  return p?.type === 'nutrition' ? 'nutrition' : 'workout'
}

function formatCreated(iso) {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'd MMM yyyy', { locale: tr })
  } catch {
    return '—'
  }
}

function rangeSummary(p) {
  if (!p?.cycleStartDate) return '—'
  try {
    const start = parseISO(`${p.cycleStartDate}T12:00:00`)
    const len = Number(p.cycleLength) || 1
    const end = addDays(start, len - 1)
    return `${format(start, 'd MMM', { locale: tr })} – ${format(end, 'd MMM yyyy', { locale: tr })}`
  } catch {
    return p.cycleStartDate
  }
}

function ViewProgramSheet({ program, member, onClose }) {
  if (!program) return null
  const isNutrition = programType(program) === 'nutrition'
  const entries = Array.isArray(program.entries) ? program.entries : []

  return (
    <Modal open={!!program} onClose={onClose} title={program.title || 'Program'} size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-semibold ring-1 ${isNutrition ? 'bg-sage-50 text-sage-700 ring-sage-200' : 'bg-brand-50 text-brand-700 ring-brand-200'}`}>
            {isNutrition ? 'Beslenme' : 'Antrenman'}
          </span>
          <span className="rounded-full bg-cream-50 px-2.5 py-1 font-medium text-cream-800/70 ring-1 ring-cream-200">
            {member?.name || program.memberName || '—'}
          </span>
          <span className="rounded-full bg-cream-50 px-2.5 py-1 font-medium text-cream-800/70 ring-1 ring-cream-200">
            {program.staffName || '—'}
          </span>
        </div>
        {program.description && (
          <p className="rounded-xl bg-cream-50 px-3 py-2 text-sm text-cream-800/75">{program.description}</p>
        )}
        <p className="text-xs font-medium text-cream-800/50">Aralık: {rangeSummary(program)}</p>
        <div className="max-h-[50vh] space-y-2 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="py-6 text-center text-sm text-cream-800/50">Kayıt yok</p>
          ) : isNutrition ? (
            entries.slice(0, 80).map((e, i) => (
              <div key={e.id || i} className="rounded-xl border border-cream-100 bg-white px-3 py-2 text-sm">
                <span className="font-medium text-cream-900">{mealLabel(e.mealType)}</span>
                {e.start ? <span className="text-cream-800/45"> · {e.start}</span> : null}
                {e.day != null ? <span className="text-cream-800/45"> · {weekdayShortLabel(e.day)}</span> : null}
                {e.date ? <span className="text-cream-800/45"> · {e.date}</span> : null}
                <p className="mt-0.5 text-cream-800/70">{e.name}{e.note ? ` (${e.note})` : ''}</p>
              </div>
            ))
          ) : (
            entries.slice(0, 80).map((e, i) => (
              <div key={e.id || i} className="rounded-xl border border-cream-100 bg-white px-3 py-2 text-sm text-cream-800/80">
                {entryToDisplayText(e)}
              </div>
            ))
          )}
          {entries.length > 80 && (
            <p className="text-center text-xs text-cream-800/45">+{entries.length - 80} kayıt daha</p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-cream-100 pt-3">
          <Link
            to={`/admin/programs/${program.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Pencil className="h-3.5 w-3.5" /> Düzenle
          </Link>
        </div>
      </div>
    </Modal>
  )
}

export default function AdminProgramsPage() {
  const { platform, deleteProgram } = useApp()
  const { toast } = useToast()
  const [typeFilter, setTypeFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [staffQuery, setStaffQuery] = useState('')
  const [viewProgram, setViewProgram] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const membersById = useMemo(() => {
    const map = new Map()
    for (const m of platform.members || []) map.set(String(m.id), m)
    return map
  }, [platform.members])

  const programs = useMemo(() => {
    const list = [...(platform.programs || [])]
    list.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    return list
  }, [platform.programs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sq = staffQuery.trim().toLowerCase()
    return programs.filter((p) => {
      const t = programType(p)
      if (typeFilter !== 'all' && t !== typeFilter) return false
      const member = membersById.get(String(p.memberId))
      const memberName = (member?.name || p.memberName || '').toLowerCase()
      const memberEmail = (member?.email || '').toLowerCase()
      if (q && !memberName.includes(q) && !memberEmail.includes(q) && !(p.title || '').toLowerCase().includes(q)) {
        return false
      }
      const staffName = (p.staffName || '').toLowerCase()
      if (sq && !staffName.includes(sq)) return false
      return true
    })
  }, [programs, typeFilter, query, staffQuery, membersById])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await deleteProgram(deleteTarget.id)
      if (res?.success) {
        toast('Program silindi', 'info')
        setDeleteTarget(null)
        if (viewProgram?.id === deleteTarget.id) setViewProgram(null)
      } else {
        toast(res?.error || 'Silinemedi', 'error')
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Programlar</h1>
        <p className="mt-1 text-sm text-cream-800/60">Antrenman ve beslenme listelerini görüntüle, düzenle veya sil</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-cream-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap gap-1.5 rounded-xl bg-cream-50 p-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTypeFilter(f.id)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                typeFilter === f.id ? 'bg-white text-cream-900 shadow-sm' : 'text-cream-800/55 hover:text-cream-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Üye adı, e-posta veya başlık…"
            className="w-full rounded-xl border border-cream-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-300"
          />
        </div>
        <div className="relative min-w-[160px] sm:w-52">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/35" />
          <input
            value={staffQuery}
            onChange={(e) => setStaffQuery(e.target.value)}
            placeholder="Personel…"
            className="w-full rounded-xl border border-cream-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-300"
          />
        </div>
      </div>

      <p className="text-xs font-medium text-cream-800/45">{filtered.length} / {programs.length} program</p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Program bulunamadı"
          description={programs.length === 0 ? 'Henüz kayıtlı program yok.' : 'Filtreleri değiştirmeyi deneyin.'}
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-cream-200 bg-white lg:block">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-cream-100 text-left text-cream-800/55">
                  <th className="px-4 py-3 font-medium">Üye</th>
                  <th className="px-4 py-3 font-medium">Tip</th>
                  <th className="px-4 py-3 font-medium">Başlık</th>
                  <th className="px-4 py-3 font-medium">Aralık</th>
                  <th className="px-4 py-3 font-medium">Personel</th>
                  <th className="px-4 py-3 font-medium">Oluşturma</th>
                  <th className="px-4 py-3 font-medium">Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const member = membersById.get(String(p.memberId))
                  const isNutrition = programType(p) === 'nutrition'
                  return (
                    <tr key={p.id} className="border-b border-cream-50 hover:bg-cream-50/40">
                      <td className="px-4 py-3">
                        <p className="font-medium text-cream-900">{member?.name || p.memberName || '—'}</p>
                        <p className="text-xs text-cream-800/45">{member?.email || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${isNutrition ? 'bg-sage-50 text-sage-700' : 'bg-brand-50 text-brand-700'}`}>
                          {isNutrition ? <Apple className="h-3 w-3" /> : <Dumbbell className="h-3 w-3" />}
                          {isNutrition ? 'Beslenme' : 'Antrenman'}
                        </span>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-cream-800/80">{p.title || '—'}</td>
                      <td className="px-4 py-3 text-cream-800/65">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5 text-cream-800/35" />
                          {rangeSummary(p)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-cream-800/70">{p.staffName || '—'}</td>
                      <td className="px-4 py-3 text-cream-800/55">{formatCreated(p.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setViewProgram(p)} className="rounded-lg p-2 text-cream-800/50 hover:bg-cream-100 hover:text-cream-900" title="Görüntüle">
                            <Eye className="h-4 w-4" />
                          </button>
                          <Link to={`/admin/programs/${p.id}/edit`} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50" title="Düzenle">
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button type="button" onClick={() => setDeleteTarget(p)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" title="Sil">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {filtered.map((p) => {
              const member = membersById.get(String(p.memberId))
              const isNutrition = programType(p) === 'nutrition'
              return (
                <div key={p.id} className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-cream-900">{member?.name || p.memberName || '—'}</p>
                      <p className="truncate text-xs text-cream-800/45">{p.title}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isNutrition ? 'bg-sage-50 text-sage-700' : 'bg-brand-50 text-brand-700'}`}>
                      {isNutrition ? 'Beslenme' : 'Antrenman'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-cream-800/55">{rangeSummary(p)} · {p.staffName || '—'}</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setViewProgram(p)} className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-cream-200 py-2 text-xs font-semibold text-cream-800">
                      <Eye className="h-3.5 w-3.5" /> Gör
                    </button>
                    <Link to={`/admin/programs/${p.id}/edit`} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-brand-500 py-2 text-xs font-semibold text-white">
                      <Pencil className="h-3.5 w-3.5" /> Düzenle
                    </Link>
                    <button type="button" onClick={() => setDeleteTarget(p)} className="rounded-xl border border-rose-200 px-3 py-2 text-rose-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <ViewProgramSheet
        program={viewProgram}
        member={viewProgram ? membersById.get(String(viewProgram.memberId)) : null}
        onClose={() => setViewProgram(null)}
      />

      <Modal open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} title="Programı Sil">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-cream-800/70">
              <strong className="text-cream-900">{deleteTarget.title || 'Bu program'}</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-cream-200 px-4 py-2.5 text-sm font-semibold text-cream-800"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
              >
                {deleting ? 'Siliniyor…' : 'Sil'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

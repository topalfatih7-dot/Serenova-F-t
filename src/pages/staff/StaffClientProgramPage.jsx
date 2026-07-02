import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Search, Dumbbell, Plus, Check, Trash2, Video, Send, ShoppingBag,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { getStaffClients } from '../../utils/chatAccess'
import CoachProgramSendModal from '../../components/staff/CoachProgramSendModal'
import {
  memberHasWorkoutAvailability,
  workoutWeekdayLabels,
} from '../../utils/memberAvailability'
import AvailabilityView from '../../components/package/AvailabilityView'
import {
  findEntriesOutsidePackage,
  getMemberPackageDateRange,
  getPackageWindowsForProgramType,
  isDateInPackageWindows,
  memberHasProgramTypePackage,
} from '../../utils/programPackageScope'
import { format, addDays } from 'date-fns'
import { CYCLE_PLAN_LENGTH } from '../../utils/programSchedule'

function createCartEntry(ex) {
  return {
    id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    exerciseId: ex.id,
    exerciseName: ex.name,
    videoUrl: ex.videoUrl || '',
    description: ex.description || '',
    amountType: 'reps',
    amount: 12,
    durationUnit: 'sn',
    note: '',
  }
}

export default function StaffClientProgramPage() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const { staffUser, platform, createProgram, exercises } = useApp()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [sendOpen, setSendOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isCoach = staffUser?.role === 'coach'

  const member = useMemo(() => {
    const clients = getStaffClients(platform.members, staffUser?.role, staffUser?.id)
    return clients.find((m) => String(m.id) === String(memberId)) || null
  }, [platform.members, staffUser?.role, staffUser?.id, memberId])

  const packageRange = useMemo(
    () => (member ? getMemberPackageDateRange(member, 'workout') : null),
    [member],
  )

  const filteredExercises = useMemo(
    () => (exercises || []).filter((ex) =>
      !search
      || ex.name.toLowerCase().includes(search.toLowerCase())
      || (ex.category || '').toLowerCase().includes(search.toLowerCase()),
    ),
    [exercises, search],
  )

  const cartExerciseIds = useMemo(() => new Set(cart.map((e) => e.exerciseId)), [cart])

  if (!isCoach) {
    return <Navigate to="/staff/clients" replace />
  }

  if (!member) {
    return (
      <div className="space-y-4">
        <Link to="/staff/clients" className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" /> Danışanlarım
        </Link>
        <p className="text-sm text-cream-800/60">Danışan bulunamadı veya size atanmamış.</p>
      </div>
    )
  }

  const addToCart = (ex) => {
    if (cartExerciseIds.has(ex.id)) {
      toast('Bu hareket zaten sepette', 'info')
      return
    }
    setCart((list) => [...list, createCartEntry(ex)])
  }

  const updateCartItem = (id, patch) => {
    setCart((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  const removeFromCart = (id) => {
    setCart((list) => list.filter((e) => e.id !== id))
  }

  const handleSubmit = async (data) => {
    if (!memberHasWorkoutAvailability(member.availability)) {
      toast('Danışan antrenman günü belirtmemiş', 'error')
      return
    }
    if (!memberHasProgramTypePackage(member, 'workout')) {
      toast('Üyenin aktif koç paketi yok', 'error')
      return
    }

    const outside = findEntriesOutsidePackage(data.entries || [], member, 'workout')
    if (outside.length) {
      toast('Program tarihleri paket süresi dışında', 'error')
      return
    }

    const windows = getPackageWindowsForProgramType(member, 'workout')
    const start = data.cycleStartDate
    const end = format(
      addDays(new Date(`${start}T12:00:00`), (data.cycleLength || CYCLE_PLAN_LENGTH) - 1),
      'yyyy-MM-dd',
    )

    if (!isDateInPackageWindows(start, windows)) {
      toast('Başlangıç tarihi paket süresi içinde olmalı', 'error')
      return
    }
    if (!isDateInPackageWindows(end, windows)) {
      toast('Program bitiş tarihi paket süresini aşıyor', 'error')
      return
    }

    setSubmitting(true)
    try {
      const created = await createProgram({
        type: 'workout',
        memberId: member.id,
        memberName: member.name,
        staffId: staffUser.id,
        staffName: staffUser.name,
        ...data,
      })
      if (!created) {
        toast('Program kaydedilemedi. Lütfen tekrar deneyin.', 'error')
        return
      }
      toast(`${member.name} için program gönderildi`, 'success')
      navigate('/staff/clients')
    } finally {
      setSubmitting(false)
      setSendOpen(false)
    }
  }

  return (
    <div className="space-y-6 pb-28 lg:pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/staff/clients"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Danışanlarım
          </Link>
          <h1 className="font-display text-2xl font-bold text-cream-900">{member.name}</h1>
          <p className="mt-1 text-sm text-cream-800/60">Antrenman programı hazırlayın · kütüphaneden hareket ekleyin</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-2 text-sm">
          <ShoppingBag className="h-4 w-4 text-brand-500" />
          <span className="font-semibold text-brand-700">{cart.length} hareket</span>
        </div>
      </div>

      <div className={`rounded-2xl border p-4 ${memberHasWorkoutAvailability(member.availability) ? 'border-brand-100 bg-brand-50/40' : 'border-amber-200 bg-amber-50/60'}`}>
        <p className="text-sm font-semibold text-cream-900">Antrenman günleri</p>
        {memberHasWorkoutAvailability(member.availability) ? (
          <>
            <p className="mt-1 text-xs text-cream-800/65">
              Program yalnızca şu günlere yazılır: <strong>{workoutWeekdayLabels(member.availability).join(', ')}</strong>
            </p>
            <div className="mt-3">
              <AvailabilityView value={member.availability} emptyText="—" />
            </div>
          </>
        ) : (
          <p className="mt-1 text-xs leading-relaxed text-amber-900/85">
            Danışan antrenman müsaitliği belirtmemiş. Program gönderilemez; danışandan takvimde
            antrenman günlerini doldurmasını isteyin.
          </p>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-400" />
            <input
              type="text"
              placeholder="Hareket ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-cream-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-300"
            />
          </div>

          {filteredExercises.length === 0 ? (
            <p className="py-12 text-center text-sm text-cream-800/50">Hareket bulunamadı</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredExercises.map((ex) => {
                const inCart = cartExerciseIds.has(ex.id)
                return (
                  <div
                    key={ex.id}
                    className={`flex flex-col rounded-2xl border p-4 transition ${
                      inCart ? 'border-brand-200 bg-brand-50/40' : 'border-cream-200 bg-white hover:border-brand-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full bg-sage-50 px-2 py-0.5 text-[10px] font-semibold text-sage-700">
                        {ex.category || 'Genel'}
                      </span>
                      {ex.videoUrl && <Video className="h-4 w-4 shrink-0 text-brand-300" />}
                    </div>
                    <p className="mt-2 font-semibold text-cream-900">{ex.name}</p>
                    <p className="mt-1 line-clamp-2 flex-1 text-xs text-cream-800/55">
                      {ex.description || 'Açıklama yok'}
                    </p>
                    <button
                      type="button"
                      onClick={() => addToCart(ex)}
                      disabled={inCart}
                      className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${
                        inCart
                          ? 'cursor-default bg-brand-100 text-brand-600'
                          : 'bg-brand-500 text-white hover:bg-brand-600 active:scale-[0.98]'
                      }`}
                    >
                      {inCart ? <><Check className="h-3.5 w-3.5" /> Sepette</> : <><Plus className="h-3.5 w-3.5" /> Sepete Ekle</>}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <aside className="xl:sticky xl:top-4 xl:self-start">
          <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-cream-900">
              <Dumbbell className="h-4 w-4 text-brand-500" />
              Program Sepeti
            </p>
            {cart.length === 0 ? (
              <p className="py-8 text-center text-xs text-cream-800/45">Kütüphaneden hareket ekleyin</p>
            ) : (
              <div className="max-h-[min(60vh,520px)] space-y-2 overflow-y-auto">
                {cart.map((e) => (
                  <div key={e.id} className="rounded-xl border border-cream-100 bg-cream-50 p-2.5">
                    <div className="flex items-start gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-cream-900">{e.exerciseName}</p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(e.id)}
                        className="shrink-0 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <select
                        value={e.amountType}
                        onChange={(ev) => updateCartItem(e.id, { amountType: ev.target.value })}
                        className="rounded-md border border-cream-200 bg-white px-2 py-1 text-[11px]"
                      >
                        <option value="reps">Tekrar</option>
                        <option value="duration">Süre</option>
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={e.amount}
                        onChange={(ev) => updateCartItem(e.id, { amount: Number(ev.target.value) || 1 })}
                        className="w-14 rounded-md border border-cream-200 bg-white px-2 py-1 text-center text-sm"
                      />
                      {e.amountType === 'duration' && (
                        <select
                          value={e.durationUnit}
                          onChange={(ev) => updateCartItem(e.id, { durationUnit: ev.target.value })}
                          className="rounded-md border border-cream-200 bg-white px-2 py-1 text-[11px]"
                        >
                          <option value="sn">sn</option>
                          <option value="dk">dk</option>
                        </select>
                      )}
                    </div>
                    <input
                      value={e.note}
                      onChange={(ev) => updateCartItem(e.id, { note: ev.target.value })}
                      placeholder="Not (ör. 3 set)"
                      className="mt-2 w-full rounded-md border border-cream-200 bg-white px-2 py-1 text-xs"
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (!cart.length) { toast('En az bir hareket ekleyin', 'error'); return }
                setSendOpen(true)
              }}
              className="mt-4 hidden w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 xl:flex"
            >
              <Send className="h-4 w-4" /> Gönder
            </button>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-white/95 p-4 backdrop-blur xl:hidden">
        <button
          type="button"
          onClick={() => {
            if (!cart.length) { toast('En az bir hareket ekleyin', 'error'); return }
            setSendOpen(true)
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white"
        >
          <Send className="h-4 w-4" /> Gönder ({cart.length} hareket)
        </button>
      </div>

      <CoachProgramSendModal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        member={member}
        cartEntries={cart}
        packageRange={packageRange}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  )
}

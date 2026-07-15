import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Dumbbell, Plus, Check, Trash2, Send, ShoppingBag, Loader2, PlayCircle,
  ChevronUp, ChevronDown, Minus, ListChecks,
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import VideoPlayer from '../../components/ui/VideoPlayer'
import ExerciseVideoThumbnail from '../../components/library/ExerciseVideoThumbnail'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { useExerciseLibrary } from '../../hooks/useExerciseLibrary'
import ExercisePagination from '../../components/library/ExercisePagination'
import ExerciseLibraryFilters, { DIFFICULTY_ALL, EXERCISE_CATEGORY_ALL, FILTER_ALL } from '../../components/library/ExerciseLibraryFilters'
import { DIFFICULTY_LABELS, formatExerciseLocations } from '../../data/exerciseTurkish'
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
import { prefetchExerciseVideo } from '../../utils/exerciseVideoPrefetch'
import { CYCLE_PLAN_LENGTH } from '../../utils/programSchedule'

function createCartEntry(ex) {
  return {
    id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    exerciseId: ex.id,
    exerciseName: ex.name,
    videoUrl: ex.videoUrl || '',
    videoPending: Boolean(ex.videoPending),
    description: ex.description || '',
    amountType: 'reps',
    amount: 12,
    durationUnit: 'sn',
    note: '',
  }
}

/** Program Akışı — tek hareket satırı (thumbnail + dokunmatik kontroller) */
function CartEntryCard({ entry, index, isFirst, isLast, onPatch, onRemove, onMove, onPreview }) {
  const iconBtn = 'flex h-9 w-9 items-center justify-center rounded-lg transition active:scale-95 sm:h-8 sm:w-8'
  const hasVideo = Boolean(entry.videoUrl || entry.videoPending)
  return (
    <div className="overflow-hidden rounded-2xl border border-cream-100/90 bg-gradient-to-br from-white to-cream-50/40 shadow-sm ring-1 ring-cream-100/60">
      <div className="flex gap-3 p-3">
        <button
          type="button"
          disabled={!hasVideo}
          onClick={() => hasVideo && onPreview?.(entry)}
          onPointerEnter={() => hasVideo && prefetchExerciseVideo(entry.videoUrl)}
          onPointerDown={() => hasVideo && prefetchExerciseVideo(entry.videoUrl)}
          className={`relative shrink-0 ${hasVideo ? 'cursor-pointer' : 'cursor-default'}`}
          aria-label={hasVideo ? 'Videoyu önizle' : undefined}
        >
          <ExerciseVideoThumbnail
            url={entry.videoUrl}
            videoPending={entry.videoPending}
            size="list"
            accent="brand"
            fallbackIcon={Dumbbell}
          />
          <span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {index + 1}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-cream-900">{entry.exerciseName}</p>
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => onMove(entry.id, -1)}
                disabled={isFirst}
                className={`${iconBtn} text-cream-800/40 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-20`}
                aria-label="Yukarı taşı"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onMove(entry.id, 1)}
                disabled={isLast}
                className={`${iconBtn} text-cream-800/40 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-20`}
                aria-label="Aşağı taşı"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(entry.id)}
                className={`${iconBtn} text-red-400 hover:bg-red-50 hover:text-red-600`}
                aria-label="Hareketi çıkar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <div className="flex rounded-lg bg-cream-100/80 p-0.5" role="group" aria-label="Miktar tipi">
              {[
                { id: 'reps', label: 'Tekrar' },
                { id: 'duration', label: 'Süre' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onPatch(entry.id, { amountType: m.id })}
                  className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition sm:py-1 ${
                    entry.amountType === m.id ? 'bg-white text-brand-700 shadow-sm' : 'text-cream-800/50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-center overflow-hidden rounded-lg border border-cream-200/80 bg-white">
              <button
                type="button"
                onClick={() => onPatch(entry.id, { amount: Math.max(1, (Number(entry.amount) || 1) - 1) })}
                className="flex h-8 w-8 items-center justify-center text-cream-800/55 transition hover:bg-cream-50 active:scale-95"
                aria-label="Azalt"
              >
                <Minus className="h-3 w-3" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={entry.amount}
                onChange={(ev) => onPatch(entry.id, { amount: Number(ev.target.value) || 1 })}
                aria-label="Miktar"
                className="h-8 w-10 border-x border-cream-100 bg-white text-center text-sm font-bold text-cream-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => onPatch(entry.id, { amount: (Number(entry.amount) || 0) + 1 })}
                className="flex h-8 w-8 items-center justify-center text-cream-800/55 transition hover:bg-cream-50 active:scale-95"
                aria-label="Artır"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {entry.amountType === 'duration' ? (
              <div className="flex rounded-lg bg-cream-100/80 p-0.5" role="group" aria-label="Süre birimi">
                {['sn', 'dk'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => onPatch(entry.id, { durationUnit: u })}
                    className={`rounded-md px-2 py-1.5 text-[11px] font-semibold transition sm:py-1 ${
                      entry.durationUnit === u ? 'bg-white text-brand-700 shadow-sm' : 'text-cream-800/50'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-[11px] font-medium text-cream-800/40">tekrar</span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-cream-100/80 px-3 pb-3 pt-2">
        <input
          value={entry.note}
          onChange={(ev) => onPatch(entry.id, { note: ev.target.value })}
          placeholder="Not ekle (ör. 3 set, yavaş tempo)"
          className="w-full rounded-xl border border-cream-200/70 bg-white/80 px-3 py-2 text-sm outline-none transition placeholder:text-cream-800/35 focus:border-brand-300 focus:bg-white"
        />
      </div>
    </div>
  )
}

/** Program Akışı — hareket listesi + boş durum (masaüstü panel ve mobil sheet ortak) */
function CartList({ cart, onPatch, onRemove, onMove, onPreview, className = '' }) {
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-400">
          <Dumbbell className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-semibold text-cream-900">Henüz hareket yok</p>
          <p className="mt-1 text-xs leading-relaxed text-cream-800/50">
            Kütüphaneden hareket ekleyin —<br />seçtikleriniz burada sıralanır
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className={`space-y-2.5 ${className}`}>
      {cart.map((e, idx) => (
        <CartEntryCard
          key={e.id}
          entry={e}
          index={idx}
          isFirst={idx === 0}
          isLast={idx === cart.length - 1}
          onPatch={onPatch}
          onRemove={onRemove}
          onMove={onMove}
          onPreview={onPreview}
        />
      ))}
    </div>
  )
}

export default function StaffClientProgramPage() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const { staffUser, platform, createProgram } = useApp()
  const { toast } = useToast()
  const [searchInput, setSearchInput] = useState('')
  const [category, setCategory] = useState(EXERCISE_CATEGORY_ALL)
  const [difficulty, setDifficulty] = useState(DIFFICULTY_ALL)
  const [location, setLocation] = useState(FILTER_ALL)
  const [requiresMachine, setRequiresMachine] = useState(FILTER_ALL)
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeExercise, setActiveExercise] = useState(null)

  const {
    items: filteredExercises,
    total,
    page,
    totalPages,
    loading,
    setSearch,
    setCategory: setCategoryFilter,
    setDifficulty: setDifficultyFilter,
    setLocation: setLocationFilter,
    setRequiresMachine: setRequiresMachineFilter,
    setPage,
  } = useExerciseLibrary({ pageSize: 20 })

  const isCoach = staffUser?.role === 'coach'

  const member = useMemo(() => {
    const clients = getStaffClients(platform.members, staffUser?.role, staffUser?.id)
    return clients.find((m) => String(m.id) === String(memberId)) || null
  }, [platform.members, staffUser?.role, staffUser?.id, memberId])

  const packageRange = useMemo(
    () => (member ? getMemberPackageDateRange(member, 'workout') : null),
    [member],
  )

  const filteredExercisesList = filteredExercises

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

  const previewCartEntry = (entry) => {
    if (!entry?.videoUrl && !entry?.videoPending) return
    setActiveExercise({
      name: entry.exerciseName,
      videoUrl: entry.videoUrl,
      videoPending: entry.videoPending,
      description: entry.description,
    })
  }

  const removeFromCart = (id) => {
    setCart((list) => list.filter((e) => e.id !== id))
  }

  const moveCartItem = (id, dir) => {
    setCart((list) => {
      const i = list.findIndex((e) => e.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= list.length) return list
      const next = [...list]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const openSend = () => {
    if (!cart.length) { toast('En az bir hareket ekleyin', 'error'); return }
    setCartOpen(false)
    setSendOpen(true)
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
          <ExerciseLibraryFilters
            searchInput={searchInput}
            onSearchChange={(value) => { setSearchInput(value); setSearch(value) }}
            category={category}
            onCategoryChange={(value) => { setCategory(value); setCategoryFilter(value) }}
            difficulty={difficulty}
            onDifficultyChange={(value) => {
              setDifficulty(value)
              setDifficultyFilter(value === DIFFICULTY_ALL ? 'Tümü' : value)
            }}
            location={location}
            onLocationChange={(value) => { setLocation(value); setLocationFilter(value) }}
            requiresMachine={requiresMachine}
            onRequiresMachineChange={(value) => { setRequiresMachine(value); setRequiresMachineFilter(value) }}
          />

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-brand-400" /></div>
          ) : filteredExercisesList.length === 0 ? (
            <p className="py-12 text-center text-sm text-cream-800/50">Hareket bulunamadı. Arama veya filtreleri değiştirin.</p>
          ) : (
            <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredExercisesList.map((ex) => {
                const inCart = cartExerciseIds.has(ex.id)
                const hasVideo = Boolean(ex.videoUrl || ex.videoPending)
                return (
                  <div
                    key={ex.id}
                    className={`group flex flex-col overflow-hidden rounded-2xl border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      inCart
                        ? 'border-brand-200 bg-gradient-to-b from-brand-50/70 to-white ring-1 ring-brand-100'
                        : 'border-cream-200/90 bg-white hover:border-brand-200'
                    }`}
                  >
                    <button
                      type="button"
                      disabled={!hasVideo}
                      onClick={() => hasVideo && setActiveExercise(ex)}
                      onPointerEnter={() => hasVideo && prefetchExerciseVideo(ex.videoUrl)}
                      onPointerDown={() => hasVideo && prefetchExerciseVideo(ex.videoUrl)}
                      onFocus={() => hasVideo && prefetchExerciseVideo(ex.videoUrl)}
                      className={`relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-brand-100 to-blue-100 ${
                        hasVideo ? 'cursor-pointer' : 'cursor-default'
                      }`}
                      aria-label={hasVideo ? `${ex.name} videosunu izle` : undefined}
                    >
                      <div className="absolute inset-0 flex items-center justify-center p-3">
                        <ExerciseVideoThumbnail
                          url={ex.videoUrl}
                          videoPending={ex.videoPending}
                          size="card"
                          accent="brand"
                          fallbackIcon={Dumbbell}
                          className="!h-full !w-auto !max-h-full !max-w-full !rounded-xl shadow-md ring-1 ring-white/40"
                        />
                      </div>
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-sage-800 shadow-sm backdrop-blur-sm">
                        {ex.category || 'Genel'}
                      </span>
                      {hasVideo && !ex.videoPending && (
                        <span className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white shadow-sm backdrop-blur-sm transition group-hover:scale-110 group-hover:bg-brand-600">
                          <PlayCircle className="h-4 w-4" />
                        </span>
                      )}
                      {ex.videoPending && (
                        <span className="absolute bottom-2.5 right-2.5 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                          Yakında
                        </span>
                      )}
                    </button>

                    <div className="flex flex-1 flex-col p-3.5">
                      <p className="font-semibold leading-snug text-cream-900">{ex.name}</p>
                      <div className="mt-1 min-h-0 max-h-28 flex-1 overflow-y-auto overscroll-contain pr-0.5 text-xs leading-relaxed text-cream-800/55">
                        {ex.description || 'Açıklama yok'}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {ex.equipment && (
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">{ex.equipment}</span>
                        )}
                        {ex.difficulty && (
                          <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-medium text-cream-800/60">
                            {DIFFICULTY_LABELS[ex.difficulty] || ex.difficulty}
                          </span>
                        )}
                        {formatExerciseLocations(ex.locations).map((label) => (
                          <span key={label} className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700">{label}</span>
                        ))}
                        {ex.requiresMachine && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">Makinalı</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCart(ex)}
                        disabled={inCart}
                        className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition ${
                          inCart
                            ? 'cursor-default bg-brand-100 text-brand-600'
                            : 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-sm hover:brightness-105 active:scale-[0.98]'
                        }`}
                      >
                        {inCart ? <><Check className="h-3.5 w-3.5" /> Sepette</> : <><Plus className="h-3.5 w-3.5" /> Sepete Ekle</>}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <ExercisePagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} className="mt-4" />
            </>
          )}
        </div>

        {/* Program Akışı — masaüstü paneli (mobilde alttaki bar + sheet kullanılır) */}
        <aside className="hidden xl:sticky xl:top-4 xl:block xl:self-start">
          <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
            <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-blue-500 px-4 py-3.5">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10 blur-xl" aria-hidden />
              <div className="relative flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
                  <ListChecks className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">Program Akışı</p>
                  <p className="text-[11px] text-white/75">
                    {cart.length > 0 ? `${cart.length} hareket · oklarla sıralayın` : 'Hareket ekleyerek başlayın'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3.5">
              <CartList
                cart={cart}
                onPatch={updateCartItem}
                onRemove={removeFromCart}
                onMove={moveCartItem}
                onPreview={previewCartEntry}
                className="max-h-[min(58vh,500px)] overflow-y-auto pr-0.5"
              />
              <button
                type="button"
                onClick={openSend}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105 active:scale-[0.99]"
              >
                <Send className="h-4 w-4" /> Programı Gönder
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobil aksiyon barı — Program Akışı + Gönder */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-white/95 px-3 pt-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))] xl:hidden">
        <div className="mx-auto flex max-w-xl gap-2">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-brand-200 bg-white py-3 text-sm font-semibold text-brand-700 transition active:scale-[0.98]"
          >
            <ShoppingBag className="h-4 w-4" /> Program Akışı
            {cart.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white shadow">
                {cart.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={openSend}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-semibold text-white shadow-md transition active:scale-[0.98]"
          >
            <Send className="h-4 w-4" /> Gönder
          </button>
        </div>
      </div>

      {/* Program Akışı — mobil alt sayfa (bottom sheet) */}
      <Modal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title={`Program Akışı${cart.length ? ` (${cart.length})` : ''}`}
        size="md"
      >
        <div className="space-y-4">
          <CartList
            cart={cart}
            onPatch={updateCartItem}
            onRemove={removeFromCart}
            onMove={moveCartItem}
            onPreview={previewCartEntry}
          />
          {cart.length > 0 && (
            <button
              type="button"
              onClick={openSend}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 text-sm font-semibold text-white shadow-md transition active:scale-[0.99]"
            >
              <Send className="h-4 w-4" /> Programı Gönder ({cart.length} hareket)
            </button>
          )}
        </div>
      </Modal>

      <CoachProgramSendModal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        member={member}
        cartEntries={cart}
        packageRange={packageRange}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <Modal open={!!activeExercise} onClose={() => setActiveExercise(null)} title={activeExercise?.name} size="lg">
        {activeExercise && (
          <div className="space-y-4">
            <VideoPlayer
              url={activeExercise.videoUrl}
              videoPending={activeExercise.videoPending}
              title={activeExercise.name}
            />
            {activeExercise.category && (
              <span className="inline-block rounded-full bg-sage-50 px-3 py-1 text-xs font-semibold text-sage-700">
                {activeExercise.category}
              </span>
            )}
            {activeExercise.description && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-cream-800/80">{activeExercise.description}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

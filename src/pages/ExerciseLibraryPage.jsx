import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, PlayCircle, Dumbbell, Library, Sparkles, Loader2, ArrowUpDown, Lock } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import VideoPlayer from '../components/ui/VideoPlayer'
import ExerciseCategorySelect from '../components/library/ExerciseCategorySelect'
import ExercisePagination from '../components/library/ExercisePagination'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import { EXERCISE_CATEGORY_ALL } from '../data/exerciseCategories'
import { DIFFICULTY_LABELS } from '../data/exerciseTurkish'
import { useExerciseLibrary } from '../hooks/useExerciseLibrary'
import { useApp } from '../context/AppContext'
import { memberHasFullVideoAccess } from '../utils/memberPackages'

const CATEGORY_COLORS = {
  default: 'from-violet-500 to-purple-600',
  Kardiyo: 'from-rose-500 to-orange-500',
  Güç: 'from-brand-500 to-blue-600',
  Esneklik: 'from-teal-500 to-emerald-500',
  Core: 'from-amber-500 to-orange-500',
}

const DIFFICULTY_ALL = 'Tümü'

function categoryGradient(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.default
}

export default function ExerciseLibraryPage({ staffMode = false }) {
  const { user } = useApp()
  const allowVideoPlayback = staffMode || memberHasFullVideoAccess(user)
  const {
    items,
    total,
    page,
    totalPages,
    loading,
    sort,
    setSort,
    sortOptions,
    setSearch,
    setCategory,
    setDifficulty,
    setEquipment,
    setPage,
    filters,
    equipmentOptions,
  } = useExerciseLibrary()

  const [searchInput, setSearchInput] = useState('')
  const [category, setCategoryLocal] = useState(EXERCISE_CATEGORY_ALL)
  const [difficulty, setDifficultyLocal] = useState(DIFFICULTY_ALL)
  const [equipment, setEquipmentLocal] = useState('')
  const [active, setActive] = useState(null)
  const [upgradeHint, setUpgradeHint] = useState(false)

  const openExercise = (ex) => {
    if (!allowVideoPlayback && ex.videoUrl && !ex.videoPending) {
      setUpgradeHint(true)
      return
    }
    setActive(ex)
  }

  const handleSearch = (value) => {
    setSearchInput(value)
    setSearch(value)
  }

  const handleCategory = (value) => {
    setCategoryLocal(value)
    setCategory(value)
  }

  const handleDifficulty = (value) => {
    setDifficultyLocal(value)
    setDifficulty(value === DIFFICULTY_ALL ? 'Tümü' : value)
  }

  const handleEquipment = (value) => {
    setEquipmentLocal(value)
    setEquipment(value)
  }

  const sortLabel = useMemo(
    () => sortOptions.find((o) => o.id === sort)?.label || 'Sıralama',
    [sort, sortOptions],
  )

  return (
    <PanelPageShell>
      <PanelPageHeader
        title="Hareket Kütüphanesi"
        subtitle="Doğru formla çalışmak için hareket videolarını izleyin"
        icon={Library}
        accent="violet"
        actions={total > 0 ? (
          <div className="flex w-full items-center gap-2 rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm sm:w-auto">
            <Sparkles className="h-4 w-4 shrink-0 text-violet-200" />
            <span className="text-sm font-semibold">{total} hareket</span>
          </div>
        ) : null}
      />

      {!allowVideoPlayback && (
        <div className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
          <p className="text-sm text-violet-900/80">
            Hareket listesini görebilirsiniz. Tam video oynatma için{' '}
            <Link to="/onboarding?plan=spor" className="font-semibold underline">Spor</Link>
            {' '}veya{' '}
            <Link to="/onboarding?plan=vip" className="font-semibold underline">VIP</Link>
            {' '}paket gerekir.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-violet-100/80 bg-gradient-to-br from-violet-50/50 via-white to-purple-50/30 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="relative min-w-0 flex-1">
              <label htmlFor="exercise-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-violet-700/70">
                Hareket Ara
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
                <input
                  id="exercise-search"
                  type="search"
                  placeholder="Hareket adı veya ekipman ara..."
                  value={searchInput}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full rounded-xl border border-violet-100 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-violet-700/70">Hareket Tipi</label>
                <ExerciseCategorySelect value={category} onChange={handleCategory} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-violet-700/70">Zorluk</label>
                <select
                  value={difficulty}
                  onChange={(e) => handleDifficulty(e.target.value)}
                  className="w-full rounded-xl border border-violet-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                >
                  <option value={DIFFICULTY_ALL}>Tümü</option>
                  {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              {equipmentOptions.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-violet-700/70">Ekipman</label>
                  <select
                    value={equipment}
                    onChange={(e) => handleEquipment(e.target.value)}
                    className="w-full rounded-xl border border-violet-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="">Tümü</option>
                    {equipmentOptions.map((eq) => (
                      <option key={eq} value={eq}>{eq}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-violet-700/70">Sıralama</label>
                <div className="relative">
                  <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="w-full rounded-xl border border-violet-100 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  >
                    {sortOptions.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-violet-700/50">Sıralama: {sortLabel}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Dumbbell} title="Hareket bulunamadı" description="Arama veya filtreleri değiştirin." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => openExercise(ex)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-violet-100/80 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg"
              >
                <div className={`relative flex h-20 items-center justify-between bg-gradient-to-br px-4 ${categoryGradient(ex.category)}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.2),transparent_50%)]" aria-hidden />
                  <span className="relative rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                    {ex.category}
                  </span>
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition group-hover:scale-110 group-hover:bg-white/30">
                    <PlayCircle className="h-5 w-5" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="font-display font-bold leading-snug text-cream-900 group-hover:text-violet-800">{ex.name}</p>
                  <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-cream-800/60">
                    {ex.description || 'Açıklama eklenmemiş.'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ex.equipment && (
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">{ex.equipment}</span>
                    )}
                    {ex.difficulty && (
                      <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-medium text-cream-800/60">
                        {DIFFICULTY_LABELS[ex.difficulty] || ex.difficulty}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs font-semibold text-violet-600">
                    {ex.videoPending ? 'Video yakında →' : allowVideoPlayback ? 'Videoyu izle →' : 'Tam erişim için yükselt →'}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <ExercisePagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} className="mt-6" />
        </>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.name} size="lg">
        {active && (
          <div className="space-y-4">
            <VideoPlayer url={active.videoUrl} videoPending={active.videoPending} />
            <div className="flex flex-wrap gap-2">
              <span className={`inline-block rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white ${categoryGradient(active.category)}`}>
                {active.category}
              </span>
              {active.equipment && (
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">{active.equipment}</span>
              )}
              {active.difficulty && (
                <span className="rounded-full bg-cream-100 px-3 py-1 text-xs font-medium text-cream-800/70">
                  {DIFFICULTY_LABELS[active.difficulty] || active.difficulty}
                </span>
              )}
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-cream-800/80">{active.description || 'Açıklama eklenmemiş.'}</p>
          </div>
        )}
      </Modal>

      <Modal open={upgradeHint} onClose={() => setUpgradeHint(false)} title="Tam video erişimi" size="sm">
        <p className="text-sm text-cream-800/70">
          Paketiniz hareket listesini içerir; videoları izlemek için Spor veya VIP pakete geçmeniz gerekir.
        </p>
        <Link
          to="/onboarding?plan=spor"
          className="mt-4 inline-flex rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          onClick={() => setUpgradeHint(false)}
        >
          Paketleri incele
        </Link>
      </Modal>
    </PanelPageShell>
  )
}

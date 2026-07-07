import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, PlayCircle, Dumbbell, Library, Sparkles, Loader2, Lock, ChevronDown } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import VideoPlayer from '../components/ui/VideoPlayer'
import ExerciseCategorySelect from '../components/library/ExerciseCategorySelect'
import ExercisePagination from '../components/library/ExercisePagination'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import { EXERCISE_CATEGORY_ALL } from '../data/exerciseCategories'
import { DIFFICULTY_LABELS, EXERCISE_LOCATION_LABELS, EXERCISE_LOCATION_OPTIONS, REQUIRES_MACHINE_LABELS, REQUIRES_MACHINE_OPTIONS, formatExerciseLocations } from '../data/exerciseTurkish'
import { useExerciseLibrary } from '../hooks/useExerciseLibrary'
import { useApp } from '../context/AppContext'
import { memberHasFullVideoAccess } from '../utils/memberPackages'
import { prefetchExerciseVideo } from '../utils/exerciseVideoPrefetch'

const CATEGORY_COLORS = {
  default: 'from-violet-500 to-purple-600',
  Kardiyo: 'from-rose-500 to-orange-500',
  Güç: 'from-brand-500 to-blue-600',
  Esneklik: 'from-teal-500 to-emerald-500',
  Core: 'from-amber-500 to-orange-500',
}

const DIFFICULTY_ALL = 'Tümü'
const FILTER_ALL = ''

const FILTER_LABEL_BASE = 'mb-2 block text-sm font-bold uppercase tracking-wide sm:mb-2.5 sm:text-base'
const SELECT_BASE =
  'w-full min-h-[3rem] cursor-pointer appearance-none rounded-2xl border-2 px-4 py-3 pr-11 text-base font-semibold outline-none transition sm:min-h-[3.25rem] sm:px-4 sm:py-3.5 sm:text-lg'

/** Her filtre alanı farklı renk — sayfa violet temasıyla uyumlu, kolay ayırt edilir */
const FILTER_THEMES = {
  search: {
    label: `${FILTER_LABEL_BASE} text-violet-800`,
    wrap:
      'relative w-full overflow-hidden rounded-2xl border-2 border-violet-400 bg-gradient-to-r from-violet-100/90 via-white to-purple-50 shadow-md shadow-violet-200/40 transition hover:border-violet-500 hover:shadow-lg hover:shadow-violet-200/50 focus-within:border-violet-600 focus-within:ring-4 focus-within:ring-violet-200/80 min-h-[3rem] sm:min-h-[3.25rem]',
    iconBar: 'from-violet-500 to-purple-600',
    input:
      `${SELECT_BASE} w-full min-w-0 border-0 bg-transparent py-3 pl-14 pr-4 text-violet-950 shadow-none placeholder:text-violet-500/70 focus:border-0 focus:bg-white/70 focus:ring-0 sm:pl-16`,
  },
  category: {
    label: `${FILTER_LABEL_BASE} text-brand-800`,
    select:
      `${SELECT_BASE} border-brand-300 bg-gradient-to-br from-brand-50 via-sky-50/80 to-white text-brand-950 shadow-sm shadow-brand-200/35 hover:border-brand-400 hover:from-brand-100/90 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-200/70`,
    chevron: 'text-brand-600',
  },
  difficulty: {
    label: `${FILTER_LABEL_BASE} text-amber-800`,
    select:
      `${SELECT_BASE} border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50/70 to-white text-amber-950 shadow-sm shadow-amber-200/35 hover:border-amber-400 hover:from-amber-100/90 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-200/70`,
    chevron: 'text-amber-600',
  },
  equipment: {
    label: `${FILTER_LABEL_BASE} text-teal-800`,
    select:
      `${SELECT_BASE} border-teal-300 bg-gradient-to-br from-teal-50 via-emerald-50/70 to-white text-teal-950 shadow-sm shadow-teal-200/35 hover:border-teal-400 hover:from-teal-100/90 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-200/70`,
    chevron: 'text-teal-600',
  },
  location: {
    label: `${FILTER_LABEL_BASE} text-rose-800`,
    select:
      `${SELECT_BASE} border-rose-300 bg-gradient-to-br from-rose-50 via-pink-50/70 to-white text-rose-950 shadow-sm shadow-rose-200/35 hover:border-rose-400 hover:from-rose-100/90 focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-200/70`,
    chevron: 'text-rose-600',
  },
  machine: {
    label: `${FILTER_LABEL_BASE} text-slate-800`,
    select:
      `${SELECT_BASE} border-slate-300 bg-gradient-to-br from-slate-50 via-zinc-50/70 to-white text-slate-950 shadow-sm shadow-slate-200/35 hover:border-slate-400 hover:from-slate-100/90 focus:border-slate-600 focus:bg-white focus:ring-4 focus:ring-slate-200/70`,
    chevron: 'text-slate-600',
  },
}

function FilterSelect({ className, chevronClassName = 'text-violet-500', children, ...props }) {
  return (
    <div className="relative">
      <select className={className} {...props}>{children}</select>
      <ChevronDown className={`pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 sm:right-4 sm:h-6 sm:w-6 ${chevronClassName}`} />
    </div>
  )
}

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
    setSearch,
    setCategory,
    setDifficulty,
    setEquipment,
    setLocation,
    setRequiresMachine,
    setPage,
    equipmentOptions,
  } = useExerciseLibrary()

  const [searchInput, setSearchInput] = useState('')
  const [category, setCategoryLocal] = useState(EXERCISE_CATEGORY_ALL)
  const [difficulty, setDifficultyLocal] = useState(DIFFICULTY_ALL)
  const [equipment, setEquipmentLocal] = useState('')
  const [location, setLocationLocal] = useState(FILTER_ALL)
  const [requiresMachine, setRequiresMachineLocal] = useState(FILTER_ALL)
  const [active, setActive] = useState(null)
  const [upgradeHint, setUpgradeHint] = useState(false)

  const openExercise = (ex) => {
    if (!allowVideoPlayback && ex.videoUrl && !ex.videoPending) {
      setUpgradeHint(true)
      return
    }
    if (ex.videoUrl) prefetchExerciseVideo(ex.videoUrl)
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

  const handleLocation = (value) => {
    setLocationLocal(value)
    setLocation(value)
  }

  const handleRequiresMachine = (value) => {
    setRequiresMachineLocal(value)
    setRequiresMachine(value)
  }

  const hasActiveFilters = Boolean(location || requiresMachine)

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

      <div className="rounded-2xl border-2 border-violet-200/60 bg-gradient-to-br from-violet-50/70 via-white to-purple-50/40 p-5 shadow-md shadow-violet-100/30 sm:rounded-3xl sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 sm:gap-6">
          <div className="w-full min-w-0">
            <label htmlFor="exercise-search" className={FILTER_THEMES.search.label}>
              Hareket Ara
            </label>
            <div className={FILTER_THEMES.search.wrap}>
              <span className={`pointer-events-none absolute inset-y-0 left-0 z-10 flex w-12 shrink-0 items-center justify-center bg-gradient-to-br sm:w-14 ${FILTER_THEMES.search.iconBar}`}>
                <Search className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>
              <input
                id="exercise-search"
                type="search"
                placeholder="Hareket adı veya ekipman ara..."
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                className={FILTER_THEMES.search.input}
              />
            </div>
          </div>

          <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-4">
              <div className="space-y-2">
                <label className={FILTER_THEMES.category.label}>Hareket Tipi</label>
                <ExerciseCategorySelect
                  value={category}
                  onChange={handleCategory}
                  selectClassName={FILTER_THEMES.category.select}
                  chevronClassName={FILTER_THEMES.category.chevron}
                />
              </div>
              <div className="space-y-2">
                <label className={FILTER_THEMES.difficulty.label}>Zorluk</label>
                <FilterSelect
                  value={difficulty}
                  onChange={(e) => handleDifficulty(e.target.value)}
                  className={FILTER_THEMES.difficulty.select}
                  chevronClassName={FILTER_THEMES.difficulty.chevron}
                >
                  <option value={DIFFICULTY_ALL}>Tümü</option>
                  {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </FilterSelect>
              </div>
              {equipmentOptions.length > 0 && (
                <div className="space-y-2">
                  <label className={FILTER_THEMES.equipment.label}>Ekipman</label>
                  <FilterSelect
                    value={equipment}
                    onChange={(e) => handleEquipment(e.target.value)}
                    className={FILTER_THEMES.equipment.select}
                    chevronClassName={FILTER_THEMES.equipment.chevron}
                  >
                    <option value="">Tümü</option>
                    {equipmentOptions.map((eq) => (
                      <option key={eq} value={eq}>{eq}</option>
                    ))}
                  </FilterSelect>
                </div>
              )}
              <div className="space-y-2">
                <label className={FILTER_THEMES.location.label}>Konum</label>
                <FilterSelect
                  value={location}
                  onChange={(e) => handleLocation(e.target.value)}
                  className={FILTER_THEMES.location.select}
                  chevronClassName={FILTER_THEMES.location.chevron}
                >
                  <option value={FILTER_ALL}>Tümü</option>
                  {EXERCISE_LOCATION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </FilterSelect>
              </div>
              <div className="space-y-2">
                <label className={FILTER_THEMES.machine.label}>Makine</label>
                <FilterSelect
                  value={requiresMachine}
                  onChange={(e) => handleRequiresMachine(e.target.value)}
                  className={FILTER_THEMES.machine.select}
                  chevronClassName={FILTER_THEMES.machine.chevron}
                >
                  <option value={FILTER_ALL}>Tümü</option>
                  {REQUIRES_MACHINE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </FilterSelect>
              </div>
            </div>
          {hasActiveFilters && (
          <p className="flex flex-wrap items-center gap-2 rounded-xl border border-violet-100 bg-gradient-to-r from-violet-50/80 via-white to-purple-50/60 px-3 py-2.5 text-sm sm:text-base">
            <span className="font-medium text-cream-800/60">Aktif filtreler:</span>
            {location && (
              <span className="rounded-full bg-rose-100 px-3 py-0.5 text-sm font-bold text-rose-900 ring-1 ring-rose-200">
                {EXERCISE_LOCATION_LABELS[location] || location}
              </span>
            )}
            {requiresMachine && (
              <span className="rounded-full bg-slate-100 px-3 py-0.5 text-sm font-bold text-slate-900 ring-1 ring-slate-200">
                {REQUIRES_MACHINE_LABELS[requiresMachine] || requiresMachine}
              </span>
            )}
          </p>
          )}
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
                onMouseEnter={() => allowVideoPlayback && prefetchExerciseVideo(ex.videoUrl)}
                onFocus={() => allowVideoPlayback && prefetchExerciseVideo(ex.videoUrl)}
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
                    {formatExerciseLocations(ex.locations).map((label) => (
                      <span key={label} className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700">{label}</span>
                    ))}
                    {ex.requiresMachine && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">Makinalı</span>
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
              {formatExerciseLocations(active.locations).map((label) => (
                <span key={label} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">{label}</span>
              ))}
              {active.requiresMachine && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Makinalı</span>
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

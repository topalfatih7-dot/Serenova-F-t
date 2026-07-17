import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlayCircle, Dumbbell, Library, Sparkles, Loader2 } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import ExercisePagination from '../components/library/ExercisePagination'
import ExerciseVideoThumbnail from '../components/library/ExerciseVideoThumbnail'
import ExerciseDetailModal from '../components/library/ExerciseDetailModal'
import ExerciseLibraryFilters, { DIFFICULTY_ALL, EXERCISE_CATEGORY_ALL, FILTER_ALL } from '../components/library/ExerciseLibraryFilters'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import { DIFFICULTY_LABELS, formatExerciseLocations } from '../data/exerciseTurkish'
import { useExerciseLibrary } from '../hooks/useExerciseLibrary'
import { useApp } from '../context/AppContext'
import { collectProgramExerciseIds } from '../utils/coachProgram'
import { prefetchExerciseVideo } from '../utils/exerciseVideoPrefetch'
import { PANEL_IMAGES } from '../utils/panelImages'

const CATEGORY_COLORS = {
  default: 'from-violet-500 to-purple-600',
  Kardiyo: 'from-rose-500 to-orange-500',
  Güç: 'from-brand-500 to-blue-600',
  Esneklik: 'from-teal-500 to-emerald-500',
  Core: 'from-amber-500 to-orange-500',
}

function categoryGradient(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.default
}

export default function ExerciseLibraryPage({ staffMode = false }) {
  const { myPrograms } = useApp()
  const programExerciseIds = useMemo(
    () => (staffMode ? undefined : collectProgramExerciseIds(myPrograms)),
    [staffMode, myPrograms],
  )
  const hasProgramExercises = staffMode || (programExerciseIds?.length > 0)

  const {
    items,
    total,
    page,
    totalPages,
    loading,
    setSearch,
    setCategory,
    setDifficulty,
    setLocation,
    setRequiresMachine,
    setPage,
  } = useExerciseLibrary({
    allowedIds: staffMode ? undefined : programExerciseIds,
  })

  const [searchInput, setSearchInput] = useState('')
  const [category, setCategoryLocal] = useState(EXERCISE_CATEGORY_ALL)
  const [difficulty, setDifficultyLocal] = useState(DIFFICULTY_ALL)
  const [location, setLocationLocal] = useState(FILTER_ALL)
  const [requiresMachine, setRequiresMachineLocal] = useState(FILTER_ALL)
  const [active, setActive] = useState(null)

  const openExercise = (ex) => {
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

  const handleLocation = (value) => {
    setLocationLocal(value)
    setLocation(value)
  }

  const handleRequiresMachine = (value) => {
    setRequiresMachineLocal(value)
    setRequiresMachine(value)
  }

  const emptyTitle = !hasProgramExercises
    ? 'Henüz program hareketi yok'
    : 'Hareket bulunamadı'
  const emptyDescription = !hasProgramExercises
    ? 'Koçunuzun veya yapay zekanın oluşturduğu antrenman programındaki hareketler burada görünür.'
    : 'Arama veya filtreleri değiştirin.'

  return (
    <PanelPageShell>
      <PanelPageHeader
        title="Hareket Kütüphanesi"
        subtitle={staffMode
          ? 'Tüm hareket videolarını inceleyin ve programlara ekleyin'
          : 'Programınızdaki hareket videolarını doğru formla izleyin'}
        icon={Library}
        accent="violet"
        image={PANEL_IMAGES.library}
        actions={total > 0 ? (
          <div className="flex w-full items-center gap-2 rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm sm:w-auto">
            <Sparkles className="h-4 w-4 shrink-0 text-violet-200" />
            <span className="text-sm font-semibold">{total} hareket</span>
          </div>
        ) : null}
      />

      {!staffMode && hasProgramExercises && (
        <p className="text-sm text-cream-800/70">
          Yalnızca size atanan antrenman programındaki hareketler listelenir.
        </p>
      )}

      {hasProgramExercises && (
        <ExerciseLibraryFilters
          searchInput={searchInput}
          onSearchChange={handleSearch}
          category={category}
          onCategoryChange={handleCategory}
          difficulty={difficulty}
          onDifficultyChange={handleDifficulty}
          location={location}
          onLocationChange={handleLocation}
          requiresMachine={requiresMachine}
          onRequiresMachineChange={handleRequiresMachine}
        />
      )}

      {loading && hasProgramExercises ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title={emptyTitle}
          description={emptyDescription}
          action={!hasProgramExercises ? (
            <Link
              to="/programs"
              className="inline-flex rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Programlarıma git
            </Link>
          ) : null}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => openExercise(ex)}
                onPointerEnter={() => prefetchExerciseVideo(ex.videoUrl)}
                onPointerDown={() => prefetchExerciseVideo(ex.videoUrl)}
                onFocus={() => prefetchExerciseVideo(ex.videoUrl)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-violet-100/80 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg"
              >
                <div className={`relative flex h-20 items-center justify-between bg-gradient-to-br px-4 ${categoryGradient(ex.category)}`}>
                  <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
                  <span className="relative rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                    {ex.category}
                  </span>
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition group-hover:scale-110 group-hover:bg-white/30">
                    <PlayCircle className="h-5 w-5" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-4 flex justify-center">
                    <div className="relative h-28 w-36 overflow-hidden rounded-2xl shadow-md ring-1 ring-violet-100/80 sm:h-32 sm:w-44">
                      <ExerciseVideoThumbnail
                        url={ex.videoUrl}
                        videoPending={ex.videoPending}
                        size="card"
                        accent="brand"
                        fallbackIcon={Dumbbell}
                        className="!h-full !w-full !max-h-full !max-w-full !rounded-2xl"
                      />
                    </div>
                  </div>
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
                    {ex.videoPending ? 'Video yakında →' : 'Videoyu izle →'}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <ExercisePagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} className="mt-6" />
        </>
      )}

      <ExerciseDetailModal open={!!active} onClose={() => setActive(null)} exercise={active} />
    </PanelPageShell>
  )
}

import { useState, useMemo } from 'react'
import { Search, PlayCircle, Dumbbell, Library, Sparkles } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import VideoPlayer from '../components/ui/VideoPlayer'
import ExerciseCategorySelect from '../components/library/ExerciseCategorySelect'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import { EXERCISE_CATEGORY_ALL } from '../data/exerciseCategories'
import { useApp } from '../context/AppContext'

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

export default function ExerciseLibraryPage() {
  const { exercises } = useApp()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(EXERCISE_CATEGORY_ALL)
  const [active, setActive] = useState(null)

  const filtered = useMemo(() => (exercises || []).filter((e) => {
    const q = search.trim().toLowerCase()
    const matchesSearch = !q || e.name.toLowerCase().includes(q)
    const matchesCategory = category === EXERCISE_CATEGORY_ALL || e.category === category
    return matchesSearch && matchesCategory
  }), [exercises, search, category])

  return (
    <PanelPageShell>
      <PanelPageHeader
        title="Hareket Kütüphanesi"
        subtitle="Doğru formla çalışmak için hareket videolarını izleyin"
        icon={Library}
        accent="violet"
        actions={filtered.length > 0 ? (
          <div className="flex w-full items-center gap-2 rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm sm:w-auto">
            <Sparkles className="h-4 w-4 shrink-0 text-violet-200" />
            <span className="text-sm font-semibold">{filtered.length} hareket</span>
          </div>
        ) : null}
      />

      <div className="rounded-2xl border border-violet-100/80 bg-gradient-to-br from-violet-50/50 via-white to-purple-50/30 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="exercise-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-violet-700/70">
              Hareket Ara
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
              <input
                id="exercise-search"
                type="search"
                placeholder="Hareket adı ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-violet-100 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </div>
          <div className="w-full space-y-1.5 sm:w-auto sm:min-w-[200px]">
            <label className="block text-xs font-semibold uppercase tracking-wide text-violet-700/70">
              Hareket Tipi
            </label>
            <ExerciseCategorySelect value={category} onChange={setCategory} />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Dumbbell} title="Hareket bulunamadı" description="Arama veya tip filtresini değiştirin." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setActive(ex)}
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
                <p className="mt-3 text-xs font-semibold text-violet-600 opacity-0 transition group-hover:opacity-100">
                  Videoyu izle →
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.name} size="lg">
        {active && (
          <div className="space-y-4">
            <VideoPlayer url={active.videoUrl} />
            <span className={`inline-block rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white ${categoryGradient(active.category)}`}>
              {active.category}
            </span>
            <p className="whitespace-pre-line text-sm leading-relaxed text-cream-800/80">{active.description || 'Açıklama eklenmemiş.'}</p>
          </div>
        )}
      </Modal>
    </PanelPageShell>
  )
}

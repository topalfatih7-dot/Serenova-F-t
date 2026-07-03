import { useState, useMemo } from 'react'
import { Search, PlayCircle, Dumbbell } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import VideoPlayer from '../components/ui/VideoPlayer'
import ExerciseCategoryChips from '../components/library/ExerciseCategoryChips'
import { EXERCISE_CATEGORY_ALL } from '../data/exerciseCategories'
import { useApp } from '../context/AppContext'

export default function ExerciseLibraryPage() {
  const { exercises } = useApp()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(EXERCISE_CATEGORY_ALL)
  const [active, setActive] = useState(null)

  const filtered = useMemo(() => (exercises || []).filter((e) => {
    const q = search.trim().toLowerCase()
    const matchesSearch = !q
      || e.name.toLowerCase().includes(q)
      || (e.category || '').toLowerCase().includes(q)
    const matchesCategory = category === EXERCISE_CATEGORY_ALL || e.category === category
    return matchesSearch && matchesCategory
  }), [exercises, search, category])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Hareket Kütüphanesi</h1>
        <p className="mt-1 text-sm text-cream-800/60">Doğru formla çalışmak için hareket videolarını izleyin.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
        <input
          type="text"
          placeholder="Hareket ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-cream-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-300"
        />
      </div>

      <ExerciseCategoryChips value={category} onChange={setCategory} />

      {filtered.length === 0 ? (
        <EmptyState icon={Dumbbell} title="Hareket bulunamadı" description="Arama veya kategori filtresini değiştirin." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setActive(ex)}
              className="group flex flex-col rounded-2xl border border-cream-200 bg-white p-5 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-sage-50 px-2 py-0.5 text-[10px] font-semibold text-sage-700">{ex.category}</span>
                <PlayCircle className="h-5 w-5 text-brand-400 group-hover:text-brand-600" />
              </div>
              <p className="mt-3 font-semibold text-cream-900">{ex.name}</p>
              <p className="mt-1 line-clamp-2 text-sm text-cream-800/60">{ex.description || 'Açıklama eklenmemiş.'}</p>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.name} size="lg">
        {active && (
          <div className="space-y-4">
            <VideoPlayer url={active.videoUrl} />
            <span className="inline-block rounded-full bg-sage-50 px-2.5 py-0.5 text-xs font-medium text-sage-700">{active.category}</span>
            <p className="whitespace-pre-line text-sm leading-relaxed text-cream-800/80">{active.description || 'Açıklama eklenmemiş.'}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

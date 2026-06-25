import { useState, useMemo } from 'react'
import { Search, PlayCircle, Dumbbell } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import VideoPlayer from '../components/ui/VideoPlayer'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'

export default function ExerciseLibraryPage() {
  const { exercises } = useApp()
  const [search, setSearch] = useState('')
  const [active, setActive] = useState(null)

  const filtered = useMemo(() => (exercises || []).filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.category || '').toLowerCase().includes(search.toLowerCase()),
  ), [exercises, search])

  return (
    <PanelPageShell>
      <PanelPageHeader
        title="Hareket Kütüphanesi"
        subtitle="Doğru formla çalışmak için hareket videolarını izleyin."
        icon={Dumbbell}
        accent="sage"
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500/60" />
        <input
          type="text"
          placeholder="Hareket ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-brand-200/60 bg-white/90 py-3 pl-10 pr-4 text-sm shadow-sm outline-none backdrop-blur transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200/50"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Dumbbell} title="Hareket bulunamadı" description="Arama terimini değiştirin." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setActive(ex)}
              className="group flex flex-col glass-card-solid p-5 text-left transition hover:scale-[1.02]"
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
    </PanelPageShell>
  )
}

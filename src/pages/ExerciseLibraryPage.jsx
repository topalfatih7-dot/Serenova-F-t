import { useState, useMemo } from 'react'
import { Search, PlayCircle, Dumbbell } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import VideoPlayer from '../components/ui/VideoPlayer'
import { useApp } from '../context/AppContext'

export default function ExerciseLibraryPage() {
  const { exercises } = useApp()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [active, setActive] = useState(null)

  const categories = useMemo(() => ['all', ...Array.from(new Set((exercises || []).map((e) => e.category || 'Genel')))], [exercises])

  const filtered = useMemo(() => (exercises || []).filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'all' || (e.category || 'Genel') === category
    return matchSearch && matchCat
  }), [exercises, search, category])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Hareket Kütüphanesi</h1>
        <p className="mt-1 text-sm text-cream-800/60">Egzersizleri inceleyin, açıklamalarını okuyun ve videolarını izleyin.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
          <input
            type="text"
            placeholder="Hareket ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-cream-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-300"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-cream-200 px-4 py-2.5 text-sm">
          {categories.map((c) => (
            <option key={c} value={c}>{c === 'all' ? 'Tüm kategoriler' : c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Dumbbell} title="Hareket bulunamadı" description="Kütüphane henüz boş veya arama sonucu yok." />
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
                <span className="rounded-full bg-cream-100 px-2.5 py-0.5 text-xs font-medium text-cream-800/70">{ex.category || 'Genel'}</span>
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
            <div>
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{active.category || 'Genel'}</span>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-cream-800/80">{active.description || 'Açıklama eklenmemiş.'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

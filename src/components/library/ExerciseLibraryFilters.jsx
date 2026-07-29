import { useMemo, useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import ExerciseCategorySelect from './ExerciseCategorySelect'
import { EXERCISE_CATEGORY_ALL } from '../../data/exerciseCategories'
import { DIFFICULTY_LABELS, EXERCISE_LOCATION_LABELS, EXERCISE_LOCATION_OPTIONS, REQUIRES_MACHINE_LABELS, REQUIRES_MACHINE_OPTIONS } from '../../data/exerciseTurkish'

const DIFFICULTY_ALL = 'Tümü'
const FILTER_ALL = ''

const FILTER_LABEL_BASE = 'mb-1 block text-[10px] font-bold uppercase tracking-wide'
const SELECT_BASE =
  'w-full min-h-[2rem] cursor-pointer appearance-none rounded-lg border px-2.5 py-1.5 pr-7 text-xs font-semibold outline-none transition'

const FILTER_THEMES = {
  search: {
    label: `${FILTER_LABEL_BASE} text-violet-800`,
    wrap:
      'relative w-full overflow-hidden rounded-lg border border-violet-300 bg-gradient-to-r from-violet-100/80 via-white to-purple-50 shadow-sm shadow-violet-100/30 transition hover:border-violet-400 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-200/70 min-h-[2rem]',
    iconBar: 'from-violet-500 to-purple-600',
    input:
      `${SELECT_BASE} w-full min-w-0 border-0 bg-transparent py-1.5 pl-9 pr-2.5 text-violet-950 shadow-none placeholder:text-violet-500/70 focus:border-0 focus:bg-white/70 focus:ring-0`,
  },
  category: {
    label: `${FILTER_LABEL_BASE} text-brand-800`,
    select:
      `${SELECT_BASE} border-brand-300 bg-gradient-to-br from-brand-50 via-sky-50/80 to-white text-brand-950 shadow-sm shadow-brand-100/30 hover:border-brand-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-200/60`,
    chevron: 'text-brand-600',
  },
  difficulty: {
    label: `${FILTER_LABEL_BASE} text-amber-800`,
    select:
      `${SELECT_BASE} border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50/70 to-white text-amber-950 shadow-sm shadow-amber-100/30 hover:border-amber-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-200/60`,
    chevron: 'text-amber-600',
  },
  location: {
    label: `${FILTER_LABEL_BASE} text-rose-800`,
    select:
      `${SELECT_BASE} border-rose-300 bg-gradient-to-br from-rose-50 via-pink-50/70 to-white text-rose-950 shadow-sm shadow-rose-100/30 hover:border-rose-400 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-200/60`,
    chevron: 'text-rose-600',
  },
  machine: {
    label: `${FILTER_LABEL_BASE} text-slate-800`,
    select:
      `${SELECT_BASE} border-slate-300 bg-gradient-to-br from-slate-50 via-zinc-50/70 to-white text-slate-950 shadow-sm shadow-slate-100/30 hover:border-slate-400 focus:border-slate-600 focus:bg-white focus:ring-2 focus:ring-slate-200/60`,
    chevron: 'text-slate-600',
  },
}

function FilterSelect({ className, chevronClassName = 'text-violet-500', children, ...props }) {
  return (
    <div className="relative">
      <select className={className} {...props}>{children}</select>
      <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${chevronClassName}`} />
    </div>
  )
}

/**
 * Hareket kütüphanesi filtre çubuğu — üye kütüphanesi ve koç program akışında ortak.
 */
export default function ExerciseLibraryFilters({
  searchInput,
  onSearchChange,
  category,
  onCategoryChange,
  difficulty,
  onDifficultyChange,
  location,
  onLocationChange,
  requiresMachine,
  onRequiresMachineChange,
  className = '',
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchInput.trim()) count += 1
    if (category !== EXERCISE_CATEGORY_ALL) count += 1
    if (difficulty !== DIFFICULTY_ALL) count += 1
    if (location) count += 1
    if (requiresMachine) count += 1
    return count
  }, [searchInput, category, difficulty, location, requiresMachine])

  const hasActiveFilters = Boolean(location || requiresMachine)

  return (
    <div className={`rounded-xl border border-violet-200/60 bg-gradient-to-br from-violet-50/60 via-white to-purple-50/30 p-2 shadow-sm shadow-violet-100/20 sm:p-2.5 ${className}`}>
      <button
        type="button"
        onClick={() => setFiltersOpen((v) => !v)}
        aria-expanded={filtersOpen}
        className="mb-0 flex w-full items-center justify-between gap-2 rounded-lg text-left transition active:scale-[0.99] sm:hidden"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
            <Search className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-violet-800">Hareket Ara</p>
            <p className="mt-0.5 truncate text-[10px] font-medium text-violet-700/65">
              {filtersOpen
                ? 'Filtreleri gizle'
                : activeFilterCount > 0
                  ? `${activeFilterCount} filtre aktif · dokunarak aç`
                  : 'Arama ve filtreler · dokunarak aç'}
            </p>
          </div>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-violet-500 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
      </button>

      <div className={`flex flex-col gap-2 ${filtersOpen ? 'mt-2' : 'hidden sm:flex'}`}>
        <div className="w-full min-w-0">
          <label htmlFor="exercise-library-search" className={FILTER_THEMES.search.label}>
            Hareket Ara
          </label>
          <div className={FILTER_THEMES.search.wrap}>
            <span className={`pointer-events-none absolute inset-y-0 left-0 z-10 flex w-8 shrink-0 items-center justify-center bg-gradient-to-br ${FILTER_THEMES.search.iconBar}`}>
              <Search className="h-3.5 w-3.5 text-white" />
            </span>
            <input
              id="exercise-library-search"
              type="search"
              placeholder="Hareket adı ara..."
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              className={FILTER_THEMES.search.input}
            />
          </div>
        </div>

        <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="min-w-0 space-y-1">
            <label className={FILTER_THEMES.category.label}>Hareket Tipi</label>
            <ExerciseCategorySelect
              value={category}
              onChange={onCategoryChange}
              selectClassName={FILTER_THEMES.category.select}
              chevronClassName={FILTER_THEMES.category.chevron}
            />
          </div>
          <div className="min-w-0 space-y-1">
            <label className={FILTER_THEMES.difficulty.label}>Zorluk</label>
            <FilterSelect
              value={difficulty}
              onChange={(e) => onDifficultyChange(e.target.value)}
              className={FILTER_THEMES.difficulty.select}
              chevronClassName={FILTER_THEMES.difficulty.chevron}
            >
              <option value={DIFFICULTY_ALL}>Tümü</option>
              {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </FilterSelect>
          </div>
          <div className="min-w-0 space-y-1">
            <label className={FILTER_THEMES.location.label}>Konum</label>
            <FilterSelect
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              className={FILTER_THEMES.location.select}
              chevronClassName={FILTER_THEMES.location.chevron}
            >
              <option value={FILTER_ALL}>Tümü</option>
              {EXERCISE_LOCATION_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </FilterSelect>
          </div>
          <div className="min-w-0 space-y-1">
            <label className={FILTER_THEMES.machine.label}>Makine</label>
            <FilterSelect
              value={requiresMachine}
              onChange={(e) => onRequiresMachineChange(e.target.value)}
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
          <p className="flex flex-wrap items-center gap-1.5 rounded-lg border border-violet-100 bg-gradient-to-r from-violet-50/80 via-white to-purple-50/60 px-2 py-1.5 text-[10px]">
            <span className="font-medium text-cream-800/60">Aktif:</span>
            {location && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-900 ring-1 ring-rose-200">
                {EXERCISE_LOCATION_LABELS[location] || location}
              </span>
            )}
            {requiresMachine && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-900 ring-1 ring-slate-200">
                {REQUIRES_MACHINE_LABELS[requiresMachine] || requiresMachine}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

export { DIFFICULTY_ALL, FILTER_ALL, EXERCISE_CATEGORY_ALL }

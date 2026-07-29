import { ChevronDown } from 'lucide-react'
import { EXERCISE_CATEGORY_ALL } from '../../data/exerciseCategories'
import { useExerciseCategories } from '../../hooks/useExerciseCategories'

const DEFAULT_SELECT =
  'w-full min-h-[2rem] cursor-pointer appearance-none rounded-lg border border-violet-200/90 bg-violet-50/70 px-2.5 py-1.5 pr-7 text-xs font-medium text-violet-950 shadow-sm shadow-violet-100/30 outline-none transition hover:border-violet-300 hover:bg-violet-50 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-200/60'

export default function ExerciseCategorySelect({
  value,
  onChange,
  selectClassName,
  chevronClassName = 'text-brand-600',
}) {
  const { categories } = useExerciseCategories()
  const items = [EXERCISE_CATEGORY_ALL, ...categories]
  const selectCls = selectClassName || DEFAULT_SELECT

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Hareket tipi filtresi"
        className={selectCls}
      >
        {items.map((cat) => (
          <option key={cat} value={cat}>{cat === EXERCISE_CATEGORY_ALL ? 'Tüm tipler' : cat}</option>
        ))}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${chevronClassName}`}
      />
    </div>
  )
}

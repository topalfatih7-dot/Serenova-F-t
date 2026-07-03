import { EXERCISE_CATEGORY_ALL } from '../../data/exerciseCategories'
import { useExerciseCategories } from '../../hooks/useExerciseCategories'

export default function ExerciseCategorySelect({ value, onChange, className = '' }) {
  const { categories } = useExerciseCategories()
  const items = [EXERCISE_CATEGORY_ALL, ...categories]

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Hareket tipi filtresi"
      className={`w-full max-w-xs rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300 ${className}`}
    >
      {items.map((cat) => (
        <option key={cat} value={cat}>{cat === EXERCISE_CATEGORY_ALL ? 'Tüm tipler' : cat}</option>
      ))}
    </select>
  )
}

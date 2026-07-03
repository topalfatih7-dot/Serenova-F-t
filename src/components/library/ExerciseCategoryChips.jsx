import { EXERCISE_CATEGORIES, EXERCISE_CATEGORY_ALL } from '../../data/exerciseCategories'

export default function ExerciseCategoryChips({ value, onChange }) {
  const items = [EXERCISE_CATEGORY_ALL, ...EXERCISE_CATEGORIES]

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((cat) => {
        const active = value === cat
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? 'border-brand-400 bg-brand-50 text-brand-800 shadow-sm'
                : 'border-cream-200 bg-white text-cream-800/70 hover:border-brand-200 hover:bg-cream-50'
            }`}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}

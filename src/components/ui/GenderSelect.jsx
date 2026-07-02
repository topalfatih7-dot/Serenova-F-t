import { MEMBER_GENDERS } from '../../data/genders'

/**
 * Zorunlu cinsiyet seçimi — yalnızca Kadın / Erkek.
 */
export default function GenderSelect({ value, onChange, error, large = false }) {
  const pad = large ? 'py-4 text-base' : 'py-3 text-sm'

  return (
    <div>
      <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-cream-800">
        Cinsiyet <span className="text-red-500">*</span>
      </span>
      <div className="grid grid-cols-2 gap-3">
        {MEMBER_GENDERS.map((g) => {
          const selected = value === g.value
          return (
            <button
              key={g.value}
              type="button"
              onClick={() => onChange(g.value)}
              className={`rounded-2xl border-2 font-semibold transition ${pad} ${
                selected
                  ? 'border-brand-500 bg-brand-50 text-brand-800 ring-4 ring-brand-100'
                  : error
                    ? 'border-red-300 bg-white text-cream-800 hover:border-red-400'
                    : 'border-cream-300 bg-white text-cream-800 hover:border-brand-300 hover:bg-brand-50/40'
              }`}
            >
              {g.label}
            </button>
          )
        })}
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

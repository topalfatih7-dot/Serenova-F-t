export default function NumberSelector({ label, value, min = 0, max = 5, step = 1, onChange, unit = '', hint, formatOption }) {
  const options = []
  for (let v = min; v <= max; v += step) options.push(v)

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-sm font-semibold text-cream-900">{label}</p>
        <span className="rounded-lg bg-brand-50 px-3 py-1 text-sm font-bold text-brand-600">
          {value}{unit}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((v) => {
          const selected = Number(value) === v
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`min-w-[2.75rem] rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                selected
                  ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                  : 'border-cream-200 bg-white text-cream-800/70 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              {formatOption ? formatOption(v) : v}
            </button>
          )
        })}
      </div>
      {hint && <p className="mt-2 text-xs text-cream-800/50">{hint}</p>}
    </div>
  )
}

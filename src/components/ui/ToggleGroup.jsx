export default function ToggleGroup({ options, value, onChange, label }) {
  return (
    <div>
      {label && <p className="mb-2 text-sm font-medium text-cream-900">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt
          const lbl = typeof opt === 'object' ? opt.label : opt
          return (
            <button
              key={val}
              type="button"
              onClick={() => onChange(val)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                value === val
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-white border border-cream-200 text-cream-800 hover:border-brand-200'
              }`}
            >
              {lbl}
            </button>
          )
        })}
      </div>
    </div>
  )
}

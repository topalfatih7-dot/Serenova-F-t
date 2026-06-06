export default function RangeSelector({ label, value, min, max, step = 1, onChange, unit = '' }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-cream-900">{label}</p>
        <span className="rounded-lg bg-brand-50 px-3 py-1 text-sm font-bold text-brand-600">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-cream-200 accent-brand-500"
      />
      <div className="mt-1 flex justify-between text-xs text-cream-800/40">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

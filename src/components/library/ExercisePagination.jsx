import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function ExercisePagination({
  page,
  totalPages,
  total,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1) return null

  const pages = []
  const add = (p) => pages.push(p)
  const window = 2
  let last = 0
  for (let p = 1; p <= totalPages; p += 1) {
    if (p === 1 || p === totalPages || (p >= page - window && p <= page + window)) {
      if (last && p - last > 1) pages.push('…')
      add(p)
      last = p
    }
  }

  return (
    <div className={`flex flex-col items-center gap-3 sm:flex-row sm:justify-between ${className}`}>
      <p className="text-sm text-cream-800/55">
        Toplam <span className="font-semibold text-cream-900">{total}</span> hareket
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-cream-200 p-2 text-cream-800/60 hover:bg-cream-50 disabled:opacity-40"
          aria-label="Önceki sayfa"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) => (
          typeof p === 'number' ? (
            <button
              key={`p-${p}`}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-[2.25rem] rounded-lg px-2 py-1.5 text-sm font-medium ${
                p === page
                  ? 'bg-brand-500 text-white'
                  : 'border border-cream-200 text-cream-800/70 hover:bg-cream-50'
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={`gap-${i}`} className="px-1 text-cream-400">…</span>
          )
        ))}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-cream-200 p-2 text-cream-800/60 hover:bg-cream-50 disabled:opacity-40"
          aria-label="Sonraki sayfa"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

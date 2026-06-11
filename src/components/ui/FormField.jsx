import { forwardRef } from 'react'

const FormField = forwardRef(function FormField(
  { label, icon: Icon, error, hint, as = 'input', className = '', children, ...props },
  ref,
) {
  const field = [
    'w-full rounded-2xl border text-sm text-cream-900 outline-none transition',
    'placeholder:text-cream-800/40',
    Icon ? 'pl-11' : 'pl-4',
    'pr-4 py-3.5',
    error
      ? 'border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-4 focus:ring-red-100'
      : 'border-cream-200 bg-cream-50/60 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100',
    className,
  ].join(' ')

  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">
          {label}
        </span>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
        )}
        {as === 'select' ? (
          <select ref={ref} className={field} {...props}>
            {children}
          </select>
        ) : (
          <input ref={ref} className={field} {...props} />
        )}
      </div>
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-red-500">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-cream-800/50">{hint}</span>
      ) : null}
    </label>
  )
})

export default FormField

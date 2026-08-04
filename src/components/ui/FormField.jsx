import { forwardRef } from 'react'

const FormField = forwardRef(function FormField(
  { label, icon: Icon, error, hint, as = 'input', className = '', emphasis = false, large = false, children, ...props },
  ref,
) {
  const field = [
    'w-full min-w-0 max-w-full rounded-2xl border outline-none transition',
    large ? 'text-base py-4' : 'text-sm py-3.5',
    emphasis ? 'text-cream-900 placeholder:text-cream-800/55' : 'text-cream-900 placeholder:text-cream-800/40',
    Icon ? (large ? 'pl-12' : 'pl-11') : 'pl-4',
    'pr-4',
    error
      ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-4 focus:ring-red-100'
      : emphasis
        ? 'border-cream-400 bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-100'
        : 'border-cream-200 bg-cream-50/60 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100',
    className,
  ].join(' ')

  return (
    <label className="block min-w-0">
      {label && (
        <span className={`mb-2 block font-semibold uppercase tracking-wide ${large ? 'text-sm text-cream-800' : `text-xs ${emphasis ? 'text-cream-800' : 'text-cream-800/55'}`}`}>
          {label}
        </span>
      )}
      <div className="relative min-w-0">
        {Icon && (
          <Icon className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${large ? 'left-4 h-5 w-5' : 'left-3.5 h-4 w-4'} ${emphasis ? 'text-cream-700' : 'text-cream-800/40'}`} />
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
        <span className={`mt-2 block font-medium text-red-500 ${large ? 'text-sm' : 'text-xs'}`}>{error}</span>
      ) : hint ? (
        <span className={`mt-2 block text-cream-800/50 ${large ? 'text-sm' : 'text-xs'}`}>{hint}</span>
      ) : null}
    </label>
  )
})

export default FormField

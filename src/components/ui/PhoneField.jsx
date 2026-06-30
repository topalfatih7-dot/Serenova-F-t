import { ChevronDown } from 'lucide-react'
import { COUNTRY_CODES, getCountry, formatNationalNumber } from '../../data/countryCodes'

/**
 * Ülke koduna göre seçilebilir telefon alanı.
 * - country: ISO kodu (örn. 'TR')
 * - value: ulusal numara (rakam/biçimli)
 * - onCountryChange(iso), onValueChange(formattedNational)
 */
export default function PhoneField({
  label = 'Telefon Numarası',
  country = 'TR',
  value = '',
  onCountryChange,
  onValueChange,
  error,
  hint,
  emphasis = false,
  large = false,
}) {
  const selected = getCountry(country)

  return (
    <div>
      {label && (
        <span className={`mb-2 block font-semibold uppercase tracking-wide ${large ? 'text-sm text-cream-800' : `text-xs ${emphasis ? 'text-cream-800' : 'text-cream-800/55'}`}`}>
          {label}
        </span>
      )}
      <div
        className={`flex items-stretch overflow-hidden rounded-2xl border bg-cream-50/60 transition focus-within:bg-white focus-within:ring-4 ${
          error
            ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-100'
            : emphasis
              ? 'border-cream-400 bg-white focus-within:border-brand-500 focus-within:ring-brand-100'
              : 'border-cream-200 focus-within:border-brand-400 focus-within:ring-brand-100'
        }`}
      >
        {/* Ülke seçici — kompakt tetikleyici (bayrak + kod). Native select görünmez şekilde üstte. */}
        <div className="relative flex items-center gap-1.5 border-r border-cream-200 bg-white/50 pl-3 pr-2">
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="text-sm font-semibold text-cream-900">+{selected.dial}</span>
          <ChevronDown className="h-3.5 w-3.5 text-cream-800/40" />
          <select
            value={country}
            onChange={(e) => onCountryChange?.(e.target.value)}
            aria-label="Ülke kodu"
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.flag} {c.name} (+{c.dial})
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex flex-1 items-center">
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder={country === 'TR' ? '5XX XXX XX XX' : 'Numara'}
            value={value}
            onChange={(e) => onValueChange?.(formatNationalNumber(country, e.target.value))}
            className={`w-full bg-transparent outline-none placeholder:text-cream-800/40 ${large ? 'py-4 pl-3 pr-4 text-base text-cream-900' : 'py-3.5 pl-3 pr-4 text-sm text-cream-900'}`}
          />
        </div>
      </div>
      {error ? (
        <span className={`mt-2 block font-medium text-red-500 ${large ? 'text-sm' : 'text-xs'}`}>{error}</span>
      ) : hint ? (
        <span className={`mt-2 block text-cream-800/50 ${large ? 'text-sm' : 'text-xs'}`}>{hint}</span>
      ) : null}
    </div>
  )
}

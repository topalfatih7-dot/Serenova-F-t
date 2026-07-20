import { Venus, Mars, Check, Lock } from 'lucide-react'
import { MEMBER_GENDERS } from '../../data/genders'

const GENDER_STYLE = {
  female: {
    idle: 'border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 text-rose-900 hover:border-rose-300',
    active: 'border-rose-500 bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-200/60 ring-4 ring-rose-100',
    iconIdle: 'bg-rose-100 text-rose-600',
    iconActive: 'bg-white/20 text-white',
    Icon: Venus,
  },
  male: {
    idle: 'border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 text-sky-900 hover:border-sky-300',
    active: 'border-sky-500 bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-200/60 ring-4 ring-sky-100',
    iconIdle: 'bg-sky-100 text-sky-600',
    iconActive: 'bg-white/20 text-white',
    Icon: Mars,
  },
}

/**
 * Zorunlu cinsiyet seçimi — yalnızca Kadın / Erkek.
 * `locked`: kayıt sonrası değiştirilemez (görüntüleme).
 */
export default function GenderSelect({ value, onChange, error, large = false, hint, locked = false }) {
  const pad = large ? 'py-4' : 'py-3'

  return (
    <div>
      <span className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-cream-800">
        Cinsiyet {!locked && <span className="text-red-500">*</span>}
        {locked && <Lock className="h-3.5 w-3.5 text-cream-800/40" />}
      </span>
      <div className="grid grid-cols-2 gap-3">
        {MEMBER_GENDERS.map((g) => {
          const selected = value === g.value
          const style = GENDER_STYLE[g.value] || GENDER_STYLE.male
          const Icon = style.Icon
          return (
            <button
              key={g.value}
              type="button"
              disabled={locked}
              onClick={() => !locked && onChange?.(g.value)}
              className={`flex items-center gap-2.5 rounded-2xl border-2 px-3 font-semibold transition ${pad} ${
                selected
                  ? style.active
                  : locked
                    ? 'cursor-not-allowed border-cream-200 bg-cream-50 text-cream-800/50 opacity-60'
                    : error
                      ? 'border-red-300 bg-white text-cream-800 hover:border-red-400'
                      : style.idle
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  selected ? style.iconActive : style.iconIdle
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className={`flex-1 text-left ${large ? 'text-base' : 'text-sm'}`}>{g.label}</span>
              {selected ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25">
                  <Check className="h-3 w-3" />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      {error ? (
        <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-2 text-xs text-cream-800/50">{hint}</p>
      ) : null}
    </div>
  )
}

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { THEME_PREF_LABELS, THEME_PREFS } from '../../utils/theme'

const PREF_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

/**
 * compact: güneş/ay — açık ↔ koyu.
 * segmented: Aydınlık / Karanlık / Sistem.
 */
export default function ThemeToggle({ variant = 'compact', className = '' }) {
  const { preference, isDark, setTheme } = useTheme()

  if (variant === 'segmented') {
    return (
      <div
        role="radiogroup"
        aria-label="Görünüm"
        className={`grid grid-cols-3 gap-1 rounded-2xl border border-cream-200 bg-cream-50/80 p-1 ${className}`.trim()}
      >
        {THEME_PREFS.map((pref) => {
          const Icon = PREF_ICONS[pref]
          const selected = preference === pref
          return (
            <button
              key={pref}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(pref)}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition ${
                selected
                  ? 'bg-white text-cream-900 shadow-sm dark:bg-[var(--yf-elevated)]'
                  : 'text-cream-800/70 hover:text-cream-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {THEME_PREF_LABELS[pref]}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Gündüz moduna geç' : 'Gece moduna geç'}
      title={isDark ? 'Gündüz modu' : 'Gece modu'}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border border-cream-200/80 bg-white/80 text-cream-800 transition hover:bg-cream-50 dark:bg-[var(--yf-elevated)] dark:hover:bg-cream-100 ${className}`.trim()}
    >
          {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  )
}

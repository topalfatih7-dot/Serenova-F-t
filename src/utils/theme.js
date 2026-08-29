/** Cihaz teması — localStorage anahtarı boot script ile aynı olmalı. */
export const THEME_KEY = 'yeniform-theme'

export const THEME_PREFS = ['light', 'dark', 'system']

export const DEFAULT_THEME_PREF = 'light'

/** Tarayıcı chrome / PWA — aydınlık marka yeşili, karanlık sayfa zemini */
export const THEME_COLOR_LIGHT = '#2d6a4f'
export const THEME_COLOR_DARK = '#0f161c'

export const THEME_PREF_LABELS = {
  light: 'Aydınlık',
  dark: 'Karanlık',
  system: 'Sistem',
}

export function normalizeThemePref(value) {
  if (value === 'dark' || value === 'system' || value === 'light') return value
  return DEFAULT_THEME_PREF
}

export function resolveIsDark(pref, systemDark) {
  const p = normalizeThemePref(pref)
  if (p === 'dark') return true
  if (p === 'light') return false
  return Boolean(systemDark)
}

export function getSystemDark() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Kayıt yoksa null — hesap ayarından hidrasyon için. */
export function readStoredTheme() {
  try {
    const raw = window.localStorage.getItem(THEME_KEY)
    if (raw == null || raw === '') return null
    return normalizeThemePref(raw)
  } catch {
    return null
  }
}

export function writeStoredTheme(pref) {
  try {
    window.localStorage.setItem(THEME_KEY, normalizeThemePref(pref))
  } catch {
    /* private mode */
  }
}

export function clearStoredTheme() {
  try {
    window.localStorage.removeItem(THEME_KEY)
  } catch {
    /* private mode */
  }
}

export function applyThemeToDocument(pref, systemDark = getSystemDark()) {
  if (typeof document === 'undefined') return false
  const isDark = resolveIsDark(pref, systemDark)
  const root = document.documentElement
  root.classList.toggle('dark', isDark)
  root.style.colorScheme = isDark ? 'dark' : 'light'
  root.dataset.theme = normalizeThemePref(pref)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', isDark ? THEME_COLOR_DARK : THEME_COLOR_LIGHT)
  }
  return isDark
}

export function subscribeSystemTheme(callback) {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {}
  }
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => callback(mq.matches)
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}

export function getChartColors(isDark) {
  return {
    grid: isDark ? '#2a3a46' : '#efe8de',
    tick: isDark ? '#c5d0d8' : '#3a4550',
    tooltipBg: isDark ? '#1a242e' : '#ffffff',
    tooltipBorder: isDark ? '#3a4a58' : '#e4eaef',
    tooltipColor: isDark ? '#edf2f6' : '#1a2332',
  }
}

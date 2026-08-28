import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useApp } from './AppContext'
import {
  applyThemeToDocument,
  DEFAULT_THEME_PREF,
  getChartColors,
  getSystemDark,
  normalizeThemePref,
  readStoredTheme,
  resolveIsDark,
  subscribeSystemTheme,
  writeStoredTheme,
} from '../utils/theme'

const ThemeContext = createContext(null)

function readBootIsDark() {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

function persistMemberTheme(updateSettings, pref) {
  if (typeof updateSettings !== 'function') return
  return updateSettings({ theme: pref })
}

function persistStaffTheme(updateStaffProfile, staffUser, pref) {
  if (typeof updateStaffProfile !== 'function' || !staffUser?.id) return
  return updateStaffProfile(staffUser.id, {
    ...staffUser,
    settings: {
      ...(staffUser.settings || {}),
      theme: pref,
    },
  })
}

export function ThemeProvider({ children }) {
  const {
    loading,
    isAdmin,
    isStaff,
    staffUser,
    settings,
    updateSettings,
    updateStaffProfile,
  } = useApp()

  const [preference, setPreference] = useState(() => readStoredTheme() ?? DEFAULT_THEME_PREF)
  const [systemDark, setSystemDark] = useState(() => getSystemDark())
  const [isDark, setIsDark] = useState(() => readBootIsDark())
  const hydratedFromAccountRef = useRef(false)

  const apply = useCallback((pref, sysDark = getSystemDark()) => {
    const nextPref = normalizeThemePref(pref)
    const dark = applyThemeToDocument(nextPref, sysDark)
    setPreference(nextPref)
    setIsDark(dark)
    return dark
  }, [])

  useEffect(() => {
    apply(preference, systemDark)
  }, [apply, preference, systemDark])

  useEffect(() => subscribeSystemTheme(setSystemDark), [])

  useEffect(() => {
    if (hydratedFromAccountRef.current || loading) return
    if (readStoredTheme() != null) {
      hydratedFromAccountRef.current = true
      return
    }
    const accountPref = isStaff
      ? staffUser?.settings?.theme
      : (!isAdmin ? settings?.theme : null)
    if (!accountPref) return
    hydratedFromAccountRef.current = true
    const next = normalizeThemePref(accountPref)
    writeStoredTheme(next)
    apply(next, getSystemDark())
  }, [apply, isAdmin, isStaff, loading, settings?.theme, staffUser?.settings?.theme])

  const setTheme = useCallback((nextPref) => {
    const pref = normalizeThemePref(nextPref)
    hydratedFromAccountRef.current = true
    writeStoredTheme(pref)
    apply(pref, getSystemDark())
    if (isStaff && staffUser?.id) {
      persistStaffTheme(updateStaffProfile, staffUser, pref)
      return
    }
    if (!isAdmin && !isStaff) {
      persistMemberTheme(updateSettings, pref)
    }
  }, [apply, isAdmin, isStaff, staffUser, updateSettings, updateStaffProfile])

  const value = useMemo(() => ({
    preference,
    isDark: resolveIsDark(preference, systemDark),
    resolvedDark: isDark,
    systemDark,
    setTheme,
  }), [preference, isDark, systemDark, setTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export function useChartColors() {
  const { isDark } = useTheme()
  return useMemo(() => getChartColors(isDark), [isDark])
}

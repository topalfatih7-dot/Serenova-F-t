import {
  createContext,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import {
  applyThemeToDocument,
  clearStoredTheme,
  getChartColors,
} from '../utils/theme'

const LIGHT = {
  preference: 'light',
  isDark: false,
  resolvedDark: false,
  systemDark: false,
  setTheme: () => {},
}

const ThemeContext = createContext(LIGHT)

/** Koyu tema şimdilik kapalı — her zaman aydınlık. */
export function ThemeProvider({ children }) {
  useEffect(() => {
    clearStoredTheme()
    applyThemeToDocument('light', false)
  }, [])

  return (
    <ThemeContext.Provider value={LIGHT}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext) || LIGHT
}

export function useChartColors() {
  return useMemo(() => getChartColors(false), [])
}

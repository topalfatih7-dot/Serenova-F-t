import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage(key, initialValue) {
  const read = () => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  }

  const [stored, setStored] = useState(read)

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(stored))
    } catch {
      /* ignore */
    }
  }, [key, stored])

  const setValue = useCallback((value) => {
    setStored((prev) => (typeof value === 'function' ? value(prev) : value))
  }, [])

  return [stored, setValue]
}

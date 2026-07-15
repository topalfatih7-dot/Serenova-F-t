import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  EXERCISE_PAGE_SIZE,
  EXERCISE_SORT_OPTIONS,
  fetchExercisesPage,
} from '../services/exerciseLibrary'

const DEFAULT_FILTERS = {
  search: '',
  category: 'Tümü',
  difficulty: 'Tümü',
  equipment: '',
  location: '',
  requiresMachine: '',
  videoReady: null,
  excludeDeferred: true,
}

/**
 * Sayfalı hareket kütüphanesi hook'u.
 */
export function useExerciseLibrary({
  pageSize = EXERCISE_PAGE_SIZE,
  initialSort = 'name_asc',
  includeDeferred = false,
  adminMode = false,
} = {}) {
  const [page, setPageState] = useState(1)
  const [sort, setSortState] = useState(initialSort)
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    excludeDeferred: !includeDeferred && !adminMode,
  })
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await fetchExercisesPage({ page, pageSize, sort, filters })
    setItems(res.items)
    setTotal(res.total)
    setTotalPages(res.totalPages)
    setError(res.error)
    setLoading(false)
  }, [page, pageSize, sort, filters])

  // setState yalnızca await sonrası — loading=true event handler'larda / initial state
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await fetchExercisesPage({ page, pageSize, sort, filters })
      if (cancelled) return
      setItems(res.items)
      setTotal(res.total)
      setTotalPages(res.totalPages)
      setError(res.error)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [page, pageSize, sort, filters])

  const patchFilters = useCallback((patch) => {
    setLoading(true)
    setFilters((f) => ({ ...f, ...patch }))
    setPageState(1)
  }, [])

  const setSearch = useCallback((search) => patchFilters({ search }), [patchFilters])
  const setCategory = useCallback((category) => patchFilters({ category }), [patchFilters])
  const setDifficulty = useCallback((difficulty) => patchFilters({ difficulty }), [patchFilters])
  const setLocation = useCallback((location) => patchFilters({ location }), [patchFilters])
  const setRequiresMachine = useCallback((requiresMachine) => patchFilters({ requiresMachine }), [patchFilters])

  const setPage = useCallback((p) => {
    setLoading(true)
    setPageState(p)
  }, [])

  const setSort = useCallback((s) => {
    setLoading(true)
    setSortState(s)
    setPageState(1)
  }, [])

  const sortOptions = useMemo(() => EXERCISE_SORT_OPTIONS, [])

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    loading,
    error,
    sort,
    setSort,
    sortOptions,
    filters,
    setSearch,
    setCategory,
    setDifficulty,
    setLocation,
    setRequiresMachine,
    setPage,
    refresh: load,
  }
}

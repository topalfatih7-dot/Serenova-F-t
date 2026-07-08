import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  EXERCISE_PAGE_SIZE,
  EXERCISE_SORT_OPTIONS,
  fetchExerciseEquipmentOptions,
  fetchExercisesPage,
} from '../services/exerciseLibrary'
import { prefetchExerciseVideosFromItems } from '../utils/exerciseVideoPrefetch'

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
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState(initialSort)
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    excludeDeferred: !includeDeferred && !adminMode,
  })
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [equipmentOptions, setEquipmentOptions] = useState([])

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

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (loading || !items.length) return undefined
    prefetchExerciseVideosFromItems(items)
    return undefined
  }, [items, loading])

  useEffect(() => {
    fetchExerciseEquipmentOptions().then(setEquipmentOptions)
  }, [total])

  const patchFilters = useCallback((patch) => {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }, [])

  const setSearch = useCallback((search) => patchFilters({ search }), [patchFilters])
  const setCategory = useCallback((category) => patchFilters({ category }), [patchFilters])
  const setDifficulty = useCallback((difficulty) => patchFilters({ difficulty }), [patchFilters])
  const setEquipment = useCallback((equipment) => patchFilters({ equipment }), [patchFilters])
  const setLocation = useCallback((location) => patchFilters({ location }), [patchFilters])
  const setRequiresMachine = useCallback((requiresMachine) => patchFilters({ requiresMachine }), [patchFilters])

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
    setSort: (s) => { setSort(s); setPage(1) },
    sortOptions,
    filters,
    setSearch,
    setCategory,
    setDifficulty,
    setEquipment,
    setLocation,
    setRequiresMachine,
    setPage,
    refresh: load,
    equipmentOptions,
  }
}

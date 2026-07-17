/**
 * Hareket kütüphanesi — sayfalama, sıralama ve filtreleme.
 */

import { supabase } from './supabaseClient'
import { rowToExercise } from './supabaseDb'

export const EXERCISE_PAGE_SIZE = 24
export const EXERCISE_PAGE_SIZE_ADMIN = 30

export const EXERCISE_SORT_OPTIONS = [
  { id: 'name_asc', column: 'name', ascending: true, label: 'İsim (A → Z)' },
  { id: 'name_desc', column: 'name', ascending: false, label: 'İsim (Z → A)' },
  { id: 'category_asc', column: 'body_part', ascending: true, label: 'Hareket tipi' },
  { id: 'difficulty_asc', column: 'difficulty', ascending: true, label: 'Zorluk' },
  { id: 'newest', column: 'created_at', ascending: false, label: 'En yeni' },
]

const DIFFICULTY_ORDER = { beginner: 1, intermediate: 2, advanced: 3 }

function resolveSort(sortId = 'name_asc') {
  return EXERCISE_SORT_OPTIONS.find((o) => o.id === sortId) || EXERCISE_SORT_OPTIONS[0]
}

function applyFilters(query, filters = {}) {
  const {
    search = '',
    category = '',
    difficulty = '',
    equipment = '',
    location = '',
    requiresMachine = '',
    videoReady = null,
    excludeDeferred = true,
    ids = null,
  } = filters

  if (Array.isArray(ids)) {
    if (ids.length === 0) return null
    query = query.in('id', ids)
  }
  if (search.trim()) {
    const q = `%${search.trim()}%`
    query = query.or(`name.ilike.${q},equipment.ilike.${q}`)
  }
  if (category && category !== 'Tümü') query = query.eq('body_part', category)
  if (difficulty && difficulty !== 'Tümü') query = query.eq('difficulty', difficulty)
  if (equipment) query = query.eq('equipment', equipment)
  if (location) query = query.contains('locations', [location])
  if (requiresMachine === 'true') query = query.eq('requires_machine', true)
  if (requiresMachine === 'false') query = query.eq('requires_machine', false)
  if (videoReady === true) query = query.eq('video_pending', false)
  if (videoReady === false) query = query.eq('video_pending', true)
  if (excludeDeferred) query = query.neq('metadata->>importStatus', 'deferred')

  return query
}

/**
 * Sayfalı hareket listesi.
 * @returns {{ items, total, page, pageSize, totalPages, error }}
 */
export async function fetchExercisesPage({
  page = 1,
  pageSize = EXERCISE_PAGE_SIZE,
  sort = 'name_asc',
  filters = {},
} = {}) {
  if (!supabase) return { items: [], total: 0, page, pageSize, totalPages: 0, error: 'Supabase yok' }

  if (Array.isArray(filters.ids) && filters.ids.length === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 0, error: null }
  }

  const { column, ascending } = resolveSort(sort)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('exercises')
    .select('*', { count: 'exact' })

  query = applyFilters(query, filters)
  if (!query) {
    return { items: [], total: 0, page, pageSize, totalPages: 0, error: null }
  }
  query = query.order(column, { ascending, nullsFirst: false })

  if (column !== 'name') query = query.order('name', { ascending: true })

  const { data, error, count } = await query.range(from, to)

  let items = (data || []).map(rowToExercise)

  if (sort === 'difficulty_asc') {
    items = [...items].sort(
      (a, b) => (DIFFICULTY_ORDER[a.difficulty] || 9) - (DIFFICULTY_ORDER[b.difficulty] || 9),
    )
  }

  const total = count ?? 0
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    error: error?.message || null,
  }
}

/** Tek hareket — program/takvim detay modalı için. */
export async function fetchExerciseById(id) {
  if (!supabase || !id) return null
  const { data, error } = await supabase.from('exercises').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return rowToExercise(data)
}

/** AI / program önerisi için hafif tam liste (yalnızca gerekli alanlar) */
export async function fetchExercisesForAi(limit = 2000) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, description, category, body_part, sport_type, video_url, video_pending, equipment, target_muscle, difficulty, movement_category, locations, requires_machine')
    .neq('metadata->>importStatus', 'deferred')
    .order('name', { ascending: true })
    .limit(limit)

  if (error) return []
  return (data || []).map(rowToExercise)
}

/** Kütüphanedeki toplam hareket sayısı */
export async function fetchExerciseCount(filters = {}) {
  if (!supabase) return 0
  let query = supabase.from('exercises').select('*', { count: 'exact', head: true })
  query = applyFilters(query, filters)
  const { count, error } = await query
  if (error) return 0
  return count ?? 0
}

/** Kategori başına hareket sayısı */
export async function fetchCategoryCounts() {
  if (!supabase) return {}
  const { data, error } = await supabase.from('exercises').select('category')
  if (error) return {}
  const counts = {}
  ;(data || []).forEach((r) => {
    const c = r.category || 'Tüm Vücut'
    counts[c] = (counts[c] || 0) + 1
  })
  return counts
}

/** Kütüphanedeki benzersiz hareket tipleri (kart rozeti = body_part) */
export async function fetchDistinctCategories() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('exercises')
    .select('body_part')
    .neq('metadata->>importStatus', 'deferred')
    .not('body_part', 'is', null)
    .neq('body_part', '')

  if (error) return []
  const set = new Set((data || []).map((r) => r.body_part).filter(Boolean))
  return [...set].sort((a, b) => a.localeCompare(b, 'tr'))
}

/** Filtre seçenekleri — ekipman listesi */
export async function fetchExerciseEquipmentOptions() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('exercises')
    .select('equipment')
    .neq('metadata->>importStatus', 'deferred')
    .not('equipment', 'is', null)
    .neq('equipment', '')

  if (error) return []
  const set = new Set((data || []).map((r) => r.equipment).filter(Boolean))
  return [...set].sort((a, b) => a.localeCompare(b, 'tr'))
}

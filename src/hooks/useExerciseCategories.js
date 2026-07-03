import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { DEFAULT_EXERCISE_CATEGORIES } from '../data/exerciseCategories'

/** Admin panelinden yönetilen hareket tipleri (site_content.exercise_taxonomy.bodyParts). */
export function useExerciseCategories() {
  const { exerciseTaxonomy } = useApp()

  const categories = useMemo(() => {
    const fromDb = (exerciseTaxonomy?.bodyParts || []).map((c) => c?.trim()).filter(Boolean)
    if (fromDb.length) return fromDb
    return [...DEFAULT_EXERCISE_CATEGORIES]
  }, [exerciseTaxonomy])

  const taxonomyId = exerciseTaxonomy?.id || null

  return { categories, taxonomyId, exerciseTaxonomy }
}

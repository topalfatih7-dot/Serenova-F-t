import { useState, useEffect } from 'react'
import { fetchDistinctCategories } from '../services/exerciseLibrary'
import { IMPORT_TAXONOMY_BODY_PARTS } from '../data/exerciseImportMaps'

/** Hareket tipleri — veritabanındaki import kayıtlarından (admin paneli yönetimi kaldırıldı). */
export function useExerciseCategories() {
  const [categories, setCategories] = useState(IMPORT_TAXONOMY_BODY_PARTS)

  useEffect(() => {
    fetchDistinctCategories().then((fromDb) => {
      if (fromDb.length) setCategories(fromDb)
    })
  }, [])

  return { categories, taxonomyId: null, exerciseTaxonomy: null }
}

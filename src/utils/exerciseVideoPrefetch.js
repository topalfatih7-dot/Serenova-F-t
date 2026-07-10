import {
  getExerciseVideoUrl,
  isExerciseVideoStoragePath,
  normalizeExerciseVideoRef,
  prefetchExerciseVideoUrls,
} from '../services/supabaseDb'

/** video_url alanından storage path çıkarır (YouTube/harici URL → null). */
export function exerciseStoragePathFromUrl(url) {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (/youtube\.com|youtu\.be/.test(trimmed)) return null
  if (isExerciseVideoStoragePath(trimmed)) return normalizeExerciseVideoRef(trimmed)
  if (/^https?:\/\//.test(trimmed) && trimmed.includes('/exercise-videos/')) {
    return normalizeExerciseVideoRef(trimmed)
  }
  return null
}

/** Hover / pointerdown / modal öncesi imzalı URL'i önbelleğe alır (no-op if invalid). */
export function prefetchExerciseVideo(url) {
  const path = exerciseStoragePathFromUrl(url)
  if (!path) return Promise.resolve(null)
  return getExerciseVideoUrl(path)
}

export { prefetchExerciseVideoUrls }

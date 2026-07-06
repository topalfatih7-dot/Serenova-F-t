/** Supabase signed URL önbelleği — aynı dosya için tekrarlayan API çağrılarını önler. */

const CACHE = new Map()
const INFLIGHT = new Map()

const DEFAULT_TTL_MS = 55 * 60 * 1000
const REFRESH_MARGIN_MS = 5 * 60 * 1000

export function readExerciseVideoUrlCache(path) {
  if (!path) return null
  const entry = CACHE.get(path)
  if (!entry) return null
  if (entry.expiresAt - REFRESH_MARGIN_MS <= Date.now()) {
    CACHE.delete(path)
    return null
  }
  return entry.url
}

export function writeExerciseVideoUrlCache(path, url, expiresAt) {
  if (!path || !url) return
  CACHE.set(path, {
    url,
    expiresAt: expiresAt || Date.now() + DEFAULT_TTL_MS,
  })
}

/** Aynı path için eşzamanlı istekleri tek promise'te birleştirir. */
export async function dedupeExerciseVideoUrlFetch(path, fetcher) {
  const cached = readExerciseVideoUrlCache(path)
  if (cached) return cached

  const pending = INFLIGHT.get(path)
  if (pending) return pending

  const promise = Promise.resolve()
    .then(fetcher)
    .then((url) => {
      INFLIGHT.delete(path)
      return url
    })
    .catch((err) => {
      INFLIGHT.delete(path)
      throw err
    })

  INFLIGHT.set(path, promise)
  return promise
}

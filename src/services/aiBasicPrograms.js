import { getApiAuthHeaders } from './apiAuth.js'
import { formatAiError } from '../utils/aiErrors.js'

const AI_PROGRAM_TIMEOUT_MS = 55_000

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = AI_PROGRAM_TIMEOUT_MS) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal })
    const data = await res.json().catch(() => ({}))
    return { res, data }
  } finally {
    clearTimeout(timer)
  }
}

function mapResult(res, data) {
  if (data?.skipped) {
    return {
      ok: true,
      synced: false,
      skipped: data.skipped,
      error: data.error || null,
      programs: data.programs || [],
    }
  }
  if (!res.ok || !data.ok) {
    return {
      ok: false,
      synced: false,
      error: formatAiError(data.error || res.statusText),
    }
  }
  return {
    ok: true,
    synced: Boolean(data.synced),
    programs: data.programs || [],
    cycleStartDate: data.cycleStartDate || null,
    cycleEndDate: data.cycleEndDate || null,
    dailyCalories: data.dailyCalories || null,
  }
}

/** Basic üye — deneme süresi programları */
export async function fetchAiBasicPrograms() {
  try {
    const { res, data } = await fetchJsonWithTimeout('/api/ai-nutrition-tips', {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({ task: 'basic-programs' }),
    })
    return mapResult(res, data)
  } catch (e) {
    const aborted = e?.name === 'AbortError'
    return {
      ok: false,
      synced: false,
      timedOut: aborted,
      error: formatAiError(aborted ? 'AI program üretimi zaman aşımına uğradı' : (e.message || e)),
    }
  }
}

/** Eko üye — 15g diyet + 30g antrenman */
export async function fetchAiEkoPrograms({ force = false } = {}) {
  try {
    const { res, data } = await fetchJsonWithTimeout('/api/ai-nutrition-tips', {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({ task: 'eko-programs', force }),
    })
    return mapResult(res, data)
  } catch (e) {
    const aborted = e?.name === 'AbortError'
    return {
      ok: false,
      synced: false,
      timedOut: aborted,
      error: formatAiError(aborted ? 'AI program üretimi zaman aşımına uğradı' : (e.message || e)),
    }
  }
}

/** Admin — başka üye için Eko AI program üretimi */
export async function fetchAiEkoProgramsAdmin(memberId, { force = true } = {}) {
  if (!memberId) {
    return { ok: false, synced: false, error: 'memberId gerekli' }
  }
  try {
    const { res, data } = await fetchJsonWithTimeout('/api/ai-nutrition-tips', {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({ task: 'eko-programs-admin', memberId, force }),
    })
    return mapResult(res, data)
  } catch (e) {
    const aborted = e?.name === 'AbortError'
    return {
      ok: false,
      synced: false,
      timedOut: aborted,
      error: formatAiError(aborted ? 'AI program üretimi zaman aşımına uğradı' : (e.message || e)),
    }
  }
}

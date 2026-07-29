import { useCallback, useState } from 'react'
import {
  appendHealthScoreHistory,
  isHealthAnalysisStale,
  needsInitialHealthAnalysis,
  resolveHealthScoreAnalysis,
} from '../services/healthScoreAnalysis'

const UNCHANGED_MSG =
  'Sağlık testi veya profil bilgileri değişmedi; yeniden analiz yapılamaz'

/**
 * Personel/admin — yalnızca HT/profil fingerprint stale (veya ilk analiz eksik) ise yeniden üretim.
 * @returns {{ ok: true, analysis } | { ok: false, error: string }}
 */
export function useStaffHealthAnalysisRerun({
  member,
  packageConfig = null,
  patchMember,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const rerun = useCallback(async () => {
    if (!member?.id || typeof patchMember !== 'function') {
      return { ok: false, error: 'Üye bulunamadı' }
    }

    const analysis = member.healthAnalysis
    const canRerun =
      needsInitialHealthAnalysis(analysis) || isHealthAnalysisStale(analysis, member)
    if (!canRerun) {
      setError(UNCHANGED_MSG)
      return { ok: false, error: UNCHANGED_MSG }
    }

    setLoading(true)
    setError(null)
    try {
      const next = await resolveHealthScoreAnalysis(
        { ...member, packageConfig: packageConfig || member.packageConfig },
        { memberId: member.id, force: true },
      )
      const healthScoreHistory = appendHealthScoreHistory(member.healthScoreHistory, next)
      await patchMember(member.id, { healthAnalysis: next, healthScoreHistory })
      return { ok: true, analysis: next }
    } catch (e) {
      const msg = e?.message || 'Yeniden analiz başarısız'
      setError(msg)
      return { ok: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [member, packageConfig, patchMember])

  return { rerun, loading, error }
}

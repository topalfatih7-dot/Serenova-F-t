import { useCallback, useState } from 'react'
import {
  appendHealthScoreHistory,
  resolveHealthScoreAnalysis,
} from '../services/healthScoreAnalysis'

/**
 * Personel/admin — danışan için force yeniden sağlık analizi.
 */
export function useStaffHealthAnalysisRerun({
  member,
  packageConfig = null,
  patchMember,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const rerun = useCallback(async () => {
    if (!member?.id || typeof patchMember !== 'function') return null
    setLoading(true)
    setError(null)
    try {
      const next = await resolveHealthScoreAnalysis(
        { ...member, packageConfig: packageConfig || member.packageConfig },
        { memberId: member.id, force: true },
      )
      const healthScoreHistory = appendHealthScoreHistory(member.healthScoreHistory, next)
      await patchMember(member.id, { healthAnalysis: next, healthScoreHistory })
      return next
    } catch (e) {
      setError(e?.message || 'Yeniden analiz başarısız')
      return null
    } finally {
      setLoading(false)
    }
  }, [member, packageConfig, patchMember])

  return { rerun, loading, error }
}

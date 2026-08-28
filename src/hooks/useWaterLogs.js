import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { deleteWaterLog, insertWaterLog, listWaterLogs } from '../services/waterLogs'
import { lastLogForDate, localDateStr, mapWaterLogRow, sumMlForDate } from '../utils/waterTracking'

export default function useWaterLogs(memberId) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(Boolean(memberId))
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    if (!memberId) {
      setLogs([])
      setLoading(false)
      return
    }
    setLoading(true)
    const r = await listWaterLogs(memberId)
    if (!r.success) {
      setError(r.error)
      setLogs([])
    } else {
      setError(null)
      setLogs(r.logs)
    }
    setLoading(false)
  }, [memberId])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (!supabase || !memberId) return undefined
    const channel = supabase
      .channel(`water-logs-${memberId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'member_water_logs', filter: `member_id=eq.${memberId}` },
        (payload) => {
          const event = payload.eventType
          if (event === 'INSERT' && payload.new) {
            const mapped = mapWaterLogRow(payload.new)
            if (!mapped) return
            setLogs((prev) => (prev.some((l) => l.id === mapped.id) ? prev : [...prev, mapped]))
            return
          }
          if (event === 'DELETE' && payload.old?.id) {
            setLogs((prev) => prev.filter((l) => l.id !== payload.old.id))
            return
          }
          void reload()
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [memberId, reload])

  const add = useCallback(async (amountMl, dateStr) => {
    if (!memberId || busy) return { success: false }
    setBusy(true)
    const r = await insertWaterLog({
      memberId,
      localDate: dateStr || localDateStr(),
      amountMl,
    })
    if (r.success && r.log) {
      setLogs((prev) => (prev.some((l) => l.id === r.log.id) ? prev : [...prev, r.log]))
    }
    setBusy(false)
    return r
  }, [memberId, busy])

  const undoLast = useCallback(async (dateStr) => {
    if (!memberId || busy) return { success: false }
    const last = lastLogForDate(logs, dateStr || localDateStr())
    if (!last) return { success: false, error: 'Geri alınacak kayıt yok' }
    setBusy(true)
    const r = await deleteWaterLog(last.id)
    if (r.success) {
      setLogs((prev) => prev.filter((l) => l.id !== last.id))
    }
    setBusy(false)
    return r
  }, [memberId, busy, logs])

  const totals = useMemo(() => {
    const map = {}
    for (const log of logs) {
      map[log.localDate] = (map[log.localDate] || 0) + (Number(log.amountMl) || 0)
    }
    return map
  }, [logs])

  return {
    logs,
    totals,
    loading,
    error,
    busy,
    reload,
    add,
    undoLast,
    mlForDate: (dateStr) => sumMlForDate(logs, dateStr),
    hasLogsForDate: (dateStr) => logs.some((l) => l.localDate === dateStr),
  }
}

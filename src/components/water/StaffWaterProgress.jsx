import { useEffect, useState } from 'react'
import { WATER_COPY, clampGoalMl, fillPercent, lastNDates, resolveDailyGoalMl } from '../../utils/waterTracking'
import { isDietitianRole } from '../../utils/staffRoles'
import { setMemberWaterGoal } from '../../services/waterLogs'
import { useToast } from '../../context/ToastContext'
import useWaterLogs from '../../hooks/useWaterLogs'

export default function StaffWaterProgress({
  member,
  viewerRole,
  canEditGoal: canEditGoalProp,
}) {
  const { toast } = useToast()
  const memberId = member?.id
  const { totals, loading, mlForDate } = useWaterLogs(memberId)
  const goalMl = resolveDailyGoalMl(member?.waterTracking)
  const today = lastNDates(1)[0]
  const todayMl = mlForDate(today)
  const week = lastNDates(7)
  const percent = fillPercent(todayMl, goalMl)
  const canEdit = canEditGoalProp ?? (viewerRole === 'admin' || isDietitianRole(viewerRole))
  const [goalDraft, setGoalDraft] = useState(String(goalMl))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setGoalDraft(String(resolveDailyGoalMl(member?.waterTracking)))
  }, [member?.waterTracking])

  const saveGoal = async (event) => {
    event.preventDefault()
    const goal = clampGoalMl(goalDraft)
    if (goal == null) {
      toast(WATER_COPY.goalInvalid, 'error')
      return
    }
    setSaving(true)
    const r = await setMemberWaterGoal(memberId, goal)
    setSaving(false)
    if (!r.success) {
      toast(r.error || WATER_COPY.goalInvalid, 'error')
      return
    }
    toast(WATER_COPY.goalSaved, 'success')
  }

  return (
    <section className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-500">{WATER_COPY.title}</p>
      <p className="mt-2 text-sm font-semibold text-cream-900">
        {loading ? '…' : `${todayMl} / ${goalMl} ${WATER_COPY.unit}`}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream-200">
        <div
          className="h-2 rounded-full bg-brand-500 transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-3 flex items-end gap-1">
        {week.map((date) => {
          const ml = totals[date] || 0
          const h = Math.max(4, Math.round((fillPercent(ml, goalMl) / 100) * 36))
          return (
            <div key={date} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-9 w-full items-end justify-center">
                <span className="w-full max-w-[10px] rounded-sm bg-brand-400/80" style={{ height: h }} />
              </div>
              <span className="text-[9px] text-cream-800/45">{date.slice(8)}</span>
            </div>
          )
        })}
      </div>
      {canEdit && (
        <form onSubmit={saveGoal} className="mt-3 flex flex-wrap items-center gap-2">
          <label className="text-xs text-cream-800/70">
            Günlük hedef (ml)
            <input
              type="number"
              min={500}
              max={5000}
              step={50}
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              disabled={saving}
              className="mt-1 w-28 rounded-lg border border-cream-200 bg-white px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-sage-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sage-700 disabled:opacity-60"
          >
            Kaydet
          </button>
        </form>
      )}
    </section>
  )
}

import WaterCarafeCard from './WaterCarafeCard'
import useWaterLogs from '../../hooks/useWaterLogs'
import { useToast } from '../../context/ToastContext'
import { WATER_COPY, localDateStr, resolveDailyGoalMl } from '../../utils/waterTracking'

export default function MemberWaterTracker({
  member,
  dateStr,
  size = 'full',
  canLog = true,
}) {
  const { toast } = useToast()
  const memberId = member?.id
  const day = dateStr || localDateStr()
  const { add, undoLast, hasLogsForDate, mlForDate, busy } = useWaterLogs(memberId)
  const goalMl = resolveDailyGoalMl(member?.waterTracking)

  const onAdd = async (amount) => {
    const r = await add(amount, day)
    if (r.success) toast(WATER_COPY.added, 'success')
    return r
  }

  const onUndo = async () => {
    const r = await undoLast(day)
    if (r.success) toast(WATER_COPY.undone, 'success')
    else if (r.error) toast(r.error, 'error')
    return r
  }

  return (
    <WaterCarafeCard
      size={size}
      todayMl={mlForDate(day)}
      goalMl={goalMl}
      waterTracking={member?.waterTracking}
      canLog={canLog}
      hasLogs={hasLogsForDate(day)}
      busy={busy}
      onAdd={onAdd}
      onUndo={onUndo}
    />
  )
}

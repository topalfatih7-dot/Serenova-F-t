import { useEffect, useMemo, useState } from 'react'
import { subscribeOnlineStats } from '../services/presenceService'
import {
  ONLINE_DISPLAY_MIN,
  getDisplayMemberCount,
  getDisplayOnlineCount,
  pickSessionOnlineBoost,
} from '../utils/displayPlatformStats'

export function usePlatformDisplayStats() {
  const [stats, setStats] = useState({ onlineNow: 0, totalMembers: 0 })
  const [sessionBoost, setSessionBoost] = useState(ONLINE_DISPLAY_MIN)

  useEffect(() => subscribeOnlineStats((s) => {
    setStats({
      onlineNow: s.onlineNow ?? s.online_now ?? 0,
      totalMembers: s.totalMembers ?? s.total_members ?? 0,
    })
  }), [])

  useEffect(() => {
    setSessionBoost(pickSessionOnlineBoost())
  }, [])

  return useMemo(() => {
    const members = getDisplayMemberCount(stats.totalMembers)
    return {
      raw: stats,
      displayMembers: members.value,
      showMemberPlus: members.showPlus,
      displayOnline: getDisplayOnlineCount(stats.onlineNow, sessionBoost),
    }
  }, [stats, sessionBoost])
}

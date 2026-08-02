import { useEffect, useMemo, useState } from 'react'
import { subscribeOnlineStats } from '../services/presenceService'
import {
  getDisplayMemberCount,
  getDisplayOnlineCount,
} from '../utils/displayPlatformStats'

export function usePlatformDisplayStats() {
  const [stats, setStats] = useState({ onlineNow: 0, totalMembers: 0 })

  useEffect(() => subscribeOnlineStats((s) => {
    setStats({
      onlineNow: s.onlineNow ?? s.online_now ?? 0,
      totalMembers: s.totalMembers ?? s.total_members ?? 0,
    })
  }), [])

  return useMemo(() => {
    const members = getDisplayMemberCount(stats.totalMembers)
    return {
      raw: stats,
      displayMembers: members.value,
      showMemberPlus: members.showPlus,
      displayOnline: getDisplayOnlineCount(stats.onlineNow),
    }
  }, [stats])
}

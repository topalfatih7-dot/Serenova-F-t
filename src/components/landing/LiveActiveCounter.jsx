import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Users } from 'lucide-react'
import { subscribeOnlineStats } from '../../services/presenceService'
import {
  getDisplayMemberCount,
  getDisplayOnlineCount,
} from '../../utils/displayPlatformStats'

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    const start = prev.current
    const diff = value - start
    if (diff === 0) return undefined
    const steps = 24
    let step = 0
    const id = setInterval(() => {
      step += 1
      setDisplay(Math.round(start + (diff * step) / steps))
      if (step >= steps) {
        clearInterval(id)
        prev.current = value
      }
    }, 25)
    return () => clearInterval(id)
  }, [value])

  return <span>{display.toLocaleString('tr-TR')}</span>
}

export default function LiveActiveCounter({ className = '' }) {
  const [stats, setStats] = useState({ onlineNow: 0, totalMembers: 0 })

  useEffect(() => subscribeOnlineStats((s) => {
    setStats({
      onlineNow: s.onlineNow ?? s.online_now ?? 0,
      totalMembers: s.totalMembers ?? s.total_members ?? 0,
    })
  }), [])

  const members = getDisplayMemberCount(stats.totalMembers)
  const onlineDisplay = getDisplayOnlineCount(stats.onlineNow)

  return (
    <section className={`relative overflow-hidden border-y border-brand-100/80 bg-gradient-to-r from-brand-50/90 via-white to-sage-50/90 ${className}`}>
      <div className="pointer-events-none absolute -left-20 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-brand-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-sage-200/30 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 px-4 py-5 sm:gap-10 sm:px-6 sm:py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "50px" }}
          className="flex items-center gap-3"
        >
          <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-brand-100">
            <Activity className="h-5 w-5 text-brand-600" />
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-sage-500" />
            </span>
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-600/70 sm:text-xs">Şu an çevrimiçi</p>
            <p className="font-display text-2xl font-bold tabular-nums text-cream-900 sm:text-3xl">
              <AnimatedNumber value={onlineDisplay} />
              <span className="ml-1 text-base font-semibold text-cream-800/50 sm:text-lg">kişi</span>
            </p>
          </div>
        </motion.div>

        <div className="hidden h-10 w-px bg-cream-200 sm:block" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "50px" }}
          transition={{ delay: 0.08 }}
          className="flex items-center gap-3"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-cream-100">
            <Users className="h-5 w-5 text-sage-600" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sage-600/70 sm:text-xs">Toplam üye</p>
            <p className="font-display text-2xl font-bold tabular-nums text-cream-900 sm:text-3xl">
              <AnimatedNumber value={members.value} />
              {members.showPlus && (
                <span className="ml-0.5 text-base font-semibold text-cream-800/50 sm:text-lg">+</span>
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

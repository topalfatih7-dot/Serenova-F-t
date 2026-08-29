import { useMemo } from 'react'
import { Wallet } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import {
  STAFF_EARNING_STATUS,
  earningMeetingMeta,
  formatIstanbulDateTime,
  formatStaffPayoutPeriodLabel,
  formatStaffPayoutWindowLabel,
} from '../../data/staffPayouts'

function formatTry(amount) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount || 0)
}

function StatusBadge({ status }) {
  const map = {
    paid: 'bg-sage-50 text-sage-700',
    approved: 'bg-brand-50 text-brand-700',
    pending: 'bg-amber-50 text-amber-700',
    reversed: 'bg-cream-100 text-cream-700',
    rejected: 'bg-red-50 text-red-700',
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || map.pending}`}>
      {STAFF_EARNING_STATUS[status] || status}
    </span>
  )
}

function periodStatus(rows) {
  if (rows.some((r) => r.status === 'pending')) return 'pending'
  if (rows.some((r) => r.status === 'approved')) return 'approved'
  if (rows.every((r) => r.status === 'paid')) return 'paid'
  return rows[0]?.status || 'pending'
}

export default function StaffEarningsHistory({ rows = [], members = [] }) {
  const groups = useMemo(() => {
    const byPeriod = new Map()
    for (const row of rows) {
      const key = row.period_key || '—'
      if (!byPeriod.has(key)) byPeriod.set(key, [])
      byPeriod.get(key).push(row)
    }
    return [...byPeriod.entries()]
      .map(([id, items]) => {
        const sorted = [...items].sort((a, b) => {
          const am = earningMeetingMeta(a, members)
          const bm = earningMeetingMeta(b, members)
          return new Date(bm.startedAt || 0) - new Date(am.startedAt || 0)
        })
        return {
          id,
          periodLabel: formatStaffPayoutPeriodLabel(id),
          windowLabel: formatStaffPayoutWindowLabel(id),
          sessions: sorted,
          amount: sorted.reduce((s, r) => s + Number(r.amount_try || 0), 0),
          status: periodStatus(sorted),
        }
      })
      .sort((a, b) => String(b.id).localeCompare(String(a.id)))
  }, [rows, members])

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Henüz hakediş yok"
        description="Faturalandırılabilir video görüşmeler tamamlandıkça danışan ve tarih burada görünür."
      />
    )
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <section key={group.id} className="overflow-hidden rounded-2xl border border-cream-200 bg-white">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-cream-100 px-4 py-3.5 sm:px-5">
            <div className="min-w-0">
              <p className="font-semibold text-cream-900">Ödeme: {group.periodLabel}</p>
              <p className="mt-0.5 text-xs text-cream-800/55">
                {group.windowLabel ? `${group.windowLabel} görüşmeleri · ` : ''}
                {group.sessions.length} seans
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <p className="font-bold text-cream-900">{formatTry(group.amount)}</p>
              <StatusBadge status={group.status} />
            </div>
          </div>
          <ul className="divide-y divide-cream-100">
            {group.sessions.map((row) => {
              const meeting = earningMeetingMeta(row, members)
              return (
                <li key={row.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="min-w-0">
                    <p className="font-medium text-cream-900">{meeting.memberName}</p>
                    <p className="text-xs text-cream-800/55">
                      {formatIstanbulDateTime(meeting.startedAt)}
                      {' · '}
                      {meeting.sessionTypeLabel}
                      {meeting.overlapMinutes ? ` · ${meeting.overlapMinutes} dk eşzamanlı` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-cream-900">{formatTry(row.amount_try)}</span>
                    <StatusBadge status={row.status} />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

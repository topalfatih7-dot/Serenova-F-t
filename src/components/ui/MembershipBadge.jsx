import { Crown, Sparkles, Star, Award } from 'lucide-react'
import { getMembershipBadgeTier } from '../../data/membershipPlans'

const BADGE_CONFIG = {
  free: {
    label: 'Basic',
    icon: Sparkles,
    cls: 'border-cream-200 bg-cream-100 text-cream-800',
  },
  silver: {
    label: 'Silver',
    icon: Star,
    cls: 'border-slate-300/80 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-200/60 text-slate-700 shadow-sm shadow-slate-200/40',
  },
  gold: {
    label: 'Gold',
    icon: Crown,
    cls: 'border-amber-400/70 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100/80 text-amber-800 shadow-sm shadow-amber-200/40',
  },
  platinum: {
    label: 'Platinum',
    icon: Award,
    cls: 'border-brand-300/70 bg-gradient-to-r from-slate-50 via-brand-50 to-violet-100/70 text-brand-800 shadow-sm shadow-brand-200/30',
  },
}

const statusColors = {
  active: 'bg-sage-50 text-sage-700 border-sage-200',
  expiring: 'bg-orange-50 text-orange-700 border-orange-200',
}

const statusLabels = {
  expiring: 'Sona Eriyor',
}

export default function MembershipBadge({ tier, status }) {
  const badgeTier = getMembershipBadgeTier(tier)
  const config = BADGE_CONFIG[badgeTier] || BADGE_CONFIG.free
  const Icon = config.icon

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.cls}`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
      {status && status !== 'active' && (
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase ${statusColors[status] || statusColors.active}`}>
          {statusLabels[status] || status}
        </span>
      )}
    </div>
  )
}

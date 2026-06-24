import { Crown, Sparkles, Star, Award, Leaf, Dumbbell } from 'lucide-react'

const PLAN_CONFIG = {
  free:     { label: 'Ücretsiz', icon: Sparkles, cls: 'border-cream-200 bg-cream-100 text-cream-800' },
  eko:      { label: 'Eko Paket', icon: Leaf, cls: 'border-sage-300 bg-sage-50 text-sage-700' },
  diyet:    { label: 'Diyet Paketi', icon: Sparkles, cls: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  spor:     { label: 'Spor Paketi', icon: Dumbbell, cls: 'border-blue-300 bg-blue-50 text-blue-700' },
  kurucu:   { label: 'Kurucu Üye', icon: Crown, cls: 'border-amber-300/60 bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-700' },
  vip:      { label: 'Vip Paket', icon: Award, cls: 'border-brand-300/60 bg-gradient-to-r from-brand-50 to-brand-100/50 text-brand-700' },
  gumus:    { label: 'Gümüş', icon: Star, cls: 'border-slate-300 bg-slate-50 text-slate-700' },
  altin:    { label: 'Altın', icon: Crown, cls: 'border-amber-300/60 bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-700' },
  platinum: { label: 'Platinum', icon: Award, cls: 'border-brand-300/60 bg-gradient-to-r from-brand-50 to-brand-100/50 text-brand-700' },
  premium:  { label: 'Premium', icon: Crown, cls: 'border-gold-400/50 bg-gradient-to-r from-brand-50 to-gold-400/10 text-brand-700' },
}

const statusColors = {
  active:    'bg-sage-50 text-sage-700 border-sage-200',
  paused:    'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  expiring:  'bg-orange-50 text-orange-700 border-orange-200',
}

const statusLabels = {
  paused:    'Duraklatıldı',
  cancelled: 'Sona Erdi',
  expiring:  'Sona Eriyor',
}

export default function MembershipBadge({ tier, status }) {
  const config = PLAN_CONFIG[tier] || PLAN_CONFIG.free
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

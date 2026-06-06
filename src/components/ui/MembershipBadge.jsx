import { Crown, Sparkles } from 'lucide-react'

export default function MembershipBadge({ tier, status }) {
  const isPremium = tier === 'premium'
  const statusColors = {
    active: 'bg-sage-50 text-sage-700 border-sage-200',
    paused: 'bg-amber-50 text-amber-700 border-amber-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
    expiring: 'bg-orange-50 text-orange-700 border-orange-200',
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
        isPremium ? 'border-gold-400/50 bg-gradient-to-r from-brand-50 to-gold-400/10 text-brand-700' : 'border-cream-200 bg-cream-100 text-cream-800'
      }`}>
        {isPremium ? <Crown className="h-3.5 w-3.5 text-gold-500" /> : <Sparkles className="h-3.5 w-3.5" />}
        {isPremium ? 'Premium' : 'Ücretsiz'}
      </span>
      {status && status !== 'active' && (
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase ${statusColors[status] || statusColors.active}`}>
          {status === 'paused' ? 'Duraklatıldı' : status === 'cancelled' ? 'İptal' : status === 'expiring' ? 'Sona Eriyor' : status}
        </span>
      )}
    </div>
  )
}

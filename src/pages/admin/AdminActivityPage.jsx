import { useApp } from '../../context/AppContext'
import EmptyState from '../../components/ui/EmptyState'
import { formatRelativeTime } from '../../utils/relativeTime'
import useRelativeTimeTick from '../../hooks/useRelativeTimeTick'
import { Activity, ArrowUpCircle, UserPlus, CreditCard, MessageSquare, LogIn, LogOut, Shield } from 'lucide-react'

const TYPE_CONFIG = {
  upgrade: { icon: ArrowUpCircle, color: 'bg-brand-50 text-brand-600', label: 'Yükseltme' },
  signup: { icon: UserPlus, color: 'bg-sage-50 text-sage-600', label: 'Kayıt' },
  payment: { icon: CreditCard, color: 'bg-gold-400/20 text-gold-600', label: 'Ödeme' },
  ticket: { icon: MessageSquare, color: 'bg-purple-50 text-purple-600', label: 'Destek' },
  login: { icon: LogIn, color: 'bg-cream-100 text-cream-800', label: 'Giriş' },
  logout: { icon: LogOut, color: 'bg-cream-100 text-cream-800', label: 'Çıkış' },
  admin_premium: { icon: Shield, color: 'bg-brand-50 text-brand-600', label: 'Premium Yönetimi' },
}

export default function AdminActivityPage() {
  useRelativeTimeTick()
  const { platform } = useApp()
  const activities = platform.activities

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Aktivite Günlüğü</h1>
        <p className="mt-1 text-sm text-cream-800/60">Tüm platform olayları canlı kayıt altında</p>
      </div>

      {activities.length === 0 ? (
        <EmptyState icon={Activity} title="Henüz aktivite yok" description="Kayıt, ödeme ve destek işlemleri burada listelenir." />
      ) : (
        <div className="space-y-3">
          {activities.map((a) => {
            const config = TYPE_CONFIG[a.type] || { icon: Activity, color: 'bg-cream-100', label: a.type }
            const Icon = config.icon
            return (
              <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-cream-200 bg-white p-5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-cream-900">{a.text}</p>
                  <p className="mt-0.5 text-xs text-cream-800/40">
                    {config.label} · {formatRelativeTime(a.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

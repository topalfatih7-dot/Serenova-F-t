import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import StatsCard from '../../components/ui/StatsCard'
import EmptyState from '../../components/ui/EmptyState'
import { useApp } from '../../context/AppContext'
import { isPaidMembership } from '../../data/membershipPlans'
import { Crown, TrendingUp, RefreshCw } from 'lucide-react'

export default function AdminSubscriptionsPage() {
  const { platform, adminStats, monthlyGrowth } = useApp()
  const premiumMembers = platform.members.filter((m) => isPaidMembership(m.membership))
  const conversionRate = adminStats.totalMembers ? Math.round((adminStats.premium / adminStats.totalMembers) * 100) : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Abonelik Yönetimi</h1>
        <p className="mt-1 text-sm text-cream-800/60">Canlı abonelik ve ödeme verileri</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Premium Üye" value={adminStats.premium} sub={`%${conversionRate} dönüşüm`} icon={Crown} accent="brand" />
        <StatsCard label="MRR" value={`${adminStats.mrr.toLocaleString('tr-TR')}₺`} sub="Aktif premium aylık" icon={TrendingUp} accent="sage" />
        <StatsCard label="Toplam Gelir" value={`${adminStats.totalRevenue.toLocaleString('tr-TR')}₺`} icon={RefreshCw} accent="gold" />
      </div>

      {platform.payments.length > 0 ? (
        <div className="rounded-2xl border border-cream-200 bg-white p-6">
          <h3 className="font-semibold text-cream-900">Ödeme Geçmişi</h3>
          <div className="mt-4 space-y-2">
            {platform.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-cream-50 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{p.memberName}</p>
                  <p className="text-xs text-cream-800/50">{new Date(p.createdAt).toLocaleString('tr-TR')}</p>
                </div>
                <span className="font-bold text-brand-600">{p.amount.toLocaleString('tr-TR')}₺</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="Henüz ödeme yok" description="Premium kayıt veya yükseltme ile ödemeler burada görünür." />
      )}

      {adminStats.totalMembers > 0 && (
        <div className="rounded-2xl border border-cream-200 bg-white p-6">
          <h3 className="font-semibold text-cream-900">Büyüme Grafiği</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#efe8de" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v / 1000}K`} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="premium" name="Premium" fill="#4a8aad" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="gelir" name="Gelir (₺)" fill="#b8924f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-cream-200 bg-white p-6">
        <h3 className="font-semibold text-cream-900">Premium Üyeler</h3>
        {premiumMembers.length === 0 ? (
          <p className="mt-4 text-sm text-cream-800/50">Premium üye yok</p>
        ) : (
          <div className="mt-4 space-y-2">
            {premiumMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl bg-cream-50 px-4 py-3">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-cream-800/50">{m.email}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.membershipStatus === 'active' ? 'bg-sage-50 text-sage-700' : 'bg-amber-50 text-amber-700'}`}>
                  {m.membershipStatus}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

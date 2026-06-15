import { Link } from 'react-router-dom'
import {
  Users, Crown, UserCheck, Pause, XCircle, TrendingUp, Calendar, ArrowRight, MessageSquare,
} from 'lucide-react'
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import StatsCard from '../../components/ui/StatsCard'
import EmptyState from '../../components/ui/EmptyState'
import { useApp } from '../../context/AppContext'
import { formatRelativeTime } from '../../utils/relativeTime'
import useRelativeTimeTick from '../../hooks/useRelativeTimeTick'

const ACTIVITY_COLORS = { upgrade: 'text-brand-600', signup: 'text-sage-600', pause: 'text-amber-600', cancel: 'text-red-500', payment: 'text-gold-500', ticket: 'text-purple-600', login: 'text-cream-800', renew: 'text-sage-600', resume: 'text-brand-500' }

export default function AdminOverviewPage() {
  useRelativeTimeTick()
  const { adminStats, monthlyGrowth, membershipBreakdown, platform, sessionStats } = useApp()
  const { activities, tickets } = platform
  const hasMembers = adminStats.totalMembers > 0
  const pct = adminStats.totalMembers ? Math.round((adminStats.premium / adminStats.totalMembers) * 100) : 0

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream-900 sm:text-3xl">Genel Bakış</h1>
          <p className="mt-1 text-sm text-cream-800/60">Canlı platform verileri</p>
        </div>
        {adminStats.openTickets > 0 && (
          <Link to="/admin/support" className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
            <MessageSquare className="h-4 w-4" />
            {adminStats.openTickets} açık destek talebi
          </Link>
        )}
      </div>

      {!hasMembers && (
        <EmptyState
          title="Henüz kayıtlı üye yok"
          description="Test için /onboarding adresinden ücretsiz veya premium kayıt oluşturun. Premium için test kartı kullanın."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Toplam Üye" value={adminStats.totalMembers} sub={`+${adminStats.newThisMonth} bu ay`} icon={Users} accent="brand" />
        <StatsCard label="Premium Üye" value={adminStats.premium} sub={hasMembers ? `%${pct} oran` : '—'} icon={Crown} accent="gold" />
        <StatsCard label="Ücretsiz Üye" value={adminStats.free} sub="Kayıtlı" icon={UserCheck} accent="sage" />
        <StatsCard label="MRR" value={adminStats.mrr ? `${(adminStats.mrr / 1000).toFixed(1)}K₺` : '0₺'} sub={`Toplam gelir: ${adminStats.totalRevenue.toLocaleString('tr-TR')}₺`} icon={TrendingUp} accent="brand" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Aktif" value={adminStats.active} icon={UserCheck} accent="sage" />
        <StatsCard label="Duraklatılmış" value={adminStats.paused} icon={Pause} accent="gold" />
        <StatsCard label="Açık Talep" value={adminStats.openTickets} icon={MessageSquare} accent="brand" />
        <StatsCard label="İptal" value={adminStats.cancelled} icon={XCircle} accent="cream" />
      </div>

      {hasMembers && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-cream-200 bg-white p-6">
            <h3 className="font-semibold text-cream-900">Üye Büyümesi</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#efe8de" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="uye" name="Toplam Üye" stroke="#5f9270" fill="#e6efe8" />
                  <Area type="monotone" dataKey="premium" name="Premium" stroke="#4a8aad" fill="#e8f0f5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-cream-200 bg-white p-6">
            <h3 className="font-semibold text-cream-900">Üyelik Dağılımı</h3>
            {membershipBreakdown.length > 0 ? (
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={membershipBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                      {membershipBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-8 text-center text-sm text-cream-800/50">Veri yok</p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-cream-200 bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-cream-900">Son Aktiviteler</h3>
            <Link to="/admin/activity" className="flex items-center gap-1 text-sm text-brand-600 hover:underline">
              Tümü <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {activities.length === 0 ? (
            <p className="mt-6 text-center text-sm text-cream-800/50">Henüz aktivite yok</p>
          ) : (
            <div className="mt-4 space-y-3">
              {activities.slice(0, 6).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl bg-cream-50 px-4 py-3">
                  <p className={`text-sm font-medium ${ACTIVITY_COLORS[a.type] || 'text-cream-800'}`}>{a.text}</p>
                  <span className="text-xs text-cream-800/40">{formatRelativeTime(a.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-cream-200 bg-white p-6">
            <h3 className="flex items-center gap-2 font-semibold text-cream-900">
              <Calendar className="h-4 w-4 text-brand-500" /> Seans Özeti
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-cream-800/60">Koç (haftalık)</span><span className="font-semibold">{sessionStats.coachThisWeek}</span></div>
              <div className="flex justify-between"><span className="text-cream-800/60">Diyetisyen (aylık)</span><span className="font-semibold">{sessionStats.dietitianThisMonth}</span></div>
              <div className="flex justify-between"><span className="text-cream-800/60">Açık talep</span><span className="font-semibold text-amber-600">{tickets.filter((t) => t.status === 'open').length}</span></div>
            </div>
          </div>
          <div className="rounded-2xl border border-cream-200 bg-gradient-to-br from-brand-50 to-sage-50 p-6">
            <p className="text-sm font-medium text-cream-900">Ortalama seri</p>
            <p className="mt-1 font-display text-3xl font-bold text-brand-600">{adminStats.avgStreak} gün</p>
          </div>
        </div>
      </div>
    </div>
  )
}

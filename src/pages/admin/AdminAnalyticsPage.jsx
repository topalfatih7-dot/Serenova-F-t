import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useApp } from '../../context/AppContext'

export default function AdminAnalyticsPage() {
  const { adminStats, monthlyGrowth, platform } = useApp()
  const conversionRate = adminStats.totalMembers ? Math.round((adminStats.premium / adminStats.totalMembers) * 100) : 0

  const membershipData = [
    { name: 'Ücretsiz', value: adminStats.free },
    { name: 'Premium', value: adminStats.premium },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Analitik</h1>
        <p className="mt-1 text-sm text-cream-800/60">Canlı platform metrikleri</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-cream-200 bg-white p-5 text-center">
          <p className="text-xs text-cream-800/50">Dönüşüm</p>
          <p className="mt-1 font-display text-3xl font-bold text-brand-600">%{conversionRate}</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-5 text-center">
          <p className="text-xs text-cream-800/50">MRR</p>
          <p className="mt-1 font-display text-2xl font-bold text-sage-600">{adminStats.mrr.toLocaleString('tr-TR')}₺</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-5 text-center">
          <p className="text-xs text-cream-800/50">Bu Ay Yeni</p>
          <p className="mt-1 font-display text-3xl font-bold text-gold-500">+{adminStats.newThisMonth}</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-5 text-center">
          <p className="text-xs text-cream-800/50">Ödeme Sayısı</p>
          <p className="mt-1 font-display text-3xl font-bold text-cream-900">{platform.payments.length}</p>
        </div>
      </div>

      {adminStats.totalMembers > 0 && (
        <>
          <div className="rounded-2xl border border-cream-200 bg-white p-6">
            <h3 className="font-semibold text-cream-900">Üye Büyüme Trendi</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#efe8de" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="uye" name="Toplam" stroke="#5f9270" strokeWidth={2} />
                  <Line type="monotone" dataKey="premium" name="Premium" stroke="#4a8aad" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-cream-200 bg-white p-6">
            <h3 className="font-semibold text-cream-900">Üyelik Dağılımı</h3>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={membershipData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#efe8de" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Üye" fill="#4a8aad" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { BarChart3, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useChartColors } from '../../context/ThemeContext'
import { fetchGa4Report } from '../../services/ga4Report'

export default function AdminAnalyticsPage() {
  const { adminStats, monthlyGrowth, platform, onboardingFunnel } = useApp()
  const colors = useChartColors()
  const conversionRate = adminStats.totalMembers ? Math.round((adminStats.premium / adminStats.totalMembers) * 100) : 0

  const [ga4, setGa4] = useState({ loading: true, data: null, error: null })

  useEffect(() => {
    let cancelled = false
    fetchGa4Report(28)
      .then((data) => { if (!cancelled) setGa4({ loading: false, data, error: null }) })
      .catch((err) => { if (!cancelled) setGa4({ loading: false, data: null, error: err.message }) })
    return () => { cancelled = true }
  }, [])

  const membershipData = [
    { name: 'Ücretsiz', value: adminStats.free },
    { name: 'Premium', value: adminStats.premium },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Analitik</h1>
        <p className="mt-1 text-sm text-cream-800/60">Aktivasyon hunisi, platform metrikleri ve GA4</p>
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

      <div className="rounded-2xl border border-cream-200 bg-white p-6">
        <h3 className="flex items-center gap-2 font-semibold text-cream-900">
          <BarChart3 className="h-4 w-4 text-brand-500" />
          Üye aktivasyon hunisi
        </h3>
        <p className="mt-1 text-xs text-cream-800/55">
          Kayıt → sağlık testi → ücretli → aktif → program → randevu
        </p>
        <div className="mt-4 space-y-3">
          {onboardingFunnel.map((row, i) => (
            <div key={row.step}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-cream-900">{row.step}</span>
                <span className="text-cream-800/60">{row.count} · %{row.pct}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-cream-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-400 to-sage-500 transition-all"
                  style={{ width: `${Math.max(row.pct, i === 0 ? 4 : 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-cream-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-cream-900">Google Analytics 4</h3>
            <p className="mt-1 text-xs text-cream-800/55">Son 28 gün — sayfa görüntüleme hunisi</p>
          </div>
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
          >
            GA4 paneli <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {ga4.loading && (
          <div className="mt-6 flex items-center justify-center gap-2 py-8 text-sm text-cream-800/50">
            <Loader2 className="h-4 w-4 animate-spin" /> GA4 verisi yükleniyor…
          </div>
        )}

        {!ga4.loading && ga4.error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p>{ga4.error}</p>
              {ga4.error.includes('401') || ga4.error.toLowerCase().includes('oturum') ? (
                <p className="mt-2 text-xs text-amber-800/80">Admin olarak giriş yaptığınızdan emin olun ve sayfayı yenileyin.</p>
              ) : null}
            </div>
          </div>
        )}

        {!ga4.loading && ga4.data && !ga4.data.configured && (
          <div className="mt-4 rounded-xl border border-dashed border-cream-200 bg-cream-50/50 p-4 text-sm text-cream-800/70">
            <p className="font-medium text-cream-900">GA4 Data API henüz bağlı değil</p>
            <p className="mt-2 text-xs leading-relaxed">
              Vercel ortam değişkenleri: <code className="rounded bg-white px-1">GA4_PROPERTY_ID</code> (sayısal mülk kimliği)
              ve <code className="rounded bg-white px-1">GA4_SERVICE_ACCOUNT_JSON</code> (Analytics okuma yetkili service account).
            </p>
            <p className="mt-2 text-xs text-cream-800/55">
              Ziyaretçi ölçümü çerez onayı sonrası <code className="rounded bg-white px-1">ga4Loader.js</code> ile çalışır.
            </p>
          </div>
        )}

        {!ga4.loading && ga4.data?.configured && !ga4.data.error && (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {[
                { label: 'Aktif kullanıcı', value: ga4.data.activeUsers },
                { label: 'Oturum', value: ga4.data.sessions },
                { label: 'Sayfa görüntüleme', value: ga4.data.pageViews },
                { label: 'Dönüşüm', value: ga4.data.conversions },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-cream-50 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-cream-800/45">{m.label}</p>
                  <p className="mt-1 font-display text-xl font-bold text-cream-900">{m.value?.toLocaleString('tr-TR') ?? 0}</p>
                </div>
              ))}
            </div>
            {ga4.data.funnelSteps?.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cream-100 text-left text-xs text-cream-800/50">
                      <th className="py-2 pr-4">Sayfa</th>
                      <th className="py-2">Görüntüleme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ga4.data.funnelSteps.map((row) => (
                      <tr key={row.path} className="border-b border-cream-50">
                        <td className="py-2 pr-4 font-mono text-xs text-cream-800">{row.path}</td>
                        <td className="py-2 font-semibold text-cream-900">{row.views?.toLocaleString('tr-TR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {!ga4.loading && ga4.data?.configured && ga4.data.error && (
          <p className="mt-4 text-sm text-red-600">{ga4.data.error}</p>
        )}
      </div>

      {adminStats.totalMembers > 0 && (
        <>
          <div className="rounded-2xl border border-cream-200 bg-white p-6">
            <h3 className="font-semibold text-cream-900">Üye Büyüme Trendi</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="month" tick={{ fill: colors.tick }} />
                  <YAxis tick={{ fill: colors.tick }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      border: `1px solid ${colors.tooltipBorder}`,
                      color: colors.tooltipColor,
                    }}
                  />
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
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="name" tick={{ fill: colors.tick }} />
                  <YAxis tick={{ fill: colors.tick }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      border: `1px solid ${colors.tooltipBorder}`,
                      color: colors.tooltipColor,
                    }}
                  />
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

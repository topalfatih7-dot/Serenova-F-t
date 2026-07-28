import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Bot, Loader2, AlertCircle, DollarSign, Hash, Zap, RefreshCw,
} from 'lucide-react'
import { fetchAiUsageReport } from '../../services/aiUsageReport'

const DAY_OPTIONS = [7, 30, 90]

const ENDPOINT_LABELS = {
  'food-text': 'Metin kalori (OpenAI)',
  'food-text-cache': 'Metin kalori (öğün cache)',
  'food-text-dictionary': 'Metin kalori (sözlük)',
  'food-vision': 'Fotoğraf kalori',
  'blog-generate': 'Blog üretimi',
  'daily-tip': 'Günün ipucu',
  openai: 'OpenAI',
  other: 'Diğer',
}

function formatUsd(n) {
  const v = Number(n) || 0
  if (v === 0) return '$0.00'
  if (v < 0.01) return `$${v.toFixed(6)}`
  return `$${v.toFixed(4)}`
}

function formatTokens(n) {
  return (Number(n) || 0).toLocaleString('tr-TR')
}

function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-5">
      <div className="flex items-center gap-2 text-cream-800/50">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-cream-900 sm:text-3xl">{value}</p>
      {sub ? <p className="mt-1 text-xs text-cream-800/55">{sub}</p> : null}
    </div>
  )
}

export default function AdminAiCostsPage() {
  const [days, setDays] = useState(30)
  const [state, setState] = useState({ loading: true, data: null, error: null })

  const load = (d = days) => {
    setState((s) => ({ ...s, loading: true, error: null }))
    fetchAiUsageReport(d)
      .then((data) => setState({ loading: false, data, error: null }))
      .catch((err) => setState({ loading: false, data: null, error: err.message }))
  }

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    fetchAiUsageReport(days)
      .then((data) => {
        if (!cancelled) setState({ loading: false, data, error: null })
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, data: null, error: err.message })
      })
    return () => { cancelled = true }
  }, [days])

  const t = state.data?.totals
  const cacheStats = state.data?.cacheStats
  const daySeries = state.data?.daySeries || []
  const byEndpoint = state.data?.byEndpoint || []
  const byModel = state.data?.byModel || []
  const recent = state.data?.recent || []

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-cream-900">
            <Bot className="h-7 w-7 text-brand-500" />
            YZ Gider
          </h1>
          <p className="mt-1 text-sm text-cream-800/60">
            AI API token kullanımı ve tahmini maliyet raporu
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-cream-200 bg-white p-1">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  days === d
                    ? 'bg-brand-500 text-white'
                    : 'text-cream-800/70 hover:bg-cream-50'
                }`}
              >
                {d} gün
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => load(days)}
            disabled={state.loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cream-200 bg-white px-3 py-2 text-xs font-semibold text-cream-800 hover:bg-cream-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${state.loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>
      </div>

      {state.loading && !state.data && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-cream-800/50">
          <Loader2 className="h-5 w-5 animate-spin" /> YZ gider verisi yükleniyor…
        </div>
      )}

      {!state.loading && state.error && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Rapor alınamadı</p>
            <p className="mt-1 text-amber-900/80">{state.error}</p>
          </div>
        </div>
      )}

      {t && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              icon={DollarSign}
              label="Toplam maliyet"
              value={formatUsd(t.costUsd)}
              sub={`Son ${days} gün · tahmini USD`}
            />
            <StatCard
              icon={Zap}
              label="API çağrısı"
              value={formatTokens(t.calls)}
              sub={`${formatTokens(t.successCalls)} başarılı · ${formatTokens(t.failedCalls)} hata`}
            />
            <StatCard
              icon={Hash}
              label="Toplam token"
              value={formatTokens(t.totalTokens)}
              sub={`${formatTokens(t.promptTokens)} giriş · ${formatTokens(t.completionTokens)} çıkış`}
            />
            <StatCard
              icon={Bot}
              label="Ort. maliyet / çağrı"
              value={t.calls ? formatUsd(t.costUsd / t.calls) : '$0.00'}
              sub="Başarılı + başarısız çağrılar dahil"
            />
            <StatCard
              icon={Zap}
              label="Kalori cache hit"
              value={cacheStats ? `%${cacheStats.cacheHitRate}` : '—'}
              sub={
                cacheStats
                  ? `${formatTokens(cacheStats.foodTextCacheHits)} cache · ${formatTokens(cacheStats.foodTextOpenAi)} OpenAI`
                  : 'Metin kalori istekleri'
              }
            />
          </div>

          {state.data?.pricingNote && (
            <p className="rounded-xl border border-cream-100 bg-cream-50/80 px-4 py-3 text-xs text-cream-800/65">
              {state.data.pricingNote}
            </p>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-cream-200 bg-white p-6">
              <h3 className="font-semibold text-cream-900">Günlük maliyet</h3>
              <p className="mt-1 text-xs text-cream-800/55">USD · günlük toplam</p>
              {daySeries.length === 0 ? (
                <p className="mt-8 text-center text-sm text-cream-800/45">Henüz kayıt yok</p>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={daySeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d4" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} width={56} />
                      <Tooltip
                        formatter={(v) => [formatUsd(v), 'Maliyet']}
                        labelFormatter={(l) => l}
                      />
                      <Line type="monotone" dataKey="costUsd" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-cream-200 bg-white p-6">
              <h3 className="font-semibold text-cream-900">Günlük token</h3>
              <p className="mt-1 text-xs text-cream-800/55">Giriş + çıkış token toplamı</p>
              {daySeries.length === 0 ? (
                <p className="mt-8 text-center text-sm text-cream-800/45">Henüz kayıt yok</p>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={daySeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d4" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} width={48} />
                      <Tooltip formatter={(v) => [formatTokens(v), 'Token']} />
                      <Bar dataKey="totalTokens" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-cream-200 bg-white p-6">
              <h3 className="font-semibold text-cream-900">Endpoint bazında</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-cream-100 text-xs uppercase tracking-wide text-cream-800/45">
                      <th className="pb-2 font-semibold">Endpoint</th>
                      <th className="pb-2 font-semibold">Çağrı</th>
                      <th className="pb-2 font-semibold">Token</th>
                      <th className="pb-2 font-semibold">Maliyet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byEndpoint.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-cream-800/45">Kayıt yok</td>
                      </tr>
                    ) : byEndpoint.map((row) => (
                      <tr key={row.endpoint} className="border-b border-cream-50">
                        <td className="py-2.5 font-medium text-cream-900">
                          {ENDPOINT_LABELS[row.endpoint] || row.endpoint}
                        </td>
                        <td className="py-2.5 text-cream-800/70">{formatTokens(row.calls)}</td>
                        <td className="py-2.5 text-cream-800/70">{formatTokens(row.totalTokens)}</td>
                        <td className="py-2.5 font-semibold text-cream-900">{formatUsd(row.costUsd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-cream-200 bg-white p-6">
              <h3 className="font-semibold text-cream-900">Model bazında</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-cream-100 text-xs uppercase tracking-wide text-cream-800/45">
                      <th className="pb-2 font-semibold">Model</th>
                      <th className="pb-2 font-semibold">Çağrı</th>
                      <th className="pb-2 font-semibold">Token</th>
                      <th className="pb-2 font-semibold">Maliyet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byModel.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-cream-800/45">Kayıt yok</td>
                      </tr>
                    ) : byModel.map((row) => (
                      <tr key={row.model} className="border-b border-cream-50">
                        <td className="py-2.5 font-medium text-cream-900">{row.model}</td>
                        <td className="py-2.5 text-cream-800/70">{formatTokens(row.calls)}</td>
                        <td className="py-2.5 text-cream-800/70">{formatTokens(row.totalTokens)}</td>
                        <td className="py-2.5 font-semibold text-cream-900">{formatUsd(row.costUsd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-cream-200 bg-white p-6">
            <h3 className="font-semibold text-cream-900">Son çağrılar</h3>
            <p className="mt-1 text-xs text-cream-800/55">En fazla 50 kayıt</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-cream-100 text-xs uppercase tracking-wide text-cream-800/45">
                    <th className="pb-2 font-semibold">Zaman</th>
                    <th className="pb-2 font-semibold">Endpoint</th>
                    <th className="pb-2 font-semibold">Model</th>
                    <th className="pb-2 font-semibold">Token</th>
                    <th className="pb-2 font-semibold">Maliyet</th>
                    <th className="pb-2 font-semibold">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-cream-800/45">
                        Henüz AI çağrısı kaydı yok. Kalori analizi yapıldığında burada görünür.
                      </td>
                    </tr>
                  ) : recent.map((row) => (
                    <tr key={row.id} className="border-b border-cream-50">
                      <td className="py-2.5 whitespace-nowrap text-cream-800/70">{formatDateTime(row.createdAt)}</td>
                      <td className="py-2.5 font-medium text-cream-900">
                        {ENDPOINT_LABELS[row.endpoint] || row.endpoint}
                      </td>
                      <td className="py-2.5 text-cream-800/70">{row.model}</td>
                      <td className="py-2.5 text-cream-800/70">
                        {formatTokens(row.totalTokens)}
                        <span className="ml-1 text-[10px] text-cream-800/40">
                          ({formatTokens(row.promptTokens)}/{formatTokens(row.completionTokens)})
                        </span>
                      </td>
                      <td className="py-2.5 font-semibold text-cream-900">{formatUsd(row.costUsd)}</td>
                      <td className="py-2.5">
                        {row.success ? (
                          <span className="rounded-full bg-sage-50 px-2 py-0.5 text-xs font-medium text-sage-700">OK</span>
                        ) : (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                            {row.errorCode || 'Hata'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

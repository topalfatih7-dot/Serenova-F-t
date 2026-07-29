import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, startOfMonth } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  CreditCard, History, Wallet, TrendingUp, Users,
  Clock, ArrowDownLeft, Building2, Crown, Loader2, ExternalLink,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import EmptyState from '../../components/ui/EmptyState'
import PanelPageHeader, { PanelPageShell } from '../../components/layout/PanelPageHeader'
import {
  STAFF_SESSION_RATE_TRY,
  STAFF_EARNING_STATUS,
  formatStaffPayoutPeriodLabel,
} from '../../data/staffPayouts'
import { getPlanLabel, isPaidMembership } from '../../data/membershipPlans'
import { startStripePortal } from '../../services/stripePayment'
import { supabase } from '../../services/supabaseClient'

function formatTry(amount) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount || 0)
}

function paymentPlanLabel(p) {
  const planId = p.packageConfig?.planId || p.packageConfig?.membership || p.planId || p.plan
  return getPlanLabel(planId) || p.plan || 'Üyelik ödemesi'
}

function paymentDate(p) {
  return p.createdAt || p.date || null
}

function StatusBadge({ status }) {
  const map = {
    completed: 'bg-sage-50 text-sage-700',
    paid: 'bg-sage-50 text-sage-700',
    approved: 'bg-brand-50 text-brand-700',
    pending: 'bg-amber-50 text-amber-700',
    refunded: 'bg-cream-100 text-cream-700',
    reversed: 'bg-cream-100 text-cream-700',
    rejected: 'bg-red-50 text-red-700',
  }
  const labels = {
    completed: 'Tamamlandı',
    paid: 'Ödendi',
    approved: 'Onaylandı',
    pending: 'Bekliyor',
    refunded: 'İade',
    reversed: 'İptal',
    rejected: 'Red',
    ...STAFF_EARNING_STATUS,
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || map.pending}`}>
      {labels[status] || status}
    </span>
  )
}

function nextFridayLabel() {
  const d = new Date()
  const day = d.getDay()
  const add = day <= 5 ? (5 - day) : 6
  d.setDate(d.getDate() + add)
  return format(d, 'd MMM', { locale: tr })
}

function MemberPayments() {
  const { user, platform } = useApp()
  const { toast } = useToast()
  const [portalLoading, setPortalLoading] = useState(false)

  const payments = useMemo(() => (
    (platform?.payments || [])
      .filter((p) => p.memberId === user?.id)
      .sort((a, b) => new Date(paymentDate(b) || 0) - new Date(paymentDate(a) || 0))
  ), [platform?.payments, user?.id])

  const openPortal = async () => {
    setPortalLoading(true)
    try {
      const result = await startStripePortal()
      if (!result.success) toast(result.error || 'Portal açılamadı.', 'error')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-900">
          <CreditCard className="h-5 w-5 text-brand-500" /> Ödeme Yöntemi
        </h2>
        <div className="rounded-2xl border border-cream-200 bg-white p-6">
          <p className="text-sm text-cream-800/70">
            Kart ve fatura bilgilerinizi Stripe Customer Portal üzerinden güvenle yönetebilirsiniz.
          </p>
          <button
            type="button"
            onClick={openPortal}
            disabled={portalLoading}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Aboneliği / kartı yönet
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-900">
          <History className="h-5 w-5 text-brand-500" /> Ödeme Geçmişim
        </h2>
        {payments.length === 0 ? (
          <EmptyState icon={History} title="Henüz ödeme kaydı yok" description="Ücretli paket satın aldığınızda ödemeleriniz burada listelenir." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-cream-200 bg-white">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="border-b border-cream-100 bg-cream-50/80 text-left text-xs uppercase tracking-wide text-cream-800/50">
                <tr>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Tutar</th>
                  <th className="px-4 py-3">Kaynak</th>
                  <th className="px-4 py-3">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-cream-50/50">
                    <td className="px-4 py-3 text-cream-800">
                      {paymentDate(p) ? format(new Date(paymentDate(p)), 'd MMM yyyy', { locale: tr }) : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-cream-900">{paymentPlanLabel(p)}</td>
                    <td className="px-4 py-3 font-semibold text-cream-900">{formatTry(p.amount)}</td>
                    <td className="px-4 py-3 text-xs text-cream-800/70">
                      {p.provider === 'admin' ? 'Admin' : p.provider === 'stripe' ? 'Stripe' : (p.provider || '—')}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.status || 'completed'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function useStaffEarnings({ staffId = null, all = false } = {}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRows = useCallback(async () => {
    let q = supabase.from('staff_earnings').select('*').order('created_at', { ascending: false })
    if (!all && staffId) q = q.eq('staff_id', staffId)
    const { data, error } = await q.limit(all ? 200 : 100)
    if (error) throw error
    return data || []
  }, [staffId, all])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await fetchRows())
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [fetchRows])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchRows()
        if (!cancelled) setRows(data)
      } catch {
        if (!cancelled) setRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [fetchRows])

  return { rows, loading, reload: load }
}

function StaffPayments() {
  const { staffUser } = useApp()
  const { rows, loading } = useStaffEarnings({ staffId: staffUser?.id })

  const summary = useMemo(() => {
    const monthStart = startOfMonth(new Date())
    const pendingAmount = rows
      .filter((r) => r.status === 'pending' || r.status === 'approved')
      .reduce((s, r) => s + Number(r.amount_try || 0), 0)
    const sessionsThisMonth = rows.filter((r) => {
      const created = new Date(r.created_at)
      return created >= monthStart && r.status !== 'rejected' && r.status !== 'reversed'
    }).length
    const totalEarned = rows
      .filter((r) => r.status === 'paid' || r.status === 'approved' || r.status === 'pending')
      .reduce((s, r) => s + Number(r.amount_try || 0), 0)

    const byPeriod = {}
    for (const r of rows) {
      const key = r.period_key || '—'
      if (!byPeriod[key]) byPeriod[key] = { id: key, period: formatStaffPayoutPeriodLabel(key), sessions: 0, amount: 0, status: r.status }
      byPeriod[key].sessions += 1
      byPeriod[key].amount += Number(r.amount_try || 0)
      if (r.status === 'pending') byPeriod[key].status = 'pending'
      else if (r.status === 'paid' && byPeriod[key].status !== 'pending') byPeriod[key].status = 'paid'
    }

    return {
      pendingAmount,
      sessionsThisMonth,
      totalEarned,
      history: Object.values(byPeriod).sort((a, b) => String(b.id).localeCompare(String(a.id))),
    }
  }, [rows])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-cream-800/50">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/40 px-4 py-3">
        <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        <p className="text-sm text-brand-900/80">
          Faturalandırılabilir görüşme başına {formatTry(STAFF_SESSION_RATE_TRY)}
          {' '}· her iki tarafın videoya katılımı ve en az 15 dk eşzamanlı süre gerekir. Program/listeler dahil değildir.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
          <p className="text-xs font-medium text-amber-800/70">Bekleyen Hakediş</p>
          <p className="mt-1 font-display text-2xl font-bold text-amber-900">{formatTry(summary.pendingAmount)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-amber-700">
            <Clock className="h-3 w-3" /> Ödeme: {nextFridayLabel()}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
          <p className="text-xs font-medium text-brand-800/70">Bu Ay Seans</p>
          <p className="mt-1 font-display text-2xl font-bold text-brand-900">{summary.sessionsThisMonth}</p>
          <p className="mt-1 text-xs text-brand-700">Görüşme başı {formatTry(STAFF_SESSION_RATE_TRY)}</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-5">
          <p className="text-xs font-medium text-cream-800/60">Toplam Kazanç</p>
          <p className="mt-1 font-display text-2xl font-bold text-cream-900">{formatTry(summary.totalEarned)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-sage-600">
            <TrendingUp className="h-3 w-3" /> Bekleyen + onaylı + ödenen
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-900">
          <Wallet className="h-5 w-5 text-brand-500" /> Hakediş Geçmişi
        </h2>
        {summary.history.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Henüz hakediş yok"
            description="Faturalandırılabilir video görüşmeler tamamlandıkça burada görünür."
          />
        ) : (
          <div className="space-y-3">
            {summary.history.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-200 bg-white p-4">
                <div>
                  <p className="font-semibold text-cream-900">{row.period}</p>
                  <p className="text-xs text-cream-800/55">
                    {row.sessions} faturalandırılabilir görüşme
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-cream-900">{formatTry(row.amount)}</p>
                  <StatusBadge status={row.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function AdminStaffEarnings() {
  const { toast } = useToast()
  const { platform } = useApp()
  const { rows, loading, reload } = useStaffEarnings({ all: true })
  const [busyId, setBusyId] = useState(null)

  const staffName = useCallback((staffId) => {
    const s = (platform?.staff || []).find((x) => x.id === staffId)
    return s?.name || 'Personel'
  }, [platform?.staff])

  const setStatus = async (id, status) => {
    setBusyId(id)
    try {
      const { error } = await supabase
        .from('staff_earnings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      toast(status === 'paid' ? 'Ödendi olarak işaretlendi.' : 'Durum güncellendi.', 'success')
      await reload()
    } catch (e) {
      toast(e?.message || 'Güncellenemedi.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-cream-800/50">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Hakediş kaydı yok"
        description="Video katılımı faturalandırılabilir olduğunda satırlar burada oluşur."
      />
    )
  }

  return (
    <div className="space-y-2">
      {rows.slice(0, 40).map((r) => (
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cream-200 bg-white px-4 py-3">
          <div>
            <p className="font-medium text-cream-900">{staffName(r.staff_id)}</p>
            <p className="text-xs text-cream-800/50">
              {formatStaffPayoutPeriodLabel(r.period_key)} · {r.session_type} · {r.overlap_minutes} dk
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{formatTry(r.amount_try)}</span>
            <StatusBadge status={r.status} />
            {r.status === 'pending' && (
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => setStatus(r.id, 'approved')}
                className="rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                Onayla
              </button>
            )}
            {(r.status === 'pending' || r.status === 'approved') && (
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => setStatus(r.id, 'paid')}
                className="rounded-lg bg-sage-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sage-700 disabled:opacity-50"
              >
                Ödendi
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function AdminPayments() {
  const { platform, adminStats, monthlyGrowth } = useApp()

  const recent = useMemo(() => (
    [...(platform?.payments || [])]
      .sort((a, b) => new Date(paymentDate(b) || 0) - new Date(paymentDate(a) || 0))
      .slice(0, 25)
  ), [platform?.payments])

  const premiumMembers = useMemo(
    () => (platform?.members || []).filter((m) => isPaidMembership(m.membership)),
    [platform?.members],
  )

  const conversionRate = adminStats?.totalMembers
    ? Math.round((adminStats.premium / adminStats.totalMembers) * 100)
    : 0

  const activePaid = adminStats?.premium ?? 0

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
          <p className="text-xs text-brand-800/70">Aylık Tekrarlayan Gelir</p>
          <p className="mt-1 font-display text-2xl font-bold text-brand-900">{formatTry(adminStats?.mrr)}</p>
        </div>
        <div className="rounded-2xl border border-sage-100 bg-sage-50/50 p-5">
          <p className="text-xs text-sage-800/70">Ücretli Üye</p>
          <p className="mt-1 font-display text-2xl font-bold text-sage-900">{activePaid}</p>
          <p className="mt-1 text-xs text-sage-700">%{conversionRate} dönüşüm</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
          <p className="text-xs text-amber-800/70">Toplam Gelir</p>
          <p className="mt-1 font-display text-2xl font-bold text-amber-900">{formatTry(adminStats?.totalRevenue)}</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-5">
          <p className="text-xs text-cream-800/60">Kayıtlı Ödeme</p>
          <p className="mt-1 font-display text-2xl font-bold text-cream-900">{platform?.payments?.length ?? 0}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-900">
          <ArrowDownLeft className="h-5 w-5 text-brand-500" /> Son Üye Ödemeleri
        </h2>
        {recent.length === 0 ? (
          <EmptyState icon={History} title="Ödeme kaydı yok" description="Stripe veya manuel plan değişimlerinde kayıtlar burada görünür." />
        ) : (
          <div className="space-y-2">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-cream-200 bg-white px-4 py-3">
                <div>
                  <p className="font-medium text-cream-900">{t.memberName || 'Üye'}</p>
                  <p className="text-xs text-cream-800/50">
                    {paymentPlanLabel(t)}
                    {t.provider === 'admin' ? ' · Admin' : t.provider === 'stripe' ? ' · Stripe' : ''}
                    {paymentDate(t) ? ` · ${format(new Date(paymentDate(t)), 'd MMM yyyy', { locale: tr })}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatTry(t.amount)}</span>
                  <StatusBadge status={t.status || 'completed'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {adminStats?.totalMembers > 0 && monthlyGrowth?.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-900">
            <TrendingUp className="h-5 w-5 text-brand-500" /> Büyüme Grafiği
          </h2>
          <div className="rounded-2xl border border-cream-200 bg-white p-6">
            <div className="h-64">
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
        </section>
      )}

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-900">
          <Crown className="h-5 w-5 text-brand-500" /> Ücretli Üyeler
        </h2>
        {premiumMembers.length === 0 ? (
          <EmptyState icon={Crown} title="Ücretli üye yok" description="Premium kayıtlar burada listelenir." />
        ) : (
          <div className="space-y-2">
            {premiumMembers.slice(0, 20).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-cream-200 bg-white px-4 py-3">
                <div>
                  <p className="font-medium text-cream-900">{m.name}</p>
                  <p className="text-xs text-cream-800/50">
                    {getPlanLabel(m.packageConfig?.planId || m.membership) || 'Ücretli üye'}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.membershipStatus === 'active' ? 'bg-sage-50 text-sage-700' : 'bg-amber-50 text-amber-700'}`}>
                  {m.membershipStatus}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-900">
          <Users className="h-5 w-5 text-brand-500" /> Personel Hakedişleri
        </h2>
        <AdminStaffEarnings />
      </section>
    </div>
  )
}

export default function PaymentManagementPage({ audience = 'member' }) {
  const title = useMemo(() => {
    if (audience === 'admin') return 'Finans & Ödemeler'
    if (audience === 'staff') return 'Kazanç & Hakediş'
    return 'Ödeme Yönetimi'
  }, [audience])

  const subtitle = useMemo(() => {
    if (audience === 'admin') return 'Gelir, ödeme geçmişi, büyüme ve personel hakediş onayları'
    if (audience === 'staff') return 'Video görüşme hakedişi — Cuma ödeme döngüsü'
    return 'Ödeme geçmişiniz ve Stripe kart yönetimi'
  }, [audience])

  return (
    <PanelPageShell>
      <PanelPageHeader
        title={title}
        subtitle={subtitle}
        icon={Wallet}
        accent={audience === 'member' ? 'brand' : audience === 'staff' ? 'warm' : 'violet'}
      />

      {audience === 'member' && <MemberPayments />}
      {audience === 'staff' && <StaffPayments />}
      {audience === 'admin' && <AdminPayments />}
    </PanelPageShell>
  )
}

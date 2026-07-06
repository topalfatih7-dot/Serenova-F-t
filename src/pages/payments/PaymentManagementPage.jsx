import { useMemo } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  CreditCard, History, Wallet, TrendingUp, Users,
  Clock, ArrowDownLeft, Building2, Crown,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useApp } from '../../context/AppContext'
import EmptyState from '../../components/ui/EmptyState'
import PanelPageHeader, { PanelPageShell } from '../../components/layout/PanelPageHeader'
import { MOCK_STAFF_EARNINGS } from '../../data/mockPayments'
import { STAFF_SESSION_RATE_TRY } from '../../data/staffPayouts'
import { getPlanLabel, isPaidMembership } from '../../data/membershipPlans'

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
    pending: 'bg-amber-50 text-amber-700',
    refunded: 'bg-cream-100 text-cream-700',
  }
  const labels = { completed: 'Tamamlandı', paid: 'Ödendi', pending: 'Bekliyor', refunded: 'İade' }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || map.pending}`}>
      {labels[status] || status}
    </span>
  )
}

function MemberPayments() {
  const { user, platform } = useApp()

  const payments = useMemo(() => (
    (platform?.payments || [])
      .filter((p) => p.memberId === user?.id)
      .sort((a, b) => new Date(paymentDate(b) || 0) - new Date(paymentDate(a) || 0))
  ), [platform?.payments, user?.id])

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-900">
          <CreditCard className="h-5 w-5 text-brand-500" /> Ödeme Yöntemi
        </h2>
        <EmptyState
          icon={CreditCard}
          title="Kart yönetimi Stripe üzerinden"
          description="Ücretli paket satın alımları güvenli Stripe Checkout ile yapılır. Kayıtlı kart ekleme ve yönetim yakında Stripe Customer Portal ile açılacak."
        />
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

function StaffPayments({ role }) {
  const earnings = MOCK_STAFF_EARNINGS[role] || MOCK_STAFF_EARNINGS.coach

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3">
        <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-900/80">
          Personel hakediş modülü henüz veritabanına bağlanmadı — aşağıdaki özet demo veridir.
          Faturalandırılabilir görüşme başına {formatTry(STAFF_SESSION_RATE_TRY)}; program ve listeler hakedişe dahil değildir.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
          <p className="text-xs font-medium text-amber-800/70">Bekleyen Hakediş</p>
          <p className="mt-1 font-display text-2xl font-bold text-amber-900">{formatTry(earnings.pendingAmount)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-amber-700">
            <Clock className="h-3 w-3" /> Ödeme: {format(new Date(earnings.nextPayoutDate), 'd MMM', { locale: tr })}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
          <p className="text-xs font-medium text-brand-800/70">Bu Ay Seans</p>
          <p className="mt-1 font-display text-2xl font-bold text-brand-900">{earnings.sessionsThisMonth}</p>
          <p className="mt-1 text-xs text-brand-700">Görüşme başı {formatTry(earnings.sessionRate)} · video katılım zorunlu</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-5">
          <p className="text-xs font-medium text-cream-800/60">Toplam Kazanç</p>
          <p className="mt-1 font-display text-2xl font-bold text-cream-900">{formatTry(earnings.totalEarned)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-sage-600">
            <TrendingUp className="h-3 w-3" /> Demo veri
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-900">
          <Wallet className="h-5 w-5 text-brand-500" /> Hakediş Geçmişi
        </h2>
        <div className="space-y-3">
          {earnings.history.map((row) => (
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
      </section>
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
                  <p className="text-xs text-cream-800/50">{m.email}</p>
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
        <p className="rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-cream-800/65">
          Personel ödeme modülü henüz aktif değil. Yalnızca her iki tarafın videoya katıldığı görüşmeler (500₺/görüşme) hakedişe dönüşür.
        </p>
      </section>
    </div>
  )
}

export default function PaymentManagementPage({ audience = 'member' }) {
  const { staffUser } = useApp()

  const title = useMemo(() => {
    if (audience === 'admin') return 'Finans & Ödemeler'
    if (audience === 'staff') return 'Kazanç & Hakediş'
    return 'Ödeme Yönetimi'
  }, [audience])

  const subtitle = useMemo(() => {
    if (audience === 'admin') return 'Gelir, ödeme geçmişi, büyüme grafiği ve ücretli üyeler'
    if (audience === 'staff') return 'Video görüşme hakedişi — Cuma ödeme döngüsü (demo)'
    return 'Ödeme geçmişiniz'
  }, [audience])

  return (
    <PanelPageShell>
      {audience === 'staff' && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-orange-50/50 px-4 py-3">
          <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900/80">Personel kazanç ekranı demo veri kullanıyor.</p>
        </div>
      )}

      <PanelPageHeader
        title={title}
        subtitle={subtitle}
        icon={Wallet}
        accent={audience === 'member' ? 'brand' : audience === 'staff' ? 'warm' : 'violet'}
      />

      {audience === 'member' && <MemberPayments />}
      {audience === 'staff' && <StaffPayments role={staffUser?.role} />}
      {audience === 'admin' && <AdminPayments />}
    </PanelPageShell>
  )
}
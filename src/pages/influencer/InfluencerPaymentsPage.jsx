import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Copy, Check, Clock, Tag, Wallet, History, Loader2 } from 'lucide-react'
import PanelPageHeader, { PanelPageShell } from '../../components/layout/PanelPageHeader'
import EmptyState from '../../components/ui/EmptyState'
import StaffPayoutAccountCard from '../../components/payments/StaffPayoutAccountCard'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import useInfluencerPayoutAccounts from '../../hooks/useInfluencerPayoutAccounts'
import useInfluencerEarnings from '../../hooks/useInfluencerEarnings'
import { upsertInfluencerPayoutAccount } from '../../services/influencerDb'
import { getPlanLabel } from '../../data/membershipPlans'
import {
  INFLUENCER_EARNING_STATUS,
  formatInfluencerPayoutPeriodLabel,
  formatInfluencerPayoutWindowLabel,
  formatInfluencerTry,
  nextInfluencerPayoutPeriodKey,
  summarizeInfluencerEarnings,
} from '../../data/influencerPayouts'

async function copyText(text) {
  await navigator.clipboard.writeText(text)
}

function StatusBadge({ status }) {
  const map = {
    paid: 'bg-sage-50 text-sage-700',
    approved: 'bg-brand-50 text-brand-700',
    pending: 'bg-amber-50 text-amber-700',
    reversed: 'bg-cream-100 text-cream-700',
    rejected: 'bg-red-50 text-red-700',
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || map.pending}`}>
      {INFLUENCER_EARNING_STATUS[status] || status}
    </span>
  )
}

export default function InfluencerPaymentsPage() {
  const { influencerUser } = useApp()
  const { toast } = useToast()
  const { account, loading: payoutLoading, reload: reloadPayout } = useInfluencerPayoutAccounts({
    influencerId: influencerUser?.id,
  })
  const { rows, loading } = useInfluencerEarnings({ influencerId: influencerUser?.id })
  const [copied, setCopied] = useState(false)

  const code = influencerUser?.code || ''
  const summary = useMemo(() => {
    const stats = summarizeInfluencerEarnings(rows)
    const payoutKey = nextInfluencerPayoutPeriodKey(new Date(), stats.pendingRows.map((r) => r.period_key))
    return { ...stats, payoutLabel: formatInfluencerPayoutPeriodLabel(payoutKey) }
  }, [rows])

  const handleCopy = async () => {
    if (!code) return
    try {
      await copyText(code)
      setCopied(true)
      toast('Kod kopyalandı.', 'success')
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast('Kopyalanamadı.', 'error')
    }
  }

  return (
    <PanelPageShell>
      <PanelPageHeader
        title="Ödeme Yönetimi"
        subtitle="IBAN, indirim kodu ve kodunuzla gelen alışverişler"
        icon={Wallet}
        accent="sage"
      />

      <section className="overflow-hidden rounded-2xl border border-brand-100 bg-white px-4 py-3.5 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-cream-800/50">
              <Tag className="h-3 w-3" /> İndirim kodunuz
            </p>
            <p className="mt-0.5 font-display text-xl font-bold tracking-wide text-cream-900">{code || '—'}</p>
            <p className="mt-0.5 text-xs text-cream-800/55">
              İlk ödemede %10 · yenilemede de %10 + %20 hakediş · sonraki Cuma: {summary.payoutLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!code}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Kopyala
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
            <p className="text-xs font-medium text-amber-800/70">Bekleyen hakediş</p>
            <p className="mt-1 font-display text-xl font-bold text-amber-900">{formatInfluencerTry(summary.pending)}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-amber-700">
              <Clock className="h-3 w-3" /> Ödeme: {summary.payoutLabel}
            </p>
          </div>
          <div className="rounded-2xl border border-sage-100 bg-sage-50/50 p-4">
            <p className="text-xs font-medium text-sage-800/70">Ödenen</p>
            <p className="mt-1 font-display text-xl font-bold text-sage-900">{formatInfluencerTry(summary.paid)}</p>
          </div>
          <div className="rounded-2xl border border-cream-200 bg-white p-4">
            <p className="text-xs font-medium text-cream-800/60">Müşteri</p>
            <p className="mt-1 font-display text-xl font-bold text-cream-900">{summary.uniqueCustomers}</p>
          </div>
        </div>

        {payoutLoading ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-cream-200 bg-white text-cream-800/50">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <StaffPayoutAccountCard
            staffUser={influencerUser}
            account={account}
            onUpsert={upsertInfluencerPayoutAccount}
            onSaved={reloadPayout}
            description="Hakediş Cuma günü EFT / FAST ile bu hesaba yatırılır."
          />
        )}
      </div>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-900">
          <History className="h-5 w-5 text-brand-500" /> Kodla gelen alışverişler
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-cream-800/50">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Henüz alışveriş yok"
            description="Kodunuzla ödeme veya yenileme tamamlandığında müşteri, paket ve hakediş burada görünür."
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-cream-200 bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-cream-100 bg-cream-50/80 text-left text-xs uppercase tracking-wide text-cream-800/50">
                <tr>
                  <th className="px-4 py-3">Müşteri</th>
                  <th className="px-4 py-3">Paket</th>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Ödenen</th>
                  <th className="px-4 py-3">Hakediş</th>
                  <th className="px-4 py-3">Döngü</th>
                  <th className="px-4 py-3">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-50">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-cream-50/50">
                    <td className="px-4 py-3 font-medium text-cream-900">{r.member_display_name || 'Üye'}</td>
                    <td className="px-4 py-3 text-cream-800">
                      {getPlanLabel(r.plan_id)}
                      {r.duration_months ? ` · ${r.duration_months} ay` : ''}
                    </td>
                    <td className="px-4 py-3 text-cream-800">
                      {r.created_at ? format(new Date(r.created_at), 'd MMM yyyy', { locale: tr }) : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-cream-900">{formatInfluencerTry(r.amount_paid_try)}</td>
                    <td className="px-4 py-3 font-semibold text-sage-800">{formatInfluencerTry(r.commission_try)}</td>
                    <td className="px-4 py-3 text-xs text-cream-800/60">
                      {formatInfluencerPayoutPeriodLabel(r.period_key)}
                      {formatInfluencerPayoutWindowLabel(r.period_key) ? (
                        <span className="mt-0.5 block">{formatInfluencerPayoutWindowLabel(r.period_key)}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PanelPageShell>
  )
}

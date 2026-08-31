import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, Tag, Users, Wallet, CalendarClock, TrendingUp, Check } from 'lucide-react'
import StatsCard from '../../components/ui/StatsCard'
import PanelPageHeader, { PanelPageShell } from '../../components/layout/PanelPageHeader'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import useInfluencerEarnings from '../../hooks/useInfluencerEarnings'
import {
  formatInfluencerPayoutPeriodLabel,
  formatInfluencerTry,
  nextInfluencerPayoutPeriodKey,
  summarizeInfluencerEarnings,
} from '../../data/influencerPayouts'

async function copyText(text) {
  await navigator.clipboard.writeText(text)
}

export default function InfluencerOverviewPage() {
  const { influencerUser } = useApp()
  const { toast } = useToast()
  const { rows, loading } = useInfluencerEarnings({ influencerId: influencerUser?.id })
  const [copied, setCopied] = useState(false)

  const summary = useMemo(() => {
    const stats = summarizeInfluencerEarnings(rows)
    const payoutKey = nextInfluencerPayoutPeriodKey(new Date(), stats.pendingRows.map((r) => r.period_key))
    return {
      ...stats,
      payoutLabel: formatInfluencerPayoutPeriodLabel(payoutKey),
    }
  }, [rows])

  const code = influencerUser?.code || ''

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
        title="Genel Bakış"
        subtitle="İndirim kodunuz, bekleyen hakedişiniz ve Cuma ödeme döngüsü"
        icon={Tag}
        accent="brand"
        actions={code ? (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/25"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {code}
          </button>
        ) : null}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Bekleyen hakediş"
          value={loading ? '…' : formatInfluencerTry(summary.pending)}
          sub="Onay bekleyen + onaylı"
          icon={Wallet}
          accent="gold"
        />
        <StatsCard
          label="Bu Cuma ödeme"
          value={loading ? '…' : summary.payoutLabel}
          sub="Cuma–Perşembe tahakkuk · sonraki Cuma EFT"
          icon={CalendarClock}
          accent="sage"
        />
        <StatsCard
          label="Toplam müşteri"
          value={loading ? '…' : String(summary.uniqueCustomers)}
          sub="Kodunuzla ödeme yapanlar"
          icon={Users}
          accent="brand"
        />
        <StatsCard
          label="Toplam kazanç"
          value={loading ? '…' : formatInfluencerTry(summary.total)}
          sub="Bekleyen + onaylı + ödenen"
          icon={TrendingUp}
          accent="cream"
        />
      </div>

      <section className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50/80 via-white to-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700/70">Paylaşım kodu</p>
        <p className="mt-2 font-display text-3xl font-bold tracking-wide text-cream-900">{code || '—'}</p>
        <p className="mt-2 max-w-prose text-sm text-cream-800/60">
          Üyeler bu kodu Checkout’ta kullanarak %10 indirim alır. Aynı abonelik yenilendikçe indirim ve hakediş (ödenen tutarın %20’si) devam eder. Üye paketi iptal edince biter; yeni pakette kodu yeniden girmesi gerekir.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!code}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            <Copy className="h-4 w-4" /> Kodu kopyala
          </button>
          <Link
            to="/influencer/payments"
            className="inline-flex items-center gap-2 rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm font-semibold text-cream-800 hover:bg-cream-50"
          >
            Ödeme yönetimi
          </Link>
        </div>
      </section>
    </PanelPageShell>
  )
}

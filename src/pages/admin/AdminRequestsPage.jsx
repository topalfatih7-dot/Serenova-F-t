import { useState, useMemo } from 'react'
import { Check, X, Snowflake, XCircle, Play, RefreshCw, Inbox } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'

const TYPE_META = {
  freeze: { label: 'Tatil Dondurma', icon: Snowflake, style: 'bg-amber-50 text-amber-700' },
  cancel: { label: 'Üyelik İptali', icon: XCircle, style: 'bg-red-50 text-red-600' },
  resume: { label: 'Yeniden Başlatma', icon: Play, style: 'bg-sage-50 text-sage-700' },
  renew: { label: 'Üyelik Yenileme', icon: RefreshCw, style: 'bg-brand-50 text-brand-700' },
}
const STATUS_META = {
  pending: { label: 'Bekliyor', style: 'bg-amber-50 text-amber-700' },
  approved: { label: 'Onaylandı', style: 'bg-sage-50 text-sage-700' },
  rejected: { label: 'Reddedildi', style: 'bg-red-50 text-red-600' },
}

export default function AdminRequestsPage() {
  const { membershipRequests, resolveMembershipRequest } = useApp()
  const { toast } = useToast()
  const [tab, setTab] = useState('pending')
  const [busy, setBusy] = useState(null)

  const filtered = useMemo(() => (membershipRequests || []).filter((r) => tab === 'all' || r.status === tab), [membershipRequests, tab])
  const pendingCount = (membershipRequests || []).filter((r) => r.status === 'pending').length

  const resolve = async (req, approve) => {
    setBusy(req.id)
    try {
      await resolveMembershipRequest(req, approve)
      toast(approve ? 'Talep onaylandı ve uygulandı' : 'Talep reddedildi', approve ? 'success' : 'info')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Üyelik Talepleri</h1>
        <p className="mt-1 text-sm text-cream-800/60">{pendingCount} bekleyen talep · dondurma ve iptaller burada onaylanır</p>
      </div>

      <div className="flex gap-2">
        {[['pending', 'Bekleyen'], ['approved', 'Onaylanan'], ['rejected', 'Reddedilen'], ['all', 'Tümü']].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${tab === id ? 'bg-brand-500 text-white' : 'bg-cream-100 text-cream-800/70 hover:bg-cream-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Inbox} title="Talep yok" description="Bu kategoride üyelik talebi bulunmuyor." />
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const meta = TYPE_META[req.type] || { label: req.type, icon: Inbox, style: 'bg-cream-100 text-cream-800' }
            const Icon = meta.icon
            const st = STATUS_META[req.status]
            return (
              <div key={req.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.style}`}><Icon className="h-5 w-5" /></span>
                  <div>
                    <p className="font-semibold text-cream-900">{req.memberName || 'Üye'} · {meta.label}</p>
                    <p className="text-xs text-cream-800/55">
                      {req.requestedUntil ? `Tarih: ${req.requestedUntil} · ` : ''}{new Date(req.createdAt).toLocaleString('tr-TR')}
                    </p>
                    {req.note && <p className="mt-1 text-sm text-cream-800/70">{req.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.style}`}>{st.label}</span>
                  {req.status === 'pending' && (
                    <>
                      <button type="button" disabled={busy === req.id} onClick={() => resolve(req, true)} className="flex items-center gap-1 rounded-lg bg-sage-500 px-3 py-2 text-xs font-semibold text-white hover:bg-sage-600 disabled:opacity-50">
                        <Check className="h-4 w-4" /> Onayla
                      </button>
                      <button type="button" disabled={busy === req.id} onClick={() => resolve(req, false)} className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">
                        <X className="h-4 w-4" /> Reddet
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

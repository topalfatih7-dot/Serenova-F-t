import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import EmptyState from '../../components/ui/EmptyState'
import { MessageSquare } from 'lucide-react'

const STATUS_STYLES = {
  open: 'bg-brand-50 text-brand-700',
  'in-progress': 'bg-amber-50 text-amber-700',
  closed: 'bg-sage-50 text-sage-700',
}

const PRIORITY_STYLES = { high: 'text-red-600', normal: 'text-cream-800', low: 'text-cream-800/50' }

export default function AdminSupportPage() {
  const { platform, setTicketStatus } = useApp()
  const { toast } = useToast()
  const tickets = platform.tickets
  const openCount = tickets.filter((t) => t.status !== 'closed').length

  const handleStatus = (id, status) => {
    setTicketStatus(id, status)
    toast(`Talep durumu: ${status === 'closed' ? 'Kapatıldı' : status === 'in-progress' ? 'İşlemde' : 'Açık'}`, 'success')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Destek Talepleri</h1>
        <p className="mt-1 text-sm text-cream-800/60">{openCount} açık · {tickets.length} toplam</p>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Destek talebi yok"
          description="Üyeler destek formu veya hızlı işlemlerden talep oluşturduğunda burada görünür."
        />
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-2xl border border-cream-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-cream-900">{t.subject}</p>
                  <p className="mt-1 text-sm text-cream-800/60">{t.memberName} · {t.memberEmail}</p>
                  <p className="mt-2 text-sm text-cream-800/80">{t.message}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-cream-800/50">
                    <span>{t.category}</span>
                    <span>·</span>
                    <span>{t.createdAt}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-medium ${PRIORITY_STYLES[t.priority]}`}>
                    {t.priority === 'high' ? 'Yüksek' : t.priority === 'normal' ? 'Normal' : 'Düşük'}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[t.status]}`}>
                    {t.status === 'open' ? 'Açık' : t.status === 'in-progress' ? 'İşlemde' : 'Kapalı'}
                  </span>
                  <div className="flex gap-1">
                    {t.status !== 'in-progress' && (
                      <button type="button" onClick={() => handleStatus(t.id, 'in-progress')} className="rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-medium text-amber-700">
                        İşleme Al
                      </button>
                    )}
                    {t.status !== 'closed' && (
                      <button type="button" onClick={() => handleStatus(t.id, 'closed')} className="rounded-lg bg-sage-100 px-2 py-1 text-[10px] font-medium text-sage-700">
                        Kapat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

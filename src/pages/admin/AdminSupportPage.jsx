import { useMemo, useState, useEffect, useRef } from 'react'
import {
  MessageSquare, Search, Clock, Loader, CheckCircle2, AlertCircle, ChevronRight,
} from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import TicketThread from '../../components/support/TicketThread'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'

const GROUPS = [
  { id: 'open', label: 'Bekleyen', icon: Clock, accent: 'text-brand-700 bg-brand-50', dot: 'bg-brand-500' },
  { id: 'in-progress', label: 'İşleme Alınan', icon: Loader, accent: 'text-amber-700 bg-amber-50', dot: 'bg-amber-500' },
  { id: 'closed', label: 'Çözülen', icon: CheckCircle2, accent: 'text-sage-700 bg-sage-50', dot: 'bg-sage-500' },
]

const PRIORITY = {
  high: { label: 'Yüksek', style: 'bg-red-50 text-red-600' },
  normal: { label: 'Normal', style: 'bg-cream-100 text-cream-800' },
  low: { label: 'Düşük', style: 'bg-cream-100 text-cream-800/50' },
}

function statusMeta(status) {
  return GROUPS.find((g) => g.id === status) || GROUPS[0]
}

export default function AdminSupportPage() {
  const { platform, setTicketStatus, sendTicketReply } = useApp()
  const { toast } = useToast()
  const tickets = platform.tickets
  const [tab, setTab] = useState('open')
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState(null)

  const counts = useMemo(() => ({
    open: tickets.filter((t) => t.status === 'open').length,
    'in-progress': tickets.filter((t) => t.status === 'in-progress').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  }), [tickets])

  const filtered = useMemo(() => tickets.filter((t) => {
    const matchTab = tab === 'all' || t.status === tab
    const q = search.toLowerCase()
    const matchSearch = !q || t.subject.toLowerCase().includes(q) || (t.memberName || '').toLowerCase().includes(q)
    return matchTab && matchSearch
  }), [tickets, tab, search])

  const activeTicket = tickets.find((t) => t.id === activeId) || null
  const prevTicketCount = useRef(tickets.length)

  useEffect(() => {
    if (tickets.length > prevTicketCount.current) {
      toast('Yeni destek talebi geldi', 'info')
    }
    prevTicketCount.current = tickets.length
  }, [tickets.length, toast])

  const handleStatus = (id, status) => {
    setTicketStatus(id, status)
    toast(status === 'closed' ? 'Talep çözüldü' : status === 'in-progress' ? 'Talep işleme alındı' : 'Talep yeniden açıldı', 'success')
  }

  const handleReply = (text) => {
    sendTicketReply(activeId, 'admin', text)
    toast('Yanıt gönderildi', 'success')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Destek Talepleri</h1>
        <p className="mt-1 text-sm text-cream-800/60">{counts.open} bekleyen · {counts['in-progress']} işlemde · {counts.closed} çözüldü</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setTab(g.id)}
            className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
              tab === g.id ? 'border-brand-300 bg-white shadow-sm ring-2 ring-brand-100' : 'border-cream-200 bg-white hover:border-cream-300'
            }`}
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${g.accent}`}>
              <g.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-2xl font-bold text-cream-900">{counts[g.id]}</p>
              <p className="text-xs font-medium text-cream-800/60">{g.label}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {[...GROUPS, { id: 'all', label: 'Tümü' }].map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setTab(g.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${tab === g.id ? 'bg-brand-500 text-white' : 'bg-cream-100 text-cream-800'}`}
            >
              {g.label}{g.id !== 'all' ? ` (${counts[g.id]})` : ''}
            </button>
          ))}
        </div>
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
          <input
            type="text"
            placeholder="Konu veya üye ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-cream-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-300"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Bu grupta talep yok"
          description="Seçtiğiniz duruma uygun destek talebi bulunmuyor."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((t) => {
            const meta = statusMeta(t.status)
            const prio = PRIORITY[t.priority] || PRIORITY.normal
            const msgCount = t.messages?.length || 1
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveId(t.id)}
                className="flex flex-col rounded-2xl border border-cream-200 bg-white p-5 text-left shadow-sm transition hover:border-brand-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.accent}`}>{meta.label}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${prio.style}`}>{prio.label}</span>
                </div>
                <p className="mt-3 font-semibold text-cream-900">{t.subject}</p>
                <p className="mt-1 text-sm text-cream-800/60">{t.memberName} · {t.memberEmail}</p>
                <p className="mt-2 line-clamp-2 text-sm text-cream-800/70">{t.message}</p>
                <div className="mt-3 flex items-center justify-between border-t border-cream-100 pt-3 text-xs text-cream-800/50">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> {msgCount} mesaj · {t.category}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-brand-600">Detay <ChevronRight className="h-3.5 w-3.5" /></span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Modal open={!!activeTicket} onClose={() => setActiveId(null)} title={activeTicket?.subject} size="lg">
        {activeTicket && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-cream-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-cream-900">{activeTicket.memberName}</p>
                <p className="text-xs text-cream-800/50">{activeTicket.memberEmail} · {activeTicket.category}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusMeta(activeTicket.status).accent}`}>
                {statusMeta(activeTicket.status).label}
              </span>
            </div>

            {activeTicket.priority === 'high' && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                <AlertCircle className="h-4 w-4" /> Yüksek öncelikli talep
              </div>
            )}

            <TicketThread ticket={activeTicket} perspective="admin" memberName={activeTicket.memberName} onReply={handleReply} live />

            <div className="flex flex-wrap gap-2 border-t border-cream-100 pt-4">
              {activeTicket.status !== 'in-progress' && activeTicket.status !== 'closed' && (
                <button type="button" onClick={() => handleStatus(activeTicket.id, 'in-progress')} className="flex items-center gap-1.5 rounded-xl bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-200">
                  <Loader className="h-4 w-4" /> İşleme Al
                </button>
              )}
              {activeTicket.status !== 'closed' ? (
                <button type="button" onClick={() => handleStatus(activeTicket.id, 'closed')} className="flex items-center gap-1.5 rounded-xl bg-sage-100 px-3 py-2 text-sm font-medium text-sage-700 hover:bg-sage-200">
                  <CheckCircle2 className="h-4 w-4" /> Çözüldü Olarak İşaretle
                </button>
              ) : (
                <button type="button" onClick={() => handleStatus(activeTicket.id, 'open')} className="flex items-center gap-1.5 rounded-xl bg-brand-100 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-200">
                  <Clock className="h-4 w-4" /> Yeniden Aç
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

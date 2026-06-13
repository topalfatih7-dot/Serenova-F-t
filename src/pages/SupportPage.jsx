import { useState } from 'react'
import FAQAccordion from '../components/landing/FAQAccordion'
import SupportForm from '../components/support/SupportForm'
import TicketThread from '../components/support/TicketThread'
import Modal from '../components/ui/Modal'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { Snowflake, XCircle, AlertTriangle, MessageSquare, ChevronRight, Play, RefreshCw, Clock } from 'lucide-react'

const TICKET_STATUS = {
  open: { label: 'Bekliyor', style: 'bg-brand-50 text-brand-700' },
  'in-progress': { label: 'İşleme Alındı', style: 'bg-amber-50 text-amber-700' },
  closed: { label: 'Çözüldü', style: 'bg-sage-50 text-sage-700' },
}

const REQUEST_META = {
  freeze: { label: 'Tatil Dondurma' },
  cancel: { label: 'Üyelik İptali' },
  resume: { label: 'Yeniden Başlatma' },
  renew: { label: 'Üyelik Yenileme' },
}
const REQUEST_STATUS = {
  pending: { label: 'Onay Bekliyor', style: 'bg-amber-50 text-amber-700' },
  approved: { label: 'Onaylandı', style: 'bg-sage-50 text-sage-700' },
  rejected: { label: 'Reddedildi', style: 'bg-red-50 text-red-600' },
}

const ACTIONS_BY_STATUS = {
  active: [
    { id: 'freeze', icon: Snowflake, label: 'Tatil Dondurma', desc: 'Üyeliğinizi geçici olarak dondurma talebi gönderin' },
    { id: 'cancel', icon: XCircle, label: 'İptal Talebi', desc: 'Üyelik iptali için talep oluşturun' },
  ],
  paused: [
    { id: 'resume', icon: Play, label: 'Yeniden Başlat', desc: 'Dondurulan üyeliğinizi yeniden aktifleştirme talebi' },
    { id: 'cancel', icon: XCircle, label: 'İptal Talebi', desc: 'Üyelik iptali için talep oluşturun' },
  ],
  cancelled: [
    { id: 'renew', icon: RefreshCw, label: 'Üyeliği Yenile', desc: 'Üyeliğinizi yeniden başlatma talebi gönderin' },
  ],
}

export default function SupportPage() {
  const { createMembershipRequest, createTicket, isAuthenticated, myTickets, myRequests, membershipStatus, sendTicketReply, faqs } = useApp()
  const { toast } = useToast()
  const [modal, setModal] = useState(null)
  const [freezeDate, setFreezeDate] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [busy, setBusy] = useState(false)

  const tickets = myTickets || []
  const requests = myRequests || []
  const activeTicket = tickets.find((t) => t.id === activeId) || null
  const membershipActions = ACTIONS_BY_STATUS[membershipStatus] || ACTIONS_BY_STATUS.active

  const submitRequest = async (type, until = null) => {
    if (!isAuthenticated) { toast('Giriş yapmalısınız', 'warning'); return }
    setBusy(true)
    try {
      const r = await createMembershipRequest(type, until)
      if (r && !r.success) { toast(r.error || 'Talep oluşturulamadı', 'error'); return }
      setModal(null)
      toast('Talebiniz oluşturuldu, admin onayı bekleniyor', 'success')
    } finally {
      setBusy(false)
    }
  }

  const handleTicket = (form) => {
    createTicket(form)
    toast('Destek talebiniz alındı. Admin panelinde görünecek.', 'success')
  }

  const handleReply = (text) => {
    sendTicketReply(activeId, 'member', text)
    toast('Mesajınız gönderildi', 'success')
  }

  const handleQuickAction = (id) => setModal(id)

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Destek Merkezi</h1>
        <p className="mt-2 text-cream-800/60">Talepleriniz admin paneline anında yansır</p>
      </div>

      {tickets.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-cream-900">
            <MessageSquare className="h-5 w-5 text-brand-500" /> Taleplerim
          </h2>
          <div className="space-y-3">
            {tickets.map((t) => {
              const meta = TICKET_STATUS[t.status] || TICKET_STATUS.open
              const last = t.messages?.length ? t.messages[t.messages.length - 1] : null
              const hasReply = (t.messages || []).some((m) => m.from === 'admin')
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-cream-200 bg-white p-4 text-left transition hover:border-brand-200 hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-cream-900">{t.subject}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.style}`}>{meta.label}</span>
                      {hasReply && t.status !== 'closed' && (
                        <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-semibold text-white">Yeni yanıt</span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-cream-800/60">{last ? `${last.from === 'admin' ? 'Destek: ' : ''}${last.text}` : t.message}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-cream-800/30" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {requests.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-cream-900">
            <Clock className="h-5 w-5 text-brand-500" /> Üyelik Taleplerim
          </h2>
          <div className="space-y-2">
            {requests.map((r) => {
              const meta = REQUEST_META[r.type] || { label: r.type }
              const st = REQUEST_STATUS[r.status] || REQUEST_STATUS.pending
              return (
                <div key={r.id} className="flex items-center justify-between rounded-2xl border border-cream-200 bg-white p-4">
                  <div>
                    <p className="font-medium text-cream-900">{meta.label}</p>
                    <p className="text-xs text-cream-800/55">
                      {r.requestedUntil ? `Tarih: ${r.requestedUntil} · ` : ''}{new Date(r.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.style}`}>{st.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 font-semibold text-cream-900">Üyelik İşlemleri</h2>
        <p className="mb-3 text-xs text-cream-800/55">Dondurma, iptal ve yeniden başlatma talepleri admin onayından sonra uygulanır.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {membershipActions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => handleQuickAction(a.id)}
              className="rounded-2xl border border-cream-200 bg-white p-5 text-left transition hover:border-brand-200 hover:shadow-sm"
            >
              <a.icon className="h-6 w-6 text-brand-500" />
              <p className="mt-3 font-medium text-cream-900">{a.label}</p>
              <p className="mt-1 text-xs text-cream-800/60">{a.desc}</p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleQuickAction('technical')}
            className="rounded-2xl border border-cream-200 bg-white p-5 text-left transition hover:border-brand-200 hover:shadow-sm"
          >
            <AlertTriangle className="h-6 w-6 text-brand-500" />
            <p className="mt-3 font-medium text-cream-900">Teknik Sorun</p>
            <p className="mt-1 text-xs text-cream-800/60">Uygulama veya platform hatası bildirin</p>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-cream-200 bg-white p-6">
        <h2 className="font-semibold text-cream-900">Bize Ulaşın</h2>
        <div className="mt-4">
          <SupportForm onSubmit={handleTicket} defaultCategory="Genel soru" />
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-semibold text-cream-900">Sık Sorulan Sorular</h2>
        <FAQAccordion items={faqs} />
      </div>

      <Modal open={modal === 'freeze'} onClose={() => setModal(null)} title="Tatil Dondurma Talebi">
        <p className="text-sm text-cream-800/70">Hangi tarihe kadar dondurmak istediğinizi seçin. Talebiniz admin onayından sonra uygulanır.</p>
        <input type="date" value={freezeDate} onChange={(e) => setFreezeDate(e.target.value)} className="mt-4 w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
        <button
          type="button"
          disabled={busy}
          onClick={() => submitRequest('freeze', freezeDate || null)}
          className="mt-4 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Talep Gönder
        </button>
      </Modal>

      <Modal open={modal === 'cancel'} onClose={() => setModal(null)} title="Üyelik İptal Talebi">
        <p className="text-sm text-cream-800/70">İptal talebiniz admin onayına gönderilecektir. Onaylandığında üyeliğiniz iptal edilir.</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => submitRequest('cancel')}
          className="mt-4 w-full rounded-xl bg-red-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          İptal Talebi Gönder
        </button>
      </Modal>

      <Modal open={modal === 'resume'} onClose={() => setModal(null)} title="Yeniden Başlatma Talebi">
        <p className="text-sm text-cream-800/70">Dondurulan üyeliğinizi yeniden aktifleştirme talebiniz admin onayına gönderilir.</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => submitRequest('resume')}
          className="mt-4 w-full rounded-xl bg-sage-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Talep Gönder
        </button>
      </Modal>

      <Modal open={modal === 'renew'} onClose={() => setModal(null)} title="Üyelik Yenileme Talebi">
        <p className="text-sm text-cream-800/70">Üyeliğinizi yeniden başlatma talebiniz admin onayına gönderilir.</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => submitRequest('renew')}
          className="mt-4 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Talep Gönder
        </button>
      </Modal>

      <Modal open={modal === 'technical'} onClose={() => setModal(null)} title="Teknik Sorun Bildir">
        <SupportForm
          defaultCategory="Teknik sorun"
          onSubmit={(form) => { handleTicket(form); setModal(null) }}
        />
      </Modal>

      <Modal open={!!activeTicket} onClose={() => setActiveId(null)} title={activeTicket?.subject} size="lg">
        {activeTicket && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-cream-50 px-4 py-3">
              <p className="text-xs text-cream-800/60">{activeTicket.category}</p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${(TICKET_STATUS[activeTicket.status] || TICKET_STATUS.open).style}`}>
                {(TICKET_STATUS[activeTicket.status] || TICKET_STATUS.open).label}
              </span>
            </div>
            <TicketThread
              ticket={activeTicket}
              perspective="member"
              onReply={handleReply}
              disabled={activeTicket.status === 'closed'}
            />
            {activeTicket.status === 'closed' && (
              <p className="text-center text-xs text-cream-800/50">Bu talep çözüldü olarak kapatıldı.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

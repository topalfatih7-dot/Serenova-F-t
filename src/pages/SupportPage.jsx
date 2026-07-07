import { useState } from 'react'
import FAQAccordion from '../components/landing/FAQAccordion'
import SupportForm from '../components/support/SupportForm'
import TicketThread from '../components/support/TicketThread'
import Modal from '../components/ui/Modal'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { PANEL_IMAGES } from '../utils/panelImages'
import { AlertTriangle, MessageSquare, ChevronRight } from 'lucide-react'

const TICKET_STATUS = {
  open: { label: 'Bekliyor', style: 'bg-brand-50 text-brand-700' },
  'in-progress': { label: 'İşleme Alındı', style: 'bg-amber-50 text-amber-700' },
  closed: { label: 'Çözüldü', style: 'bg-sage-50 text-sage-700' },
}


export default function SupportPage() {
  const { createTicket, myTickets, sendTicketReply, faqs } = useApp()
  const { toast } = useToast()
  const [modal, setModal] = useState(null)
  const [activeId, setActiveId] = useState(null)

  const tickets = myTickets || []
  const activeTicket = tickets.find((t) => t.id === activeId) || null

  const handleTicket = (form) => {
    createTicket(form)
    toast('Destek talebiniz alındı. Admin panelinde görünecek.', 'success')
  }

  const handleReply = (text) => {
    sendTicketReply(activeId, 'member', text)
    toast('Mesajınız gönderildi', 'success')
  }

  return (
    <PanelPageShell className="space-y-10">
      <PanelPageHeader
        title="Destek Merkezi"
        subtitle="Talepleriniz anlık olarak destek ekibine iletilir"
        icon={MessageSquare}
        accent="violet"
        image={PANEL_IMAGES.support}
      />

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

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setModal('technical')}
          className="rounded-2xl border border-cream-200 bg-white p-5 text-left transition hover:border-brand-200 hover:shadow-sm"
        >
          <AlertTriangle className="h-6 w-6 text-brand-500" />
          <p className="mt-3 font-medium text-cream-900">Teknik Sorun</p>
          <p className="mt-1 text-xs text-cream-800/60">Uygulama veya platform hatası bildirin</p>
        </button>
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
              live
            />
            {activeTicket.status === 'closed' && (
              <p className="text-center text-xs text-cream-800/50">Bu talep çözüldü olarak kapatıldı.</p>
            )}
          </div>
        )}
      </Modal>
    </PanelPageShell>
  )
}

import { useState } from 'react'
import FAQAccordion from '../components/landing/FAQAccordion'
import SupportForm from '../components/support/SupportForm'
import TicketThread from '../components/support/TicketThread'
import Modal from '../components/ui/Modal'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { PANEL_IMAGES } from '../utils/panelImages'
import {
  AlertTriangle, MessageSquare, ChevronRight, HeartPulse,
  CreditCard, HelpCircle, Sparkles, Headphones,
} from 'lucide-react'

const TICKET_STATUS = {
  open: { label: 'Bekliyor', style: 'bg-violet-100 text-violet-800 ring-1 ring-violet-200' },
  'in-progress': { label: 'İşleme Alındı', style: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200' },
  closed: { label: 'Çözüldü', style: 'bg-sage-100 text-sage-800 ring-1 ring-sage-200' },
}

const QUICK_ACTIONS = [
  {
    id: 'technical',
    category: 'Teknik sorun',
    title: 'Teknik Sorun',
    desc: 'Uygulama veya platform hatası bildirin',
    icon: AlertTriangle,
    accent: 'from-rose-500 to-orange-500',
    card: 'from-rose-50 via-white to-orange-50/50 border-rose-200/70 hover:border-rose-300 hover:shadow-rose-100/60',
    iconWrap: 'shadow-rose-500/25',
  },
  {
    id: 'payment',
    category: 'Ödeme',
    title: 'Ödeme & Paket',
    desc: 'Fatura, ödeme veya paket sorularınız',
    icon: CreditCard,
    accent: 'from-amber-500 to-warm-500',
    card: 'from-amber-50 via-white to-orange-50/40 border-amber-200/70 hover:border-amber-300 hover:shadow-amber-100/60',
    iconWrap: 'shadow-amber-500/25',
  },
  {
    id: 'health',
    category: 'Sağlık bildirimi',
    title: 'Sağlık Bildirimi',
    desc: 'Sağlık testi veya programla ilgili bildirim',
    icon: HeartPulse,
    accent: 'from-teal-500 to-sage-500',
    card: 'from-teal-50 via-white to-sage-50/50 border-teal-200/70 hover:border-teal-300 hover:shadow-teal-100/60',
    iconWrap: 'shadow-teal-500/25',
  },
  {
    id: 'general',
    category: 'Genel soru',
    title: 'Genel Soru',
    desc: 'Diğer tüm soru ve talepleriniz için',
    icon: HelpCircle,
    accent: 'from-violet-500 to-brand-500',
    card: 'from-violet-50 via-white to-brand-50/40 border-violet-200/70 hover:border-violet-300 hover:shadow-violet-100/60',
    iconWrap: 'shadow-violet-500/25',
  },
]

export default function SupportPage() {
  const { createTicket, myTickets, sendTicketReply, faqs } = useApp()
  const { toast } = useToast()
  const [modal, setModal] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [formCategory, setFormCategory] = useState('Genel soru')

  const tickets = myTickets || []
  const activeTicket = tickets.find((t) => t.id === activeId) || null
  const modalAction = QUICK_ACTIONS.find((a) => a.id === modal)

  const handleTicket = (form) => {
    createTicket(form)
    toast('Destek talebiniz alındı. Admin panelinde görünecek.', 'success')
  }

  const handleReply = async (text) => {
    const result = await sendTicketReply(activeId, 'member', text)
    if (result?.success === false) {
      toast(result.error || 'Mesaj gönderilemedi', 'error')
      return
    }
    toast('Mesajınız gönderildi', 'success')
  }

  const openQuick = (action) => {
    setFormCategory(action.category)
    setModal(action.id)
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
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-cream-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-brand-500 text-white shadow-md">
              <MessageSquare className="h-4 w-4" />
            </span>
            Taleplerim
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
                  className="group flex w-full items-center gap-4 rounded-2xl border border-violet-100/80 bg-gradient-to-r from-white to-violet-50/40 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-cream-900">{t.subject}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.style}`}>{meta.label}</span>
                      {hasReply && t.status !== 'closed' && (
                        <span className="rounded-full bg-gradient-to-r from-violet-500 to-brand-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          Yeni yanıt
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-cream-800/60">
                      {last ? `${last.from === 'admin' ? 'Destek: ' : ''}${last.text}` : t.message}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-violet-300 transition group-hover:translate-x-0.5 group-hover:text-violet-500" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <h2 className="font-display text-lg font-bold text-cream-900">Hızlı talep</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => openQuick(action)}
                className={`group relative overflow-hidden rounded-3xl border-2 bg-gradient-to-br p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${action.card}`}
              >
                <div
                  aria-hidden
                  className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/50 blur-2xl transition group-hover:scale-125"
                />
                <span
                  className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${action.accent} text-white shadow-lg ${action.iconWrap} transition group-hover:scale-110`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <p className="relative mt-4 font-display text-base font-bold text-cream-900">{action.title}</p>
                <p className="relative mt-1 text-sm leading-relaxed text-cream-800/60">{action.desc}</p>
                <span className="relative mt-3 inline-flex items-center gap-1 text-xs font-bold text-cream-800/45 transition group-hover:gap-1.5 group-hover:text-cream-900">
                  Formu aç <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border-2 border-violet-200/60 bg-gradient-to-br from-violet-50/80 via-white to-brand-50/40 shadow-md shadow-violet-100/40">
        <div aria-hidden className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-violet-300/25 blur-3xl" />
        <div aria-hidden className="absolute -right-10 bottom-0 h-36 w-36 rounded-full bg-brand-300/20 blur-3xl" />
        <div className="relative border-b border-violet-100/80 bg-gradient-to-r from-violet-500 via-brand-500 to-sage-500 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
              <Headphones className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-white">Bize Ulaşın</h2>
              <p className="text-xs font-medium text-white/80 sm:text-sm">
                Formu doldurun — ekibimiz talebinizi takip eder
              </p>
            </div>
          </div>
        </div>
        <div className="relative p-5 sm:p-6">
          <SupportForm
            key={formCategory}
            onSubmit={handleTicket}
            defaultCategory={formCategory}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg font-bold text-cream-900">Sık Sorulan Sorular</h2>
        <FAQAccordion items={faqs} />
      </div>

      <Modal
        open={!!modalAction}
        onClose={() => setModal(null)}
        title={modalAction?.title || 'Destek Talebi'}
        size="md"
      >
        {modalAction && (
          <SupportForm
            key={`modal-${modalAction.id}`}
            defaultCategory={modalAction.category}
            onSubmit={(form) => {
              handleTicket(form)
              setModal(null)
            }}
          />
        )}
      </Modal>

      <Modal open={!!activeTicket} onClose={() => setActiveId(null)} title={activeTicket?.subject} size="lg">
        {activeTicket && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/80 to-white px-4 py-3">
              <p className="text-xs font-semibold text-violet-800/70">{activeTicket.category}</p>
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

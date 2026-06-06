import { useState } from 'react'
import FAQAccordion from '../components/landing/FAQAccordion'
import SupportForm from '../components/support/SupportForm'
import Modal from '../components/ui/Modal'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { mockFAQs } from '../data/mockData'
import { Snowflake, XCircle, AlertTriangle } from 'lucide-react'

const quickActions = [
  { id: 'freeze', icon: Snowflake, label: 'Tatil Dondurma', desc: 'Üyeliğinizi geçici olarak duraklatın', category: 'Tatil dondurma' },
  { id: 'cancel', icon: XCircle, label: 'İptal Talebi', desc: 'Üyelik iptali ve iade bilgisi', category: 'Üyelik / iptal' },
  { id: 'technical', icon: AlertTriangle, label: 'Teknik Sorun', desc: 'Uygulama veya platform hatası', category: 'Teknik sorun' },
]

export default function SupportPage() {
  const { pauseMembership, cancelMembership, createTicket, isAuthenticated } = useApp()
  const { toast } = useToast()
  const [modal, setModal] = useState(null)
  const [freezeDate, setFreezeDate] = useState('')

  const handleTicket = (form) => {
    createTicket(form)
    toast('Destek talebiniz alındı. Admin panelinde görünecek.', 'success')
  }

  const handleQuickAction = (id) => {
    if (id === 'freeze') setModal('freeze')
    else if (id === 'cancel') setModal('cancel')
    else setModal('technical')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Destek Merkezi</h1>
        <p className="mt-2 text-cream-800/60">Talepleriniz admin paneline anında yansır</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {quickActions.map((a) => (
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
      </div>

      <div className="rounded-2xl border border-cream-200 bg-white p-6">
        <h2 className="font-semibold text-cream-900">Bize Ulaşın</h2>
        <div className="mt-4">
          <SupportForm onSubmit={handleTicket} defaultCategory="Genel soru" />
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-semibold text-cream-900">Sık Sorulan Sorular</h2>
        <FAQAccordion items={mockFAQs} />
      </div>

      <Modal open={modal === 'freeze'} onClose={() => setModal(null)} title="Tatil Dondurma Talebi">
        <p className="text-sm text-cream-800/70">Üyeliğiniz geçici olarak dondurulacaktır.</p>
        <input type="date" value={freezeDate} onChange={(e) => setFreezeDate(e.target.value)} className="mt-4 w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) { toast('Giriş yapmalısınız', 'warning'); return }
            pauseMembership(freezeDate || '2026-08-01')
            setModal(null)
            toast('Dondurma talebi oluşturuldu', 'success')
          }}
          className="mt-4 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white"
        >
          Talep Gönder
        </button>
      </Modal>

      <Modal open={modal === 'cancel'} onClose={() => setModal(null)} title="Üyelik İptali">
        <p className="text-sm text-cream-800/70">İlk 7 gün içinde koşulsuz iade hakkınız vardır.</p>
        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) { toast('Giriş yapmalısınız', 'warning'); return }
            cancelMembership()
            setModal(null)
            toast('İptal talebi admin paneline iletildi', 'info')
          }}
          className="mt-4 w-full rounded-xl bg-red-500 py-3 text-sm font-semibold text-white"
        >
          İptali Onayla
        </button>
      </Modal>

      <Modal open={modal === 'technical'} onClose={() => setModal(null)} title="Teknik Sorun Bildir">
        <SupportForm
          defaultCategory="Teknik sorun"
          onSubmit={(form) => { handleTicket(form); setModal(null) }}
        />
      </Modal>
    </div>
  )
}

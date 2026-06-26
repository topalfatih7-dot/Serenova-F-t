import { Shield } from 'lucide-react'
import Modal from '../ui/Modal'
import { CHAT_CONSENT_TEXT } from '../../utils/chatAccess'

export default function ChatConsentModal({ open, onAccept, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Mesajlaşma Bilgilendirmesi">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/60 p-4">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="whitespace-pre-line text-sm leading-relaxed text-amber-950/85">{CHAT_CONSENT_TEXT}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-wellness-outline flex-1 sm:flex-none">
            Vazgeç
          </button>
          <button type="button" onClick={onAccept} className="btn-wellness flex-1 sm:flex-none">
            Okudum, mesajlaşmaya başla
          </button>
        </div>
      </div>
    </Modal>
  )
}

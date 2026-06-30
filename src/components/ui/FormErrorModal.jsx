import { AlertCircle } from 'lucide-react'
import Modal from './Modal'

/** Form doğrulama / kayıt hataları — kapatınca form verisi silinmez. */
export default function FormErrorModal({
  open,
  message,
  onClose,
  title = 'Bir şeyi kontrol edin',
  footer = null,
  hint = 'Girdiğiniz bilgiler duruyor — hatayı düzeltip tekrar deneyebilirsiniz.',
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <p className="mt-4 text-base leading-relaxed text-cream-800">{message}</p>
        {hint ? (
          <p className="mt-2 text-sm text-cream-800/55">{hint}</p>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-105"
        >
          Tamam, anladım
        </button>
        {footer}
      </div>
    </Modal>
  )
}

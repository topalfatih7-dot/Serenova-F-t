import { Check, Loader2 } from 'lucide-react'
import DisclaimerBox from '../ui/DisclaimerBox'

const ACK_ITEMS = [
  {
    key: 'healthAck',
    text: 'Sağlık durumumu doğru bildirdim ve gerekli durumlarda doktoruma danıştım.',
  },
  {
    key: 'disclaimer',
    text: 'Bu hizmetin tıbbi teşhis veya tedavi olmadığını kabul ediyorum.',
  },
]

/**
 * Sağlık testi onayları — testlere başlamadan önce alınır.
 */
export default function HealthTestConsentForm({
  healthAck,
  disclaimer,
  onHealthAckChange,
  onDisclaimerChange,
  onSubmit,
  submitting = false,
  showErrors = false,
  title = 'Başlamadan önce',
  subtitle = 'Güvenliğiniz için lütfen aşağıdaki onayları işaretleyin. Onaylardan sonra testlere geçebilirsiniz.',
  submitLabel = 'Onayla ve başla',
}) {
  const setters = {
    healthAck: onHealthAckChange,
    disclaimer: onDisclaimerChange,
  }
  const values = { healthAck, disclaimer }

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-3xl border border-cream-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="font-display text-xl font-bold text-cream-900">{title}</h2>
        <p className="mt-1 text-sm text-cream-800/65">{subtitle}</p>
      </div>
      <DisclaimerBox variant="prominent" />
      {ACK_ITEMS.map((item) => {
        const checked = Boolean(values[item.key])
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => setters[item.key](!checked)}
            className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
              checked ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-200' : 'border-cream-200 bg-white'
            }`}
          >
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
              checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-cream-300'
            }`}>
              {checked && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span className="text-sm leading-snug text-cream-800/80">{item.text}</span>
          </button>
        )
      })}
      {showErrors && (!healthAck || !disclaimer) && (
        <p className="text-xs font-medium text-red-600">Lütfen tüm onayları işaretleyin.</p>
      )}
      {onSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? 'Kaydediliyor…' : submitLabel}
        </button>
      )}
    </div>
  )
}

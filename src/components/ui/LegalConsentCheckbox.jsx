import { Link } from 'react-router-dom'
import { CheckSquare2, Square } from 'lucide-react'

const DEFAULT_ERROR = 'Devam etmek için koşulları kabul etmelisiniz.'

export default function LegalConsentCheckbox({ accepted, onChange, error, errorMessage = DEFAULT_ERROR, className = '' }) {
  const hasError = Boolean(error)

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => onChange(!accepted)}
        className={`flex w-full min-h-[4.5rem] min-w-0 items-start gap-3 rounded-2xl border p-3.5 text-left transition sm:min-h-[5.25rem] sm:gap-4 sm:p-5 ${
          hasError
            ? 'border-red-300 bg-red-50/50'
            : accepted
              ? 'border-brand-200 bg-brand-50/40'
              : 'border-cream-200 bg-cream-50/40 hover:border-brand-200'
        }`}
        aria-pressed={accepted}
      >
        <span className="mt-0.5 shrink-0 text-brand-500">
          {accepted
            ? <CheckSquare2 className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.25} />
            : <Square className="h-7 w-7 text-cream-400 sm:h-8 sm:w-8" strokeWidth={2.25} />}
        </span>
        <span className="min-w-0 text-sm leading-relaxed text-cream-800/85 sm:text-base">
          <Link to="/legal/uyelik-ve-abonelik-sozlesmesi" className="font-semibold text-brand-600 hover:underline" onClick={(ev) => ev.stopPropagation()}>
            Üyelik ve Abonelik Sözleşmesi
          </Link>
          {' '}ve{' '}
          <Link to="/legal/kvkk" className="font-semibold text-brand-600 hover:underline" onClick={(ev) => ev.stopPropagation()}>
            KVKK Aydınlatma Metni
          </Link>
          {' '}kapsamında kişisel verilerimin işlenmesini kabul ediyorum.
        </span>
      </button>
      {hasError && (
        <p className="mt-2.5 text-base font-medium text-red-500">{typeof error === 'string' ? error : errorMessage}</p>
      )}
    </div>
  )
}

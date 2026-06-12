import { AlertCircle, Heart } from 'lucide-react'

export default function DisclaimerBox({ variant = 'default', compact = false }) {
  const items = [
    'Bu program tıbbi teşhis veya tedavi niteliği taşımaz.',
    'Sağlık sorunlarınız için doktorunuza danışın.',
    'Beslenme önerileri genel rehberlik amaçlıdır.',
  ]

  if (compact) {
    return (
      <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Koçluk ve wellness hizmetidir; tıbbi tedavi değildir.
      </p>
    )
  }

  return (
    <div className={`rounded-2xl border ${variant === 'prominent' ? 'border-amber-200 bg-amber-50' : 'border-cream-200 bg-cream-100/50'} p-5`}>
      <div className="flex items-center gap-2">
        {variant === 'prominent' ? (
          <AlertCircle className="h-5 w-5 text-amber-600" />
        ) : (
          <Heart className="h-5 w-5 text-brand-500" />
        )}
        <h4 className="font-semibold text-cream-900">Önemli Bilgilendirme</h4>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-cream-800/80">
            <span className="text-brand-400">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

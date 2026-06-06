import { useState } from 'react'
import { CreditCard, Info } from 'lucide-react'
import { TEST_CARD, validateTestPayment } from '../../config/testPayment'

export default function PaymentForm({ amount, onSubmit, onCancel, loading = false }) {
  const [card, setCard] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [holder, setHolder] = useState('')
  const [errors, setErrors] = useState({})

  const fillTestCard = () => {
    setCard(TEST_CARD.numberFormatted)
    setExpiry(TEST_CARD.expiry)
    setCvv(TEST_CARD.cvv)
    setHolder(TEST_CARD.holder)
    setErrors({})
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = validateTestPayment({ cardNumber: card, expiry, cvv })
    if (!result.valid) {
      setErrors(result.errors)
      return
    }
    if (!holder.trim()) {
      setErrors({ holder: 'Kart sahibi adı gerekli' })
      return
    }
    onSubmit?.({ cardNumber: card, expiry, cvv, holder })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {amount != null && (
        <div className="rounded-xl bg-brand-50 p-4 text-center">
          <p className="text-sm text-cream-800/60">Ödenecek tutar</p>
          <p className="font-display text-2xl font-bold text-brand-600">{amount.toLocaleString('tr-TR')}₺</p>
        </div>
      )}

      <button
        type="button"
        onClick={fillTestCard}
        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 px-4 py-3 text-left text-sm text-brand-700 hover:bg-brand-50"
      >
        <CreditCard className="h-4 w-4 shrink-0" />
        <span>Test kartını otomatik doldur</span>
      </button>

      <div className="rounded-xl bg-cream-50 p-3">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-cream-800/40" />
          <div className="text-xs text-cream-800/60">
            <p><strong>Kart:</strong> {TEST_CARD.numberFormatted}</p>
            <p><strong>Son kullanma:</strong> {TEST_CARD.expiry} · <strong>CVV:</strong> {TEST_CARD.cvv}</p>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Kart Numarası</label>
        <input
          value={card}
          onChange={(e) => setCard(e.target.value)}
          placeholder="4242 4242 4242 4242"
          className={`w-full rounded-xl border px-4 py-3 text-sm ${errors.cardNumber ? 'border-red-300' : 'border-cream-200'}`}
        />
        {errors.cardNumber && <p className="mt-1 text-xs text-red-500">{errors.cardNumber}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Son Kullanma</label>
          <input
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            placeholder="AA/YY"
            className={`w-full rounded-xl border px-4 py-3 text-sm ${errors.expiry ? 'border-red-300' : 'border-cream-200'}`}
          />
          {errors.expiry && <p className="mt-1 text-xs text-red-500">{errors.expiry}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">CVV</label>
          <input
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
            placeholder="123"
            className={`w-full rounded-xl border px-4 py-3 text-sm ${errors.cvv ? 'border-red-300' : 'border-cream-200'}`}
          />
          {errors.cvv && <p className="mt-1 text-xs text-red-500">{errors.cvv}</p>}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Kart Sahibi</label>
        <input
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
          placeholder="Ad Soyad"
          className={`w-full rounded-xl border px-4 py-3 text-sm ${errors.holder ? 'border-red-300' : 'border-cream-200'}`}
        />
        {errors.holder && <p className="mt-1 text-xs text-red-500">{errors.holder}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-cream-200 py-3 text-sm font-medium">
            İptal
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? 'İşleniyor...' : 'Ödemeyi Tamamla'}
        </button>
      </div>
    </form>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wifi, Lock, ShieldCheck, Loader2, Sparkles } from 'lucide-react'
import { TEST_CARD, validateTestPayment } from '../../config/testPayment'

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function detectBrand(number) {
  const n = number.replace(/\D/g, '')
  if (/^4/.test(n)) return 'VISA'
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'AMEX'
  if (/^9792/.test(n) || /^65/.test(n)) return 'Troy'
  return ''
}

export default function PaymentForm({ amount, onSubmit, onCancel, loading = false, submitLabel, loadingLabel }) {
  const [card, setCard] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [holder, setHolder] = useState('')
  const [flipped, setFlipped] = useState(false)
  const [errors, setErrors] = useState({})

  const brand = detectBrand(card)

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
    if (!result.valid) { setErrors(result.errors); return }
    if (!holder.trim()) { setErrors({ holder: 'Kart sahibi adı gerekli' }); return }
    onSubmit?.({ cardNumber: card, expiry, cvv, holder })
  }

  const rawDigits = card.replace(/\D/g, '').padEnd(16, '•')
  const displayNumber = rawDigits.match(/.{1,4}/g) || []

  const inputBase = 'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-cream-900 outline-none transition focus:ring-2 focus:ring-brand-100'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Animasyonlu kredi kartı */}
      <div className="card-flip-scene mx-auto aspect-[1.586/1] w-full max-w-[360px]">
        <div className={`card-flip-inner ${flipped ? 'is-flipped' : ''}`}>
          {/* ÖN YÜZ */}
          <div className="card-flip-face rounded-2xl shadow-xl shadow-brand-900/25">
            <div className="relative h-full w-full bg-gradient-to-br from-brand-600 via-brand-500 to-sage-500 p-5 text-white">
              <div className="card-sheen pointer-events-none absolute inset-0" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-11 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 shadow-inner" />
                    <Wifi className="h-5 w-5 rotate-90 opacity-80" />
                  </div>
                  <span className="font-display text-lg font-bold italic tracking-wide drop-shadow">
                    {brand || 'KART'}
                  </span>
                </div>

                <div className="flex justify-between gap-1 font-mono text-base font-semibold tracking-[0.12em] drop-shadow-sm sm:text-lg">
                  {displayNumber.map((group, i) => (
                    <span key={i} className="tabular-nums">{group}</span>
                  ))}
                </div>

                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[8px] uppercase tracking-widest opacity-70">Kart Sahibi</p>
                    <p className="truncate text-sm font-medium uppercase tracking-wide">{holder || 'AD SOYAD'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] uppercase tracking-widest opacity-70">Son Kul.</p>
                    <p className="font-mono text-sm font-medium">{expiry || 'AA/YY'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ARKA YÜZ */}
          <div className="card-flip-face card-flip-back rounded-2xl shadow-xl shadow-brand-900/25">
            <div className="relative h-full w-full bg-gradient-to-br from-brand-700 via-brand-600 to-sage-600 text-white">
              <div className="card-sheen pointer-events-none absolute inset-0" />
              <div className="mt-5 h-10 w-full bg-cream-900/80" />
              <div className="relative mt-5 px-5">
                <p className="mb-1 text-[8px] uppercase tracking-widest opacity-70">CVV</p>
                <div className="flex h-9 items-center justify-end rounded-md bg-white px-3 font-mono text-sm font-semibold tracking-widest text-cream-900">
                  {cvv ? cvv.replace(/./g, '*') : '•••'}
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[10px] opacity-80">
                  <Lock className="h-3 w-3" /> Güvenli ödeme · bilgileriniz şifrelenir
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {amount != null && (
        <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
          <span className="text-sm text-cream-800/60">Ödenecek tutar</span>
          <span className="font-display text-2xl font-bold text-brand-600">{amount.toLocaleString('tr-TR')}₺</span>
        </div>
      )}

      <button
        type="button"
        onClick={fillTestCard}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 px-4 py-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-50"
      >
        <Sparkles className="h-4 w-4 shrink-0" />
        Test kartını otomatik doldur
      </button>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800">Kart Numarası</label>
          <input
            inputMode="numeric"
            value={card}
            onFocus={() => setFlipped(false)}
            onChange={(e) => setCard(formatCardNumber(e.target.value))}
            placeholder="4242 4242 4242 4242"
            className={`${inputBase} font-mono tracking-wider ${errors.cardNumber ? 'border-red-300' : 'border-cream-300 focus:border-brand-500'}`}
          />
          {errors.cardNumber && <p className="mt-1 text-xs text-red-500">{errors.cardNumber}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800">Kart Sahibi</label>
          <input
            value={holder}
            onFocus={() => setFlipped(false)}
            onChange={(e) => setHolder(e.target.value)}
            placeholder="Ad Soyad"
            className={`${inputBase} uppercase ${errors.holder ? 'border-red-300' : 'border-cream-300 focus:border-brand-500'}`}
          />
          {errors.holder && <p className="mt-1 text-xs text-red-500">{errors.holder}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800">Son Kullanma</label>
            <input
              inputMode="numeric"
              value={expiry}
              onFocus={() => setFlipped(false)}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="AA/YY"
              className={`${inputBase} font-mono ${errors.expiry ? 'border-red-300' : 'border-cream-300 focus:border-brand-500'}`}
            />
            {errors.expiry && <p className="mt-1 text-xs text-red-500">{errors.expiry}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800">CVV</label>
            <input
              inputMode="numeric"
              value={cvv}
              onFocus={() => setFlipped(true)}
              onBlur={() => setFlipped(false)}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="123"
              className={`${inputBase} font-mono ${errors.cvv ? 'border-red-300' : 'border-cream-300 focus:border-brand-500'}`}
            />
            {errors.cvv && <p className="mt-1 text-xs text-red-500">{errors.cvv}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-cream-800/50">
        <ShieldCheck className="h-3.5 w-3.5 text-sage-500" />
        {amount != null
          ? '256-bit SSL ile güvenli ödeme · Test ortamı'
          : '256-bit SSL ile kart bilgileriniz güvenle saklanır · Test ortamı'}
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-cream-300 py-3 text-sm font-medium text-cream-800 hover:bg-cream-50">
            İptal
          </button>
        )}
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-sage-500 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-105 disabled:opacity-60"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> {loadingLabel || 'İşleniyor…'}</>
            : <><Lock className="h-4 w-4" /> {amount != null ? `${amount.toLocaleString('tr-TR')}₺ Öde` : (submitLabel || 'Ödemeyi Tamamla')}</>}
        </motion.button>
      </div>
    </form>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle, Check, Copy, Landmark, Loader2, Lock, Save, ShieldCheck,
} from 'lucide-react'
import { BankMark } from './BankSelect'
import { findBankByCode, unknownBank } from '../../data/turkishBanks'
import { upsertPayoutAccount } from '../../services/staffPayoutAccounts'
import {
  compactIban,
  ibanValidationMessage,
  isPayoutAccountComplete,
  isValidTrIban,
  maskIbanInput,
  trIbanBankCode,
} from '../../utils/iban'
import { useToast } from '../../context/ToastContext'

const inputCls = 'w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

async function copyText(text) {
  await navigator.clipboard.writeText(text)
}

export default function StaffPayoutAccountCard({ staffUser, account, onSaved, className = '' }) {
  const { toast } = useToast()
  const holderName = String(staffUser?.name || '').trim()
  const [saving, setSaving] = useState(false)
  const [iban, setIban] = useState(() => (account?.iban ? maskIbanInput(account.iban) : ''))

  useEffect(() => {
    setIban(account?.iban ? maskIbanInput(account.iban) : '')
  }, [account])

  const compact = compactIban(iban)
  const detectedCode = trIbanBankCode(compact)
  const detectedBank = findBankByCode(detectedCode)

  const ibanError = useMemo(() => {
    if (!compact) return ''
    return ibanValidationMessage(compact)
  }, [compact])

  const canSave = isPayoutAccountComplete({
    accountHolderName: holderName,
    bankCode: detectedCode,
    iban: compact,
  })
  const savedComplete = isPayoutAccountComplete({
    ...(account || {}),
    accountHolderName: holderName || account?.accountHolderName,
  })

  const onIbanChange = (raw) => {
    setIban(maskIbanInput(raw))
  }

  const save = async (e) => {
    e.preventDefault()
    if (holderName.length < 3) {
      toast('Paneldeki adınız eksik. Profilinizdeki isim hesap sahibi olarak kaydedilir.', 'error')
      return
    }
    if (!detectedCode) {
      toast('Geçerli bir IBAN girin; banka otomatik tespit edilir.', 'error')
      return
    }
    const message = ibanValidationMessage(compact)
    if (message) {
      toast(message, 'error')
      return
    }
    setSaving(true)
    try {
      const saved = await upsertPayoutAccount(staffUser.id, {
        accountHolderName: holderName,
        bankCode: detectedCode,
        iban: compact,
        accountType: 'individual',
      })
      toast('Ödeme hesabı kaydedildi.', 'success')
      onSaved?.(saved)
    } catch (err) {
      toast(err?.message || 'Kaydedilemedi.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`flex h-full flex-col overflow-hidden rounded-3xl border border-sage-100/90 bg-gradient-to-br from-sage-50/90 via-white to-white shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-3 border-b border-sage-100/80 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-500 to-emerald-600 text-white shadow-lg ring-4 ring-sage-200/60">
            <Landmark className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-cream-900">Banka ve IBAN</h2>
            <p className="mt-0.5 max-w-prose text-sm text-cream-800/55">
              Hakediş Cuma günü EFT / FAST ile bu hesaba gönderilir. IBAN kadro profilinde görünmez.
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          savedComplete ? 'bg-sage-100 text-sage-800' : 'bg-amber-100 text-amber-900'
        }`}>
          {savedComplete ? <ShieldCheck className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {savedComplete ? 'Ödeme hesabı hazır' : 'Hesap bilgisi eksik'}
        </span>
      </div>

      <form onSubmit={save} className="flex flex-1 justify-center p-5 sm:p-6 lg:p-5 xl:p-6">
        <div className="grid w-full max-w-xl gap-4 lg:max-w-none">
          <div className="rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 to-orange-50/60 px-4 py-3.5 shadow-sm">
            <p className="flex items-start gap-2.5 text-sm leading-relaxed text-amber-950">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              <span>
                <span className="font-semibold">Önemli:</span>{' '}
                Girdiğiniz IBAN, paneldeki adınıza kayıtlı bir bireysel banka hesabına ait olmalıdır.
                Üçüncü kişi veya şirket hesaplarına yapılan ödemeler banka tarafından reddedilebilir;
                hakedişinizin sorunsuz ulaşması için hesap sahibi bilgisini kontrol edin.
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-cream-200 bg-cream-50/80 px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cream-800/50">
              <Lock className="h-3.5 w-3.5" /> Hesap sahibi
            </p>
            <p className="mt-1 font-display text-base font-bold text-cream-900">{holderName || '—'}</p>
          </div>

          <label className="block">
            <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-cream-800/55">
              <span>IBAN <span className="text-brand-500">*</span></span>
              {compact && isValidTrIban(compact) && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await copyText(compact)
                      toast('IBAN kopyalandı.', 'success')
                    } catch {
                      toast('Kopyalanamadı.', 'error')
                    }
                  }}
                  className="inline-flex items-center gap-1 normal-case tracking-normal text-sage-700 hover:text-sage-900"
                >
                  <Copy className="h-3.5 w-3.5" /> Kopyala
                </button>
              )}
            </span>
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              value={iban}
              onChange={(e) => onIbanChange(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData?.getData('text') || ''
                if (!pasted.trim()) return
                e.preventDefault()
                onIbanChange(pasted)
              }}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              aria-invalid={Boolean(ibanError) || undefined}
              className={`${inputCls} font-mono tracking-wide ${ibanError ? 'border-red-300' : compact && isValidTrIban(compact) ? 'border-sage-300' : ''}`}
            />
            {ibanError ? (
              <p className="mt-1.5 text-xs font-medium text-red-600">{ibanError}</p>
            ) : compact && isValidTrIban(compact) ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-sage-700">
                <Check className="h-3.5 w-3.5" />
                Geçerli IBAN
              </p>
            ) : null}
          </label>

          {detectedCode && (
            <div className="flex items-center gap-3 rounded-xl border border-cream-200 bg-white px-4 py-3 shadow-sm">
              <BankMark bank={detectedBank || unknownBank(detectedCode)} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">Tespit edilen banka</p>
                <p className="truncate font-display text-sm font-bold text-cream-900">
                  {detectedBank?.short || `Banka kodu ${detectedCode}`}
                </p>
                {detectedBank && (
                  <p className="truncate text-[11px] text-cream-800/45">EFT {detectedCode} · {detectedBank.name}</p>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !canSave}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sage-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sage-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Kaydediliyor…' : 'Ödeme hesabını kaydet'}
          </button>
        </div>
      </form>
    </motion.section>
  )
}

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

export default function StaffPayoutAccountCard({
  staffUser,
  account,
  onSaved,
  onUpsert,
  className = '',
  description = 'Hakediş Cuma günü EFT / FAST ile bu hesaba gönderilir. IBAN kadro profilinde görünmez.',
}) {
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
      const saveFn = onUpsert || upsertPayoutAccount
      const saved = await saveFn(staffUser.id, {
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
      className={`overflow-hidden rounded-2xl border border-sage-100/90 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-sage-100/70 px-4 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sage-600 text-white">
            <Landmark className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-sm font-bold text-cream-900">Banka ve IBAN</h2>
            <p className="text-[11px] leading-snug text-cream-800/50">{description}</p>
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          savedComplete ? 'bg-sage-100 text-sage-800' : 'bg-amber-100 text-amber-900'
        }`}>
          {savedComplete ? <ShieldCheck className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          {savedComplete ? 'Hazır' : 'Eksik'}
        </span>
      </div>

      <form onSubmit={save} className="space-y-2.5 p-4">
        <div className="flex items-center gap-2.5 rounded-lg border border-cream-200 bg-cream-50/70 px-3 py-2">
          <Lock className="h-3.5 w-3.5 shrink-0 text-cream-800/40" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-cream-800/45">Hesap sahibi</p>
            <p className="truncate text-sm font-semibold text-cream-900">{holderName || '—'}</p>
          </div>
        </div>

        <label className="block">
          <span className="mb-1 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-cream-800/55">
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
                <Copy className="h-3 w-3" /> Kopyala
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
            className={`${inputCls} py-2 font-mono tracking-wide ${ibanError ? 'border-red-300' : compact && isValidTrIban(compact) ? 'border-sage-300' : ''}`}
          />
          {ibanError ? (
            <p className="mt-1 text-xs font-medium text-red-600">{ibanError}</p>
          ) : compact && isValidTrIban(compact) ? (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-sage-700">
              <Check className="h-3.5 w-3.5" />
              Geçerli IBAN
            </p>
          ) : (
            <p className="mt-1 text-[11px] leading-snug text-cream-800/45">
              Adınıza kayıtlı bireysel hesap olmalı; şirket / üçüncü kişi reddedilebilir.
            </p>
          )}
        </label>

        {detectedCode && (
          <div className="flex items-center gap-2.5 rounded-lg border border-cream-200 bg-cream-50/50 px-3 py-2">
            <BankMark bank={detectedBank || unknownBank(detectedCode)} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-cream-900">
                {detectedBank?.short || `Banka kodu ${detectedCode}`}
              </p>
              {detectedBank && (
                <p className="truncate text-[11px] text-cream-800/45">EFT {detectedCode}</p>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !canSave}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sage-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sage-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </form>
    </motion.section>
  )
}

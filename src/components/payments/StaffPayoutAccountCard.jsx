import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle, Check, Copy, Landmark, Loader2, Lock, Save, ShieldCheck,
} from 'lucide-react'
import BankSelect from './BankSelect'
import { findBankByCode } from '../../data/turkishBanks'
import { upsertPayoutAccount } from '../../services/staffPayoutAccounts'
import {
  compactIban,
  ibanValidationMessage,
  isPayoutAccountComplete,
  isTrIbanFormat,
  isValidTrIban,
  maskIbanInput,
  trIbanBankCode,
} from '../../utils/iban'
import { useToast } from '../../context/ToastContext'

const inputCls = 'w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

async function copyText(text) {
  await navigator.clipboard.writeText(text)
}

export default function StaffPayoutAccountCard({ staffUser, account, onSaved }) {
  const { toast } = useToast()
  const holderName = String(staffUser?.name || '').trim()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => ({
    bankCode: account?.bankCode || '',
    iban: account?.iban ? maskIbanInput(account.iban) : '',
  }))

  useEffect(() => {
    setForm({
      bankCode: account?.bankCode || '',
      iban: account?.iban ? maskIbanInput(account.iban) : '',
    })
  }, [account])

  const compact = compactIban(form.iban)
  const detectedCode = trIbanBankCode(compact)
  const detectedBank = findBankByCode(detectedCode)

  const ibanError = useMemo(() => {
    if (!compact) return ''
    return ibanValidationMessage(compact, form.bankCode)
  }, [compact, form.bankCode])

  const canSave = isPayoutAccountComplete({
    accountHolderName: holderName,
    bankCode: form.bankCode,
    iban: compact,
  })
  const savedComplete = isPayoutAccountComplete({
    ...(account || {}),
    accountHolderName: holderName || account?.accountHolderName,
  })

  const onIbanChange = (raw) => {
    const next = maskIbanInput(raw)
    const nextCompact = compactIban(next)
    const bank = findBankByCode(trIbanBankCode(nextCompact))
    setForm((f) => ({
      ...f,
      iban: next,
      bankCode: (isValidTrIban(nextCompact) && bank) ? bank.code : f.bankCode,
    }))
  }

  const save = async (e) => {
    e.preventDefault()
    if (holderName.length < 3) {
      toast('Paneldeki adınız eksik. Profilinizdeki isim hesap sahibi olarak kaydedilir.', 'error')
      return
    }
    if (!form.bankCode) {
      toast('Banka seçin.', 'error')
      return
    }
    const message = ibanValidationMessage(compact, form.bankCode)
    if (message) {
      toast(message, 'error')
      return
    }
    setSaving(true)
    try {
      const saved = await upsertPayoutAccount(staffUser.id, {
        accountHolderName: holderName,
        bankCode: form.bankCode,
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
      className="overflow-hidden rounded-3xl border border-sage-100/90 bg-gradient-to-br from-sage-50/90 via-white to-white shadow-sm"
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

      <form onSubmit={save} className="grid gap-4 p-5 sm:p-6 lg:max-w-2xl">
        <div className="rounded-xl border border-cream-200 bg-cream-50/80 px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cream-800/50">
            <Lock className="h-3.5 w-3.5" /> Hesap sahibi
          </p>
          <p className="mt-1 font-display text-base font-bold text-cream-900">{holderName || '—'}</p>
        </div>

        <BankSelect
          value={form.bankCode}
          error={!form.bankCode && isTrIbanFormat(compact) ? 'Banka seçin veya IBAN’daki kodu kontrol edin.' : ''}
          onChange={(code) => setForm((f) => ({ ...f, bankCode: code }))}
        />

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
            value={form.iban}
            onChange={(e) => onIbanChange(e.target.value)}
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
              {detectedBank ? ` · ${detectedBank.short}` : ''}
              {form.bankCode && detectedCode === form.bankCode ? ' ile eşleşiyor' : ''}
            </p>
          ) : null}
        </label>

        <button
          type="submit"
          disabled={saving || !canSave}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sage-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sage-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Kaydediliyor…' : 'Ödeme hesabını kaydet'}
        </button>
      </form>
    </motion.section>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle, Building2, Check, Copy, Landmark, Loader2, Save, ShieldCheck, User,
} from 'lucide-react'
import BankSelect, { BankMark } from './BankSelect'
import { findBankByCode, unknownBank } from '../../data/turkishBanks'
import { upsertPayoutAccount } from '../../services/staffPayoutAccounts'
import {
  compactIban,
  formatIbanDisplay,
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
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => ({
    accountHolderName: account?.accountHolderName || staffUser?.name || '',
    bankCode: account?.bankCode || '',
    iban: formatIbanDisplay(account?.iban || ''),
    accountType: account?.accountType || 'individual',
  }))

  useEffect(() => {
    setForm({
      accountHolderName: account?.accountHolderName || staffUser?.name || '',
      bankCode: account?.bankCode || '',
      iban: formatIbanDisplay(account?.iban || ''),
      accountType: account?.accountType || 'individual',
    })
  }, [account, staffUser?.name])

  const compact = compactIban(form.iban)
  const detectedCode = trIbanBankCode(compact)
  const detectedBank = findBankByCode(detectedCode)
  const selectedBank = findBankByCode(form.bankCode) || (form.bankCode ? unknownBank(form.bankCode) : null)

  const ibanError = useMemo(() => {
    if (!compact) return ''
    return ibanValidationMessage(compact, form.bankCode)
  }, [compact, form.bankCode])

  const holderError = form.accountHolderName.trim().length > 0 && form.accountHolderName.trim().length < 3
    ? 'Hesap sahibi adı en az 3 karakter olmalı.'
    : ''

  const previewComplete = isPayoutAccountComplete({
    accountHolderName: form.accountHolderName,
    bankCode: form.bankCode,
    iban: compact,
  })

  const onIbanChange = (raw) => {
    const next = maskIbanInput(raw)
    const nextCompact = compactIban(next)
    const code = trIbanBankCode(nextCompact)
    const bank = findBankByCode(code)
    setForm((f) => ({
      ...f,
      iban: next,
      bankCode: (isValidTrIban(nextCompact) && bank) ? bank.code : f.bankCode,
    }))
  }

  const save = async (e) => {
    e.preventDefault()
    const holder = form.accountHolderName.trim()
    if (holder.length < 3) {
      toast('Hesap sahibi adını kimlikte / bankada göründüğü gibi yazın.', 'error')
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
        ...form,
        accountHolderName: holder,
        iban: compact,
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
          account && isPayoutAccountComplete(account)
            ? 'bg-sage-100 text-sage-800'
            : 'bg-amber-100 text-amber-900'
        }`}>
          {account && isPayoutAccountComplete(account) ? <ShieldCheck className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {account && isPayoutAccountComplete(account) ? 'Ödeme hesabı hazır' : 'Hesap bilgisi eksik'}
        </span>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:items-start sm:p-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cream-900 via-sage-900 to-sage-800 p-5 text-white shadow-lg">
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/55">Alıcı hesap</p>
              <p className="mt-1 truncate font-display text-lg font-bold">
                {selectedBank?.short || 'Banka seçilmedi'}
              </p>
            </div>
            {selectedBank ? <BankMark bank={selectedBank} /> : (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Building2 className="h-4 w-4 text-white/70" />
              </span>
            )}
          </div>
          <p className="relative mt-6 font-mono text-sm tracking-wide sm:text-base">
            {compact ? formatIbanDisplay(compact) : 'TR00 0000 0000 0000 0000 0000 00'}
          </p>
          <div className="relative mt-5 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-white/45">Hesap sahibi</p>
              <p className="truncate text-sm font-semibold">{form.accountHolderName.trim() || '—'}</p>
            </div>
            <p className="shrink-0 text-[11px] text-white/50">TRY · {form.accountType === 'business' ? 'Ticari' : 'Bireysel'}</p>
          </div>
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
              className="relative mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium hover:bg-white/15"
            >
              <Copy className="h-3.5 w-3.5" /> IBAN kopyala
            </button>
          )}
        </div>

        <form onSubmit={save} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">
              Hesap sahibi <span className="text-brand-500">*</span>
            </span>
            <span className="relative block">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/35" />
              <input
                type="text"
                autoComplete="name"
                value={form.accountHolderName}
                onChange={(e) => setForm((f) => ({ ...f, accountHolderName: e.target.value }))}
                className={`${inputCls} pl-10 ${holderError ? 'border-red-300' : ''}`}
                placeholder="Bankadaki ad soyad / unvan"
              />
            </span>
            {holderError
              ? <p className="mt-1.5 text-xs font-medium text-red-600">{holderError}</p>
              : <p className="mt-1.5 text-xs text-cream-800/45">IBAN kaydındaki isimle birebir aynı olmalı.</p>}
          </label>

          <BankSelect
            value={form.bankCode}
            error={!form.bankCode && isTrIbanFormat(compact) ? 'Banka seçin veya IBAN’daki kodu kontrol edin.' : ''}
            onChange={(code) => setForm((f) => ({ ...f, bankCode: code }))}
          />

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">
              IBAN <span className="text-brand-500">*</span>
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
            ) : (
              <p className="mt-1.5 text-xs text-cream-800/45">TR ile başlar, 26 karakter. Yapıştırınca banka otomatik seçilir.</p>
            )}
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">Hesap türü</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'individual', label: 'Bireysel', hint: 'Şahıs hesabı' },
                { id: 'business', label: 'Ticari', hint: 'Şirket / serbest meslek' },
              ].map((opt) => {
                const active = form.accountType === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, accountType: opt.id }))}
                    className={`rounded-xl border-2 px-3 py-2.5 text-left transition ${
                      active
                        ? 'border-sage-500 bg-sage-50 text-sage-900'
                        : 'border-cream-200 bg-white text-cream-800 hover:border-cream-300'
                    }`}
                  >
                    <span className="block text-sm font-semibold">{opt.label}</span>
                    <span className="block text-[11px] opacity-70">{opt.hint}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !previewComplete}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sage-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sage-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Kaydediliyor…' : 'Ödeme hesabını kaydet'}
          </button>
        </form>
      </div>
    </motion.section>
  )
}

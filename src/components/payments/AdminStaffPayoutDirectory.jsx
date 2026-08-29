import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  AlertTriangle, Building2, Copy, Landmark, Search, ShieldCheck, Users,
} from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import { BankMark } from './BankSelect'
import { findBankByCode, unknownBank } from '../../data/turkishBanks'
import { staffRoleLabel } from '../../utils/staffRoles'
import { formatIbanDisplay, isPayoutAccountComplete } from '../../utils/iban'
import { useToast } from '../../context/ToastContext'
import { PanelFilterBar } from '../layout/PanelPageHeader'

async function copyText(text) {
  await navigator.clipboard.writeText(text)
}

export default function AdminStaffPayoutDirectory({ staff = [], accounts = [], loading = false }) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const byStaff = useMemo(() => {
    const map = new Map(accounts.map((a) => [a.staffId, a]))
    return (staff || []).map((s) => ({
      staff: s,
      account: map.get(s.id) || null,
      complete: isPayoutAccountComplete(map.get(s.id)),
    }))
  }, [staff, accounts])

  const counts = useMemo(() => ({
    all: byStaff.length,
    ready: byStaff.filter((r) => r.complete).length,
    missing: byStaff.filter((r) => !r.complete).length,
  }), [byStaff])

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr')
    return byStaff.filter((row) => {
      if (filter === 'ready' && !row.complete) return false
      if (filter === 'missing' && row.complete) return false
      if (!q) return true
      const hay = [
        row.staff.name,
        row.staff.email,
        staffRoleLabel(row.staff.role),
        row.account?.bankShort,
        row.account?.iban,
        row.account?.accountHolderName,
      ].join(' ').toLocaleLowerCase('tr')
      return hay.includes(q)
    })
  }, [byStaff, filter, search])

  const copyIban = async (iban) => {
    try {
      await copyText(iban)
      toast('IBAN kopyalandı.', 'success')
    } catch {
      toast('Kopyalanamadı.', 'error')
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-cream-900">
            <Landmark className="h-5 w-5 text-sage-600" /> Personel Banka Hesapları
          </h2>
          <p className="mt-1 text-sm text-cream-800/55">
            {counts.ready} tanımlı · {counts.missing} eksik · Cuma EFT/FAST için IBAN buradan kopyalanır
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-cream-200 bg-white p-4">
          <p className="text-xs text-cream-800/55">Kayıtlı personel</p>
          <p className="mt-1 font-display text-xl font-bold text-cream-900">{counts.all}</p>
        </div>
        <div className="rounded-2xl border border-sage-100 bg-sage-50/60 p-4">
          <p className="text-xs text-sage-800/70">IBAN hazır</p>
          <p className="mt-1 font-display text-xl font-bold text-sage-900">{counts.ready}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
          <p className="text-xs text-amber-800/70">Eksik hesap</p>
          <p className="mt-1 font-display text-xl font-bold text-amber-900">{counts.missing}</p>
        </div>
      </div>

      <PanelFilterBar
        accent="sage"
        value={filter}
        onChange={setFilter}
        options={[
          { id: 'all', label: 'Tümü', icon: Users, badge: counts.all },
          { id: 'ready', label: 'Tanımlı', icon: ShieldCheck, badge: counts.ready },
          { id: 'missing', label: 'Eksik', icon: AlertTriangle, badge: counts.missing },
        ]}
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/35" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="İsim, banka veya IBAN ara…"
          className="w-full rounded-xl border border-cream-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-300"
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-cream-200 bg-white px-4 py-10 text-center text-sm text-cream-800/50">
          Hesaplar yükleniyor…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Kayıt yok"
          description={byStaff.length === 0 ? 'Henüz personel kaydı yok.' : 'Filtreye uyan hesap bulunamadı.'}
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map(({ staff: s, account, complete }) => {
            const bank = account?.bankCode
              ? (findBankByCode(account.bankCode) || unknownBank(account.bankCode))
              : null
            return (
              <article
                key={s.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${
                  complete ? 'border-cream-200' : 'border-amber-200/90'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-cream-900">{s.name}</p>
                    <p className="truncate text-xs text-cream-800/50">
                      {staffRoleLabel(s.role)}
                      {s.email ? ` · ${s.email}` : ''}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    complete ? 'bg-sage-50 text-sage-700' : 'bg-amber-50 text-amber-800'
                  }`}>
                    {complete ? 'Hazır' : 'Eksik'}
                  </span>
                </div>

                {complete && account ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      {bank && <BankMark bank={bank} size="sm" />}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-cream-900">{account.bankShort}</p>
                        <p className="text-[11px] text-cream-800/45">
                          EFT {account.bankCode} · {account.accountType === 'business' ? 'Ticari' : 'Bireysel'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cream-50 px-3 py-2.5">
                      <p className="break-all font-mono text-xs tracking-wide text-cream-900 sm:text-sm">
                        {formatIbanDisplay(account.iban)}
                      </p>
                      <button
                        type="button"
                        onClick={() => copyIban(account.iban)}
                        className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-sage-800 shadow-sm ring-1 ring-cream-200 hover:bg-sage-50"
                      >
                        <Copy className="h-3.5 w-3.5" /> Kopyala
                      </button>
                    </div>
                    <p className="text-xs text-cream-800/55">
                      Hesap sahibi: <span className="font-medium text-cream-900">{account.accountHolderName}</span>
                      {account.updatedAt ? (
                        <> · {format(new Date(account.updatedAt), 'd MMM yyyy', { locale: tr })}</>
                      ) : null}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900/80">
                    Personel henüz Ödeme Yönetimi’nden IBAN ve banka bilgisi girmedi. Ödeme işaretlemeden önce hesabı tamamlamasını isteyin.
                  </p>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export function StaffPayoutInline({ account }) {
  const { toast } = useToast()
  if (!isPayoutAccountComplete(account)) {
    return <p className="text-[11px] font-medium text-amber-700">IBAN yok</p>
  }
  const bank = findBankByCode(account.bankCode) || unknownBank(account.bankCode)
  return (
    <button
      type="button"
      title="IBAN kopyala"
      onClick={async () => {
        try {
          await copyText(account.iban)
          toast('IBAN kopyalandı.', 'success')
        } catch {
          toast('Kopyalanamadı.', 'error')
        }
      }}
      className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-cream-50 px-2 py-1 text-left text-[11px] text-cream-800 hover:bg-sage-50"
    >
      <BankMark bank={bank} size="xs" />
      <span className="min-w-0">
        <span className="block truncate font-medium text-cream-900">{account.bankShort}</span>
        <span className="block truncate font-mono">{formatIbanDisplay(account.iban)}</span>
      </span>
      <Copy className="h-3 w-3 shrink-0 text-cream-800/40" />
    </button>
  )
}

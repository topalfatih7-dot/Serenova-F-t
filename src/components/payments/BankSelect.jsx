import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Landmark, Search } from 'lucide-react'
import {
  BANK_GROUPS,
  BANK_TONE_CLASS,
  bankInitials,
  findBankByCode,
  searchBanks,
  unknownBank,
} from '../../data/turkishBanks'

function BankMark({ bank, size = 'md' }) {
  const dim = size === 'xs'
    ? 'h-7 w-7 text-[9px]'
    : size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs'
  const tone = BANK_TONE_CLASS[bank?.tone] || BANK_TONE_CLASS.navy
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-xl font-bold ${dim} ${tone}`}>
      {bankInitials(bank)}
    </span>
  )
}

export default function BankSelect({ value, onChange, error, disabled = false }) {
  const listId = useId()
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const selected = findBankByCode(value) || (value ? unknownBank(value) : null)
  const grouped = useMemo(() => searchBanks(query), [query])
  const flat = useMemo(
    () => [...grouped.deposit, ...grouped.participation, ...grouped.other],
    [grouped],
  )

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  const pick = (bank) => {
    onChange?.(bank.code)
    setQuery('')
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (disabled) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      else setActiveIndex((i) => Math.min(i + 1, Math.max(flat.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && flat[activeIndex]) pick(flat[activeIndex])
      else setOpen(true)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">
        Banka <span className="text-brand-500">*</span>
      </span>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={Boolean(error) || undefined}
        onClick={() => {
          setOpen((v) => !v)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
        onKeyDown={onKeyDown}
        className={`flex w-full min-h-[52px] items-center gap-3 rounded-xl border bg-white px-3 py-2 text-left shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 ${
          error ? 'border-red-300' : 'border-cream-200'
        } ${disabled ? 'opacity-60' : ''}`}
      >
        {selected ? (
          <>
            <BankMark bank={selected} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-cream-900">{selected.short}</span>
              <span className="block truncate text-[11px] text-cream-800/50">
                EFT {selected.code} · {selected.name}
              </span>
            </span>
          </>
        ) : (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-100 text-cream-800/40">
              <Landmark className="h-4 w-4" />
            </span>
            <span className="text-sm text-cream-800/50">Banka ara veya seçin</span>
          </>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-cream-800/40 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-xl shadow-cream-900/10"
        >
          <div className="relative border-b border-cream-100 p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/35" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              autoComplete="off"
              placeholder="Ziraat, Garanti, 00062…"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full rounded-xl border border-cream-200 bg-cream-50/80 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-300"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-1.5">
            {flat.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-cream-800/50">Eşleşen banka yok.</p>
            )}
            {['deposit', 'participation', 'other'].map((groupKey) => {
              const items = grouped[groupKey]
              if (!items.length) return null
              return (
                <div key={groupKey} className="mb-1">
                  <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-cream-800/40">
                    {BANK_GROUPS[groupKey]}
                  </p>
                  {items.map((bank) => {
                    const idx = flat.indexOf(bank)
                    const active = idx === activeIndex
                    const isSelected = bank.code === value
                    return (
                      <button
                        key={bank.code}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => pick(bank)}
                        className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left ${
                          active ? 'bg-brand-50' : 'hover:bg-cream-50'
                        }`}
                      >
                        <BankMark bank={bank} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-cream-900">{bank.short}</span>
                          <span className="block truncate text-[11px] text-cream-800/45">{bank.code} · {bank.name}</span>
                        </span>
                        {isSelected && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

export { BankMark }

import { useState } from 'react'
import { PauseCircle, Ban, PlayCircle, Loader2, ShieldAlert } from 'lucide-react'

const STATUS_META = {
  active: { label: 'Aktif', style: 'bg-sage-50 text-sage-800 ring-sage-200' },
  expiring: { label: 'Sona Eriyor', style: 'bg-orange-50 text-orange-800 ring-orange-200' },
  paused: { label: 'Donduruldu', style: 'bg-sky-50 text-sky-800 ring-sky-200' },
  cancelled: { label: 'İptal', style: 'bg-red-50 text-red-800 ring-red-200' },
}

/**
 * Admin-only üyelik dondurma / iptal / aktifleştirme.
 * Üye paneline hiçbir talep veya vaat UI’si bağlanmaz.
 */
export default function AdminMembershipStatusPanel({
  member,
  onSubmit,
  busy = false,
  compact = false,
}) {
  const [note, setNote] = useState(member?.membershipStatusNote || '')
  const [pauseUntil, setPauseUntil] = useState(member?.pauseUntil || '')
  const [confirm, setConfirm] = useState(null)
  const [localBusy, setLocalBusy] = useState(false)

  const status = member?.membershipStatus || 'active'
  const meta = STATUS_META[status] || STATUS_META.active
  const working = busy || localBusy

  const run = async (nextStatus) => {
    setLocalBusy(true)
    try {
      await onSubmit?.({
        status: nextStatus,
        note: note.trim(),
        pauseUntil: nextStatus === 'paused' ? pauseUntil || null : null,
      })
      setConfirm(null)
    } finally {
      setLocalBusy(false)
    }
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-cream-200/90 bg-gradient-to-br from-slate-50 via-white to-cream-50/40 ${compact ? 'p-3.5' : 'p-4'} shadow-sm ring-1 ring-cream-100/80`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <ShieldAlert className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-sm font-bold text-cream-900">Üyelik durumu (yalnızca admin)</p>
            <p className="mt-0.5 text-xs leading-relaxed text-cream-800/55">
              Destek kanalından gelen dondurma/iptal işlemleri. Üye paneline yansımaz.
            </p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${meta.style}`}>
          {meta.label}
        </span>
      </div>

      {(member?.membershipStatusChangedAt || member?.membershipStatusNote || member?.pauseUntil) && (
        <div className="mt-3 rounded-xl border border-cream-100 bg-white/80 px-3 py-2 text-[11px] text-cream-800/65">
          {member.membershipStatusChangedAt && (
            <p>Son işlem: {new Date(member.membershipStatusChangedAt).toLocaleString('tr-TR')}</p>
          )}
          {member.pauseUntil && status === 'paused' && (
            <p className="mt-0.5">Dondurma bitiş (iç not): {member.pauseUntil}</p>
          )}
          {member.membershipStatusNote && (
            <p className="mt-0.5">Not: {member.membershipStatusNote}</p>
          )}
        </div>
      )}

      <label className="mt-3 block">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-cream-800/45">İç not (opsiyonel)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Örn. telefon ile talep · 11 Temmuz"
          className="mt-1 w-full resize-none rounded-xl border border-cream-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-300"
        />
      </label>

      {(status !== 'paused' || confirm === 'paused') && (
        <label className="mt-2 block">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-cream-800/45">Dondurma bitiş tarihi (opsiyonel)</span>
          <input
            type="date"
            value={pauseUntil}
            onChange={(e) => setPauseUntil(e.target.value)}
            className="mt-1 w-full rounded-xl border border-cream-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300"
          />
        </label>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-cream-800/45">
        Dondurma paketi otomatik uzatmaz. Süre eklemek için Premium Yönetimi’ni kullanın.
      </p>

      {confirm ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
          <p className="text-sm font-semibold text-amber-950">
            {confirm === 'paused' && 'Üyelik dondurulsun mu?'}
            {confirm === 'cancelled' && 'Üyelik iptal edilsin mi?'}
            {confirm === 'active' && 'Üyelik yeniden aktifleştirilsin mi?'}
          </p>
          <p className="mt-1 text-xs text-amber-900/75">
            {confirm === 'paused' && 'Üye ücretli özelliklere erişemez; paket kaydı korunur.'}
            {confirm === 'cancelled' && 'Üye ücretli özelliklere erişemez. Gerekirse sonra aktifleştirebilirsiniz.'}
            {confirm === 'active' && 'Aktif/sona eriyor durumu paket süresine göre yeniden hesaplanır.'}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={working}
              onClick={() => setConfirm(null)}
              className="flex-1 rounded-xl border border-cream-200 bg-white py-2 text-xs font-semibold text-cream-800"
            >
              Vazgeç
            </button>
            <button
              type="button"
              disabled={working}
              onClick={() => run(confirm)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {working && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Onayla
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {status !== 'paused' && (
            <button
              type="button"
              disabled={working}
              onClick={() => setConfirm('paused')}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs font-semibold text-sky-800 transition hover:bg-sky-100 disabled:opacity-50"
            >
              <PauseCircle className="h-3.5 w-3.5" /> Dondur
            </button>
          )}
          {status !== 'cancelled' && (
            <button
              type="button"
              disabled={working}
              onClick={() => setConfirm('cancelled')}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-50"
            >
              <Ban className="h-3.5 w-3.5" /> İptal et
            </button>
          )}
          {(status === 'paused' || status === 'cancelled') && (
            <button
              type="button"
              disabled={working}
              onClick={() => setConfirm('active')}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sage-200 bg-sage-50 px-3 py-2.5 text-xs font-semibold text-sage-800 transition hover:bg-sage-100 disabled:opacity-50 sm:col-span-1"
            >
              <PlayCircle className="h-3.5 w-3.5" /> Aktifleştir
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export { STATUS_META as ADMIN_MEMBERSHIP_STATUS_META }

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from '../ui/Modal'
import { MEMBERSHIP_CANCEL_COPY } from '../../data/membershipCancelCopy'

export default function MembershipCancelDialog({
  open,
  onClose,
  variant, // period_end | immediate | resume | stack
  planLabel,
  dateLabel,
  busy = false,
  onConfirm,
}) {
  const [acked, setAcked] = useState(false)
  const copy = MEMBERSHIP_CANCEL_COPY
  const needsAck = variant === 'immediate' || variant === 'stack'

  useEffect(() => {
    if (open) setAcked(false)
  }, [open, variant])

  const title = variant === 'immediate'
    ? copy.immediateTitle
    : variant === 'resume'
      ? copy.resumeTitle
      : variant === 'stack'
        ? copy.stackingTitle
        : copy.periodTitle
  const lead = variant === 'immediate'
    ? copy.immediateLead(planLabel, dateLabel)
    : variant === 'resume'
      ? copy.resumeLead(planLabel, dateLabel)
      : variant === 'stack'
        ? copy.stackingBody
        : copy.periodLead(planLabel, dateLabel)
  const bullets = variant === 'immediate'
    ? copy.immediateBullets
    : variant === 'period_end'
      ? copy.periodBullets
      : []
  const ackLabel = variant === 'immediate' ? copy.immediateAck : copy.stackingAck
  const cta = variant === 'immediate'
    ? copy.immediateCta
    : variant === 'resume'
      ? copy.resumeCta
      : variant === 'stack'
        ? 'Ödemeye devam et'
        : copy.periodCta
  const danger = variant === 'immediate'

  return (
    <Modal open={open} onClose={() => { if (!busy) onClose?.() }} title={title} size="md">
      {danger ? (
        <div className="mb-4 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm font-semibold leading-relaxed text-red-950">{lead}</p>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-cream-800">{lead}</p>
      )}
      {bullets.length > 0 && (
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-cream-800">
          {bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {needsAck && (
        <label className={`mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 text-sm ${
          danger ? 'border-red-200 bg-red-50/60' : 'border-amber-200 bg-amber-50/70'
        }`}>
          <input
            type="checkbox"
            checked={acked}
            onChange={(e) => setAcked(e.target.checked)}
            className="mt-1 h-4 w-4 accent-brand-600"
          />
          <span className={danger ? 'font-medium text-red-950' : 'text-cream-900'}>{ackLabel}</span>
        </label>
      )}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="rounded-xl border border-cream-200 px-4 py-2.5 text-sm font-semibold text-cream-800 hover:bg-cream-50 disabled:opacity-50"
        >
          Vazgeç
        </button>
        <button
          type="button"
          disabled={busy || (needsAck && !acked)}
          onClick={() => onConfirm?.()}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-500 hover:bg-brand-600'
          }`}
        >
          {busy ? 'Yönlendiriliyor…' : cta}
        </button>
      </div>
    </Modal>
  )
}

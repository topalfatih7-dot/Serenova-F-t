import { Copy, Sparkles } from 'lucide-react'
import Modal from '../ui/Modal'
import { useToast } from '../../context/ToastContext'
import { cloneCartEntries, weekdayFullLabel } from '../../utils/coachProgram'

/**
 * Tüm müsait günlere aynı programı uygula (eski tek-sepet kısayolu).
 */
export default function CoachApplySameProgramModal({
  open,
  onClose,
  workoutWeekdays = [],
  sourceCart = [],
  onApply,
}) {
  const { toast } = useToast()

  const handleApply = () => {
    if (!sourceCart.length) {
      toast('Önce bir güne hareket ekleyin; o program tüm müsait günlere kopyalanır', 'error')
      return
    }
    if (!workoutWeekdays.length) {
      toast('Danışanın müsait antrenman günü yok', 'error')
      return
    }

    const nextCarts = {}
    workoutWeekdays.forEach((day) => {
      nextCarts[day] = cloneCartEntries(sourceCart)
    })
    onApply({ dayCarts: nextCarts })
    toast(`${workoutWeekdays.length} müsait güne aynı program uygulandı`, 'success')
    onClose()
  }

  const dayNames = workoutWeekdays.map(weekdayFullLabel).join(', ')

  return (
    <Modal open={open} onClose={onClose} title="Tüm günlere aynı program" size="md">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-sky-500 to-teal-500 p-4 text-white shadow-lg shadow-brand-500/20">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/80">
            <Sparkles className="h-3.5 w-3.5" /> Seçili gün kopyalanacak
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/90">
            {sourceCart.length} hareket → <strong>{dayNames || '—'}</strong>
          </p>
        </div>

        <ul className="max-h-44 space-y-2 overflow-y-auto rounded-2xl border border-cream-100 bg-gradient-to-br from-cream-50 to-white p-4 text-sm text-cream-800">
          {sourceCart.map((e, i) => (
            <li key={e.id || i} className="flex items-center gap-2 truncate">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                {i + 1}
              </span>
              <span className="truncate font-medium">{e.exerciseName}</span>
            </li>
          ))}
          {!sourceCart.length && (
            <li className="text-cream-800/45">Kaynak günde henüz hareket yok</li>
          )}
        </ul>

        <button
          type="button"
          onClick={handleApply}
          disabled={!sourceCart.length || !workoutWeekdays.length}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 via-sky-500 to-teal-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 hover:brightness-105 disabled:opacity-50"
        >
          <Copy className="h-4 w-4" />
          Tüm müsait günlere uygula
        </button>
      </div>
    </Modal>
  )
}

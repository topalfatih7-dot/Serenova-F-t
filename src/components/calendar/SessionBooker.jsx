import { useEffect, useMemo, useState } from 'react'
import { addDays, format, getDay, isSameMonth, startOfDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CalendarClock, Loader2, CalendarX } from 'lucide-react'
import Modal from '../ui/Modal'
import { useToast } from '../../context/ToastContext'

const WINDOW_DAYS = 28

const ACCENTS = {
  brand: { sel: 'bg-brand-500 text-white', ring: 'border-brand-300 text-brand-700', btn: 'bg-brand-500 hover:bg-brand-600' },
  sage: { sel: 'bg-sage-500 text-white', ring: 'border-sage-300 text-sage-700', btn: 'bg-sage-500 hover:bg-sage-600' },
  teal: { sel: 'bg-teal-600 text-white', ring: 'border-teal-300 text-teal-700', btn: 'bg-teal-600 hover:bg-teal-700' },
}

/** 'HH:00' müsait saatini iki 30 dk slota açar: 'HH:00' ve 'HH:30' */
function expandHourToSlots(hour) {
  const h = String(hour).split(':')[0]
  if (!h) return []
  return [`${h}:00`, `${h}:30`]
}

function buildDaySlots(date, availability) {
  const dow = getDay(date)
  const hours = availability?.[String(dow)] || []
  const set = new Set()
  ;[...hours].forEach((hr) => expandHourToSlots(hr).forEach((t) => set.add(t)))
  return [...set].sort()
}

function slotDateTime(date, time) {
  const [hh, mm] = time.split(':').map(Number)
  const d = new Date(date)
  d.setHours(hh, mm, 0, 0)
  return d
}

export default function SessionBooker({
  open,
  onClose,
  type,
  staff,
  existingSessions = [],
  monthlyLimit = 0,
  duration = 30,
  accent = 'brand',
  onBook,
  getBookedSlots,
}) {
  const { toast } = useToast()
  const tone = ACCENTS[accent] || ACCENTS.brand
  const availability = staff?.availability || {}

  const days = useMemo(() => {
    const out = []
    const start = startOfDay(new Date())
    for (let i = 0; i < WINDOW_DAYS; i++) {
      const d = addDays(start, i)
      if (buildDaySlots(d, availability).length > 0) out.push(d)
    }
    return out
  }, [availability])

  const [selectedIdx, setSelectedIdx] = useState(0)
  const [takenSet, setTakenSet] = useState(() => new Set())
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    if (open) setSelectedIdx(0)
  }, [open])

  // Pencere boyunca dolu slotları çek
  useEffect(() => {
    if (!open || !staff?.id || !getBookedSlots) return
    let active = true
    const from = startOfDay(new Date()).toISOString()
    const to = addDays(startOfDay(new Date()), WINDOW_DAYS).toISOString()
    getBookedSlots(staff.id, type, from, to).then((slots) => {
      if (active) setTakenSet(new Set((slots || []).map((s) => new Date(s).getTime())))
    })
    return () => { active = false }
  }, [open, staff?.id, type, getBookedSlots])

  const ownActive = useMemo(() => {
    const s = new Set()
    ;(existingSessions || []).forEach((x) => {
      if (['scheduled', 'rescheduled'].includes(x.status || 'scheduled') && x.date) {
        s.add(new Date(x.date).getTime())
      }
    })
    return s
  }, [existingSessions])

  const selectedDay = days[selectedIdx] || null
  const slots = selectedDay ? buildDaySlots(selectedDay, availability) : []

  const usedThisMonth = useMemo(() => {
    if (!selectedDay) return 0
    return (existingSessions || []).filter((x) => (
      ['scheduled', 'rescheduled'].includes(x.status || 'scheduled')
      && x.date && isSameMonth(new Date(x.date), selectedDay)
    )).length
  }, [existingSessions, selectedDay])

  const limitReached = monthlyLimit > 0 && usedThisMonth >= monthlyLimit

  const handleBook = async (time) => {
    if (booking || !selectedDay) return
    const dt = slotDateTime(selectedDay, time)
    if (dt.getTime() <= Date.now()) {
      toast('Geçmiş bir saat seçilemez.', 'warning')
      return
    }
    setBooking(true)
    try {
      const r = await onBook(dt.toISOString(), duration)
      if (r?.success === false) {
        toast(r.error || 'Randevu oluşturulamadı.', 'error')
        return
      }
      toast('Randevunuz oluşturuldu.', 'success')
      onClose?.()
    } finally {
      setBooking(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Randevu Al" size="lg">
      {!staff ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-cream-800/60">
          <CalendarX className="h-8 w-8 text-cream-400" />
          Henüz bir uzman atanmamış. Atama sonrası randevu alabilirsiniz.
        </div>
      ) : days.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-cream-800/60">
          <CalendarX className="h-8 w-8 text-cream-400" />
          {staff.name || 'Uzmanınız'} önümüzdeki {WINDOW_DAYS} gün için müsaitlik belirtmemiş.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl bg-cream-50 p-3 text-xs text-cream-800/70">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
            <span>
              <span className="font-semibold">{staff.name}</span> ile müsait gün ve saati seçin.
              {monthlyLimit > 0 && ` Bu ay kalan hakkınız: ${Math.max(monthlyLimit - usedThisMonth, 0)}/${monthlyLimit}.`}
            </span>
          </div>

          {/* Gün seçimi */}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {days.map((d, i) => {
              const sel = i === selectedIdx
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => setSelectedIdx(i)}
                  className={`flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    sel ? tone.sel : 'border-cream-200 bg-white text-cream-800/70 hover:border-brand-200'
                  }`}
                >
                  <span className="uppercase">{format(d, 'EEE', { locale: tr })}</span>
                  <span className="text-base">{format(d, 'd', { locale: tr })}</span>
                  <span className="text-[10px] opacity-70">{format(d, 'MMM', { locale: tr })}</span>
                </button>
              )
            })}
          </div>

          {/* Saat slotları */}
          {limitReached ? (
            <p className="rounded-xl bg-amber-50 px-3 py-3 text-center text-sm font-medium text-amber-700">
              Bu ay için randevu hakkınız doldu. Sonraki ay için bir gün seçebilirsiniz.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((t) => {
                const dt = slotDateTime(selectedDay, t)
                const ts = dt.getTime()
                const past = ts <= Date.now()
                const taken = takenSet.has(ts)
                const own = ownActive.has(ts)
                const disabled = past || taken || own || booking
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleBook(t)}
                    className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                      disabled
                        ? 'cursor-not-allowed border-cream-100 bg-cream-50 text-cream-400 line-through'
                        : `bg-white ${tone.ring} hover:bg-cream-50`
                    }`}
                    title={own ? 'Bu saatte zaten randevunuz var' : taken ? 'Bu saat dolu' : ''}
                  >
                    {t}
                  </button>
                )
              })}
              {slots.length === 0 && (
                <p className="col-span-full py-4 text-center text-sm text-cream-800/50">Bu gün için uygun slot yok.</p>
              )}
            </div>
          )}

          {booking && (
            <div className="flex items-center justify-center gap-2 text-sm text-cream-800/60">
              <Loader2 className="h-4 w-4 animate-spin" /> Randevu oluşturuluyor…
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

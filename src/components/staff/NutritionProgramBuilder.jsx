import { useMemo, useState } from 'react'
import { format, addDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Plus, Trash2, Apple, CalendarDays, Coffee, Sun, Moon, Cookie } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { MEAL_TYPES, mealLabel } from '../../utils/programSchedule'

const MEAL_UI = {
  breakfast: { icon: Coffee, accent: 'bg-amber-100 text-amber-700 ring-amber-200', btn: 'bg-amber-500 hover:bg-amber-600' },
  snack_morning: { icon: Cookie, accent: 'bg-orange-50 text-orange-700 ring-orange-200', btn: 'bg-orange-500 hover:bg-orange-600' },
  lunch: { icon: Sun, accent: 'bg-sage-100 text-sage-700 ring-sage-200', btn: 'bg-sage-500 hover:bg-sage-600' },
  snack_afternoon: { icon: Cookie, accent: 'bg-lime-50 text-lime-800 ring-lime-200', btn: 'bg-lime-600 hover:bg-lime-700' },
  dinner: { icon: Moon, accent: 'bg-indigo-50 text-indigo-700 ring-indigo-200', btn: 'bg-indigo-500 hover:bg-indigo-600' },
  note: { icon: Apple, accent: 'bg-cream-100 text-cream-800 ring-cream-200', btn: 'bg-cream-700 hover:bg-cream-800' },
}

const SELECTABLE_MEALS = MEAL_TYPES.filter((m) => m.id !== 'note')

function entryToText(e) {
  const dateLabel = e.date ? format(new Date(`${e.date}T12:00:00`), 'd MMM', { locale: tr }) : ''
  return `${dateLabel} ${mealLabel(e.mealType)}: ${e.name}${e.note ? ` (${e.note})` : ''}`
}

export default function NutritionProgramBuilder({ onCreate }) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [entries, setEntries] = useState([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [mealType, setMealType] = useState('breakfast')
  const [draft, setDraft] = useState({ content: '', note: '' })

  const dateEntries = useMemo(
    () => [...entries.filter((e) => e.date === selectedDate)].sort((a, b) => {
      const ai = MEAL_TYPES.findIndex((m) => m.id === a.mealType)
      const bi = MEAL_TYPES.findIndex((m) => m.id === b.mealType)
      return ai - bi
    }),
    [entries, selectedDate],
  )

  const datesWithMeals = useMemo(() => {
    const set = new Set(entries.map((e) => e.date))
    return Array.from(set).sort()
  }, [entries])

  const activeMeal = SELECTABLE_MEALS.find((m) => m.id === mealType) || SELECTABLE_MEALS[0]
  const activeUi = MEAL_UI[mealType] || MEAL_UI.breakfast
  const ActiveIcon = activeUi.icon

  const addEntry = () => {
    if (!draft.content.trim()) {
      toast('Öğün içeriği girin', 'error')
      return
    }
    setEntries((list) => {
      const filtered = list.filter((e) => !(e.date === selectedDate && e.mealType === mealType))
      return [
        ...filtered,
        {
          id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date: selectedDate,
          mealType,
          name: draft.content.trim(),
          note: draft.note.trim(),
          exerciseName: draft.content.trim(),
        },
      ]
    })
    setDraft({ content: '', note: '' })
    toast(`${mealLabel(mealType)} eklendi`, 'success')
  }

  const removeEntry = (id) => setEntries((list) => list.filter((e) => e.id !== id))

  const submit = () => {
    if (!title.trim()) { toast('Liste başlığı gerekli', 'error'); return }
    if (entries.length === 0) { toast('En az bir öğün ekleyin', 'error'); return }
    const ordered = [...entries].sort((a, b) => a.date.localeCompare(b.date))
    onCreate({
      title: title.trim(),
      description: description.trim(),
      entries: ordered,
      items: ordered.map(entryToText),
    })
    setTitle('')
    setDescription('')
    setEntries([])
  }

  const selectedDateLabel = format(new Date(`${selectedDate}T12:00:00`), 'd MMMM yyyy, EEEE', { locale: tr })

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Beslenme listesi başlığı"
          className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-sage-300"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Genel notlar (su tüketimi, alerjiler vb.)"
          rows={2}
          className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-sage-300"
        />
      </div>

      <div className="rounded-xl border border-sage-200 bg-sage-50/50 p-3">
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sage-700">
          <CalendarDays className="h-3.5 w-3.5" />
          Tarih Seç
        </label>
        <input
          type="date"
          value={selectedDate}
          min={format(new Date(), 'yyyy-MM-dd')}
          max={format(addDays(new Date(), 90), 'yyyy-MM-dd')}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="mt-2 w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm"
        />
        <p className="mt-1 text-[11px] text-cream-800/50">{selectedDateLabel}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-h-[200px] rounded-xl border border-cream-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold text-cream-800/70">
            {selectedDateLabel} — {dateEntries.length} öğün
          </p>
          {dateEntries.length === 0 ? (
            <p className="py-8 text-center text-xs text-cream-800/40">Bu tarihe öğün ekleyin</p>
          ) : (
            <div className="space-y-2">
              {dateEntries.map((e) => {
                const ui = MEAL_UI[e.mealType] || MEAL_UI.breakfast
                const Icon = ui.icon
                return (
                  <div key={e.id} className={`rounded-xl border px-3 py-3 ring-1 ${ui.accent}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ui.btn} text-white`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-cream-900">{mealLabel(e.mealType)}</p>
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-cream-800/45">Öğün içeriği</p>
                          <p className="text-sm leading-relaxed text-cream-800">{e.name}</p>
                          {e.note && <p className="mt-1 text-xs text-cream-800/55">Not: {e.note}</p>}
                        </div>
                      </div>
                      <button type="button" onClick={() => removeEntry(e.id)} className="shrink-0 text-red-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-sage-100 bg-white p-3">
          <p className="mb-3 text-xs font-semibold uppercase text-sage-700">Öğün Ekle</p>
          <div className="mb-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {SELECTABLE_MEALS.map((m) => {
              const ui = MEAL_UI[m.id] || MEAL_UI.breakfast
              const Icon = ui.icon
              const selected = mealType === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMealType(m.id)}
                  className={`flex items-center gap-1.5 rounded-xl border px-2 py-2 text-left text-[10px] font-semibold transition sm:text-xs ${
                    selected ? `${ui.btn} border-transparent text-white shadow-sm` : 'border-cream-200 bg-cream-50 text-cream-800/70 hover:bg-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="leading-tight">{m.short}</span>
                </button>
              )
            })}
          </div>

          <div className={`mb-3 flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ${activeUi.accent}`}>
            <ActiveIcon className="h-4 w-4 shrink-0" />
            <span className="text-sm font-semibold">{activeMeal.label}</span>
          </div>

          <label className="mb-1 block text-xs font-medium text-cream-800/60">Öğün içeriği</label>
          <textarea
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            placeholder="Örn. Yulaf lapası, muz, 10 badem, yeşil çay"
            rows={3}
            className="mb-2 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm"
          />
          <input
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            placeholder="Dikkat edilecekler (opsiyonel)"
            className="mb-3 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addEntry}
            className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold text-white ${activeUi.btn}`}
          >
            <Plus className="h-4 w-4" />
            {mealLabel(mealType)} Ekle
          </button>
          <p className="mt-2 text-[10px] text-cream-800/45">Aynı öğünü tekrar eklerseniz içerik güncellenir.</p>
        </div>
      </div>

      {datesWithMeals.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {datesWithMeals.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDate(d)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                d === selectedDate ? 'bg-sage-500 text-white' : 'bg-sage-100 text-sage-700'
              }`}
            >
              {format(new Date(`${d}T12:00:00`), 'd MMM', { locale: tr })}: {entries.filter((e) => e.date === d).length}
            </button>
          ))}
        </div>
      )}

      <button type="button" onClick={submit} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sage-500 py-3 text-sm font-semibold text-white hover:bg-sage-600">
        <Apple className="h-4 w-4" />
        Beslenme Listesini Gönder
      </button>
    </div>
  )
}

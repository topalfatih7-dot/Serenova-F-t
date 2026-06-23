import { useMemo, useState } from 'react'
import { format, addDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Plus, Trash2, Apple, CalendarDays, Check } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { MEAL_TYPES, mealLabel } from '../../utils/programSchedule'

function entryToText(e) {
  const meal = mealLabel(e.mealType)
  const dateLabel = e.date ? format(new Date(`${e.date}T12:00:00`), 'd MMM', { locale: tr }) : ''
  return `${dateLabel} ${meal}: ${e.name}${e.note ? ` (${e.note})` : ''}`
}

export default function NutritionProgramBuilder({ onCreate }) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [entries, setEntries] = useState([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [mealType, setMealType] = useState('breakfast')
  const [draft, setDraft] = useState({ name: '', note: '', calories: '' })

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

  const addEntry = () => {
    if (!draft.name.trim()) { toast('Öğün içeriği girin', 'error'); return }
    setEntries((list) => [
      ...list,
      {
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: selectedDate,
        mealType,
        name: draft.name.trim(),
        note: draft.note.trim(),
        calories: draft.calories ? Number(draft.calories) : null,
        exerciseName: draft.name.trim(),
      },
    ])
    setDraft({ name: '', note: '', calories: '' })
  }

  const removeEntry = (id) => setEntries((list) => list.filter((e) => e.id !== id))

  const submit = () => {
    if (!title.trim()) { toast('Program başlığı gerekli', 'error'); return }
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
          placeholder="Beslenme programı başlığı"
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
        <div className="min-h-[180px] rounded-xl border border-cream-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold text-cream-800/70">
            {selectedDateLabel} — {dateEntries.length} öğün
          </p>
          {dateEntries.length === 0 ? (
            <p className="py-8 text-center text-xs text-cream-800/40">Bu tarihe öğün ekleyin</p>
          ) : (
            <div className="space-y-1.5">
              {dateEntries.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-2 rounded-lg border border-cream-100 bg-cream-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-sage-600">{mealLabel(e.mealType)}</p>
                    <p className="text-sm font-semibold text-cream-900">{e.name}</p>
                    {e.note && <p className="text-xs text-cream-800/55">{e.note}</p>}
                  </div>
                  <button type="button" onClick={() => removeEntry(e.id)} className="shrink-0 text-red-400 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-sage-100 bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-sage-700">Öğün Ekle</p>
          <div className="mb-2 flex flex-wrap gap-1">
            {MEAL_TYPES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMealType(m.id)}
                className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition ${
                  mealType === m.id ? 'bg-sage-500 text-white' : 'bg-cream-100 text-cream-800/70'
                }`}
              >
                {m.short}
              </button>
            ))}
          </div>
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Örn. Yulaf + meyve + badem"
            className="mb-2 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm"
          />
          <input
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            placeholder="Dikkat edilecekler (opsiyonel)"
            className="mb-2 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addEntry}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-sage-500 py-2.5 text-sm font-semibold text-white hover:bg-sage-600"
          >
            <Plus className="h-4 w-4" />
            Öğünü Ekle
          </button>
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
        Beslenme Programını Gönder
      </button>
    </div>
  )
}

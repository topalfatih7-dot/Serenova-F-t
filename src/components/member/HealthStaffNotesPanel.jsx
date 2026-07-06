import { useState } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { MessageSquarePlus, Loader2, StickyNote } from 'lucide-react'
import {
  appendHealthStaffNote,
  HEALTH_NOTE_ROLE_META,
  normalizeHealthStaffNotes,
  sortHealthStaffNotes,
} from '../../data/healthStaffNotes'

export default function HealthStaffNotesPanel({
  notes = [],
  canWrite = false,
  author,
  onSave,
  saving = false,
}) {
  const [draft, setDraft] = useState('')
  const sorted = sortHealthStaffNotes(normalizeHealthStaffNotes(notes))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || !onSave) return
    const next = appendHealthStaffNote(notes, {
      staffId: author?.id || '',
      staffName: author?.name || 'Uzman',
      staffRole: author?.role || 'coach',
      text,
    })
    await onSave(next)
    setDraft('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-cream-900">
          <StickyNote className="h-4 w-4 text-brand-500" />
          Klinik Notlar
          <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-bold text-cream-800/60">
            {sorted.length}
          </span>
        </p>
        <p className="text-[11px] text-cream-800/45">
          Tüm geçmiş notlar saklanır — yeni uzman atandığında da görünür.
        </p>
      </div>

      {canWrite && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-100 bg-brand-50/30 p-4">
          <label className="block text-xs font-semibold text-cream-800/70">Yeni not</label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Gözlem, takip planı veya danışanla ilgili notunuz…"
            className="mt-2 w-full resize-y rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-sm text-cream-900 outline-none focus:border-brand-300"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={saving || !draft.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}
              Notu Kaydet
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-cream-200 py-8 text-center text-sm text-cream-800/45">
          Henüz not yok.{canWrite ? ' İlk notunuzu yukarıdan ekleyebilirsiniz.' : ''}
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.map((note) => {
            const meta = HEALTH_NOTE_ROLE_META[note.staffRole] || HEALTH_NOTE_ROLE_META.coach
            return (
              <article key={note.id} className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${meta.chip}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                  <span className="text-sm font-semibold text-cream-900">{note.staffName}</span>
                  <span className="text-[11px] text-cream-800/45">
                    {format(new Date(note.createdAt), 'd MMM yyyy HH:mm', { locale: tr })}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-cream-800/85">{note.text}</p>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

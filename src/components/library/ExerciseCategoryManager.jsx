import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Modal from '../ui/Modal'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { useExerciseCategories } from '../../hooks/useExerciseCategories'

export default function ExerciseCategoryManager({ exercises }) {
  const { saveExerciseTaxonomy, reassignExerciseCategory } = useApp()
  const { toast } = useToast()
  const { categories, taxonomyId } = useExerciseCategories()
  const [newName, setNewName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [reassignTo, setReassignTo] = useState('')
  const [busy, setBusy] = useState(false)

  const countInCategory = (cat) => (exercises || []).filter((e) => e.category === cat).length

  const persistCategories = async (nextCategories) => {
    const r = await saveExerciseTaxonomy({
      id: taxonomyId,
      bodyParts: nextCategories,
      sportTypes: [],
    })
    if (!r?.success) {
      toast(r?.error || 'Kategoriler kaydedilemedi.', 'error')
      return false
    }
    return true
  }

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      toast('Bu tip zaten mevcut.', 'error')
      return
    }
    setBusy(true)
    const ok = await persistCategories([...categories, name])
    setBusy(false)
    if (ok) {
      setNewName('')
      toast('Hareket tipi eklendi', 'success')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const affected = countInCategory(deleteTarget)
    if (affected > 0) {
      if (!reassignTo || reassignTo === deleteTarget) {
        toast('Lütfen hareketlerin taşınacağı tipi seçin.', 'error')
        return
      }
      setBusy(true)
      const r = await reassignExerciseCategory(deleteTarget, reassignTo)
      if (!r?.success) {
        setBusy(false)
        toast(r?.error || 'Hareketler taşınamadı.', 'error')
        return
      }
    }
    const next = categories.filter((c) => c !== deleteTarget)
    const ok = await persistCategories(next)
    setBusy(false)
    if (ok) {
      setDeleteTarget(null)
      setReassignTo('')
      toast('Hareket tipi silindi', 'info')
    }
  }

  const otherCategories = deleteTarget
    ? categories.filter((c) => c !== deleteTarget)
    : []

  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-cream-900">Hareket Tipleri</h2>
          <p className="mt-1 text-sm text-cream-800/60">
            Üye kütüphanesindeki filtre seçenekleri. Her hareket bir tipe atanır.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <div
            key={cat}
            className="flex items-center gap-1 rounded-full border border-cream-200 bg-cream-50/80 py-1 pl-3 pr-1 text-xs font-medium text-cream-800"
          >
            <span>{cat}</span>
            <span className="text-cream-800/40">({countInCategory(cat)})</span>
            <button
              type="button"
              disabled={categories.length <= 1}
              onClick={() => {
                const others = categories.filter((c) => c !== cat)
                setDeleteTarget(cat)
                setReassignTo(others[0] || '')
              }}
              className="rounded-full p-1.5 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={`${cat} tipini sil`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex max-w-md gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Yeni hareket tipi (ör. Bacak)"
          className="min-w-0 flex-1 rounded-xl border border-cream-200 px-4 py-2.5 text-sm"
        />
        <button
          type="button"
          disabled={busy || !newName.trim()}
          onClick={handleAdd}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Ekle
        </button>
      </div>

      <Modal open={!!deleteTarget} onClose={() => !busy && setDeleteTarget(null)} title="Hareket Tipini Sil">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-cream-800/70">
              <strong>{deleteTarget}</strong> tipini silmek istediğinize emin misiniz?
            </p>
            {countInCategory(deleteTarget) > 0 && (
              <div>
                <p className="mb-2 text-sm text-cream-800/70">
                  Bu tipte <strong>{countInCategory(deleteTarget)}</strong> hareket var. Silmeden önce başka bir tipe taşıyın:
                </p>
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="w-full rounded-xl border border-cream-200 px-4 py-2.5 text-sm"
                >
                  {categories.filter((c) => c !== deleteTarget).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" disabled={busy} onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-cream-200 py-2.5 text-sm">Vazgeç</button>
              <button type="button" disabled={busy} onClick={handleDelete} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white">Sil</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

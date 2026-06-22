import { useState, useRef, useMemo } from 'react'
import { Plus, Search, Edit, Trash2, Dumbbell, Upload, Loader2 } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import VideoPlayer from '../../components/ui/VideoPlayer'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'

const CATEGORIES = [
  'Tüm Vücut', 'Üst Vücut', 'Alt Vücut', 'Göğüs', 'Sırt',
  'Omuz', 'Kol', 'Karın', 'Kalça', 'Bacak', 'Kardiyo', 'Esneme',
]

const EMPTY = { name: '', category: 'Tüm Vücut', description: '', videoUrl: '' }

function ExerciseFormModal({ open, onClose, onSubmit, initial, isEdit }) {
  const { uploadExerciseVideo } = useApp()
  const { toast } = useToast()
  const [form, setForm] = useState(initial || EMPTY)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('video/')) { setError('Lütfen bir video dosyası seçin.'); return }
    setUploading(true)
    setError('')
    const res = await uploadExerciseVideo(file)
    setUploading(false)
    if (!res.success) { setError(res.error || 'Video yüklenemedi.'); return }
    update({ videoUrl: res.url })
    toast('Video yüklendi', 'success')
  }

  const submit = () => {
    if (!form.name.trim()) { setError('Hareket adı gerekli.'); return }
    setError('')
    onSubmit(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Hareketi Düzenle' : 'Yeni Hareket Ekle'} size="lg">
      <div className="space-y-4">
        <input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Hareket adı (ör. Squat)" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
        <select value={form.category} onChange={(e) => update({ category: e.target.value })} className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <textarea value={form.description} onChange={(e) => update({ description: e.target.value })} placeholder="Hareketin nasıl yapılacağına dair açıklama..." rows={4} className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
        <div className="rounded-2xl border border-cream-200 bg-cream-50/50 p-4">
          <p className="mb-2 text-sm font-semibold text-cream-900">Video</p>
          <input value={form.videoUrl} onChange={(e) => update({ videoUrl: e.target.value })} placeholder="Video URL" className="w-full rounded-xl border border-cream-200 px-4 py-2.5 text-sm" />
          <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 bg-white py-3 text-sm font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50">
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…</> : <><Upload className="h-4 w-4" /> Video dosyası seç</>}
          </button>
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          {form.videoUrl && <div className="mt-3"><VideoPlayer url={form.videoUrl} /></div>}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button type="button" onClick={submit} disabled={uploading} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
          {isEdit ? 'Değişiklikleri Kaydet' : 'Hareketi Ekle'}
        </button>
      </div>
    </Modal>
  )
}

export default function AdminLibraryPage() {
  const { exercises, addExercise, editExercise, removeExercise } = useApp()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = useMemo(() => (exercises || []).filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.category || '').toLowerCase().includes(search.toLowerCase()),
  ), [exercises, search])

  const handleAdd = async (form) => {
    const r = await addExercise(form)
    if (r && !r.success) { toast(r.error, 'error'); return }
    setAddOpen(false)
    toast('Hareket eklendi', 'success')
  }

  const handleEdit = async (form) => {
    const r = await editExercise(editTarget.id, form)
    if (r && !r.success) { toast(r.error, 'error'); return }
    setEditTarget(null)
    toast('Hareket güncellendi', 'success')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream-900">Hareket Kütüphanesi</h1>
          <p className="mt-1 text-sm text-cream-800/60">{exercises.length} hareket · koçlar program yazarken bu hareketleri kullanır</p>
        </div>
        <button type="button" onClick={() => setAddOpen(true)} className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
          <Plus className="h-4 w-4" /> Yeni Hareket
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
        <input type="text" placeholder="Hareket veya kategori ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-cream-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-300" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Henüz hareket eklenmedi"
          description="İlk hareketi ekleyerek kütüphaneyi oluşturmaya başlayın."
          action={<button type="button" onClick={() => setAddOpen(true)} className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white">Yeni Hareket</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => (
            <div key={ex.id} className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <span className="rounded-full bg-sage-50 px-2 py-0.5 text-[10px] font-medium text-sage-700">{ex.category}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setEditTarget(ex)} className="rounded-lg p-1.5 text-cream-800/50 hover:bg-cream-100" aria-label="Düzenle"><Edit className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setDeleteTarget(ex)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" aria-label="Sil"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-3 font-semibold text-cream-900">{ex.name}</p>
              <p className="mt-1 line-clamp-2 text-sm text-cream-800/60">{ex.description || 'Açıklama eklenmemiş.'}</p>
            </div>
          ))}
        </div>
      )}

      {addOpen && <ExerciseFormModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdd} />}
      {editTarget && <ExerciseFormModal key={editTarget.id} open={!!editTarget} onClose={() => setEditTarget(null)} onSubmit={handleEdit} initial={editTarget} isEdit />}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hareketi Sil">
        <p className="text-sm text-cream-800/70"><strong>{deleteTarget?.name}</strong> hareketini silmek istediğinize emin misiniz?</p>
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-cream-200 py-2.5 text-sm">Vazgeç</button>
          <button type="button" onClick={() => { removeExercise(deleteTarget.id); setDeleteTarget(null); toast('Hareket silindi', 'info') }} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white">Sil</button>
        </div>
      </Modal>
    </div>
  )
}

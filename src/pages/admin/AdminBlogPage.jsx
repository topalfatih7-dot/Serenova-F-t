import { useState } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, BookOpen, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { BLOG_CATEGORIES } from '../../data/blogPosts'

const ACCENTS = [
  { value: 'brand', label: 'Pembe', dot: 'bg-brand-500' },
  { value: 'sage', label: 'Yeşil', dot: 'bg-sage-500' },
  { value: 'gold', label: 'Altın', dot: 'bg-gold-500' },
  { value: 'cream', label: 'Krem', dot: 'bg-cream-400' },
]

const EMPTY = {
  title: '', category: 'Beslenme', author: 'Yeni Form Ekibi',
  accent: 'brand', excerpt: '', content: '', published: true,
}

function PostFormModal({ open, onClose, onSubmit, initial, isEdit }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [error, setError] = useState('')
  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const submit = () => {
    if (!form.title.trim()) { setError('Başlık gerekli.'); return }
    if (!form.content.trim()) { setError('İçerik gerekli.'); return }
    setError('')
    onSubmit({ ...form, excerpt: form.excerpt.trim() || form.content.slice(0, 140) })
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Yazıyı Düzenle' : 'Yeni Blog Yazısı'} size="lg">
      <div className="space-y-4">
        <input value={form.title} onChange={(e) => update({ title: e.target.value })} placeholder="Başlık" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />

        <div className="grid gap-3 sm:grid-cols-2">
          <select value={form.category} onChange={(e) => update({ category: e.target.value })} className="rounded-xl border border-cream-200 px-4 py-3 text-sm">
            {BLOG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={form.author} onChange={(e) => update({ author: e.target.value })} placeholder="Yazar" className="rounded-xl border border-cream-200 px-4 py-3 text-sm" />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-cream-800/80">Kapak rengi</p>
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => update({ accent: a.value })}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  form.accent === a.value ? 'border-brand-400 ring-2 ring-brand-100' : 'border-cream-200'
                }`}
              >
                <span className={`h-3 w-3 rounded-full ${a.dot}`} /> {a.label}
              </button>
            ))}
          </div>
        </div>

        <textarea value={form.excerpt} onChange={(e) => update({ excerpt: e.target.value })} placeholder="Kısa özet (boş bırakılırsa içerikten alınır)" rows={2} className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
        <textarea value={form.content} onChange={(e) => update({ content: e.target.value })} placeholder="Yazı içeriği. Paragrafları boş satırla ayırın." rows={9} className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />

        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-cream-200 px-4 py-3">
          <span className="text-sm font-medium text-cream-900">Yayında</span>
          <input type="checkbox" checked={form.published} onChange={(e) => update({ published: e.target.checked })} className="h-4 w-4 accent-brand-500" />
        </label>

        {error && <p className="text-xs text-red-500">{error}</p>}
        <button type="button" onClick={submit} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600">
          {isEdit ? 'Değişiklikleri Kaydet' : 'Yayınla'}
        </button>
      </div>
    </Modal>
  )
}

export default function AdminBlogPage() {
  const { posts, addPost, editPost, removePost } = useApp()
  const { toast } = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const publishedCount = posts.filter((p) => p.published).length

  const handleAdd = (form) => {
    addPost(form)
    setAddOpen(false)
    toast(form.published ? 'Yazı yayınlandı' : 'Taslak kaydedildi', 'success')
  }

  const handleEdit = (form) => {
    editPost(editTarget.id, form)
    setEditTarget(null)
    toast('Yazı güncellendi', 'success')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream-900">Blog Yönetimi</h1>
          <p className="mt-1 text-sm text-cream-800/60">{publishedCount} yayında · {posts.length} toplam</p>
        </div>
        <button type="button" onClick={() => setAddOpen(true)} className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
          <Plus className="h-4 w-4" /> Yeni Yazı
        </button>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Henüz yazı yok"
          description="İlk blog yazınızı oluşturun. Yayınlanan yazıları herkes okuyabilir."
          action={<button type="button" onClick={() => setAddOpen(true)} className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white">Yeni Yazı</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((p) => (
            <div key={p.id} className="flex flex-col rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-cream-100 px-2.5 py-0.5 text-xs font-medium text-cream-800">{p.category}</span>
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.published ? 'bg-sage-50 text-sage-700' : 'bg-amber-50 text-amber-700'}`}>
                  {p.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {p.published ? 'Yayında' : 'Taslak'}
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold leading-snug text-cream-900">{p.title}</h3>
              <p className="mt-2 line-clamp-2 flex-1 text-sm text-cream-800/60">{p.excerpt}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-cream-800/50">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {p.readMinutes} dk</span>
                <span>{format(new Date(p.createdAt), 'd MMM yyyy', { locale: tr })}</span>
              </div>
              <div className="mt-4 flex gap-2 border-t border-cream-100 pt-4">
                <button type="button" onClick={() => editPost(p.id, { published: !p.published })} className="flex-1 rounded-lg bg-cream-100 py-2 text-xs font-medium text-cream-800 hover:bg-cream-200">
                  {p.published ? 'Yayından kaldır' : 'Yayınla'}
                </button>
                <button type="button" onClick={() => setEditTarget(p)} className="rounded-lg border border-cream-200 p-2 text-cream-800/60 hover:bg-cream-50" aria-label="Düzenle">
                  <Edit className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setDeleteTarget(p)} className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50" aria-label="Sil">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {addOpen && <PostFormModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdd} />}
      {editTarget && (
        <PostFormModal open={!!editTarget} onClose={() => setEditTarget(null)} onSubmit={handleEdit} initial={editTarget} isEdit />
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Yazıyı Sil">
        <p className="text-sm text-cream-800/70"><strong>{deleteTarget?.title}</strong> yazısını silmek istediğinize emin misiniz?</p>
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-cream-200 py-2.5 text-sm">Vazgeç</button>
          <button type="button" onClick={() => { removePost(deleteTarget.id); setDeleteTarget(null); toast('Yazı silindi', 'info') }} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white">Sil</button>
        </div>
      </Modal>
    </div>
  )
}

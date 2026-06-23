import { useMemo, useState } from 'react'
import { Plus, Edit, Trash2, Star, HelpCircle, Sparkles, CheckCircle, Clock } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'

const TABS = [
  { id: 'testimonials', label: 'Yorumlar', kind: 'testimonial', icon: Star },
  { id: 'faqs', label: 'SSS', kind: 'faq', icon: HelpCircle },
  { id: 'successStories', label: 'Başarı Hikâyeleri', kind: 'success_story', icon: Sparkles },
]

const SUCCESS_STORY_FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'approved', label: 'Yayında' },
  { id: 'pending', label: 'İncelemede' },
]

const EMPTY = {
  testimonial: { name: '', role: '', quote: '', rating: 5 },
  faq: { q: '', a: '' },
  success_story: { name: '', duration: '', highlight: '', story: '', consent: true, approved: true },
}

function dataFromItem(item) {
  const { id, ...rest } = item
  return rest
}

function ContentFormModal({ open, onClose, onSubmit, kind, initial, isEdit }) {
  const [form, setForm] = useState(initial || EMPTY[kind])
  const [error, setError] = useState('')
  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const submit = () => {
    if (kind === 'testimonial' && (!form.name?.trim() || !form.quote?.trim())) { setError('İsim ve yorum gerekli.'); return }
    if (kind === 'faq' && (!form.q?.trim() || !form.a?.trim())) { setError('Soru ve cevap gerekli.'); return }
    if (kind === 'success_story' && !form.name?.trim()) { setError('İsim gerekli.'); return }
    setError('')
    onSubmit(form)
  }

  const titles = { testimonial: 'Yorum', faq: 'SSS', success_story: 'Başarı Hikâyesi' }

  return (
    <Modal open={open} onClose={onClose} title={`${isEdit ? 'Düzenle' : 'Yeni'} · ${titles[kind]}`} size="lg">
      <div className="space-y-4">
        {kind === 'testimonial' && (
          <>
            <input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="İsim (ör. Selin A.)" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
            <input value={form.role} onChange={(e) => update({ role: e.target.value })} placeholder="Rol/etiket (ör. Premium Üye · 6 ay)" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
            <textarea value={form.quote} onChange={(e) => update({ quote: e.target.value })} rows={3} placeholder="Yorum metni" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-cream-800/70">Puan:</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => update({ rating: n })} aria-label={`${n} yıldız`}>
                  <Star className={`h-5 w-5 ${n <= form.rating ? 'fill-gold-400 text-gold-400' : 'text-cream-300'}`} />
                </button>
              ))}
            </div>
          </>
        )}

        {kind === 'faq' && (
          <>
            <input value={form.q} onChange={(e) => update({ q: e.target.value })} placeholder="Soru" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
            <textarea value={form.a} onChange={(e) => update({ a: e.target.value })} rows={4} placeholder="Cevap" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
          </>
        )}

        {kind === 'success_story' && (
          <>
            <input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="İsim" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
            <input value={form.duration} onChange={(e) => update({ duration: e.target.value })} placeholder="Süre (ör. 12 hafta)" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
            <input value={form.highlight} onChange={(e) => update({ highlight: e.target.value })} placeholder="Öne çıkan başlık" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
            <textarea value={form.story || ''} onChange={(e) => update({ story: e.target.value })} rows={4} placeholder="Hikaye metni" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-cream-200 px-4 py-3">
              <span className="text-sm font-medium text-cream-900">Onaylı (yayında)</span>
              <input type="checkbox" checked={!!form.approved} onChange={(e) => update({ approved: e.target.checked })} className="h-4 w-4 accent-brand-500" />
            </label>
          </>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
        <button type="button" onClick={submit} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600">
          {isEdit ? 'Değişiklikleri Kaydet' : 'Ekle'}
        </button>
      </div>
    </Modal>
  )
}

export default function AdminContentPage() {
  const { testimonials, faqs, successStories, addContent, editContent, removeContent } = useApp()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('testimonials')
  const [storyFilter, setStoryFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const tab = TABS.find((t) => t.id === activeTab)
  const lists = { testimonials, faqs, successStories }
  const rawItems = lists[activeTab] || []

  const storyCounts = useMemo(() => ({
    all: successStories.length,
    approved: successStories.filter((s) => s.approved).length,
    pending: successStories.filter((s) => !s.approved).length,
  }), [successStories])

  const items = useMemo(() => {
    if (activeTab !== 'successStories' || storyFilter === 'all') return rawItems
    if (storyFilter === 'approved') return rawItems.filter((s) => s.approved)
    return rawItems.filter((s) => !s.approved)
  }, [activeTab, rawItems, storyFilter])

  const handleAdd = async (form) => {
    setAddOpen(false)
    await addContent(tab.kind, form)
    toast('Eklendi', 'success')
  }

  const handleEdit = async (form) => {
    const id = editTarget.id
    setEditTarget(null)
    await editContent(id, form)
    toast('Güncellendi', 'success')
  }

  const handleDelete = async () => {
    const id = deleteTarget.id
    setDeleteTarget(null)
    await removeContent(id)
    toast('Silindi', 'info')
  }

  const toggleApprove = async (item) => {
    await editContent(item.id, { ...dataFromItem(item), approved: !item.approved })
    toast(item.approved ? 'Yayından kaldırıldı' : 'Yayınlandı', 'success')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream-900">İçerik Yönetimi</h1>
          <p className="mt-1 text-sm text-cream-800/60">Ana sayfadaki yorumlar, SSS ve başarı hikâyeleri</p>
        </div>
        <button type="button" onClick={() => setAddOpen(true)} className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
          <Plus className="h-4 w-4" /> Yeni Ekle
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setActiveTab(t.id)
              if (t.id === 'successStories' && storyCounts.pending > 0) setStoryFilter('pending')
              else if (t.id !== 'successStories') setStoryFilter('all')
            }}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === t.id ? 'bg-cream-900 text-white' : 'bg-cream-100 text-cream-800 hover:bg-cream-200'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
            <span className={`rounded-full px-1.5 text-xs ${activeTab === t.id ? 'bg-white/20' : 'bg-cream-200'}`}>{(lists[t.id] || []).length}</span>
          </button>
        ))}
      </div>

      {activeTab === 'successStories' && (
        <div className="flex flex-wrap gap-2">
          {SUCCESS_STORY_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStoryFilter(f.id)}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                storyFilter === f.id ? 'bg-brand-500 text-white' : 'bg-white text-cream-800 ring-1 ring-cream-200 hover:bg-cream-50'
              }`}
            >
              {f.label}
              <span className={`rounded-full px-1.5 text-xs ${storyFilter === f.id ? 'bg-white/20' : 'bg-cream-100'}`}>
                {storyCounts[f.id]}
              </span>
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={tab.icon}
          title={activeTab === 'successStories' && storyFilter !== 'all' ? 'Bu filtrede kayıt yok' : 'Henüz içerik yok'}
          description={
            activeTab === 'successStories' && storyFilter === 'pending'
              ? 'Onay bekleyen başarı hikâyesi bulunmuyor.'
              : 'İlk kaydı eklemek için “Yeni Ekle” butonunu kullanın.'
          }
          action={<button type="button" onClick={() => setAddOpen(true)} className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white">Yeni Ekle</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
              {activeTab === 'testimonials' && (
                <>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: item.rating || 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />)}
                  </div>
                  <p className="mt-2 flex-1 text-sm text-cream-800/70">“{item.quote}”</p>
                  <p className="mt-3 text-sm font-semibold text-cream-900">{item.name}</p>
                  <p className="text-xs text-cream-800/50">{item.role}</p>
                </>
              )}
              {activeTab === 'faqs' && (
                <>
                  <p className="font-semibold text-cream-900">{item.q}</p>
                  <p className="mt-2 flex-1 text-sm text-cream-800/70">{item.a}</p>
                </>
              )}
              {activeTab === 'successStories' && (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-cream-900">{item.name}</p>
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.approved ? 'bg-sage-50 text-sage-700' : 'bg-amber-50 text-amber-700'}`}>
                      {item.approved ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {item.approved ? 'Onaylı' : 'İncelemede'}
                    </span>
                  </div>
                  {item.highlight && <p className="mt-1 text-sm text-brand-600">{item.highlight}</p>}
                  {item.duration && <p className="text-xs text-cream-800/50">{item.duration}</p>}
                  <p className="mt-2 flex-1 text-sm text-cream-800/70 line-clamp-3">{item.story}</p>
                  <button type="button" onClick={() => toggleApprove(item)} className="mt-3 rounded-lg bg-cream-100 py-2 text-xs font-medium text-cream-800 hover:bg-cream-200">
                    {item.approved ? 'Yayından kaldır' : 'Onayla ve yayınla'}
                  </button>
                </>
              )}
              <div className="mt-4 flex gap-2 border-t border-cream-100 pt-4">
                <button type="button" onClick={() => setEditTarget(item)} className="flex-1 rounded-lg border border-cream-200 py-2 text-xs font-medium text-cream-800/70 hover:bg-cream-50">
                  <Edit className="mr-1 inline h-3.5 w-3.5" /> Düzenle
                </button>
                <button type="button" onClick={() => setDeleteTarget(item)} className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50" aria-label="Sil">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {addOpen && <ContentFormModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdd} kind={tab.kind} />}
      {editTarget && (
        <ContentFormModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          kind={tab.kind}
          initial={dataFromItem(editTarget)}
          isEdit
        />
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Sil">
        <p className="text-sm text-cream-800/70">Bu kaydı silmek istediğinize emin misiniz?</p>
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-cream-200 py-2.5 text-sm">Vazgeç</button>
          <button type="button" onClick={handleDelete} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white">Sil</button>
        </div>
      </Modal>
    </div>
  )
}

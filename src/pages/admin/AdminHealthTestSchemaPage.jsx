import { useEffect, useMemo, useState } from 'react'
import {
  HeartPulse, Plus, Trash2, ChevronUp, ChevronDown, Pencil, Save, Loader2,
  RotateCcw, CheckCircle2, Stethoscope, Dumbbell, Apple, Activity, Moon, Bone, Clock3,
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import {
  DEFAULT_HEALTH_TEST_SCHEMA,
  HEALTH_TEST_ICON_OPTIONS,
  makeQuestionKey,
  makeSectionId,
  normalizeHealthTestSchema,
  validateHealthTestSchema,
} from '../../data/healthTestSchema'

const ICONS = {
  HeartPulse, Stethoscope, Dumbbell, Apple, Activity, Moon, Bone, Clock3,
}

const QUESTION_TYPES = [
  { value: 'single', label: 'Tek seçim' },
  { value: 'multi', label: 'Çoklu seçim' },
  { value: 'emoji', label: 'Emoji' },
  { value: 'text', label: 'Metin' },
]

function cloneSchema(raw) {
  return normalizeHealthTestSchema(structuredClone(raw || DEFAULT_HEALTH_TEST_SCHEMA))
}

function moveItem(list, index, dir) {
  const next = [...list]
  const j = index + dir
  if (j < 0 || j >= next.length) return next
  ;[next[index], next[j]] = [next[j], next[index]]
  return next.map((item, i) => ({ ...item, sort: i }))
}

function emptyQuestion(existingKeys) {
  return {
    key: makeQuestionKey('Yeni soru', existingKeys),
    type: 'single',
    label: '',
    hint: '',
    required: true,
    sort: 0,
    options: [
      { value: 'yes', label: 'Evet' },
      { value: 'no', label: 'Hayır' },
    ],
    detail: null,
  }
}

function QuestionFormModal({ open, onClose, onSubmit, initial, existingKeys, isEdit }) {
  const [form, setForm] = useState(initial || emptyQuestion(existingKeys))
  const [error, setError] = useState('')
  const needsOptions = form.type === 'single' || form.type === 'multi' || form.type === 'emoji'

  useEffect(() => {
    if (open) {
      setForm(initial || emptyQuestion(existingKeys))
      setError('')
    }
  }, [open, initial, existingKeys])

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const updateOption = (idx, patch) => {
    setForm((f) => {
      const options = [...(f.options || [])]
      options[idx] = { ...options[idx], ...patch }
      return { ...f, options }
    })
  }

  const submit = () => {
    if (!form.label?.trim()) {
      setError('Soru metni gerekli.')
      return
    }
    if (needsOptions && !(form.options || []).some((o) => o.label?.trim())) {
      setError('En az bir seçenek gerekli.')
      return
    }
    const key = isEdit && form.key
      ? form.key
      : (form.key || makeQuestionKey(form.label, existingKeys.filter((k) => k !== form.key)))
    onSubmit({
      ...form,
      key,
      label: form.label.trim(),
      hint: form.hint || '',
      options: needsOptions
        ? (form.options || []).filter((o) => o.label?.trim()).map((o, i) => ({
            value: (o.value || `opt_${i + 1}`).trim(),
            label: o.label.trim(),
            ...(o.emoji ? { emoji: o.emoji } : {}),
          }))
        : [],
      detail: form.detail?.placeholder
        ? {
            key: form.detail.key || `${key}Detail`,
            when: Array.isArray(form.detail.when) ? form.detail.when : ['yes', 'other'],
            placeholder: form.detail.placeholder,
          }
        : null,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={`${isEdit ? 'Soruyu düzenle' : 'Yeni soru'}`} size="lg">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-cream-800/60">Soru metni</label>
          <input
            value={form.label}
            onChange={(e) => update({ label: e.target.value })}
            className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm"
            placeholder="Örn. Sigara kullanıyor musunuz?"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-cream-800/60">Tip</label>
            <select
              value={form.type}
              onChange={(e) => update({ type: e.target.value })}
              className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <label className="mt-6 flex items-center gap-2 rounded-xl border border-cream-200 px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={!!form.required}
              onChange={(e) => update({ required: e.target.checked })}
            />
            Zorunlu soru
          </label>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-cream-800/60">İpucu (opsiyonel)</label>
          <input
            value={form.hint || ''}
            onChange={(e) => update({ hint: e.target.value })}
            className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm"
          />
        </div>
        {isEdit && (
          <p className="rounded-xl bg-cream-50 px-3 py-2 text-[11px] text-cream-800/55">
            Cevap anahtarı: <code className="font-mono">{form.key}</code> (üyelerin eski cevapları için sabit)
          </p>
        )}
        {needsOptions && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-cream-800/60">Seçenekler</label>
              <button
                type="button"
                onClick={() => update({
                  options: [...(form.options || []), { value: `opt_${(form.options || []).length + 1}`, label: '', emoji: form.type === 'emoji' ? '🙂' : undefined }],
                })}
                className="text-xs font-bold text-brand-600"
              >
                + Seçenek
              </button>
            </div>
            {(form.options || []).map((o, idx) => (
              <div key={idx} className="flex gap-2">
                {form.type === 'emoji' && (
                  <input
                    value={o.emoji || ''}
                    onChange={(e) => updateOption(idx, { emoji: e.target.value })}
                    className="w-14 rounded-xl border border-cream-200 px-2 py-2 text-center text-sm"
                    placeholder="🙂"
                  />
                )}
                <input
                  value={o.label || ''}
                  onChange={(e) => updateOption(idx, { label: e.target.value, value: o.value || makeQuestionKey(e.target.value, []).replace(/^q_/, '') })}
                  className="min-w-0 flex-1 rounded-xl border border-cream-200 px-3 py-2 text-sm"
                  placeholder="Seçenek metni"
                />
                <button
                  type="button"
                  onClick={() => update({ options: (form.options || []).filter((_, i) => i !== idx) })}
                  className="rounded-xl border border-cream-200 px-2 text-cream-800/50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-semibold text-cream-800/60">Koşullu açıklama alanı (opsiyonel)</label>
          <input
            value={form.detail?.placeholder || ''}
            onChange={(e) => update({
              detail: e.target.value
                ? { key: form.detail?.key || '', when: form.detail?.when || ['yes', 'other'], placeholder: e.target.value }
                : null,
            })}
            className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm"
            placeholder="Örn. İlaç adını yazınız (seçime göre görünür)"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-cream-200 py-2.5 text-sm font-semibold">Vazgeç</button>
          <button type="button" onClick={submit} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
            {isEdit ? 'Güncelle' : 'Ekle'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function AdminHealthTestSchemaPage() {
  const { healthTestSchema, saveHealthTestSchema } = useApp()
  const toast = useToast()
  const [draft, setDraft] = useState(() => cloneSchema(healthTestSchema || DEFAULT_HEALTH_TEST_SCHEMA))
  const [activeSectionId, setActiveSectionId] = useState(draft.sections[0]?.id || '')
  const [saving, setSaving] = useState(false)
  const [qModal, setQModal] = useState(null)
  const [sectionModal, setSectionModal] = useState(null)

  useEffect(() => {
    const next = cloneSchema(healthTestSchema || DEFAULT_HEALTH_TEST_SCHEMA)
    setDraft(next)
    setActiveSectionId((prev) => next.sections.find((s) => s.id === prev)?.id || next.sections[0]?.id || '')
  }, [healthTestSchema])

  const baseline = useMemo(
    () => JSON.stringify(normalizeHealthTestSchema(healthTestSchema || DEFAULT_HEALTH_TEST_SCHEMA)),
    [healthTestSchema],
  )
  const dirty = JSON.stringify(normalizeHealthTestSchema(draft)) !== baseline

  const activeSection = draft.sections.find((s) => s.id === activeSectionId) || draft.sections[0]
  const allKeys = draft.sections.flatMap((s) => s.questions.map((q) => q.key))

  const patchSections = (updater) => {
    setDraft((d) => {
      const sections = updater(d.sections.map((s, i) => ({ ...s, sort: i })))
      return { ...d, sections: sections.map((s, i) => ({ ...s, sort: i })) }
    })
  }

  const save = async () => {
    const { ok, errors, schema } = validateHealthTestSchema(draft)
    if (!ok) {
      toast(errors[0] || 'Şema geçersiz', 'error')
      return
    }
    setSaving(true)
    try {
      const r = await saveHealthTestSchema({
        id: healthTestSchema?.id,
        version: schema.version,
        sections: schema.sections,
      })
      if (!r?.success) {
        toast(r?.error || 'Kaydedilemedi', 'error')
        return
      }
      toast('Sağlık testi şeması kaydedildi', 'success')
    } finally {
      setSaving(false)
    }
  }

  const resetToSeed = () => {
    if (!window.confirm('Varsayılan 30 soruluk şemaya sıfırlansın mı? Kaydedilmemiş değişiklikler kaybolur.')) return
    const next = cloneSchema(DEFAULT_HEALTH_TEST_SCHEMA)
    setDraft(next)
    setActiveSectionId(next.sections[0]?.id || '')
  }

  const addSection = () => {
    setSectionModal({ title: '', subtitle: '', icon: 'HeartPulse' })
  }

  const commitSection = (form) => {
    const id = makeSectionId(form.title, draft.sections.map((s) => s.id))
    const section = {
      id,
      title: form.title.trim(),
      subtitle: form.subtitle?.trim() || '',
      icon: form.icon || 'HeartPulse',
      audience: 'shared',
      sort: draft.sections.length,
      questions: [],
    }
    patchSections((list) => [...list, section])
    setActiveSectionId(id)
    setSectionModal(null)
  }

  const removeSection = (sectionId) => {
    const sec = draft.sections.find((s) => s.id === sectionId)
    if (!sec) return
    if (sec.questions.length && !window.confirm(`“${sec.title}” ve ${sec.questions.length} soru silinsin mi?`)) return
    if (draft.sections.length <= 1) {
      toast('En az bir kategori kalmalı', 'error')
      return
    }
    patchSections((list) => list.filter((s) => s.id !== sectionId))
    if (activeSectionId === sectionId) {
      const next = draft.sections.find((s) => s.id !== sectionId)
      setActiveSectionId(next?.id || '')
    }
  }

  const questionCount = draft.sections.reduce((n, s) => n + s.questions.length, 0)

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream-900">Sağlık Testi Yönetimi</h1>
          <p className="mt-1 text-sm text-cream-800/60">
            Kategori ve soru ekleyin, sıralayın, düzenleyin. Üye formu bu şemayı kullanır.
          </p>
          <p className="mt-2 text-xs text-cream-800/45">
            {draft.sections.length} kategori · {questionCount} soru
            {dirty ? ' · Kaydedilmemiş değişiklikler' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetToSeed}
            className="inline-flex items-center gap-2 rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm font-semibold text-cream-800 hover:bg-cream-50"
          >
            <RotateCcw className="h-4 w-4" />
            Varsayılana sıfırla
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Şemayı kaydet
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-cream-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-cream-800/45">Kategoriler</p>
            <button type="button" onClick={addSection} className="rounded-lg p-1 text-brand-600 hover:bg-brand-50" title="Kategori ekle">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-1">
            {draft.sections.map((section, idx) => {
              const Icon = ICONS[section.icon] || HeartPulse
              const active = section.id === activeSection?.id
              return (
                <div
                  key={section.id}
                  className={`rounded-xl px-2 py-2 ${active ? 'bg-cream-100' : 'hover:bg-cream-50'}`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveSectionId(section.id)}
                    className="flex w-full items-center gap-2 text-left"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-cream-900 ring-1 ring-cream-200">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-cream-900">{section.title}</span>
                      <span className="text-[11px] text-cream-800/50">{section.questions.length} soru</span>
                    </span>
                  </button>
                  <div className="mt-1 flex items-center gap-1 pl-10">
                    <button type="button" disabled={idx === 0} onClick={() => patchSections((list) => moveItem(list, idx, -1))} className="rounded p-1 text-cream-800/40 hover:bg-white disabled:opacity-30">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" disabled={idx === draft.sections.length - 1} onClick={() => patchSections((list) => moveItem(list, idx, 1))} className="rounded p-1 text-cream-800/40 hover:bg-white disabled:opacity-30">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => removeSection(section.id)} className="rounded p-1 text-cream-800/40 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        <div className="space-y-4">
          {activeSection ? (
            <>
              <div className="rounded-2xl border border-cream-200 bg-white p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-cream-800/60">Kategori adı</label>
                    <input
                      value={activeSection.title}
                      onChange={(e) => patchSections((list) => list.map((s) => (s.id === activeSection.id ? { ...s, title: e.target.value } : s)))}
                      className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-cream-800/60">İkon</label>
                    <select
                      value={activeSection.icon}
                      onChange={(e) => patchSections((list) => list.map((s) => (s.id === activeSection.id ? { ...s, icon: e.target.value } : s)))}
                      className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm"
                    >
                      {HEALTH_TEST_ICON_OPTIONS.map((icon) => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-semibold text-cream-800/60">Alt başlık</label>
                  <input
                    value={activeSection.subtitle || ''}
                    onChange={(e) => patchSections((list) => list.map((s) => (s.id === activeSection.id ? { ...s, subtitle: e.target.value } : s)))}
                    className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-cream-900">Sorular</p>
                <button
                  type="button"
                  onClick={() => setQModal({ mode: 'add' })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 ring-1 ring-brand-100"
                >
                  <Plus className="h-3.5 w-3.5" /> Soru ekle
                </button>
              </div>

              {activeSection.questions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-cream-200 py-12 text-center text-sm text-cream-800/45">
                  Bu kategoride henüz soru yok.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeSection.questions.map((q, qIdx) => (
                    <div key={q.key} className="flex items-start gap-3 rounded-2xl border border-cream-200 bg-white p-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-cream-900">{q.label}</p>
                        <p className="mt-1 text-[11px] text-cream-800/50">
                          {q.type} · {q.required ? 'zorunlu' : 'opsiyonel'} · <code className="font-mono">{q.key}</code>
                          {q.options?.length ? ` · ${q.options.length} seçenek` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button type="button" disabled={qIdx === 0} onClick={() => patchSections((list) => list.map((s) => (s.id === activeSection.id ? { ...s, questions: moveItem(s.questions, qIdx, -1) } : s)))} className="rounded-lg p-1.5 text-cream-800/40 hover:bg-cream-50 disabled:opacity-30">
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button type="button" disabled={qIdx === activeSection.questions.length - 1} onClick={() => patchSections((list) => list.map((s) => (s.id === activeSection.id ? { ...s, questions: moveItem(s.questions, qIdx, 1) } : s)))} className="rounded-lg p-1.5 text-cream-800/40 hover:bg-cream-50 disabled:opacity-30">
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setQModal({ mode: 'edit', question: q, index: qIdx })} className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!window.confirm('Bu soru silinsin mi?')) return
                            patchSections((list) => list.map((s) => (s.id === activeSection.id
                              ? { ...s, questions: s.questions.filter((_, i) => i !== qIdx).map((qq, i) => ({ ...qq, sort: i })) }
                              : s)))
                          }}
                          className="rounded-lg p-1.5 text-cream-800/40 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-cream-800/50">Kategori seçin veya ekleyin.</p>
          )}
        </div>
      </div>

      {!dirty && healthTestSchema?.id && (
        <p className="flex items-center gap-2 text-xs text-sage-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> Supabase’de kayıtlı şema kullanılıyor
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Şemayı kaydet
        </button>
      </div>

      <QuestionFormModal
        open={!!qModal}
        onClose={() => setQModal(null)}
        isEdit={qModal?.mode === 'edit'}
        initial={qModal?.question}
        existingKeys={allKeys.filter((k) => k !== qModal?.question?.key)}
        onSubmit={(question) => {
          if (!activeSection) return
          if (qModal?.mode === 'edit') {
            patchSections((list) => list.map((s) => (s.id === activeSection.id
              ? {
                  ...s,
                  questions: s.questions.map((q, i) => (i === qModal.index ? { ...question, sort: i } : q)),
                }
              : s)))
          } else {
            patchSections((list) => list.map((s) => (s.id === activeSection.id
              ? { ...s, questions: [...s.questions, { ...question, sort: s.questions.length }] }
              : s)))
          }
          setQModal(null)
        }}
      />

      <Modal open={!!sectionModal} onClose={() => setSectionModal(null)} title="Yeni kategori">
        {sectionModal && (
          <div className="space-y-4">
            <input
              value={sectionModal.title}
              onChange={(e) => setSectionModal((s) => ({ ...s, title: e.target.value }))}
              placeholder="Kategori adı"
              className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm"
            />
            <input
              value={sectionModal.subtitle}
              onChange={(e) => setSectionModal((s) => ({ ...s, subtitle: e.target.value }))}
              placeholder="Alt başlık (opsiyonel)"
              className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm"
            />
            <select
              value={sectionModal.icon}
              onChange={(e) => setSectionModal((s) => ({ ...s, icon: e.target.value }))}
              className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm"
            >
              {HEALTH_TEST_ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button type="button" onClick={() => setSectionModal(null)} className="flex-1 rounded-xl border border-cream-200 py-2.5 text-sm font-semibold">Vazgeç</button>
              <button
                type="button"
                onClick={() => {
                  if (!sectionModal.title?.trim()) {
                    toast('Kategori adı gerekli', 'error')
                    return
                  }
                  commitSection(sectionModal)
                }}
                className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white"
              >
                Ekle
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

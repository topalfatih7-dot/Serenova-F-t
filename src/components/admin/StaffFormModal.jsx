import { useState } from 'react'
import { Plus, Trash2, Check, X } from 'lucide-react'
import Modal from '../ui/Modal'
import PhotoUpload from '../ui/PhotoUpload'
import { STAFF_ROLES } from '../../utils/staffRoles'
import { PASSWORD_RULES, isPasswordValid } from '../../services/password'
import { WEEKDAYS } from '../package/SupportScheduler'
import {
  EMPTY_STAFF_FORM,
  EMPTY_EDUCATION,
  EMPTY_EXPERIENCE,
  EMPTY_CERTIFICATE,
  normalizeStaffProfile,
  parseLines,
  joinLines,
} from '../../data/staffProfile'

function ListEditor({ items, emptyItem, fields, onChange, addLabel }) {
  const updateItem = (index, patch) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }
  const removeItem = (index) => onChange(items.filter((_, i) => i !== index))
  const addItem = () => onChange([...items, { ...emptyItem }])

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-cream-200 bg-cream-50/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-cream-800/50">#{index + 1}</span>
            <button type="button" onClick={() => removeItem(index)} className="rounded-lg p-1 text-red-500 hover:bg-red-50" aria-label="Sil">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {fields.map((f) => (
              <input
                key={f.key}
                value={item[f.key] || ''}
                onChange={(e) => updateItem(index, { [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className={`rounded-lg border border-cream-200 px-3 py-2 text-sm ${f.full ? 'sm:col-span-2' : ''}`}
              />
            ))}
          </div>
        </div>
      ))}
      <button type="button" onClick={addItem} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cream-300 py-2.5 text-sm font-medium text-cream-800/70 hover:border-brand-300 hover:text-brand-600">
        <Plus className="h-4 w-4" /> {addLabel}
      </button>
    </div>
  )
}

export default function StaffFormModal({ open, onClose, onSubmit, initial, isEdit }) {
  const [form, setForm] = useState(() => normalizeStaffProfile(initial || EMPTY_STAFF_FORM))
  const [error, setError] = useState('')
  const [tab, setTab] = useState('profile')

  const update = (patch) => setForm((f) => normalizeStaffProfile({ ...f, ...patch }))

  const toggleDay = (d) => {
    const workDays = form.workDays.includes(d)
      ? form.workDays.filter((x) => x !== d)
      : [...form.workDays, d].sort((a, b) => a - b)
    update({ workDays })
  }

  const submit = () => {
    if (!form.name?.trim() || !form.email?.includes('@')) {
      setError('Ad ve geçerli e-posta gerekli.')
      return
    }
    const passwordRequired = !isEdit || (form.password && form.password.length > 0)
    if (passwordRequired && !isPasswordValid(form.password)) {
      setError('Şifre gereksinimleri karşılanmıyor (8+ karakter, büyük/küçük harf, rakam ve özel karakter).')
      return
    }
    if (form.workDays.length === 0) {
      setError('Panel erişimi için en az bir çalışma günü seçin.')
      return
    }
    setError('')
    const payload = {
      ...form,
      specialties: parseLines(joinLines(form.specialties.length ? form.specialties : parseLines(form.specialty))),
      specialty: form.specialty || parseLines(joinLines(form.specialties))[0] || '',
      experienceYears: form.experienceYears === '' ? 0 : Number(form.experienceYears) || 0,
      languages: parseLines(joinLines(form.languages)),
    }
    onSubmit(payload)
  }

  const tabs = [
    { id: 'profile', label: 'Profil' },
    { id: 'education', label: 'Eğitim & Deneyim' },
    { id: 'certs', label: 'Sertifikalar' },
    { id: 'access', label: 'Erişim' },
  ]

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Uzman Profilini Düzenle' : 'Yeni Uzman Ekle'} size="xl">
      <div className="mb-4 flex flex-wrap gap-2 border-b border-cream-100 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              tab === t.id ? 'bg-brand-500 text-white' : 'bg-cream-100 text-cream-800 hover:bg-cream-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
        {tab === 'profile' && (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {STAFF_ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => update({ role: r.value })}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition ${
                    form.role === r.value ? 'border-brand-400 bg-brand-50 text-brand-700 ring-2 ring-brand-200' : 'border-cream-200 text-cream-800'
                  }`}
                >
                  <r.icon className="h-4 w-4" /> {r.label}
                </button>
              ))}
            </div>

            <PhotoUpload
              value={form.photo}
              onChange={(photo) => update({ photo })}
              label="Profil Fotoğrafı"
              hint="Kadro sayfalarında ve profilde görünür. Net portre önerilir."
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Ad Soyad *" className="rounded-xl border border-cream-200 px-4 py-3 text-sm" />
              <input value={form.title} onChange={(e) => update({ title: e.target.value })} placeholder="Unvan (ör. Uzman Diyetisyen)" className="rounded-xl border border-cream-200 px-4 py-3 text-sm" />
              <input value={form.specialty} onChange={(e) => update({ specialty: e.target.value })} placeholder="Ana uzmanlık alanı" className="rounded-xl border border-cream-200 px-4 py-3 text-sm sm:col-span-2" />
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-cream-800/70">Uzmanlık alanları (her satıra bir tane)</span>
              <textarea
                value={joinLines(form.specialties)}
                onChange={(e) => update({ specialties: parseLines(e.target.value) })}
                rows={3}
                placeholder={'Spor beslenmesi\nKilo yönetimi\nMetabolik sağlık'}
                className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm"
              />
            </label>

            <input value={form.headline} onChange={(e) => update({ headline: e.target.value })} placeholder="Kısa slogan (kartlarda görünür)" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />

            <textarea value={form.bio} onChange={(e) => update({ bio: e.target.value })} placeholder="Detaylı biyografi (profil sayfasında)" rows={5} className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-cream-800/70">Konuşulan diller (her satıra bir dil)</span>
              <textarea
                value={joinLines(form.languages)}
                onChange={(e) => update({ languages: parseLines(e.target.value) })}
                rows={2}
                className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm"
              />
            </label>

            <input
              type="number"
              min="0"
              max="50"
              value={form.experienceYears}
              onChange={(e) => update({ experienceYears: e.target.value })}
              placeholder="Toplam deneyim (yıl)"
              className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm sm:max-w-xs"
            />
          </>
        )}

        {tab === 'education' && (
          <>
            <div>
              <p className="mb-2 text-sm font-semibold text-cream-900">Eğitim bilgileri</p>
              <ListEditor
                items={form.education}
                emptyItem={EMPTY_EDUCATION}
                fields={[
                  { key: 'degree', placeholder: 'Derece / Bölüm' },
                  { key: 'school', placeholder: 'Okul / Üniversite' },
                  { key: 'year', placeholder: 'Yıl' },
                ]}
                onChange={(education) => update({ education })}
                addLabel="Eğitim ekle"
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-cream-900">İş deneyimi</p>
              <ListEditor
                items={form.experiences}
                emptyItem={EMPTY_EXPERIENCE}
                fields={[
                  { key: 'title', placeholder: 'Pozisyon' },
                  { key: 'organization', placeholder: 'Kurum' },
                  { key: 'period', placeholder: 'Dönem (ör. 2020–2024)' },
                  { key: 'description', placeholder: 'Kısa açıklama', full: true },
                ]}
                onChange={(experiences) => update({ experiences })}
                addLabel="Deneyim ekle"
              />
            </div>
          </>
        )}

        {tab === 'certs' && (
          <ListEditor
            items={form.certificates}
            emptyItem={EMPTY_CERTIFICATE}
            fields={[
              { key: 'name', placeholder: 'Sertifika / Diploma adı' },
              { key: 'issuer', placeholder: 'Veren kurum' },
              { key: 'year', placeholder: 'Yıl' },
            ]}
            onChange={(certificates) => update({ certificates })}
            addLabel="Sertifika ekle"
          />
        )}

        {tab === 'access' && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={form.email} onChange={(e) => update({ email: e.target.value })} placeholder="E-posta *" type="email" className="rounded-xl border border-cream-200 px-4 py-3 text-sm" />
              <input value={form.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="Telefon" className="rounded-xl border border-cream-200 px-4 py-3 text-sm" />
            </div>

            <div>
              <input value={form.password} onChange={(e) => update({ password: e.target.value })} placeholder={isEdit ? 'Şifre (değiştirmek için doldurun)' : 'Şifre *'} type="password" className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm" />
              {form.password && (
                <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {PASSWORD_RULES.map((r) => {
                    const ok = r.test(form.password)
                    return (
                      <li key={r.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-sage-600' : 'text-cream-800/50'}`}>
                        {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />} {r.label}
                      </li>
                    )
                  })}
                </ul>
              )}
              <p className="mt-1.5 text-xs text-cream-800/45">Personel paneline giriş bilgileri.</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-cream-800/80">Randevu için çalışma günleri</p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      form.workDays.includes(d.value) ? 'bg-brand-500 text-white' : 'bg-cream-100 text-cream-800'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-cream-800/70">Başlangıç</span>
                <input type="time" value={form.workStart} onChange={(e) => update({ workStart: e.target.value })} className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-cream-800/70">Bitiş</span>
                <input type="time" value={form.workEnd} onChange={(e) => update({ workEnd: e.target.value })} className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm" />
              </label>
            </div>
          </>
        )}
      </div>

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      <button type="button" onClick={submit} className="mt-4 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600">
        {isEdit ? 'Profili Kaydet' : 'Uzmanı Kaydet'}
      </button>
    </Modal>
  )
}

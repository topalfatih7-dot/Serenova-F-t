import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, Upload, Loader2, X, FileText, UserPlus } from 'lucide-react'
import Modal from '../ui/Modal'
import { toggleInList, OTHER_OPTION } from '../../data/staffApplication'
import { staffRoleLabel } from '../../utils/staffRoles'

export const TONE_STYLES = {
  brand: { active: 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-200/50', idle: 'bg-brand-50 text-brand-800 ring-brand-100 hover:bg-brand-100', bar: 'from-brand-400 to-brand-600' },
  sky: { active: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200/50', idle: 'bg-sky-50 text-sky-800 ring-sky-100 hover:bg-sky-100', bar: 'from-sky-400 to-blue-500' },
  emerald: { active: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200/50', idle: 'bg-emerald-50 text-emerald-800 ring-emerald-100 hover:bg-emerald-100', bar: 'from-emerald-400 to-teal-500' },
  amber: { active: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200/50', idle: 'bg-amber-50 text-amber-900 ring-amber-100 hover:bg-amber-100', bar: 'from-amber-400 to-orange-500' },
  violet: { active: 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md shadow-violet-200/50', idle: 'bg-violet-50 text-violet-800 ring-violet-100 hover:bg-violet-100', bar: 'from-violet-400 to-fuchsia-500' },
  sage: { active: 'bg-gradient-to-br from-sage-500 to-emerald-600 text-white shadow-md shadow-sage-200/50', idle: 'bg-sage-50 text-sage-800 ring-sage-100 hover:bg-sage-100', bar: 'from-sage-400 to-emerald-500' },
  rose: { active: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-200/50', idle: 'bg-rose-50 text-rose-800 ring-rose-100 hover:bg-rose-100', bar: 'from-rose-400 to-pink-500' },
  teal: { active: 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-200/50', idle: 'bg-teal-50 text-teal-800 ring-teal-100 hover:bg-teal-100', bar: 'from-teal-400 to-cyan-500' },
}

const SERVICE_TONES = ['brand', 'sky', 'emerald', 'amber', 'violet', 'sage', 'rose']

export function AccordionSection({ id, title, subtitle, icon: Icon, tone = 'brand', open, onToggle, count, children }) {
  const style = TONE_STYLES[tone] || TONE_STYLES.brand
  return (
    <div className="overflow-hidden rounded-2xl border border-cream-200/80 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-cream-50/80 sm:px-5"
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${style.bar} text-white shadow-sm`}>
          {Icon && <Icon className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-cream-900">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-cream-800/55">{subtitle}</p>}
        </div>
        {count > 0 && (
          <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-bold text-sage-700">{count}</span>
        )}
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-cream-400">
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-cream-100 px-4 pb-5 pt-4 sm:px-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function GroupedChipSelect({ groups, selected, onChange, otherValue, onOtherChange, showOther = true }) {
  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const tone = TONE_STYLES[group.tone] || TONE_STYLES.brand
        const groupSelected = group.items.filter((i) => selected.includes(i)).length
        return (
          <div key={group.id || group.label} className="rounded-xl border border-cream-100 bg-gradient-to-br from-white to-cream-50/50 p-3">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-cream-800/60">{group.label}</p>
              {groupSelected > 0 && <span className="text-[10px] font-semibold text-sage-600">{groupSelected} seçili</span>}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {group.items.map((item) => {
                const active = selected.includes(item)
                return (
                  <motion.button
                    key={item}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onChange(toggleInList(selected, item))}
                    className={`relative rounded-xl px-2.5 py-2.5 text-left text-[11px] font-semibold leading-snug ring-1 transition ${active ? tone.active : tone.idle}`}
                  >
                    {active && <Check className="absolute right-1.5 top-1.5 h-3 w-3 opacity-90" strokeWidth={3} />}
                    {item}
                  </motion.button>
                )
              })}
            </div>
          </div>
        )
      })}
      {showOther && (
        <OtherOptionBlock
          selected={selected.includes(OTHER_OPTION)}
          onToggle={() => onChange(toggleInList(selected, OTHER_OPTION))}
          value={otherValue}
          onChange={onOtherChange}
          placeholder="Diğer uzmanlık alanını yazın"
        />
      )}
    </div>
  )
}

export function FlatChipSelect({ items, selected, onChange, tone = 'brand', columns = 2, showOther = true, otherValue, onOtherChange, otherPlaceholder }) {
  const style = TONE_STYLES[tone] || TONE_STYLES.brand
  const list = items.filter((i) => i !== OTHER_OPTION)
  return (
    <div className="space-y-3">
      {list.length > 0 && (
        <div className={`grid gap-2 ${columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : columns === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {list.map((item) => {
            const active = selected.includes(item)
            return (
              <motion.button
                key={item}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => onChange(toggleInList(selected, item))}
                className={`rounded-xl px-3 py-2.5 text-left text-xs font-semibold ring-1 transition ${active ? style.active : style.idle}`}
              >
                <span className="flex items-start gap-2">
                  {active && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={3} />}
                  <span>{item}</span>
                </span>
              </motion.button>
            )
          })}
        </div>
      )}
      {showOther && (
        <OtherOptionBlock
          selected={selected.includes(OTHER_OPTION)}
          onToggle={() => onChange(toggleInList(selected, OTHER_OPTION))}
          value={otherValue}
          onChange={onOtherChange}
          placeholder={otherPlaceholder || 'Diğer seçeneği belirtin'}
          tone={tone}
        />
      )}
    </div>
  )
}

export function ServiceAreaGrid({ items, selected, onChange, otherValue, onOtherChange }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.filter((i) => i !== OTHER_OPTION).map((item, idx) => {
          const tone = TONE_STYLES[SERVICE_TONES[idx % SERVICE_TONES.length]]
          const active = selected.includes(item)
          return (
            <motion.button
              key={item}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange(toggleInList(selected, item))}
              className={`relative overflow-hidden rounded-2xl p-4 text-left ring-1 transition ${active ? tone.active : `${tone.idle} hover:shadow-sm`}`}
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone.bar}`} />
              <p className="mt-1 text-xs font-bold leading-snug">{item}</p>
              {active && <Check className="absolute right-2 top-3 h-4 w-4" strokeWidth={3} />}
            </motion.button>
          )
        })}
      </div>
      <OtherOptionBlock
        selected={selected.includes(OTHER_OPTION)}
        onToggle={() => onChange(toggleInList(selected, OTHER_OPTION))}
        value={otherValue}
        onChange={onOtherChange}
        placeholder="Diğer hizmet alanını yazın"
        tone="amber"
      />
    </div>
  )
}

function OtherOptionBlock({ selected, onToggle, value, onChange, placeholder, tone = 'violet' }) {
  const style = TONE_STYLES[tone] || TONE_STYLES.violet
  return (
    <div className="rounded-xl border border-dashed border-cream-200 bg-cream-50/50 p-3">
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={onToggle}
        className={`w-full rounded-xl px-3 py-2.5 text-left text-xs font-bold ring-1 transition ${selected ? style.active : style.idle}`}
      >
        <span className="flex items-center gap-2">
          {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          {OTHER_OPTION}
        </span>
      </motion.button>
      <AnimatePresence>
        {selected && (
          <motion.input
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export function BulkCertUpload({ files, uploading, onUpload, onRemove }) {
  const inputRef = useRef(null)
  return (
    <div className="rounded-2xl border-2 border-dashed border-sage-200 bg-gradient-to-br from-sage-50/80 to-emerald-50/40 p-5">
      <p className="text-sm font-bold text-cream-900">Sertifika Belgeleri</p>
      <p className="mt-1 text-xs text-cream-800/60">Seçtiğiniz tüm sertifikaların PDF veya fotoğraflarını buraya toplu yükleyin (birden fazla dosya).</p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={(e) => { onUpload(Array.from(e.target.files || [])); e.target.value = '' }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-sage-700 shadow-sm ring-1 ring-sage-200 transition hover:bg-sage-50 disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? 'Yükleniyor…' : 'Dosya seç veya sürükle (PDF / görsel)'}
      </button>
      {files?.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f, i) => (
            <li key={f.url || i} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-xs ring-1 ring-cream-100">
              <span className="flex min-w-0 items-center gap-2 text-cream-800">
                <FileText className="h-3.5 w-3.5 shrink-0 text-sage-600" />
                <span className="truncate">{f.name || `Belge ${i + 1}`}</span>
              </span>
              <button type="button" onClick={() => onRemove(i)} className="shrink-0 rounded p-1 text-cream-400 hover:bg-red-50 hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ApplicationSummaryModal({ open, onClose, form, submitting, onSubmit }) {
  const isCoach = form.role === 'coach'
  const GENDER_LABELS = { female: 'Kadın', male: 'Erkek' }
  const EDU = { lise: 'Lise', onlisans: 'Önlisans', lisans: 'Lisans' }

  return (
    <Modal open={open} onClose={() => !submitting && onClose()} title="Başvuru Özeti" size="lg">
      <div className="space-y-5 text-sm">
        <p className="rounded-xl bg-sage-50 px-4 py-3 text-xs text-sage-800">
          Göndermeden önce bilgilerinizi kontrol edin. Onay sonrası personel paneli erişiminiz açılır.
        </p>

        <SummarySection title="Kişisel">
          {form.photo && (
            <div className="mb-3 flex justify-center">
              <img src={form.photo} alt={form.name} className="h-24 w-24 rounded-2xl object-cover ring-2 ring-brand-100" />
            </div>
          )}
          <SummaryRow label="Rol" value={staffRoleLabel(form.role)} />
          <SummaryRow label="Ad Soyad" value={form.name} />
          <SummaryRow label="E-posta" value={form.email} />
          <SummaryRow label="Telefon" value={form.phone} />
          <SummaryRow label="Cinsiyet" value={GENDER_LABELS[form.gender]} />
          <SummaryRow label="Konum" value={form.city ? `${form.city} / ${form.district}` : ''} />
          {form.hasGym && <SummaryRow label="Salon" value={[form.gymName, form.gymCity, form.gymDistrict].filter(Boolean).join(' · ')} />}
        </SummarySection>

        <SummarySection title="Uzmanlık">
          <SummaryRow label="Alanlar" value={[...(form.specialties || []), form.specialtyOther].filter(Boolean).join(', ')} />
          <SummaryRow label="Deneyim" value={form.experienceYears ? `${form.experienceYears} yıl` : ''} />
          {isCoach && <SummaryRow label="Yetkin gruplar" value={[...(form.competentGroups || []), form.competentGroupOther].filter(Boolean).join(', ')} />}
          {!isCoach && (
            <>
              <SummaryRow label="Mezuniyet" value={form.graduationDepartment} />
              <SummaryRow label="Oda no" value={form.licenseNumber} />
            </>
          )}
        </SummarySection>

        {isCoach && (
          <SummarySection title="Eğitim & Sertifika">
            <SummaryRow label="Eğitim" value={[EDU[form.educationLevel], form.educationDepartment, form.educationGpa && `GPA ${form.educationGpa}`].filter(Boolean).join(' · ')} />
            <SummaryRow label="Resmi antrenörlük" value={(form.officialCoachingCerts || []).join(', ')} />
            <SummaryRow label="Uluslararası" value={[...(form.internationalCerts || []), form.certOtherNotes?.international].filter(Boolean).join(', ')} />
            <SummaryRow label="Branş" value={[...(form.branchCerts || []), form.certOtherNotes?.branch].filter(Boolean).join(', ')} />
            <SummaryRow label="Belgeler" value={`${(form.certificateFiles || []).length} dosya yüklendi`} />
          </SummarySection>
        )}

        {isCoach && (
          <SummarySection title="Yaklaşım & Hizmet">
            <SummaryRow label="Yaklaşımlar" value={[...(form.workApproaches || []), form.workApproachOther].filter(Boolean).join(', ')} />
            <SummaryRow label="Hizmet alanları" value={[...(form.serviceAreas || []), form.serviceAreaOther].filter(Boolean).join(', ')} />
          </SummarySection>
        )}

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="btn-wellness flex w-full items-center justify-center gap-2 !py-3.5 disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" />
          {submitting ? 'Gönderiliyor…' : 'Başvuruyu Onayla ve Gönder'}
        </button>
      </div>
    </Modal>
  )
}

function SummarySection({ title, children }) {
  return (
    <div className="rounded-xl border border-cream-100 bg-cream-50/50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-600">{title}</p>
      <dl className="mt-2 space-y-1.5">{children}</dl>
    </div>
  )
}

function SummaryRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-xs">
      <dt className="w-28 shrink-0 text-cream-800/50">{label}</dt>
      <dd className="font-medium text-cream-900">{value}</dd>
    </div>
  )
}

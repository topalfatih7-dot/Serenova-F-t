import { useMemo, useState } from 'react'
import {
  Search, Users, Activity, Target, Salad, CalendarClock, ClipboardList,
  Dumbbell, Apple, Mail, CalendarRange, Plus, Trash2, Video, UserRound, FileText,
  Check, CalendarCheck,
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import AvailabilityView from '../../components/package/AvailabilityView'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { calculateBMI, bmiCategory, GOAL_LABELS, FITNESS_LABELS, NUTRITION_LABELS } from '../../services/health'
import { AVAILABILITY_WEEKDAYS } from '../../services/availability'
import { getStaffClients, getStaffAppointments } from './StaffOverviewPage'
import VideoJoinLink from '../../components/video/VideoJoinLink'

const weekdayName = (v) => AVAILABILITY_WEEKDAYS.find((d) => d.value === Number(v))?.label || ''

function entryToText(e) {
  const amount = e.amountType === 'duration' ? `${e.amount} ${e.durationUnit || 'sn'}` : `${e.amount} tekrar`
  return `${weekdayName(e.day)} ${e.start}-${e.end} · ${e.exerciseName} · ${amount}`
}

// Koç program oluşturucu — takvim tabanlı gün seçici + iki sütun düzeni
function CoachProgramBuilder({ exercises, onCreate }) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [entries, setEntries] = useState([])
  const [selectedDay, setSelectedDay] = useState(1)
  const [exSearch, setExSearch] = useState('')
  const [selectedExId, setSelectedExId] = useState('')
  const [draft, setDraft] = useState({
    start: '09:00', end: '09:45', amountType: 'reps', amount: 12, durationUnit: 'sn', note: '',
  })

  const filteredExercises = useMemo(
    () => exercises.filter((ex) =>
      !exSearch ||
      ex.name.toLowerCase().includes(exSearch.toLowerCase()) ||
      (ex.category || '').toLowerCase().includes(exSearch.toLowerCase())
    ),
    [exercises, exSearch]
  )

  const dayEntries = useMemo(
    () => [...entries.filter((e) => e.day === selectedDay)].sort((a, b) => a.start.localeCompare(b.start)),
    [entries, selectedDay]
  )

  const entriesPerDay = useMemo(
    () => AVAILABILITY_WEEKDAYS.reduce((acc, d) => {
      acc[d.value] = entries.filter((e) => e.day === d.value).length
      return acc
    }, {}),
    [entries]
  )

  const addEntry = () => {
    const ex = exercises.find((x) => x.id === selectedExId)
    if (!ex) { toast('Kütüphaneden bir hareket seçin', 'error'); return }
    if (draft.end <= draft.start) { toast('Bitiş saati başlangıçtan sonra olmalı', 'error'); return }
    setEntries((list) => [
      ...list,
      {
        id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        day: selectedDay, start: draft.start, end: draft.end,
        exerciseId: ex.id, exerciseName: ex.name, videoUrl: ex.videoUrl || '', description: ex.description || '',
        amountType: draft.amountType, amount: Number(draft.amount) || 0, durationUnit: draft.durationUnit, note: draft.note.trim(),
      },
    ])
    setSelectedExId('')
    setDraft((d) => ({ ...d, note: '' }))
  }

  const removeEntry = (id) => setEntries((list) => list.filter((e) => e.id !== id))

  const submit = () => {
    if (!title.trim()) { toast('Program başlığı gerekli', 'error'); return }
    if (entries.length === 0) { toast('En az bir hareket ekleyin', 'error'); return }
    const ordered = [...entries].sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))
    onCreate({ title: title.trim(), description: description.trim(), entries: ordered, items: ordered.map(entryToText) })
    setTitle(''); setDescription(''); setEntries([])
  }

  const selectedDayName = weekdayName(selectedDay)

  return (
    <div className="space-y-4">
      {/* Başlık & Notlar */}
      <div className="space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Program başlığı (ör. 4 Haftalık Güç Programı)"
          className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Genel notlar (opsiyonel)"
          rows={2}
          className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300"
        />
      </div>

      {/* Haftalık takvim — gün seçici */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/50">Gün Seç</p>
        <div className="grid grid-cols-7 gap-1">
          {AVAILABILITY_WEEKDAYS.map((d) => {
            const count = entriesPerDay[d.value] || 0
            const isSelected = selectedDay === d.value
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => setSelectedDay(d.value)}
                className={`flex flex-col items-center justify-center rounded-xl py-2.5 text-center text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-brand-500 text-white shadow-md'
                    : count > 0
                    ? 'border border-brand-200 bg-brand-50 text-brand-700'
                    : 'bg-cream-50 text-cream-800/60 hover:bg-cream-100'
                }`}
              >
                <span>{d.short}</span>
                {count > 0 && (
                  <span className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                    isSelected ? 'bg-white/30 text-white' : 'bg-brand-500 text-white'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* İki sütun — PC: yan yana, Mobil: alt alta */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sol: seçili günün hareketleri */}
        <div className="flex min-h-[200px] flex-col rounded-xl border border-cream-200 bg-white p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-cream-800/70">
            <CalendarCheck className="h-3.5 w-3.5 text-brand-500" />
            {selectedDayName} — {dayEntries.length} hareket
          </p>
          {dayEntries.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <Dumbbell className="h-8 w-8 text-cream-200" />
              <p className="mt-2 text-xs text-cream-800/40">Sağ panelden hareket ekleyin</p>
            </div>
          ) : (
            <div className="space-y-1.5 overflow-y-auto">
              {dayEntries.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-cream-100 bg-cream-50 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-cream-900">{e.exerciseName}</p>
                    <p className="text-xs text-cream-800/55">
                      {e.start}–{e.end} · {e.amountType === 'duration' ? `${e.amount} ${e.durationUnit}` : `${e.amount} tekrar`}
                    </p>
                    {e.note && <p className="text-[11px] italic text-cream-800/40">{e.note}</p>}
                  </div>
                  {e.videoUrl && <Video className="h-3.5 w-3.5 shrink-0 text-brand-400" />}
                  <button type="button" onClick={() => removeEntry(e.id)} className="shrink-0 rounded p-1 text-red-400 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sağ: hareket ekleme */}
        <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
            {selectedDayName} için Hareket Ekle
          </p>

          {/* Kütüphane arama */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream-400" />
            <input
              value={exSearch}
              onChange={(e) => setExSearch(e.target.value)}
              placeholder="Kütüphanede ara…"
              className="w-full rounded-lg border border-cream-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-brand-300"
            />
          </div>

          {/* Hareket listesi */}
          <div className="mb-3 max-h-36 overflow-y-auto rounded-lg border border-cream-200 bg-white">
            {filteredExercises.length === 0 ? (
              <p className="p-3 text-center text-xs text-cream-800/40">Sonuç bulunamadı</p>
            ) : filteredExercises.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setSelectedExId(ex.id)}
                className={`flex w-full items-center gap-2 border-b border-cream-50 px-3 py-2 text-left text-sm transition last:border-0 ${
                  selectedExId === ex.id ? 'bg-brand-50 text-brand-700' : 'text-cream-800 hover:bg-cream-50'
                }`}
              >
                <Dumbbell className="h-3.5 w-3.5 shrink-0 text-brand-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{ex.name}</p>
                  {ex.category && <p className="text-[10px] text-cream-800/50">{ex.category}</p>}
                </div>
                {selectedExId === ex.id && <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-brand-500" />}
              </button>
            ))}
          </div>

          {/* Saat & miktar */}
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-cream-800/60">
              Başlangıç
              <input type="time" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} className="mt-1 w-full rounded-lg border border-cream-200 bg-white px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-cream-800/60">
              Bitiş
              <input type="time" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} className="mt-1 w-full rounded-lg border border-cream-200 bg-white px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-cream-800/60">
              Ölçü tipi
              <select value={draft.amountType} onChange={(e) => setDraft({ ...draft, amountType: e.target.value })} className="mt-1 w-full rounded-lg border border-cream-200 bg-white px-2 py-1.5 text-sm">
                <option value="reps">Tekrar</option>
                <option value="duration">Süre</option>
              </select>
            </label>
            <label className="text-xs text-cream-800/60">
              {draft.amountType === 'duration' ? 'Süre' : 'Tekrar'}
              <div className="mt-1 flex gap-1.5">
                <input type="number" min={1} value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} className="w-full rounded-lg border border-cream-200 bg-white px-2 py-1.5 text-sm" />
                {draft.amountType === 'duration' && (
                  <select value={draft.durationUnit} onChange={(e) => setDraft({ ...draft, durationUnit: e.target.value })} className="rounded-lg border border-cream-200 bg-white px-1.5 py-1.5 text-sm">
                    <option value="sn">sn</option>
                    <option value="dk">dk</option>
                  </select>
                )}
              </div>
            </label>
          </div>
          <input
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            placeholder="Not (ör. 3 set, 60 sn dinlenme)"
            className="mt-2 w-full rounded-lg border border-cream-200 bg-white px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={addEntry}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            {`${selectedDayName}'ya Ekle`}
          </button>
        </div>
      </div>

      {/* Program özeti */}
      {entries.length > 0 && (
        <div className="rounded-xl border border-cream-100 bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/50">
            Program Özeti — {entries.length} hareket
          </p>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABILITY_WEEKDAYS.filter((d) => (entriesPerDay[d.value] || 0) > 0).map((d) => (
              <span
                key={d.value}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  selectedDay === d.value ? 'bg-brand-500 text-white' : 'bg-brand-100 text-brand-700'
                }`}
              >
                {d.short}: {entriesPerDay[d.value]}
              </span>
            ))}
          </div>
        </div>
      )}

      <button type="button" onClick={submit} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600">
        Programı Gönder
      </button>
      <p className="text-center text-xs text-cream-800/50">Program danışana bildirim olarak iletilir.</p>
    </div>
  )
}

// Diyetisyen beslenme programı (serbest metin)
function NutritionProgramForm({ onCreate }) {
  const { toast } = useToast()
  const [form, setForm] = useState({ title: '', description: '', items: '' })

  const submit = () => {
    if (!form.title.trim()) { toast('Program başlığı gerekli', 'error'); return }
    const items = form.items.split('\n').map((s) => s.trim()).filter(Boolean)
    onCreate({ title: form.title.trim(), description: form.description.trim(), items })
    setForm({ title: '', description: '', items: '' })
  }

  return (
    <div className="rounded-2xl border border-sage-200 bg-sage-50/40 p-4">
      <p className="flex items-center gap-2 font-semibold text-cream-900">
        <ClipboardList className="h-4 w-4 text-sage-600" /> Beslenme Programı Oluştur
      </p>
      <div className="mt-3 space-y-3">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Program başlığı (ör. Dengeli Beslenme Planı)" className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Açıklama / genel notlar" rows={2} className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm" />
        <textarea value={form.items} onChange={(e) => setForm({ ...form, items: e.target.value })} placeholder={'Her satıra bir öğün/madde:\nKahvaltı: Yulaf + meyve\nÖğle: Izgara tavuk + salata\nAkşam: Sebze + protein'} rows={5} className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm" />
        <button type="button" onClick={submit} className="w-full rounded-xl bg-sage-500 py-2.5 text-sm font-semibold text-white hover:bg-sage-600">Programı Gönder</button>
        <p className="text-center text-xs text-cream-800/50">Program danışana bildirim olarak iletilir.</p>
      </div>
    </div>
  )
}

function ClientInfo({ member, role, isCoach }) {
  const bmi = calculateBMI(member.weight, member.height)
  const cat = bmiCategory(bmi)
  const appts = getStaffAppointments([member], role)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        {member.photo && (
          <img src={member.photo} alt={member.name} className="h-40 w-32 shrink-0 self-center rounded-2xl border border-cream-200 object-cover sm:self-start" />
        )}
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-cream-50 p-3">
            <p className="text-xs text-cream-800/50">Vücut Kitle İndeksi</p>
            <p className="mt-1 font-display text-2xl font-bold text-cream-900">{bmi ?? '—'}</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${cat.color}`}>{cat.label}</span>
          </div>
          <div className="rounded-xl bg-cream-50 p-3">
            <p className="text-xs text-cream-800/50">Ölçüler</p>
            <p className="mt-1 text-sm font-medium text-cream-900">{member.weight ? `${member.weight} kg` : '—'} · {member.height ? `${member.height} cm` : '—'}</p>
            <p className="mt-1 text-xs text-cream-800/50">Bel: {member.waist ? `${member.waist} cm` : '—'}</p>
          </div>
          <div className="rounded-xl bg-cream-50 p-3">
            <p className="text-xs text-cream-800/50">Spor Seviyesi</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-cream-900">
              <Activity className="h-4 w-4 text-brand-500" /> {FITNESS_LABELS[member.fitnessLevel] || '—'}
            </p>
            <p className="mt-1 text-xs text-cream-800/50">Yaş: {member.age || '—'} · {member.gender === 'female' ? 'Kadın' : member.gender === 'male' ? 'Erkek' : '—'}</p>
          </div>
          <div className="rounded-xl bg-cream-50 p-3">
            <p className="text-xs text-cream-800/50">İletişim</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-cream-900 break-all"><Mail className="h-3.5 w-3.5 shrink-0" /> {member.email}</p>
            {member.phone && <p className="mt-1 text-xs text-cream-800/55">{member.phone}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-cream-800/80"><Target className="h-4 w-4 text-brand-500" /> Hedefler</p>
          <Chips values={member.goals} map={GOAL_LABELS} />
        </div>
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-cream-800/80"><Salad className="h-4 w-4 text-sage-500" /> Beslenme Tercihleri</p>
          <Chips values={member.nutritionPrefs} map={NUTRITION_LABELS} />
        </div>
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-cream-800/80"><CalendarRange className="h-4 w-4 text-brand-500" /> Haftalık Müsaitlik</p>
        <AvailabilityView value={member.availability} emptyText="Danışan henüz müsait saat belirtmemiş." />
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-cream-800/80"><CalendarClock className="h-4 w-4 text-brand-500" /> Yaklaşan Randevular</p>
        {appts.length === 0 ? (
          <p className="text-sm text-cream-800/40">Yaklaşan randevu yok</p>
        ) : (
          <div className="space-y-1.5">
            {appts.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-cream-50 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-cream-800/70">{a.title}</span>
                <span className="shrink-0 font-medium text-cream-900">{format(new Date(a.date), 'd MMM, HH:mm', { locale: tr })}</span>
                <VideoJoinLink
                  session={a}
                  sessionType={isCoach ? 'coach' : 'dietitian'}
                  audience="staff"
                  size="sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Chips({ values, map }) {
  if (!values?.length) return <span className="text-sm text-cream-800/40">—</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <span key={v} className="rounded-full bg-cream-100 px-2.5 py-1 text-xs font-medium text-cream-800">
          {map[v] || v}
        </span>
      ))}
    </div>
  )
}

export default function StaffClientsPage() {
  const { staffUser, platform, createProgram, exercises } = useApp()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [infoClient, setInfoClient] = useState(null)
  const [programClient, setProgramClient] = useState(null)
  const isCoach = staffUser.role === 'coach'
  const RoleIcon = isCoach ? Dumbbell : Apple

  const clients = useMemo(() => getStaffClients(platform.members, staffUser.role, staffUser.id), [platform.members, staffUser.role, staffUser.id])
  const filtered = clients.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = (data) => {
    if (!programClient) return
    createProgram({
      type: isCoach ? 'workout' : 'nutrition',
      memberId: programClient.id,
      memberName: programClient.name,
      staffId: staffUser.id,
      staffName: staffUser.name,
      ...data,
    })
    toast(`${programClient.name} için program oluşturuldu ve bildirildi`, 'success')
    setProgramClient(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Danışanlarım</h1>
        <p className="mt-1 text-sm text-cream-800/60">{clients.length} danışan · bilgileri görüntüleyin veya program oluşturun</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
        <input
          type="text"
          placeholder="İsim veya e-posta ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-cream-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-300"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Danışan bulunamadı" description="Size atanan ücretli üyeler burada görünecek." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => {
            const bmi = calculateBMI(m.weight, m.height)
            const cat = bmiCategory(bmi)
            return (
              <div
                key={m.id}
                className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-600">
                    {m.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-cream-900">{m.name}</p>
                    <p className="truncate text-xs text-cream-800/50">{m.email}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-cream-800/60">
                    <RoleIcon className="h-4 w-4" /> {FITNESS_LABELS[m.fitnessLevel] || '—'}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cat.color}`}>
                    VKİ {bmi ?? '—'}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInfoClient(m)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-cream-200 bg-cream-50 py-2.5 text-xs font-semibold text-cream-800 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <UserRound className="h-3.5 w-3.5" /> Bilgiler
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgramClient(m)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-600"
                  >
                    <FileText className="h-3.5 w-3.5" /> Program Oluştur
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={!!infoClient} onClose={() => setInfoClient(null)} title={infoClient?.name} size="lg">
        {infoClient && <ClientInfo member={infoClient} role={staffUser.role} isCoach={isCoach} />}
      </Modal>

      <Modal open={!!programClient} onClose={() => setProgramClient(null)} title={`${programClient?.name} — Program`} size="xl">
        {programClient && (
          isCoach
            ? <CoachProgramBuilder member={programClient} exercises={exercises} onCreate={handleCreate} />
            : <NutritionProgramForm onCreate={handleCreate} />
        )}
      </Modal>
    </div>
  )
}

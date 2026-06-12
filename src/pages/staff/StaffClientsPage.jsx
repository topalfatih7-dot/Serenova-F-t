import { useMemo, useState } from 'react'
import {
  Search, Users, Activity, Target, Salad, CalendarClock, ClipboardList,
  Dumbbell, Apple, Mail, ChevronRight, CalendarRange,
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import AvailabilityView from '../../components/package/AvailabilityView'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { calculateBMI, bmiCategory, GOAL_LABELS, FITNESS_LABELS, NUTRITION_LABELS } from '../../services/health'
import { getStaffClients, getStaffAppointments } from './StaffOverviewPage'

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

function ClientDetail({ member, role, onCreate }) {
  const isCoach = role === 'coach'
  const bmi = calculateBMI(member.weight, member.height)
  const cat = bmiCategory(bmi)
  const appts = getStaffAppointments([member], role)
  const [form, setForm] = useState({ title: '', description: '', items: '' })
  const { toast } = useToast()

  const submit = () => {
    if (!form.title.trim()) { toast('Program başlığı gerekli', 'error'); return }
    const items = form.items.split('\n').map((s) => s.trim()).filter(Boolean)
    onCreate({ title: form.title.trim(), description: form.description.trim(), items })
    setForm({ title: '', description: '', items: '' })
  }

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
            <p className="text-xs text-cream-800/50">Fitness Seviyesi</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-cream-900">
              <Activity className="h-4 w-4 text-brand-500" /> {FITNESS_LABELS[member.fitnessLevel] || '—'}
            </p>
            <p className="mt-1 text-xs text-cream-800/50">Yaş: {member.age || '—'} · {member.gender === 'female' ? 'Kadın' : member.gender === 'male' ? 'Erkek' : '—'}</p>
          </div>
          <div className="rounded-xl bg-cream-50 p-3">
            <p className="text-xs text-cream-800/50">İletişim</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-cream-900 break-all"><Mail className="h-3.5 w-3.5 shrink-0" /> {member.email}</p>
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
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-cream-50 px-3 py-2 text-sm">
                <span className="text-cream-800/70">{a.title}</span>
                <span className="font-medium text-cream-900">{format(new Date(a.date), 'd MMM, HH:mm', { locale: tr })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
        <p className="flex items-center gap-2 font-semibold text-cream-900">
          <ClipboardList className="h-4 w-4 text-brand-600" />
          {isCoach ? 'Çalışma Programı Oluştur' : 'Beslenme Programı Oluştur'}
        </p>
        <div className="mt-3 space-y-3">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={isCoach ? 'Program başlığı (ör. 4 Haftalık Güç Programı)' : 'Program başlığı (ör. Dengeli Beslenme Planı)'}
            className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Açıklama / genel notlar"
            rows={2}
            className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm"
          />
          <textarea
            value={form.items}
            onChange={(e) => setForm({ ...form, items: e.target.value })}
            placeholder={isCoach
              ? 'Her satıra bir madde:\nPazartesi: Alt vücut – 4x12\nÇarşamba: Üst vücut – 4x10\nCuma: Kardiyo 30dk'
              : 'Her satıra bir öğün/madde:\nKahvaltı: Yulaf + meyve\nÖğle: Izgara tavuk + salata\nAkşam: Sebze + protein'}
            rows={5}
            className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm"
          />
          <button type="button" onClick={submit} className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
            Programı Gönder
          </button>
          <p className="text-center text-xs text-cream-800/50">Program danışana bildirim olarak iletilir.</p>
        </div>
      </div>
    </div>
  )
}

export default function StaffClientsPage() {
  const { staffUser, platform, createProgram } = useApp()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const isCoach = staffUser.role === 'coach'
  const RoleIcon = isCoach ? Dumbbell : Apple

  const clients = useMemo(() => getStaffClients(platform.members, staffUser.role, staffUser.id), [platform.members, staffUser.role, staffUser.id])
  const filtered = clients.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = (data) => {
    createProgram({
      type: isCoach ? 'workout' : 'nutrition',
      memberId: selected.id,
      memberName: selected.name,
      staffId: staffUser.id,
      staffName: staffUser.name,
      ...data,
    })
    toast(`${selected.name} için program oluşturuldu ve bildirildi`, 'success')
    setSelected(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Danışanlarım</h1>
        <p className="mt-1 text-sm text-cream-800/60">{clients.length} danışan · detay ve program için bir danışan seçin</p>
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
        <EmptyState icon={Users} title="Danışan bulunamadı" description="Premium üyeler kayıt oldukça burada görünecekler." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => {
            const bmi = calculateBMI(m.weight, m.height)
            const cat = bmiCategory(bmi)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelected(m)}
                className="rounded-2xl border border-cream-200 bg-white p-5 text-left shadow-sm transition hover:border-brand-200 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-600">
                    {m.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-cream-900">{m.name}</p>
                    <p className="truncate text-xs text-cream-800/50">{m.email}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-cream-800/30" />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-cream-800/60">
                    <RoleIcon className="h-4 w-4" /> {FITNESS_LABELS[m.fitnessLevel] || '—'}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cat.color}`}>
                    VKİ {bmi ?? '—'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} size="lg">
        {selected && <ClientDetail member={selected} role={staffUser.role} onCreate={handleCreate} />}
      </Modal>
    </div>
  )
}

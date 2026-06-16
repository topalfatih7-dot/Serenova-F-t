import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Dumbbell, Apple, Flame, Bell, Crown, MessageCircle, LineChart,
} from 'lucide-react'
import StatsCard from '../components/ui/StatsCard'
import MembershipBadge from '../components/ui/MembershipBadge'
import CalendarView from '../components/calendar/CalendarView'
import { WeightChart, WorkoutChart, MoodChart } from '../components/dashboard/ProgressChart'
import { useApp } from '../context/AppContext'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

function ChartEmpty({ message = 'Henüz veri yok' }) {
  return (
    <div className="flex h-56 flex-col items-center justify-center gap-2 text-center text-sm text-cream-800/50">
      <LineChart className="h-7 w-7 text-cream-800/30" />
      {message}
    </div>
  )
}

export default function DashboardPage() {
  const {
    user, membership, membershipStatus, packageConfig, coachSessions, dietitianSessions,
    tasks, progress, toggleTask,
  } = useApp()

  const nextCoach = coachSessions.find((s) => s.status === 'scheduled' && new Date(s.date) > new Date())
  const nextDietitian = dietitianSessions.find((s) => s.status === 'scheduled' && new Date(s.date) > new Date())
  const taskDone = tasks.filter((t) => t.done).length

  const calendarEvents = useMemo(() => [
    ...coachSessions
      .filter((s) => s.status !== 'cancelled')
      .map((s) => ({ id: s.id, title: 'Koç Görüşmesi', date: s.date, type: 'coach' })),
    ...dietitianSessions
      .filter((s) => s.status !== 'cancelled')
      .map((s) => ({ id: s.id, title: 'Diyetisyen', date: s.date, type: 'dietitian' })),
  ], [coachSessions, dietitianSessions])

  return (
    <div className="space-y-6">
      <div className="welcome-banner">
        <p className="text-sm font-medium text-white/80">Hoş geldiniz</p>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{user.name?.split(' ')[0] || 'Üye'}, bugün harika bir gün olabilir</h1>
        <p className="mt-2 text-sm text-white/75">Küçük adımlar büyük dönüşümlerin başlangıcıdır — görevlerinizi tamamlayarak ilerleyin.</p>
      </div>
      {membershipStatus === 'paused' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">Üyeliğiniz duraklatıldı. Yeniden başlatmak için destek alanından talep oluşturun.</p>
          <Link to="/support" className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white">
            Destek Alanı
          </Link>
        </div>
      )}

      {membershipStatus === 'cancelled' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">Üyeliğiniz iptal edildi. Yeniden başlatmak için destek alanından talep oluşturun.</p>
          <Link to="/support" className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white">
            Destek Alanı
          </Link>
        </div>
      )}

      {membership === 'free' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white p-5">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-gold-500" />
            <div>
              <p className="font-medium text-cream-900">Premium ile daha fazlasını keşfedin</p>
              <p className="text-sm text-cream-800/60">Birebir koç desteği ve detaylı takip</p>
            </div>
          </div>
          <Link to="/builder" className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white">Yükselt</Link>
        </motion.div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <MembershipBadge tier={membership} status={membershipStatus !== 'active' ? membershipStatus : null} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/support" className="flex items-center gap-1.5 rounded-xl border border-cream-200 px-3 py-2 text-xs font-medium hover:bg-cream-50">
            <MessageCircle className="h-3.5 w-3.5" /> Destek Alanı
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Aktif Plan" value={membership === 'premium' ? `${packageConfig.durationWeeks} hafta` : 'Ücretsiz'} sub={membership === 'premium' ? 'Premium' : 'Temel plan'} icon={Crown} accent="brand" />
        <StatsCard label="Sonraki Koç" value={nextCoach ? format(new Date(nextCoach.date), 'd MMM', { locale: tr }) : '—'} sub={nextCoach?.title || 'Planlanmadı'} icon={Dumbbell} accent="sage" />
        <StatsCard label="Sonraki Diyetisyen" value={nextDietitian ? format(new Date(nextDietitian.date), 'd MMM', { locale: tr }) : '—'} sub={nextDietitian?.title || 'Planlanmadı'} icon={Apple} accent="gold" />
        <StatsCard label="Seri" value={`${user.streak} gün`} sub={`Görevler: ${taskDone}/${tasks.length}`} icon={Flame} accent="brand" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card-solid p-6">
          <h3 className="font-semibold text-cream-900">Kilo Trendi</h3>
          {progress.weight?.length ? <WeightChart data={progress.weight} /> : <ChartEmpty message="Kilo kayıtlarınız burada görünecek" />}
        </div>
        <div className="glass-card-solid p-6">
          <h3 className="font-semibold text-cream-900">Antrenman Tamamlama</h3>
          {progress.workouts?.length ? <WorkoutChart data={progress.workouts} /> : <ChartEmpty message="Antrenman verileriniz burada görünecek" />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CalendarView events={calendarEvents} />
        </div>
        <div className="space-y-4">
          <div className="glass-card-solid p-5">
            <h3 className="flex items-center gap-2 font-semibold text-cream-900">
              <Bell className="h-4 w-4 text-brand-500" /> Günlük Görevler
            </h3>
            <div className="mt-4 space-y-2">
              {tasks.length === 0 ? (
                <p className="rounded-xl bg-cream-50 p-4 text-center text-sm text-cream-800/50">Henüz görev yok</p>
              ) : tasks.map((t) => (
                <label key={t.id} className={`flex items-center gap-3 rounded-xl p-3 ${t.done ? 'bg-sage-50' : 'bg-cream-50'}`}>
                  <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} className="accent-brand-500" />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${t.done ? 'line-through text-cream-800/40' : 'text-cream-900'}`}>{t.title}</p>
                    {t.progress !== undefined && (
                      <div className="mt-1 h-1.5 rounded-full bg-cream-200">
                        <div className="h-1.5 rounded-full bg-brand-400" style={{ width: `${(t.progress / t.target) * 100}%` }} />
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="glass-card-solid p-5">
            <h3 className="font-semibold text-cream-900">Enerji & Ruh Hali</h3>
            {progress.mood?.length ? <MoodChart data={progress.mood} /> : <ChartEmpty message="Ruh hali verileriniz burada görünecek" />}
          </div>
        </div>
      </div>
    </div>
  )
}

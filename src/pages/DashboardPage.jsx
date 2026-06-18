import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dumbbell, Apple, Flame, Crown, MessageCircle, LineChart,
  ChevronDown, ChevronUp, Salad, Activity,
  Check, Droplets, Target, Play, CalendarDays, ClipboardList,
} from 'lucide-react'
import StatsCard from '../components/ui/StatsCard'
import MembershipBadge from '../components/ui/MembershipBadge'
import OnboardingTutorial from '../components/ui/OnboardingTutorial'
import { WeightChart, WorkoutChart } from '../components/dashboard/ProgressChart'
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

// ─── KİŞİSEL ANALİZ PANELİ ─────────────────────────────────────────
function HealthAnalysisPanel({ analysis }) {
  const [open, setOpen] = useState(false)
  if (!analysis) return null

  const { bmi, bmiCategory, dailyCalories, coachRecommendations, dietitianRecommendations, fitnessScore } = analysis

  const bmiColors = {
    Normal: 'text-sage-600 bg-sage-50 border-sage-200',
    Zayıf: 'text-blue-600 bg-blue-50 border-blue-200',
    'Fazla Kilolu': 'text-amber-600 bg-amber-50 border-amber-200',
    Obez: 'text-red-600 bg-red-50 border-red-200',
  }
  const bmiColor = bmiColors[bmiCategory?.label] || bmiColors.Normal

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/70 via-white to-sage-50/50 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-sage-500 text-white shadow">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display font-bold text-cream-900">Kişisel Sağlık Özeti</p>
            <p className="text-xs text-cream-800/55">Profilinize özel koç & beslenme önerileri</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            {fitnessScore}/100
          </span>
          {open ? <ChevronUp className="h-4 w-4 text-cream-400" /> : <ChevronDown className="h-4 w-4 text-cream-400" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-brand-100"
          >
            <div className="p-5 space-y-6">
              {/* Vücut Durumu */}
              <div className="grid gap-3 sm:grid-cols-3">
                {bmi && (
                  <div className={`rounded-xl border px-4 py-3 ${bmiColor}`}>
                    <p className="text-xs font-medium opacity-70">VKİ</p>
                    <p className="font-display text-2xl font-bold">{bmi}</p>
                    <p className="text-xs font-semibold">{bmiCategory?.label}</p>
                    <p className="mt-1 text-[11px] opacity-75">{bmiCategory?.advice}</p>
                  </div>
                )}
                {dailyCalories && (
                  <div className="rounded-xl border border-sage-200 bg-sage-50 px-4 py-3 text-sage-700">
                    <p className="text-xs font-medium opacity-70">Günlük Kalori</p>
                    <p className="font-display text-2xl font-bold">{dailyCalories.recommended}</p>
                    <p className="text-xs font-semibold">kcal/gün ({dailyCalories.goal})</p>
                  </div>
                )}
                {dietitianRecommendations?.hydration && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700">
                    <div className="flex items-center gap-1.5">
                      <Droplets className="h-4 w-4" />
                      <p className="text-xs font-medium opacity-70">Günlük Su</p>
                    </div>
                    <p className="font-display text-2xl font-bold">{dietitianRecommendations.hydration.amount}</p>
                    <p className="text-xs font-semibold">{dietitianRecommendations.hydration.unit}/gün</p>
                  </div>
                )}
              </div>

              {/* Makro Besinler */}
              {dietitianRecommendations?.macros && (
                <div>
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-cream-900">
                    <Target className="h-4 w-4 text-brand-500" /> Günlük Makro Hedefler
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Protein', value: dietitianRecommendations.macros.protein, color: 'bg-red-100 text-red-700 border-red-200' },
                      { label: 'Karbonhidrat', value: dietitianRecommendations.macros.carb, color: 'bg-amber-100 text-amber-700 border-amber-200' },
                      { label: 'Yağ', value: dietitianRecommendations.macros.fat, color: 'bg-blue-100 text-blue-700 border-blue-200' },
                    ].map((m) => (
                      <div key={m.label} className={`rounded-xl border px-3 py-2.5 text-center ${m.color}`}>
                        <p className="text-lg font-bold">{m.value}g</p>
                        <p className="text-xs font-medium">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Önerileri */}
              {coachRecommendations?.exercises?.length > 0 && (
                <div>
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-cream-900">
                    <Play className="h-4 w-4 text-brand-500" /> Video Kütüphanesinden Öneriler
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                      {coachRecommendations.totalCount} video
                    </span>
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {coachRecommendations.exercises.map((ex) => (
                      <div key={ex.id} className="flex items-center gap-2.5 rounded-xl bg-cream-50 p-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                          <Dumbbell className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-cream-900">{ex.name}</p>
                          <p className="text-xs text-cream-800/55">{ex.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link to="/library" className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100">
                    Tüm Kütüphaneyi Gör
                  </Link>
                </div>
              )}

              {/* Beslenme İpuçları */}
              {dietitianRecommendations?.tips?.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-cream-900">
                    <Salad className="h-4 w-4 text-sage-500" /> Beslenme İpuçları
                  </p>
                  <ul className="space-y-1.5">
                    {dietitianRecommendations.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-cream-800/70">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-500" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function DashboardPage() {
  const {
    user, membership, membershipStatus, coachSessions, dietitianSessions,
    myPrograms, progress,
  } = useApp()

  const nextCoach = coachSessions.find((s) => s.status === 'scheduled' && new Date(s.date) > new Date())
  const nextDietitian = dietitianSessions.find((s) => s.status === 'scheduled' && new Date(s.date) > new Date())

  const planLabel = membership === 'free' ? 'Basic' :
    membership === 'gumus' ? 'Gümüş' :
    membership === 'altin' ? 'Altın' :
    membership === 'platinum' ? 'Platinum' : 'Premium'

  return (
    <div className="space-y-6">
      {/* İlk giriş eğitim popup'ı */}
      <OnboardingTutorial userId={user?.id} />

      <div className="welcome-banner">
        <p className="text-sm font-medium text-white/80">Hoş geldiniz</p>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{user.name?.split(' ')[0] || 'Üye'}, bugün harika bir gün olabilir</h1>
        <p className="mt-2 text-sm text-white/75">Küçük adımlar büyük dönüşümlerin başlangıcıdır — görevlerinizi tamamlayarak ilerleyin.</p>
      </div>

      {membershipStatus === 'paused' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">Üyeliğiniz duraklatıldı. Yeniden başlatmak için destek alanından talep oluşturun.</p>
          <Link to="/support" className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white">Destek Alanı</Link>
        </div>
      )}

      {membershipStatus === 'cancelled' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">Üyeliğiniz iptal edildi. Yeniden başlatmak için destek alanından talep oluşturun.</p>
          <Link to="/support" className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white">Destek Alanı</Link>
        </div>
      )}

      {membership === 'free' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white p-5">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-gold-500" />
            <div>
              <p className="font-medium text-cream-900">Daha fazlasını keşfedin</p>
              <p className="text-sm text-cream-800/60">Birebir koç & diyetisyen desteği için ücretli planlarımız</p>
            </div>
          </div>
          <Link to="/membership" className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white">Planları İncele</Link>
        </motion.div>
      )}

      {/* Kişisel analiz özeti — Basic paket kullanıcılarına göster */}
      {user.healthAnalysis && (
        <HealthAnalysisPanel analysis={user.healthAnalysis} />
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
        <StatsCard label="Aktif Plan" value={planLabel} sub={membership === 'free' ? 'Otomatik programlar' : 'Koç & Diyetisyen destekli'} icon={Crown} accent="brand" />
        <StatsCard label="Sonraki Koç" value={nextCoach ? format(new Date(nextCoach.date), 'd MMM', { locale: tr }) : '—'} sub={nextCoach?.title || 'Planlanmadı'} icon={Dumbbell} accent="sage" />
        <StatsCard label="Sonraki Diyetisyen" value={nextDietitian ? format(new Date(nextDietitian.date), 'd MMM', { locale: tr }) : '—'} sub={nextDietitian?.title || 'Planlanmadı'} icon={Apple} accent="gold" />
        <StatsCard label="Seri" value={`${user.streak ?? 0} gün`} sub="Kesintisiz gün" icon={Flame} accent="brand" />
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

      {/* Hızlı Erişim */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/calendar"
          className="group flex items-center gap-4 rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 shadow-sm transition hover:shadow-md hover:border-brand-300"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow group-hover:scale-110 transition">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-cream-900">Program Takvimi</p>
            <p className="text-xs text-cream-800/55">Günlük programınızı görün</p>
          </div>
        </Link>
        <Link
          to="/programs"
          className="group flex items-center gap-4 rounded-2xl border border-sage-200 bg-gradient-to-br from-sage-50 to-white p-5 shadow-sm transition hover:shadow-md hover:border-sage-300"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sage-500 text-white shadow group-hover:scale-110 transition">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-cream-900">Programlarım</p>
            <p className="text-xs text-cream-800/55">
              {myPrograms.length > 0 ? `${myPrograms.length} aktif program` : 'Koç & diyetisyen programları'}
            </p>
          </div>
        </Link>
        <Link
          to="/library"
          className="group flex items-center gap-4 rounded-2xl border border-cream-200 bg-gradient-to-br from-cream-50 to-white p-5 shadow-sm transition hover:shadow-md hover:border-cream-300"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cream-800 text-white shadow group-hover:scale-110 transition">
            <Play className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-cream-900">Video Kütüphanesi</p>
            <p className="text-xs text-cream-800/55">Egzersiz & beslenme videoları</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

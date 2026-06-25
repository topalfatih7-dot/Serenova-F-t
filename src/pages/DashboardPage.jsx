import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dumbbell, Apple, Flame, Crown, MessageCircle, LineChart,
  ChevronDown, ChevronUp, Salad, Activity,
  Check, Play, CalendarDays, ClipboardList, Star, HeartPulse, Sparkles,
} from 'lucide-react'
import StatsCard from '../components/ui/StatsCard'
import MembershipBadge from '../components/ui/MembershipBadge'
import SuccessStorySubmitModal from '../components/social/SuccessStorySubmitModal'
import { WeightChart, WorkoutChart, MealChart } from '../components/dashboard/ProgressChart'
import { getPlanLabel } from '../data/membershipPlans'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useHealthAnalysisSync } from '../hooks/useHealthAnalysisSync'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { isHealthTestComplete } from '../data/healthTest'

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
  const [open, setOpen] = useState(true)
  if (!analysis) return null

  const { bmi, bmiCategory, dailyCalories, coachRecommendations, dietitianRecommendations, fitnessScore, healthTestInsights, estimatedMetrics } = analysis

  const libraryWeeklyPlan = (coachRecommendations?.weeklyPlan || []).filter(
    (day) => day.exerciseNames?.length > 0,
  )

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
              {estimatedMetrics && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                  <HeartPulse className="mt-0.5 h-4 w-4 shrink-0" />
                  Sağlık testinize göre özet oluşturuldu. Profilinize boy, kilo ve yaş ekleyerek önerileri daha da kişiselleştirebilirsiniz.
                </div>
              )}

              {healthTestInsights?.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-cream-900">
                    <HeartPulse className="h-4 w-4 text-brand-500" /> Sağlık Testi Özeti
                  </p>
                  <ul className="space-y-1 rounded-xl border border-cream-100 bg-white/80 p-3">
                    {healthTestInsights.slice(0, 8).map((tip, i) => (
                      <li key={i} className="text-xs text-cream-800/75">• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Vücut Durumu */}
              <div className="grid gap-3 sm:grid-cols-2">
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
              </div>

              {libraryWeeklyPlan.length > 0 && (
                <div>
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-cream-900">
                    <CalendarDays className="h-4 w-4 text-brand-500" /> Haftalık Antrenman Planı
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                      Kütüphane
                    </span>
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {libraryWeeklyPlan.map((day) => (
                      <div key={day.day} className="rounded-xl border border-cream-100 bg-white/80 px-3 py-2.5">
                        <p className="text-xs font-semibold text-brand-700">{day.day}</p>
                        <p className="text-sm font-medium text-cream-900">
                          {day.exerciseNames.join(' · ')}
                        </p>
                        <p className="text-[11px] text-cream-800/50">Yoğunluk: {day.intensity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {libraryWeeklyPlan.length === 0 && (coachRecommendations?.exercises?.length > 0 || coachRecommendations?.totalCount > 0) && (
                <p className="rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2.5 text-xs text-cream-800/70">
                  Haftalık plan kütüphane hareketlerinden oluşturuluyor… Sayfayı yenileyin veya bir süre sonra tekrar kontrol edin.
                </p>
              )}

              {/* Video Önerileri */}
              {coachRecommendations?.exercises?.length > 0 && (
                <div>
                  <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-cream-900">
                    <Play className="h-4 w-4 text-brand-500" /> Kütüphaneden Önerilen Hareketler
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                      {coachRecommendations.totalCount} video
                    </span>
                  </p>
                  {coachRecommendations.message && (
                    <p className="mb-3 text-xs leading-relaxed text-cream-800/65">{coachRecommendations.message}</p>
                  )}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {coachRecommendations.exercises.map((ex) => (
                      <Link
                        key={ex.id}
                        to="/library"
                        className="flex items-center gap-2.5 rounded-xl border border-cream-100 bg-cream-50 p-3 transition hover:border-brand-200 hover:bg-brand-50/50"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                          <Dumbbell className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-cream-900">{ex.name}</p>
                          <p className="truncate text-xs text-cream-800/55">{ex.category || ex.bodyPart}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link to="/library" className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100">
                    Tüm Kütüphaneyi Gör
                  </Link>
                </div>
              )}

              {/* Beslenme İpuçları (AI) */}
              {(dietitianRecommendations?.tips?.length > 0 || !dietitianRecommendations?.aiGenerated) && (
                <div>
                  <p className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-cream-900">
                    <Salad className="h-4 w-4 text-sage-500" /> Beslenme İpuçları
                    {dietitianRecommendations?.aiGenerated && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                        <Sparkles className="h-3 w-3" /> AI
                      </span>
                    )}
                  </p>
                  {dietitianRecommendations?.focus && (
                    <p className="mb-3 rounded-xl border border-sage-100 bg-sage-50/60 px-3 py-2 text-xs leading-relaxed text-sage-900">
                      <span className="font-semibold">Bu hafta odak: </span>
                      {dietitianRecommendations.focus}
                    </p>
                  )}
                  {!dietitianRecommendations?.tips?.length ? (
                    <p className="text-xs text-cream-800/60">AI beslenme ipuçları hazırlanıyor…</p>
                  ) : (
                  <ul className="space-y-1.5">
                    {dietitianRecommendations.tips
                      .filter((tip) => !/\bsu\b|litre|hidrasyon/i.test(tip))
                      .map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-cream-800/70">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-500" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                  )}
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
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    user, membership, membershipStatus, coachSessions, dietitianSessions,
    myPrograms, progress, isFreeTrialExpired, freeTrialExpiresAt, refresh,
    exercises, updateProfile, createProgram,
  } = useApp()
  const [storyOpen, setStoryOpen] = useState(false)

  useHealthAnalysisSync({ user, exercises, myPrograms, updateProfile, createProgram })

  // Stripe ödeme dönüşü: üyeliği tazele (webhook birkaç saniye sürebilir).
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      toast('Ödeme alındı! Üyeliğiniz birkaç saniye içinde aktifleşecek.', 'success')
      refresh?.()
      const t = setTimeout(() => refresh?.(), 4000)
      const next = new URLSearchParams(searchParams)
      next.delete('payment'); next.delete('session_id')
      setSearchParams(next, { replace: true })
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isFreeTrialExpired) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
            <Crown className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="mt-5 font-display text-xl font-bold text-cream-900">48 Saatlik Deneme Süreniz Doldu</h2>
          <p className="mt-2 text-sm leading-relaxed text-cream-800/65">
            Üretsiz deneme süreniz sona erdi. Devam etmek için bir üyelik planı seçerek tüm özelliklere erişin.
          </p>
          <Link
            to="/membership"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Crown className="h-4 w-4" /> Plan Seç &amp; Devam Et
          </Link>
          <p className="mt-4 text-xs text-cream-800/40">
            Soru ve sorunlar için <Link to="/support" className="underline">destek merkezi</Link>
          </p>
        </motion.div>
      </div>
    )
  }

  const nextCoach = coachSessions.find((s) => s.status === 'scheduled' && new Date(s.date) > new Date())
  const nextDietitian = dietitianSessions.find((s) => s.status === 'scheduled' && new Date(s.date) > new Date())

  const planLabel = getPlanLabel(membership)

  return (
    <div className="space-y-6">
      <div className="welcome-banner">
        <p className="text-sm font-medium text-white/80">Hoş geldiniz</p>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{user.name?.split(' ')[0] || 'Üye'}, bugün harika bir gün olabilir</h1>
        <p className="mt-2 text-sm text-white/75">Küçük adımlar büyük dönüşümlerin başlangıcıdır — görevlerinizi tamamlayarak ilerleyin.</p>
      </div>

      {membership === 'free' && freeTrialExpiresAt && !isFreeTrialExpired && (() => {
        const msLeft = new Date(freeTrialExpiresAt) - new Date()
        const hLeft = Math.max(0, Math.ceil(msLeft / 3600000))
        return (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Crown className="h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-sm text-amber-800 flex-1">
              Deneme süreniz: <strong>{hLeft} saat</strong> kaldı.
            </p>
            <Link to="/membership" className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white">Üye Ol</Link>
          </div>
        )
      })()}

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

      {/* Kişisel sağlık özeti — sağlık testi sonrası */}
      {user.healthAnalysis ? (
        <HealthAnalysisPanel analysis={user.healthAnalysis} />
      ) : isHealthTestComplete(user.healthTest, user.gender) ? (
        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 px-5 py-4 text-sm text-cream-800/70">
          Kişisel sağlık özetiniz hazırlanıyor…
        </div>
      ) : null}

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
        <StatsCard label="Sonraki Koç" value={nextCoach ? format(new Date(nextCoach.date), 'd MMM', { locale: tr }) : '—'} sub={nextCoach?.title || 'Planlanmadı'} icon={Dumbbell} accent="sage" onClick={() => navigate('/schedule/coach')} />
        <StatsCard label="Sonraki Diyetisyen" value={nextDietitian ? format(new Date(nextDietitian.date), 'd MMM', { locale: tr }) : '—'} sub={nextDietitian?.title || 'Planlanmadı'} icon={Apple} accent="gold" onClick={() => navigate('/schedule/dietitian')} />
        <StatsCard label="Seri" value={`${user.streak ?? 0} gün`} sub="Kesintisiz gün" icon={Flame} accent="brand" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="glass-card-solid p-6">
          <h3 className="font-semibold text-cream-900">Kilo Trendi</h3>
          {progress.weight?.length ? <WeightChart data={progress.weight} /> : <ChartEmpty message="Kilo kayıtlarınız burada görünecek" />}
        </div>
        <div className="glass-card-solid p-6">
          <h3 className="font-semibold text-cream-900">Antrenman Tamamlama</h3>
          {progress.workouts?.length ? <WorkoutChart data={progress.workouts} /> : <ChartEmpty message="Antrenman verileriniz burada görünecek" />}
        </div>
        <div className="glass-card-solid p-6 lg:col-span-2 xl:col-span-1">
          <h3 className="flex items-center gap-2 font-semibold text-cream-900">
            <Apple className="h-4 w-4 text-sage-600" /> Öğün Takibi
          </h3>
          <p className="mt-0.5 text-xs text-cream-800/50">Diyet listelerindeki öğün onayları (takvimden ayrı)</p>
          {progress.meals?.length ? <MealChart data={progress.meals} /> : <ChartEmpty message="Diyetisyen listeniz eklendikçe öğün verileri burada görünür" />}
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
        <button
          type="button"
          onClick={() => setStoryOpen(true)}
          className="group flex items-center gap-4 rounded-2xl border border-gold-400/40 bg-gradient-to-br from-gold-50 to-white p-5 text-left shadow-sm transition hover:shadow-md hover:border-gold-400/70"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-amber-500 text-white shadow transition group-hover:scale-110">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-cream-900">Başarı Hikayeni Paylaş</p>
            <p className="text-xs text-cream-800/55">Yolculuğunla başkalarına ilham ver</p>
          </div>
        </button>
      </div>

      <SuccessStorySubmitModal open={storyOpen} onClose={() => setStoryOpen(false)} />
    </div>
  )
}

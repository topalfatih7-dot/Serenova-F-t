import { useState, useCallback, useMemo, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Dumbbell, Apple, Flame, Crown, MessageCircle, LineChart,
  ClipboardList, Star, CalendarDays, Play, BookOpen, Sparkles,
  ArrowRight, Clock, HeartPulse, UserCheck, Stethoscope,
} from 'lucide-react'
import StatsCard from '../components/ui/StatsCard'
import MembershipBadge from '../components/ui/MembershipBadge'
import SuccessStorySubmitModal from '../components/social/SuccessStorySubmitModal'
import WelcomeSuccessModal from '../components/auth/WelcomeSuccessModal'
import { WeightChart } from '../components/dashboard/ProgressChart'
import WeeklyAdherenceTable from '../components/dashboard/WeeklyAdherenceTable'
import HealthScoreCard from '../components/dashboard/HealthScoreCard'
import ActivationChecklist from '../components/dashboard/ActivationChecklist'
import {
  getPlanLabel,
  isPaidMembership,
  memberNeedsStaffAssignment,
  packageIncludesCoach,
  packageIncludesDietitian,
  packageIncludesDoctor,
} from '../data/membershipPlans'
import { useApp } from '../context/AppContext'
import { resolveFirstName } from '../utils/displayName'
import useStripePaymentReturn from '../hooks/useStripePaymentReturn'
import { PANEL_IMAGES } from '../utils/panelImages'
import { resolveBlogCover } from '../utils/blogImages'
import { blogPostPath } from '../utils/blogSlug'
import { useDailyTip } from '../hooks/useDailyTip'
import { useHealthAnalysisSync } from '../hooks/useHealthAnalysisSync'
import { getHealthTestLockState } from '../services/healthScoreAnalysis'
import { buildWeeklyAdherence } from '../utils/memberProgress'
import { getRemainingDays } from '../services/premiumMembership'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

function ChartEmpty({ message = 'Henüz veri yok' }) {
  //console.log('message', message)
  return (
    <div className="flex h-56 flex-col items-center justify-center gap-2 text-center text-sm text-cream-800/50">
      <LineChart className="h-7 w-7 text-cream-800/30" />
      {message}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    user, membership, membershipStatus, coachSessions, dietitianSessions,
    doctorSessions, myPrograms, progress, isUnpaidMember,
    premiumExpiresAt, refresh,
    posts, packageConfig,
  } = useApp()
  const [storyOpen, setStoryOpen] = useState(false)
  const [welcomeOpen, setWelcomeOpen] = useState(() => Boolean(location.state?.welcome))
  const { tip: dailyTip, loading: dailyTipLoading } = useDailyTip()
  const {
    analysis: healthAnalysis,
    history: healthScoreHistory,
    loading: healthScoreLoading,
    error: healthScoreError,
    complete: healthAnalysisComplete,
    detailedComplete: healthDetailedComplete,
  } = useHealthAnalysisSync()
  const healthLockState = useMemo(
    () => getHealthTestLockState({
      healthAnalysis,
      detailedComplete: healthDetailedComplete,
    }),
    [healthAnalysis, healthDetailedComplete],
  )

  useStripePaymentReturn(refresh)

  useEffect(() => {
    if (!location.state?.welcome) return
    setWelcomeOpen(true)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state?.welcome, location.pathname, navigate])

  const dismissWelcome = useCallback(() => {
    setWelcomeOpen(false)
  }, [])

  const goMembership = useCallback(() => navigate('/plans'), [navigate])
  const goCoachSchedule = useCallback(() => navigate('/schedule?tab=coach'), [navigate])
  const goDietitianSchedule = useCallback(() => navigate('/schedule?tab=dietitian'), [navigate])
  const goDoctorSchedule = useCallback(() => navigate('/schedule?tab=doctor'), [navigate])

  const premiumRemainingDays = useMemo(
    () => getRemainingDays(premiumExpiresAt),
    [premiumExpiresAt],
  )
  const showExpiringBanner = Boolean(
    isPaidMembership(membership)
    && (membershipStatus === 'expiring' || (premiumRemainingDays != null && premiumRemainingDays > 0 && premiumRemainingDays <= 7)),
  )

  const showAssignmentPendingBanner = Boolean(
    isPaidMembership(membership)
    && !isUnpaidMember
    && memberNeedsStaffAssignment({
      packageConfig,
      assignedCoachId: user?.assignedCoachId,
      assignedDietitianId: user?.assignedDietitianId,
      assignedDoctorId: user?.assignedDoctorId,
    }),
  )

  const assignmentPendingHint = useMemo(() => {
    if (!showAssignmentPendingBanner) return ''
    const parts = []
    if (packageIncludesCoach(packageConfig) && !user?.assignedCoachId) parts.push('koç')
    if (packageIncludesDietitian(packageConfig) && !user?.assignedDietitianId) parts.push('diyetisyen')
    if (packageIncludesDoctor(packageConfig) && !user?.assignedDoctorId) parts.push('doktor')
    if (parts.length === 0) return 'Uzman atamanız hazırlanıyor.'
    if (parts.length === 1) {
      const label = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
      return `${label} atamanız hazırlanıyor.`
    }
    return `${parts.slice(0, -1).join(', ')} ve ${parts[parts.length - 1]} atamanız hazırlanıyor.`
  }, [
    showAssignmentPendingBanner,
    packageConfig,
    user?.assignedCoachId,
    user?.assignedDietitianId,
    user?.assignedDoctorId,
  ])

  const latestPosts = useMemo(
    () => (posts || [])
      .filter((p) => p.published)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3),
    [posts],
  )

  const weekly = useMemo(
    () => buildWeeklyAdherence(myPrograms, user?.completedActivities, user),
    [myPrograms, user],
  )

  const nextCoach = coachSessions.find((s) => s.status === 'scheduled' && new Date(s.date) > new Date())
  const nextDietitian = dietitianSessions.find((s) => s.status === 'scheduled' && new Date(s.date) > new Date())
  const nextDoctor = (doctorSessions || user?.doctorSessions || []).find(
    (s) => s.status === 'scheduled' && new Date(s.date) > new Date(),
  )
  const showDoctorStat = packageIncludesDoctor(packageConfig)
    || (Number(packageConfig?.doctorSessionsTotal) || 0) > 0
    || Boolean(user?.assignedDoctorId)

  const planLabel = getPlanLabel(membership)
  const firstName = resolveFirstName({ name: user?.name, email: user?.email })

  const today = new Date()

  return (
    <div className="space-y-6">
      <ActivationChecklist
        user={user}
        membership={membership}
        packageConfig={packageConfig}
        myPrograms={isUnpaidMember ? [] : myPrograms}
        coachSessions={coachSessions}
        dietitianSessions={dietitianSessions}
        doctorSessions={user?.doctorSessions}
      />

      <div className="welcome-banner">
        <div className="welcome-banner-photo" aria-hidden>
          <img src={PANEL_IMAGES.dashboardHero.url} alt="" />
        </div>
        <div className="welcome-banner-content relative">
          <p className="text-sm font-medium text-white/80 sm:text-white">{format(today, 'd MMMM yyyy, EEEE', { locale: tr })}</p>
          <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl sm:text-white">{firstName}, bugün harika bir gün olabilir</h1>
          <p className="mt-2 max-w-xl text-sm text-white/75 sm:text-white/95">Küçük adımlar büyük dönüşümlerin başlangıcıdır — görevlerinizi tamamlayarak ilerleyin.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/calendar"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-md transition hover:scale-[1.03] sm:text-sm"
            >
              <CalendarDays className="h-4 w-4" /> Bugünkü Programım
            </Link>
            <Link
              to="/health-test"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/25 sm:text-sm"
            >
              <HeartPulse className="h-4 w-4" /> Kişisel Sağlık Analizi
            </Link>
          </div>
        </div>
      </div>

      <HealthScoreCard
        analysis={healthAnalysis}
        history={healthScoreHistory}
        loading={healthScoreLoading}
        complete={healthAnalysisComplete}
        error={healthScoreError}
        scoresOnly={isUnpaidMember}
        lockState={healthLockState}
      />

      <div className="flex items-start gap-3 rounded-2xl border border-gold-400/30 bg-gradient-to-r from-gold-50 via-amber-50/60 to-white px-4 py-3.5 shadow-sm">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-amber-500 text-white shadow ${dailyTipLoading ? 'animate-pulse' : ''}`}>
          <Sparkles className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700/70">Günün ipucu</p>
          <p className={`mt-0.5 text-sm leading-relaxed text-cream-900 transition-opacity ${dailyTipLoading ? 'opacity-60' : 'opacity-100'}`}>
            {dailyTip}
          </p>
        </div>
      </div>

      {showAssignmentPendingBanner && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-sage-300 bg-sage-50 px-4 py-3.5">
          <UserCheck className="h-5 w-5 shrink-0 text-sage-700" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-sage-950">Uzmanınız atanıyor</p>
            <p className="mt-0.5 text-xs text-sage-900/70">
              {assignmentPendingHint} Atama tamamlanınca profilinizde görünecek; randevu ve mesajlaşma o zaman açılır.
            </p>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 rounded-lg bg-sage-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sage-800"
          >
            Profil <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {showExpiringBanner && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5">
          <Clock className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-950">
              Paket süreniz bitmek üzere
              {premiumRemainingDays != null ? (
                <> — <strong>{premiumRemainingDays} gün</strong> kaldı</>
              ) : null}
            </p>
            <p className="mt-0.5 text-xs text-amber-900/70">
              Kesintisiz devam için planınızı yenileyin. Son gün dahil erişiminiz sürer.
            </p>
          </div>
          <Link
            to="/plans"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Yenile <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
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

      <div className={`grid gap-4 sm:grid-cols-2 ${showDoctorStat ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
        <StatsCard label="Aktif Plan" value={planLabel} sub={membership === 'free' ? 'Kişisel sağlık analizi' : 'Koç & Diyetisyen destekli'} icon={Crown} accent="brand" onClick={goMembership} />
        <StatsCard label="Sonraki Koç" value={nextCoach ? format(new Date(nextCoach.date), 'd MMM', { locale: tr }) : '—'} sub={nextCoach?.title || 'Planlanmadı'} icon={Dumbbell} accent="sage" onClick={goCoachSchedule} />
        <StatsCard label="Sonraki Diyetisyen" value={nextDietitian ? format(new Date(nextDietitian.date), 'd MMM', { locale: tr }) : '—'} sub={nextDietitian?.title || 'Planlanmadı'} icon={Apple} accent="gold" onClick={goDietitianSchedule} />
        {showDoctorStat && (
          <StatsCard
            label="Sonraki Doktor"
            value={nextDoctor ? format(new Date(nextDoctor.date), 'd MMM', { locale: tr }) : '—'}
            sub={nextDoctor?.title || 'Planlanmadı'}
            icon={Stethoscope}
            accent="brand"
            onClick={goDoctorSchedule}
          />
        )}
        <StatsCard label="Seri" value={`${user.streak ?? 0} gün`} sub="Kesintisiz gün" icon={Flame} accent="brand" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="glass-card-solid p-6">
          <h3 className="font-semibold text-cream-900">Kilo Trendi</h3>
          {progress.weight?.length ? <WeightChart data={progress.weight} /> : <ChartEmpty message="Kilo kayıtlarınız burada görünecek" />}
        </div>
        <div className="glass-card-solid p-6">
          <WeeklyAdherenceTable
            title="Antrenman Takibi"
            icon={Dumbbell}
            metric="workout"
            accent="brand"
            data={weekly}
            emptyMessage="Antrenman verileriniz burada görünecek"
          />
        </div>
        <div className="glass-card-solid p-6 lg:col-span-2 xl:col-span-1">
          <WeeklyAdherenceTable
            title="Öğün Takibi"
            icon={Apple}
            metric="meal"
            accent="sage"
            data={weekly}
            emptyMessage="Diyetisyen listeniz eklendikçe öğün verileri burada görünür"
          />
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

      {latestPosts.length > 0 && (
        <section>
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-semibold text-cream-900">
              <BookOpen className="h-5 w-5 text-brand-500" /> Sizin için okumalar
            </h3>
            <Link to="/blog" className="flex items-center gap-1 text-sm font-semibold text-brand-600 transition-all hover:gap-2 hover:text-brand-700">
              Tümünü gör <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latestPosts.map((p) => {
              const cover = resolveBlogCover(p)
              return (
                <Link
                  key={p.id}
                  to={blogPostPath(p)}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-cream-100">
                    <img
                      src={cover.url}
                      alt={cover.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                    <span className="absolute bottom-2.5 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-brand-700 backdrop-blur">
                      {p.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h4 className="font-display text-sm font-bold leading-snug text-cream-900 group-hover:text-brand-700">{p.title}</h4>
                    <p className="mt-1.5 line-clamp-2 flex-1 text-xs text-cream-800/60">{p.excerpt}</p>
                    <span className="mt-3 flex items-center gap-1 text-[11px] text-cream-800/50">
                      <Clock className="h-3 w-3" /> {p.readMinutes} dk okuma
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <SuccessStorySubmitModal open={storyOpen} onClose={() => setStoryOpen(false)} />
      <WelcomeSuccessModal
        open={welcomeOpen}
        planName="Ücretsiz"
        isPaid={false}
        onContinue={dismissWelcome}
      />
    </div>
  )
}

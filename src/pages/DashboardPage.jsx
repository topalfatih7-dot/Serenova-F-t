import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Dumbbell, Apple, Flame, Crown, MessageCircle, LineChart,
  ClipboardList, Star, CalendarDays, Play,
} from 'lucide-react'
import StatsCard from '../components/ui/StatsCard'
import MembershipBadge from '../components/ui/MembershipBadge'
import SuccessStorySubmitModal from '../components/social/SuccessStorySubmitModal'
import { WeightChart, WorkoutChart, MealChart } from '../components/dashboard/ProgressChart'
import { getPlanLabel } from '../data/membershipPlans'
import { useApp } from '../context/AppContext'
import { resolveFirstName } from '../utils/displayName'
import { useHealthAnalysisSync } from '../hooks/useHealthAnalysisSync'
import useStripePaymentReturn from '../hooks/useStripePaymentReturn'
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
  const navigate = useNavigate()
  const {
    user, membership, membershipStatus, coachSessions, dietitianSessions,
    myPrograms, progress, isFreeTrialExpired, freeTrialExpiresAt, refresh,
    exerciseCount, updateProfile, createProgram,
  } = useApp()
  const [storyOpen, setStoryOpen] = useState(false)

  useHealthAnalysisSync({ user, exerciseCount, myPrograms, updateProfile, createProgram })
  useStripePaymentReturn(refresh)

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
  const firstName = resolveFirstName({ name: user?.name, email: user?.email })

  return (
    <div className="space-y-6">
      <div className="welcome-banner">
        <p className="text-sm font-medium text-white/80">Hoş geldiniz</p>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{firstName}, bugün harika bir gün olabilir</h1>
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
        <StatsCard label="Aktif Plan" value={planLabel} sub={membership === 'free' ? 'Otomatik programlar' : 'Koç & Diyetisyen destekli'} icon={Crown} accent="brand" onClick={() => navigate('/membership')} />
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

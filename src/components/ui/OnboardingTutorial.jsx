import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ChevronRight, ArrowLeft, CalendarDays, ClipboardList,
  Dumbbell, Library, Flame, CheckCircle, Sparkles,
} from 'lucide-react'

const STEPS = [
  {
    id: 'welcome',
    emoji: '👋',
    color: 'from-brand-500 to-brand-700',
    bg: 'bg-brand-500',
    lightBg: 'bg-brand-50',
    textColor: 'text-brand-600',
    title: 'Hoş Geldiniz!',
    subtitle: 'Yeni Form\'a başlıyorsunuz',
    description: 'Bu kısa tur, programı nasıl kullanacağınızı gösterecek. Hazır mısınız?',
    icon: Sparkles,
  },
  {
    id: 'calendar',
    emoji: '📅',
    color: 'from-violet-500 to-purple-700',
    bg: 'bg-violet-500',
    lightBg: 'bg-violet-50',
    textColor: 'text-violet-600',
    title: 'Program Takvimi',
    subtitle: 'Günlük programınızı takip edin',
    description: 'Koçunuz ve diyetisyeniniz size özel bir haftalık program hazırlar. Takvimde her güne tıklayarak o günün aktivitelerini görün ve "Tamamladım" butonuyla ilerlemenizi kaydedin.',
    icon: CalendarDays,
    tip: 'Sol menüden "Takvim" bağlantısına tıklayın',
  },
  {
    id: 'programs',
    emoji: '📋',
    color: 'from-sage-500 to-emerald-700',
    bg: 'bg-sage-500',
    lightBg: 'bg-sage-50',
    textColor: 'text-sage-600',
    title: 'Programlarım',
    subtitle: 'Antrenman & beslenme programları',
    description: 'Koçunuz antrenman programı, diyetisyeniniz beslenme programı hazırlar. Her programda hangi egzersizi yapacağınız, kaç set/tekrar yapmanız gerektiği yazılıdır.',
    icon: ClipboardList,
    tip: 'Sol menüden "Programlarım" bağlantısına tıklayın',
  },
  {
    id: 'sessions',
    emoji: '🤝',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-500',
    lightBg: 'bg-amber-50',
    textColor: 'text-amber-600',
    title: 'Koç & Diyetisyen',
    subtitle: 'Görüşmelerinizi takip edin',
    description: 'Koç ve diyetisyen görüşmelerinizi sol menüden takip edebilirsiniz. Haftalık müsaitliğinizi Takvim sayfasından belirleyin; ekibiniz bu saatlere göre randevu ayarlayacak.',
    icon: Dumbbell,
    tip: 'Takvim sayfasında müsaitliğinizi ayarlayın',
  },
  {
    id: 'library',
    emoji: '🎬',
    color: 'from-pink-500 to-rose-600',
    bg: 'bg-pink-500',
    lightBg: 'bg-pink-50',
    textColor: 'text-pink-600',
    title: 'Video Kütüphanesi',
    subtitle: 'Egzersiz videoları',
    description: 'Hareketlerin doğru yapılışını video kütüphanesinden izleyebilirsiniz. Takviminizdeki programı görüntülerken de ilgili videoları direkt açabilirsiniz.',
    icon: Library,
    tip: 'Sol menüden "Kütüphane" bağlantısına tıklayın',
  },
  {
    id: 'calories',
    emoji: '🔥',
    color: 'from-red-500 to-orange-500',
    bg: 'bg-red-500',
    lightBg: 'bg-red-50',
    textColor: 'text-red-600',
    title: 'Kalori Hesapla',
    subtitle: 'Öğününüzü analiz edin',
    description: 'Yemek fotoğrafı yükleyin veya manuel olarak besin ekleyerek kalori hesaplayın. Makro besin değerlerinizi (protein, karbonhidrat, yağ) de görebilirsiniz.',
    icon: Flame,
    tip: 'Sol menüden "Kalori Hesapla" bağlantısına tıklayın',
  },
  {
    id: 'start',
    emoji: '🚀',
    color: 'from-brand-500 via-purple-600 to-pink-500',
    bg: 'bg-gradient-to-r from-brand-500 to-purple-600',
    lightBg: 'bg-brand-50',
    textColor: 'text-brand-600',
    title: 'Hazırsınız!',
    subtitle: 'Dönüşümünüze başlayın',
    description: 'Artık programı kullanmak için her şeyi biliyorsunuz. İlk adımı atın ve koçunuzun size hazırladığı programı takip etmeye başlayın. Başarılar!',
    icon: CheckCircle,
  },
]

const STORAGE_KEY = (userId) => `tutorial_shown_${userId}`

export default function OnboardingTutorial({ userId, seen = false, onComplete }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!userId) return
    // Veritabanında daha önce görüldü olarak işaretlendiyse hiç açma
    if (seen) return
    const key = STORAGE_KEY(userId)
    if (!localStorage.getItem(key)) {
      setVisible(true)
    }
  }, [userId, seen])

  const close = () => {
    if (userId) localStorage.setItem(STORAGE_KEY(userId), '1')
    setVisible(false)
    // Tek seferlik gösterim: kalıcı olarak (veritabanı) işaretlemek için üst bileşene haber ver
    onComplete?.()
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      close()
    }
  }

  const back = () => {
    setStep((s) => Math.max(0, s - 1))
  }

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 40 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="fixed inset-x-4 top-1/2 z-[101] mx-auto max-w-md -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {/* Üst renkli şerit */}
            <div className={`relative bg-gradient-to-br ${current.color} px-6 pb-6 pt-5`}>
              {/* Kapat */}
              <button
                type="button"
                onClick={close}
                className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Emoji + icon */}
              <div className="flex items-end gap-3">
                <motion.div
                  key={step}
                  initial={{ scale: 0.5, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 300 }}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-4xl"
                >
                  {current.emoji}
                </motion.div>
                <div>
                  <p className="text-sm font-medium text-white/75">{current.subtitle}</p>
                  <h2 className="font-display text-2xl font-bold text-white">{current.title}</h2>
                </div>
              </div>

              {/* Adım göstergesi */}
              <div className="mt-4 flex gap-1.5">
                {STEPS.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ width: i === step ? 24 : 8 }}
                    className={`h-1.5 rounded-full transition-all ${
                      i <= step ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* İçerik */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={`flex items-center justify-center rounded-2xl ${current.lightBg} py-6`}>
                    <Icon className={`h-14 w-14 ${current.textColor}`} strokeWidth={1.5} />
                  </div>

                  <p className="mt-5 text-sm leading-relaxed text-cream-800/80">
                    {current.description}
                  </p>

                  {current.tip && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-cream-200 bg-cream-50 px-3 py-2">
                      <span className="text-lg">💡</span>
                      <p className="text-xs text-cream-800/65">{current.tip}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Alt butonlar */}
              <div className="mt-6 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={back}
                      className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-cream-800/60 transition hover:bg-cream-100 hover:text-cream-800"
                    >
                      <ArrowLeft className="h-4 w-4" /> Geri
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={close}
                    className="px-2 text-sm font-medium text-cream-800/40 transition hover:text-cream-800"
                  >
                    Turu Atla
                  </button>
                </div>

                <motion.button
                  type="button"
                  onClick={next}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-2 rounded-2xl bg-gradient-to-r ${current.color} px-6 py-3 text-sm font-bold text-white shadow-lg`}
                >
                  {isLast ? (
                    <>Başla <CheckCircle className="h-4 w-4" /></>
                  ) : (
                    <>İleri <ChevronRight className="h-4 w-4" /></>
                  )}
                </motion.button>
              </div>

              {/* Adım sayacı */}
              <p className="mt-3 text-center text-xs text-cream-800/30">
                {step + 1} / {STEPS.length}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

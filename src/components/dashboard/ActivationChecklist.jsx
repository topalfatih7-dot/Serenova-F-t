import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, Crown, HeartPulse, CalendarCheck, ClipboardList, X } from 'lucide-react'
import { isHealthTestComplete } from '../../data/healthTest'
import { isPaidMembership } from '../../data/membershipPlans'

function storageKey(userId) {
  return `activation_checklist_dismissed_${userId}`
}

function wasDismissed(userId) {
  if (!userId || typeof window === 'undefined') return false
  try {
    return localStorage.getItem(storageKey(userId)) === '1'
  } catch {
    return false
  }
}

/**
 * Yeni üye — sonraki adımlar checklist.
 * Tamamlanınca veya kullanıcı kapatınca gizlenir.
 */
export default function ActivationChecklist({
  user,
  membership,
  packageConfig,
  myPrograms = [],
  coachSessions = [],
  dietitianSessions = [],
  doctorSessions = [],
}) {
  const userId = user?.id
  const [dismissed, setDismissed] = useState(() => wasDismissed(userId))

  const steps = useMemo(() => {
    const htDone = Boolean(
      user?.healthAck
      && user?.disclaimer
      && isHealthTestComplete(user?.healthTest, user?.gender, packageConfig),
    )
    const paid = isPaidMembership(membership)
    const hasProgram = (myPrograms || []).length > 0
    const hasSession = (coachSessions || []).length
      + (dietitianSessions || []).length
      + (doctorSessions || []).length > 0

    const list = [
      {
        id: 'health_test',
        label: 'Kişisel sağlık analizini tamamla',
        hint: 'Skorlarınızın doğru hesaplanması için gerekli',
        done: htDone,
        to: '/health-test',
        icon: HeartPulse,
      },
    ]

    if (!paid) {
      list.push({
        id: 'plan',
        label: 'Paket seç',
        hint: 'Mesaj, takvim, program ve uzman raporları için',
        done: false,
        to: '/plans',
        icon: Crown,
      })
    } else {
      list.push({
        id: 'session',
        label: 'İlk randevunu al',
        hint: 'Koç, diyetisyen veya doktor görüşmesi',
        done: hasSession,
        to: '/schedule',
        icon: CalendarCheck,
      })
      list.push({
        id: 'program',
        label: 'Programını kontrol et',
        hint: hasProgram ? 'Personelin gönderdiği program hazır' : 'Personelin program gönderince burada görünür',
        done: hasProgram,
        to: '/programs',
        icon: ClipboardList,
      })
    }

    return list
  }, [
    user, membership, packageConfig, myPrograms,
    coachSessions, dietitianSessions, doctorSessions,
  ])

  const allDone = steps.every((s) => s.done)
  const remaining = steps.filter((s) => !s.done).length

  if (dismissed || allDone || !userId) return null

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey(userId), '1')
    } catch { /* ignore */ }
    setDismissed(true)
  }

  return (
    <div className="rounded-2xl border border-brand-200/80 bg-gradient-to-br from-brand-50/80 via-white to-sage-50/40 p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold text-cream-900 sm:text-lg">
            Başlangıç adımları
          </h2>
          <p className="mt-0.5 text-xs text-cream-800/60">
            {remaining} adım kaldı — sırayla tamamlayın
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg p-1.5 text-cream-800/40 transition hover:bg-cream-100 hover:text-cream-800"
          aria-label="Listeyi kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="mt-3 space-y-2">
        {steps.map((step) => {
          const Icon = step.icon
          const content = (
            <span className="flex min-w-0 flex-1 items-start gap-3">
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                step.done ? 'bg-sage-100 text-sage-600' : 'bg-white text-brand-600 shadow-sm ring-1 ring-cream-200'
              }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-semibold ${step.done ? 'text-cream-800/55 line-through' : 'text-cream-900'}`}>
                  {step.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-cream-800/50">
                  {step.hint}
                </span>
              </span>
            </span>
          )

          return (
            <li key={step.id}>
              {step.done ? (
                <div className="flex items-center gap-2 rounded-xl px-2 py-2">
                  {content}
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-sage-500" />
                </div>
              ) : (
                <Link
                  to={step.to}
                  className="flex items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-white/80"
                >
                  {content}
                  <Circle className="h-5 w-5 shrink-0 text-cream-300" />
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

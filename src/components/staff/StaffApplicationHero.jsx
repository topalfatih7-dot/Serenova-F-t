import { motion } from 'framer-motion'
import { UserPlus, Dumbbell, Apple, ArrowRight, Check } from 'lucide-react'
import PlansAnimatedBackground from '../landing/PlansAnimatedBackground'
import { staffRoleLabel } from '../../utils/staffRoles'

const ease = [0.22, 1, 0.36, 1]

const ROLE_CARDS = [
  {
    id: 'coach',
    Icon: Dumbbell,
    title: 'Koç',
    tagline: 'Antrenman, performans ve hareket programları',
    accent: 'brand',
  },
  {
    id: 'dietitian',
    Icon: Apple,
    title: 'Diyetisyen',
    tagline: 'Beslenme planı ve klinik diyet desteği',
    accent: 'sage',
  },
]

export default function StaffApplicationHero({
  phase,
  selectedRole,
  onSelectRole,
  onStart,
  lockedRole,
}) {
  const isSelect = phase === 'select'
  const lockedLabel = staffRoleLabel(lockedRole || selectedRole)

  return (
    <PlansAnimatedBackground
      className={`staff-apply-hero plans-section-ref ${isSelect ? '!py-12 sm:!py-16' : '!py-8 sm:!py-10'}`}
    >
      <div aria-hidden className="staff-apply-hero-mesh" />
      <div aria-hidden className="staff-apply-hero-grain" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
        className="relative z-[1] mx-auto max-w-4xl px-4 text-center sm:px-6"
      >
        <span className="plans-ref-badge section-badge">
          <UserPlus className="h-3.5 w-3.5" />
          Kadromuza Katıl
        </span>

        <h1 className="plans-ref-heading mt-4 font-display text-3xl font-bold tracking-tight text-cream-900 sm:text-4xl md:text-[2.75rem] md:leading-[1.15]">
          {isSelect ? 'Uzman Başvurusu' : `${lockedLabel} Başvurusu`}
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-cream-800/65 sm:text-base">
          {isSelect
            ? 'Rolünüzü seçin, ardından adım adım başvuru formunu tamamlayın.'
            : 'Bölümlere dokunarak açın, bilgilerinizi adım adım tamamlayın.'}
        </p>

        {isSelect ? (
          <>
            <div
              className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2 sm:gap-4"
              role="radiogroup"
              aria-label="Başvuru rolü"
            >
              {ROLE_CARDS.map((card, i) => {
                const active = selectedRole === card.id
                const Icon = card.Icon
                const isSage = card.accent === 'sage'
                return (
                  <motion.button
                    key={card.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.08 + i * 0.06, ease }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => onSelectRole(card.id)}
                    className={`staff-apply-role-card group relative overflow-hidden rounded-2xl border px-5 py-5 text-left shadow-sm transition sm:px-6 sm:py-6 ${
                      active
                        ? isSage
                          ? 'border-sage-400 bg-gradient-to-br from-white via-sage-50/80 to-sage-100/40 ring-2 ring-sage-400/50'
                          : 'border-brand-400 bg-gradient-to-br from-white via-brand-50/70 to-sky-50/40 ring-2 ring-brand-400/45'
                        : 'border-cream-200/90 bg-white/85 hover:border-cream-300 hover:bg-white'
                    }`}
                  >
                    <div
                      aria-hidden
                      className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-2xl transition ${
                        active
                          ? isSage
                            ? 'bg-sage-300'
                            : 'bg-brand-300'
                          : 'bg-cream-200 group-hover:bg-cream-300'
                      }`}
                    />
                    <div className="relative flex items-start gap-3.5">
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
                          isSage
                            ? 'bg-gradient-to-br from-sage-500 to-sage-700'
                            : 'bg-gradient-to-br from-brand-500 to-brand-700'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-display text-lg font-bold text-cream-900">{card.title}</p>
                          {active && (
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full text-white ${
                                isSage ? 'bg-sage-500' : 'bg-brand-500'
                              }`}
                            >
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-snug text-cream-800/55 sm:text-[13px]">
                          {card.tagline}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28, duration: 0.4 }}
              className="mt-7"
            >
              <button
                type="button"
                onClick={onStart}
                disabled={!selectedRole}
                className="btn-wellness inline-flex items-center gap-2 !px-8 !py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-45"
              >
                Başvuruya başla
                <ArrowRight className="h-4 w-4" />
              </button>
              {!selectedRole && (
                <p className="mt-2.5 text-xs text-cream-800/45">Devam etmek için bir rol seçin</p>
              )}
            </motion.div>
          </>
        ) : null}
      </motion.div>
    </PlansAnimatedBackground>
  )
}

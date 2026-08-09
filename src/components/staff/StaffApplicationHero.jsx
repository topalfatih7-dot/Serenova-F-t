import { motion, AnimatePresence } from 'framer-motion'
import { Dumbbell, Apple, ArrowRight, Check } from 'lucide-react'
import PlansAnimatedBackground from '../landing/PlansAnimatedBackground'
import { staffRoleLabel } from '../../utils/staffRoles'

const ease = [0.22, 1, 0.36, 1]

const ROLE_CARDS = [
  {
    id: 'coach',
    Icon: Dumbbell,
    title: 'Koç',
    tagline: 'Antrenman · performans · hareket',
    image: '/staff-apply/role-coach.webp',
    accent: 'brand',
  },
  {
    id: 'dietitian',
    Icon: Apple,
    title: 'Diyetisyen',
    tagline: 'Beslenme · klinik diyet',
    image: '/staff-apply/role-dietitian.webp',
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
      className={`staff-apply-hero plans-section-ref ${isSelect ? 'staff-apply-hero--select' : 'staff-apply-hero--form'}`}
    >
      <div aria-hidden className="staff-apply-hero-mesh" />
      <div aria-hidden className="staff-apply-hero-grain" />
      <div aria-hidden className="staff-apply-hero-veil" />
      <div aria-hidden className="staff-apply-hero-frame" />

      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {isSelect ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.55, ease }}
              className="staff-apply-select"
            >
              <div className="staff-apply-select__copy text-center lg:text-left">
                <p className="staff-apply-brand">Yeni Form</p>
                <h1 className="staff-apply-heading mt-3 font-display">
                  Kadromuza
                  <span className="staff-apply-heading__accent"> katıl</span>
                </h1>
                <p className="staff-apply-lede mx-auto mt-4 max-w-sm lg:mx-0">
                  Rolünü seç ve başvuruya başla.
                </p>
              </div>

              <div
                className="staff-apply-roles"
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
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease }}
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => onSelectRole(card.id)}
                      className={`staff-apply-role ${active ? 'is-active' : ''} ${isSage ? 'is-sage' : 'is-brand'}`}
                    >
                      <div className="staff-apply-role__media">
                        <img
                          src={card.image}
                          alt=""
                          width={720}
                          height={960}
                          loading={i === 0 ? 'eager' : 'lazy'}
                          decoding="async"
                          className="staff-apply-role__img"
                        />
                        <div className="staff-apply-role__shade" aria-hidden />
                        <div className="staff-apply-role__overlay">
                          <span className="staff-apply-role__icon" aria-hidden>
                            <Icon className="h-4 w-4" strokeWidth={1.75} />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
                                {card.title}
                              </p>
                              <AnimatePresence>
                                {active && (
                                  <motion.span
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.6, opacity: 0 }}
                                    className="staff-apply-role__check"
                                  >
                                    <Check className="h-3 w-3" strokeWidth={3} />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>
                            <p className="mt-1 text-[12px] font-medium tracking-wide text-white/75">
                              {card.tagline}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="staff-apply-cta"
              >
                <button
                  type="button"
                  onClick={onStart}
                  disabled={!selectedRole}
                  className="btn-wellness staff-apply-cta__btn inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Başvuruya başla
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease }}
              className="staff-apply-form-hero text-center"
            >
              <p className="staff-apply-brand staff-apply-brand--sm">Yeni Form</p>
              <h1 className="staff-apply-heading staff-apply-heading--sm mt-2 font-display">
                {lockedLabel} Başvurusu
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PlansAnimatedBackground>
  )
}

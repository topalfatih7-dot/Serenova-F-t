import { useId, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Droplets } from 'lucide-react'
import {
  WATER_COPY,
  clampAmountMl,
  fillPercent,
  goalReached,
  isGoalCustomized,
  remainingMl,
} from '../../utils/waterTracking'

const FILL_TOP = 74
const FILL_SPAN = 148

function bottleOffset(percent) {
  const visual = Math.max(6, Math.min(100, Number(percent) || 0))
  return FILL_SPAN * (1 - visual / 100)
}

function WaterBackdrop({ percent }) {
  const uid = useId().replace(/:/g, '')
  const reduce = useReducedMotion()
  const depth = 0.16 + (percent / 100) * 0.4

  return (
    <div className="water-carafe-scene" aria-hidden>
      <svg
        className="water-carafe-surface"
        viewBox="0 0 800 420"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id={`lagoon-${uid}`} cx="28%" cy="8%" r="92%">
            <stop offset="0%" stopColor="var(--water-lagoon-0)" />
            <stop offset="22%" stopColor="var(--water-lagoon-1)" />
            <stop offset="52%" stopColor="var(--water-lagoon-2)" />
            <stop offset="100%" stopColor="var(--water-lagoon-3)" />
          </radialGradient>
        </defs>
        <rect width="800" height="420" fill={`url(#lagoon-${uid})`} />
        <ellipse cx="620" cy="70" rx="220" ry="90" fill="rgba(255,255,255,0.16)" />
        <ellipse cx="140" cy="340" rx="260" ry="120" fill="rgba(6,70,96,0.22)" />
      </svg>
      <div className="water-carafe-depth" style={{ opacity: depth }} />
      <div className={reduce ? 'water-carafe-caustics' : 'water-carafe-caustics water-carafe-caustics--live'} />
    </div>
  )
}

function WaterBottle({ percent, reached, compact }) {
  const uid = useId().replace(/:/g, '')
  const reduce = useReducedMotion()
  const clipId = `bottle-clip-${uid}`
  const fillId = `bottle-fill-${uid}`
  const glassId = `bottle-glass-${uid}`
  const offset = bottleOffset(percent)

  return (
    <svg
      viewBox="0 0 120 240"
      className={`water-carafe-bottle ${compact ? 'water-carafe-bottle--compact' : ''}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--water-fill-0)" />
          <stop offset="38%" stopColor="var(--water-fill-1)" />
          <stop offset="100%" stopColor="var(--water-fill-2)" />
        </linearGradient>
        <linearGradient id={glassId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.42)" />
          <stop offset="42%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(8,70,92,0.18)" />
        </linearGradient>
        <clipPath id={clipId}>
          <path d="M38 92 C38 82 47 76 60 72 C73 76 82 82 82 92 V206 C82 216 72 222 60 222 C48 222 38 216 38 206 Z" />
        </clipPath>
      </defs>

      <path
        d="M51 38 V54 C51 62 40 70 36 82 L32 94 V206 C32 220 44 228 60 228 C76 228 88 220 88 206 V94 L84 82 C80 70 69 62 69 54 V38 Z"
        fill={`url(#${glassId})`}
        stroke="rgba(255,255,255,0.72)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      <g clipPath={`url(#${clipId})`}>
        <motion.g
          initial={false}
          animate={{ y: offset }}
          transition={reduce ? { duration: 0 } : { duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <path
            className={reduce ? undefined : 'water-bottle-wave'}
            d="M18 74 C34 62 50 86 66 74 S98 62 114 74 V240 H18 Z"
            fill={`url(#${fillId})`}
          />
          {!reduce && percent > 8 && (
            <g className="water-bottle-fizz" fill="rgba(255,255,255,0.55)">
              <circle cx="48" cy="150" r="2.2" />
              <circle cx="68" cy="172" r="1.6" />
              <circle cx="54" cy="196" r="2" />
            </g>
          )}
        </motion.g>
      </g>

      <path
        d="M44 56 C44 50 50 46 60 46 C70 46 76 50 76 56"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.4"
      />
      <path
        d="M42 108 C46 102 50 128 42 150"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <rect x="46" y="8" width="28" height="16" rx="5" fill="var(--water-cap-a)" />
      <rect x="50" y="4" width="20" height="8" rx="4" fill="var(--water-cap-b)" />
      <rect x="40" y="22" width="40" height="10" rx="3" fill="#d4af37" />
      <rect x="42" y="24" width="36" height="3" rx="1.5" fill="rgba(255,255,255,0.35)" />
    </svg>
  )
}

export default function WaterCarafeCard({
  size = 'full',
  todayMl = 0,
  goalMl,
  waterTracking,
  canLog = true,
  hasLogs = false,
  busy = false,
  onAdd,
  onUndo,
}) {
  const compact = size === 'compact'
  const [raw, setRaw] = useState('')
  const [localError, setLocalError] = useState('')
  const percent = fillPercent(todayMl, goalMl)
  const reached = goalReached(todayMl, goalMl)
  const customized = isGoalCustomized(waterTracking)
  const left = remainingMl(todayMl, goalMl)

  const submit = async (event) => {
    event?.preventDefault()
    if (!canLog || busy) return
    const amount = clampAmountMl(raw)
    if (amount == null) {
      setLocalError(WATER_COPY.amountInvalid)
      return
    }
    setLocalError('')
    const r = await onAdd?.(amount)
    if (r && r.success === false) {
      setLocalError(r.error || WATER_COPY.amountInvalid)
      return
    }
    setRaw('')
  }

  return (
    <section
      className={`water-carafe-card ${compact ? 'water-carafe-card--compact' : ''} ${reached ? 'water-carafe-card--reached' : ''}`}
    >
      <WaterBackdrop percent={percent} />
      <div
        className="sr-only"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`${Math.round(todayMl)} ${WATER_COPY.unit}, ${goalMl} ${WATER_COPY.goalSuffix}`}
      />

      <div className={`water-carafe-body ${compact ? 'water-carafe-body--compact' : 'water-carafe-body--split'}`}>
        <WaterBottle percent={percent} reached={reached} compact={compact} />
        <div className="water-carafe-copy">
          <p className="water-carafe-kicker">
            <Droplets className="h-3.5 w-3.5" strokeWidth={2.4} />
            {WATER_COPY.title}
          </p>

          <div className={`flex items-end justify-between gap-3 ${compact ? 'mt-1.5' : 'mt-2'}`}>
            <p className={`font-display font-bold tracking-tight text-white ${compact ? 'text-3xl' : 'text-4xl xl:text-5xl'}`}>
              {Math.round(todayMl)}
              <span className="ml-1.5 align-middle text-base font-semibold text-white/70">{WATER_COPY.unit}</span>
            </p>
            <p className="mb-1 text-right text-sm font-medium text-white/75">
              {goalMl} {WATER_COPY.goalSuffix}
            </p>
          </div>

          <p className={`text-sm text-white/80 ${compact ? 'mt-1.5' : 'mt-2'}`}>
            {reached
              ? WATER_COPY.goalReached
              : `${WATER_COPY.remainingPrefix} ${left} ${WATER_COPY.remainingSuffix}`}
          </p>
          {customized && (
            <p className="mt-1 text-xs font-medium text-amber-100">{WATER_COPY.goalByDietitian}</p>
          )}

          {canLog && (
            <form onSubmit={submit} className={`flex flex-wrap items-end gap-2 ${compact ? 'mt-3' : 'mt-4'}`}>
              <label className="min-w-[6.5rem] flex-1">
                <span className="sr-only">{WATER_COPY.placeholder}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={1000}
                  step={1}
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  placeholder={WATER_COPY.placeholder}
                  disabled={busy}
                  className="water-carafe-input"
                />
              </label>
              <button type="submit" disabled={busy} className="water-carafe-add">
                {WATER_COPY.add}
              </button>
              {hasLogs && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onUndo?.()}
                  className="water-carafe-undo"
                >
                  {WATER_COPY.undo}
                </button>
              )}
            </form>
          )}
          {localError ? (
            <p className="mt-2 text-xs font-medium text-rose-100">{localError}</p>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-white/65">{WATER_COPY.glassHint}</p>
          )}
          {!compact && (
            <p className="mt-1 text-[11px] leading-relaxed text-white/50">{WATER_COPY.medicalHint}</p>
          )}
        </div>
      </div>
    </section>
  )
}

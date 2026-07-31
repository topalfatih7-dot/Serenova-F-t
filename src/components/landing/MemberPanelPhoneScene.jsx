import { useEffect, useRef } from 'react'
import { Shield, Dumbbell, HeartPulse } from 'lucide-react'
import { createTimeline, utils } from 'animejs'
import MemberPanelPhoneScreen from './MemberPanelPhoneScreen'

const CHIPS = [
  { id: 'dietitian', label: 'Uzman Diyetisyenler', Icon: Shield, accent: 'from-brand-500 to-brand-600' },
  { id: 'coach', label: 'Kişisel Antrenörler', Icon: Dumbbell, accent: 'from-sage-500 to-emerald-500' },
  { id: 'health', label: 'Sağlık Analizleri', Icon: HeartPulse, accent: 'from-brand-400 to-sage-500' },
]

const DEPTH_LAYERS = 10
const LAYER_STEP = 1.4
const REST_Y = -16
const REST_X = 7
const TILT_Y = 10
const TILT_X = 7
const IDLE_Y = 2.2
const IDLE_X = 0.9
const LERP_HOVER = 0.14
const LERP_IDLE = 0.06
const BEZEL = 7
const FRAME_RADIUS = 36
const SCREEN_RADIUS = FRAME_RADIUS - BEZEL

function depthShade(i) {
  const t = i / Math.max(1, DEPTH_LAYERS - 1)
  const l = Math.round(42 - t * 22)
  return `linear-gradient(160deg, hsl(215 18% ${l + 6}%) 0%, hsl(215 22% ${l}%) 55%, hsl(215 26% ${Math.max(8, l - 8)}%) 100%)`
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Mobil / dokunmatik cihazlarda 3D hareket kapalı — sayfa kaydırması engellenmesin
function isTouchDevice() {
  if (typeof window === 'undefined') return true
  return !window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

function cancelSafe(a) {
  try {
    a?.pause?.()
    a?.cancel?.()
  } catch {
    /* ignore */
  }
}

/**
 * 3D telefon sahnesi.
 * Hover tüm hit-area’da; idle sinüs loop (sert rewind yok); translateY yok.
 */
export default function MemberPanelPhoneScene({ className = '' }) {
  const rootRef = useRef(null)
  const phoneRef = useRef(null)
  const chipRefs = useRef([])
  const entranceRef = useRef(null)
  const startedRef = useRef(false)
  const readyRef = useRef(false)
  const hoverRef = useRef(false)
  const pointerRef = useRef({ nx: 0, ny: 0 })
  const currentRef = useRef({ y: REST_Y, x: REST_X })
  const rafRef = useRef(0)
  const t0Ref = useRef(0)

  useEffect(() => {
    const phone = phoneRef.current
    const chips = chipRefs.current.filter(Boolean)
    const root = rootRef.current
    if (!phone || !root) return undefined

    const reduced = prefersReducedMotion() || isTouchDevice()

    utils.set(phone, {
      rotateY: REST_Y,
      rotateX: REST_X,
      translateZ: 0,
      opacity: 1,
    })
    chips.forEach((chip, i) => {
      utils.set(chip, {
        translateZ: 36 + i * 10,
        translateX: 0,
        opacity: 1,
      })
    })

    if (reduced) return undefined

    const applyTilt = (y, x) => {
      currentRef.current = { y, x }
      utils.set(phone, { rotateY: y, rotateX: x })
    }

    const stopLoop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
    }

    const loop = (now) => {
      if (!readyRef.current) {
        rafRef.current = 0
        return
      }

      if (!t0Ref.current) t0Ref.current = now
      const t = (now - t0Ref.current) / 1000

      let targetY
      let targetX
      let lerp

      if (hoverRef.current) {
        const { nx, ny } = pointerRef.current
        targetY = REST_Y + nx * TILT_Y
        targetX = REST_X - ny * TILT_X
        lerp = LERP_HOVER
      } else {
        // Kesintisiz sinüs — alternate rewind yok, aşağı kayma yok
        targetY = REST_Y + Math.sin(t * 0.55) * IDLE_Y
        targetX = REST_X + Math.sin(t * 0.38 + 1.2) * IDLE_X
        lerp = LERP_IDLE
      }

      const cur = currentRef.current
      applyTilt(
        cur.y + (targetY - cur.y) * lerp,
        cur.x + (targetX - cur.x) * lerp,
      )

      rafRef.current = requestAnimationFrame(loop)
    }

    const startLoop = () => {
      if (rafRef.current) return
      t0Ref.current = 0
      rafRef.current = requestAnimationFrame(loop)
    }

    const runEntrance = () => {
      if (startedRef.current) return
      startedRef.current = true

      utils.set(phone, {
        opacity: 0,
        rotateY: -30,
        rotateX: 12,
        translateZ: -36,
      })
      chips.forEach((chip) => {
        utils.set(chip, {
          opacity: 0,
          translateX: -28,
          translateZ: 0,
        })
      })

      const tl = createTimeline({ defaults: { ease: 'out(3)' } })
      entranceRef.current = tl

      tl.add(phone, {
        opacity: [0, 1],
        rotateY: [-30, REST_Y],
        rotateX: [12, REST_X],
        translateZ: [-36, 0],
        duration: 900,
      }, 0)

      chips.forEach((chip, i) => {
        tl.add(chip, {
          opacity: [0, 1],
          translateX: [-28, 0],
          translateZ: [0, 36 + i * 10],
          duration: 650,
        }, 200 + i * 110)
      })

      tl.then(() => {
        currentRef.current = { y: REST_Y, x: REST_X }
        readyRef.current = true
        startLoop()
      })
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          runEntrance()
          io.disconnect()
        }
      },
      { threshold: 0.2, rootMargin: '48px' },
    )
    io.observe(root)

    const readPointer = (e) => {
      const rect = root.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) return
      pointerRef.current = {
        nx: Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width - 0.5) * 2)),
        ny: Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height - 0.5) * 2)),
      }
    }

    const onEnter = (e) => {
      if (!readyRef.current) return
      hoverRef.current = true
      readPointer(e)
    }

    const onMove = (e) => {
      if (!readyRef.current) return
      if (!hoverRef.current) hoverRef.current = true
      readPointer(e)
    }

    const onLeave = () => {
      hoverRef.current = false
      // pointer sıfırlanmaz — idle hedefe lerp ile yumuşak geçer
    }

    root.addEventListener('pointerenter', onEnter)
    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerleave', onLeave)

    return () => {
      io.disconnect()
      root.removeEventListener('pointerenter', onEnter)
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
      stopLoop()
      cancelSafe(entranceRef.current)
      entranceRef.current = null
      startedRef.current = false
      readyRef.current = false
      hoverRef.current = false
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className={`hiw-phone-scene relative mx-auto w-full max-w-[380px] select-none ${className}`}
      style={{ perspective: '1400px' }}
      aria-hidden
    >
      {/* Arka ışık — telefon ortada, renkli halo (yalnızca CSS) */}
      <div className="hiw-phone-backlight" aria-hidden>
        <span className="hiw-phone-backlight__core" />
        <span className="hiw-phone-backlight__orb hiw-phone-backlight__orb--brand" />
        <span className="hiw-phone-backlight__orb hiw-phone-backlight__orb--sage" />
        <span className="hiw-phone-backlight__orb hiw-phone-backlight__orb--warm" />
        <span className="hiw-phone-backlight__halo" />
      </div>

      {/* Tüm sahne hover alanı */}
      <div className="hiw-phone-hit absolute inset-0 z-30" />

      <div className="pointer-events-none absolute left-0 top-[18%] z-20 flex flex-col gap-3 sm:left-[-6%] sm:top-[14%] sm:gap-4">
        {CHIPS.map((chip, i) => {
          const Icon = chip.Icon
          return (
            <div
              key={chip.id}
              ref={(el) => {
                chipRefs.current[i] = el
              }}
              className="hiw-float-chip"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div
                className={`hiw-float-chip-bob hiw-float-chip-bob--${i} flex items-center gap-2 rounded-xl border border-white/80 bg-white/95 px-2.5 py-2 shadow-lg shadow-brand-900/10 backdrop-blur-sm`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${chip.accent} text-white shadow-sm`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                </span>
                <span className="whitespace-nowrap font-display text-[10px] font-bold tracking-tight text-cream-900 sm:text-[11px]">
                  {chip.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div
        ref={phoneRef}
        className="hiw-phone-device pointer-events-none relative z-10 mx-auto w-[248px] sm:w-[280px]"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        <div
          className="hiw-phone-chassis relative w-full"
          style={{
            transformStyle: 'preserve-3d',
            aspectRatio: '9 / 19.2',
          }}
        >
          {Array.from({ length: DEPTH_LAYERS }, (_, i) => {
            const fromBack = DEPTH_LAYERS - 1 - i
            return (
              <div
                key={`depth-${fromBack}`}
                className="hiw-phone-depth absolute inset-0"
                style={{
                  borderRadius: FRAME_RADIUS,
                  transform: `translateZ(${-fromBack * LAYER_STEP}px)`,
                  background: depthShade(fromBack),
                  boxShadow:
                    fromBack === DEPTH_LAYERS - 1
                      ? '0 0 0 1px rgba(0,0,0,0.4)'
                      : undefined,
                }}
              />
            )
          })}

          <div
            className="hiw-phone-face absolute inset-0"
            style={{
              borderRadius: FRAME_RADIUS,
              transform: 'translateZ(0.5px)',
              padding: BEZEL,
              background:
                'linear-gradient(165deg, #3a4558 0%, #1a2332 40%, #121820 100%)',
              boxShadow:
                '0 28px 50px -18px rgba(15, 23, 42, 0.55), inset 0 1px 0 rgba(255,255,255,0.14)',
            }}
          >
            <span
              className="absolute rounded-[1px]"
              style={{
                left: -2.5,
                top: '21%',
                width: 2.5,
                height: 22,
                background: 'linear-gradient(180deg, #5a6574, #2a3544)',
              }}
            />
            <span
              className="absolute rounded-[1px]"
              style={{
                left: -2.5,
                top: '30%',
                width: 2.5,
                height: 38,
                background: 'linear-gradient(180deg, #5a6574, #2a3544)',
              }}
            />
            <span
              className="absolute rounded-[1px]"
              style={{
                right: -2.5,
                top: '27%',
                width: 2.5,
                height: 48,
                background: 'linear-gradient(180deg, #5a6574, #2a3544)',
              }}
            />

            <div
              className="relative h-full w-full overflow-hidden bg-cream-50"
              style={{ borderRadius: SCREEN_RADIUS }}
            >
              <div className="pointer-events-none absolute left-1/2 top-1.5 z-20 h-[18px] w-[72px] -translate-x-1/2 rounded-full bg-cream-900" />
              <div
                className="pointer-events-none absolute inset-0 z-10"
                style={{
                  borderRadius: SCREEN_RADIUS,
                  background:
                    'linear-gradient(145deg, rgba(255,255,255,0.16) 0%, transparent 38%, transparent 62%, rgba(255,255,255,0.05) 100%)',
                }}
              />
              <div className="h-full w-full">
                <MemberPanelPhoneScreen />
              </div>
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none mx-auto mt-5 h-3.5 w-[72%] rounded-[100%] opacity-45 blur-md"
          style={{
            background: 'radial-gradient(ellipse, rgba(26,35,50,0.48), transparent 70%)',
          }}
        />
      </div>
    </div>
  )
}

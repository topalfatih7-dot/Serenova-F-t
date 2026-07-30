import { Bell, Flame, Crown, CalendarDays, ArrowRight } from 'lucide-react'
import { PANEL_IMAGES } from '../../utils/panelImages'

const SCORE = 78
const GAUGE_SIZE = 64
const GAUGE_STROKE = 7
const GAUGE_R = (GAUGE_SIZE - GAUGE_STROKE) / 2
const GAUGE_C = 2 * Math.PI * GAUGE_R
const GAUGE_OFFSET = GAUGE_C - (SCORE / 100) * GAUGE_C

const WEIGHT_POINTS = '4,28 28,22 52,24 76,16 100,18 124,12'

/** Statik müşteri paneli özeti — landing telefon mockup ekranı. */
export default function MemberPanelPhoneScreen() {
  return (
    <div className="hiw-phone-screen flex h-full flex-col overflow-hidden bg-cream-50 text-cream-900">
      {/* Status bar */}
      <div className="flex shrink-0 items-center justify-between px-4 pb-1 pt-3 text-[9px] font-semibold text-cream-800/70">
        <span>09:41</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-3.5 rounded-sm bg-cream-800/50" />
          <span className="inline-block h-2 w-2 rounded-full bg-cream-800/50" />
        </span>
      </div>

      {/* Greeting */}
      <div className="flex shrink-0 items-start justify-between px-3.5 pb-2 pt-1">
        <div>
          <p className="font-display text-[13px] font-bold leading-tight tracking-tight text-cream-900">
            Merhaba, Şenol
          </p>
          <p className="mt-0.5 text-[9px] leading-snug text-cream-800/60">
            Bugün harika bir gün olabilir
          </p>
        </div>
        <span className="relative mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-cream-200">
          <Bell className="h-3.5 w-3.5 text-cream-800/70" strokeWidth={2} />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </span>
      </div>

      <div className="relative min-h-0 flex-1 space-y-1.5 overflow-hidden px-3 pb-2">
        {/* Welcome strip */}
        <div
          className="relative overflow-hidden rounded-xl px-2.5 py-2 text-white"
          style={{
            background:
              'linear-gradient(125deg, #2478a8 0%, #2d8fc4 30%, #449664 70%, #3b82f6 100%)',
          }}
        >
          <p className="text-[7px] font-medium text-white/80">30 Temmuz 2026, Perşembe</p>
          <p className="mt-0.5 font-display text-[10px] font-bold leading-snug">
            Küçük adımlar, büyük dönüşüm
          </p>
          <div className="mt-1 flex gap-1">
            <span className="rounded-full bg-white px-1.5 py-0.5 text-[6.5px] font-semibold text-brand-700">
              Bugünkü Programım
            </span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[6.5px] font-semibold text-white">
              Sağlık Analizi
            </span>
          </div>
        </div>

        {/* Health score */}
        <div className="rounded-xl border border-cream-200/80 bg-gradient-to-br from-brand-50 via-white to-sage-50 p-2 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
              <svg width={GAUGE_SIZE} height={GAUGE_SIZE} className="-rotate-90" aria-hidden>
                <circle
                  cx={GAUGE_SIZE / 2}
                  cy={GAUGE_SIZE / 2}
                  r={GAUGE_R}
                  fill="none"
                  stroke="#e8f2eb"
                  strokeWidth={GAUGE_STROKE}
                />
                <circle
                  cx={GAUGE_SIZE / 2}
                  cy={GAUGE_SIZE / 2}
                  r={GAUGE_R}
                  fill="none"
                  stroke="#5a9e6f"
                  strokeWidth={GAUGE_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={GAUGE_C}
                  strokeDashoffset={GAUGE_OFFSET}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-base font-bold leading-none text-cream-900">{SCORE}</span>
                <span className="text-[6px] font-medium text-cream-800/50">/100</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[7px] font-bold uppercase tracking-wide text-brand-600/80">
                YeniForm Sağlık Skoru
              </p>
              <p className="mt-0.5 font-display text-[11px] font-bold text-cream-900">Genel puanınız</p>
              <span className="mt-1 inline-flex rounded-md bg-sage-100 px-1.5 py-0.5 text-[7px] font-semibold text-sage-800">
                Güçlü
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-lg border border-cream-200/70 bg-white p-1.5 shadow-sm">
            <div className="flex items-center gap-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-brand-600 text-white">
                <Flame className="h-2.5 w-2.5" strokeWidth={2.5} />
              </span>
              <span className="text-[7px] font-medium text-cream-800/55">Seri</span>
            </div>
            <p className="mt-0.5 font-display text-[12px] font-bold tabular-nums text-cream-900">12 gün</p>
          </div>
          <div className="rounded-lg border border-cream-200/70 bg-white p-1.5 shadow-sm">
            <div className="flex items-center gap-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-sage-500 to-emerald-500 text-white">
                <Crown className="h-2.5 w-2.5" strokeWidth={2.5} />
              </span>
              <span className="text-[7px] font-medium text-cream-800/55">Aktif Plan</span>
            </div>
            <p className="mt-0.5 font-display text-[12px] font-bold text-cream-900">Spor</p>
          </div>
        </div>

        {/* Today's program */}
        <div className="overflow-hidden rounded-xl border border-cream-200/70 bg-white shadow-sm">
          <div className="relative h-12 w-full overflow-hidden">
            <img
              src={PANEL_IMAGES.programWorkout.url}
              alt=""
              className="h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[6.5px] font-semibold text-cream-900">
              <CalendarDays className="h-2.5 w-2.5 text-brand-600" />
              Bugünkü Program
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <div className="min-w-0">
              <p className="truncate font-display text-[10px] font-bold text-cream-900">
                Üst Vücut Güçlendirme
              </p>
              <p className="text-[7px] text-cream-800/55">35 dk · Orta seviye</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-gradient-to-r from-brand-500 to-sage-500 px-2 py-0.5 text-[7px] font-bold text-white shadow-sm">
              Başla
              <ArrowRight className="h-2.5 w-2.5" />
            </span>
          </div>
        </div>

        {/* Dietitian message */}
        <div className="flex items-center gap-2 rounded-xl border border-cream-200/70 bg-white px-2 py-1.5 shadow-sm">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sage-400 to-sage-600 text-[9px] font-bold text-white">
            AK
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[7px] font-semibold text-cream-800/50">Diyetisyeniniz Ayşe K.</p>
            <p className="truncate text-[9px] font-medium leading-snug text-cream-900">
              Planınıza harika devam ediyorsunuz!
            </p>
          </div>
        </div>

        {/* Weight trend mini */}
        <div className="rounded-xl border border-cream-200/70 bg-white px-2 py-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[7px] font-bold uppercase tracking-wide text-cream-800/50">Kilo Trendi</p>
            <p className="font-display text-[11px] font-bold tabular-nums text-cream-900">70,4 kg</p>
          </div>
          <svg viewBox="0 0 128 36" className="mt-0.5 h-7 w-full" aria-hidden>
            <polyline
              fill="none"
              stroke="#b8dcef"
              strokeWidth="1.5"
              points={WEIGHT_POINTS}
            />
            <polyline
              fill="none"
              stroke="#2d8fc4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={WEIGHT_POINTS}
            />
            <circle cx="124" cy="12" r="3" fill="#2d8fc4" />
          </svg>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-cream-50 to-transparent" />
      </div>
    </div>
  )
}

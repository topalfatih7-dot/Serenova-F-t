import { Link } from 'react-router-dom'
import { Sparkles, Target, Gem, ArrowRight } from 'lucide-react'

/**
 * Üyeye dönük AI değerlendirmesi — güçlü yönler, geliştirilecek alanlar
 * ve plan önerisi (pazarlama). `brief` için resolveMemberBrief kullanın.
 */
export default function MemberHealthBrief({ brief, showPitch = true }) {
  if (!brief) return null

  return (
    <div className="min-w-0 space-y-3">
      {brief.strengths && (
        <div className="rounded-3xl border border-sage-200 bg-sage-50/60 p-5 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sage-700">
            <Sparkles className="h-4 w-4 shrink-0" /> Bunları iyi yapıyorsun
          </p>
          <p className="mt-2 text-sm leading-relaxed text-sage-900/85 break-words">
            {brief.strengths}
          </p>
        </div>
      )}

      {brief.focus && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-700">
            <Target className="h-4 w-4 shrink-0" /> Birlikte düzeltelim
          </p>
          <p className="mt-2 text-sm leading-relaxed text-amber-900/85 break-words">
            {brief.focus}
          </p>
        </div>
      )}

      {showPitch && brief.planPitch && (
        <div className="overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-sage-50/40 p-5 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-700">
            <Gem className="h-4 w-4 shrink-0" /> Sana özel öneri
          </p>
          <p className="mt-2 text-sm leading-relaxed text-cream-900/85 break-words">
            {brief.planPitch}
          </p>
          <Link
            to="/plans"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-600"
          >
            Planları incele <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Ruler, Scale, CalendarDays, UserRound } from 'lucide-react'
import { getMissingAnalysisProfileFields } from '../../utils/healthProfile'

const FIELD_ICONS = {
  birthDate: CalendarDays,
  weight: Scale,
  height: Ruler,
  gender: UserRound,
}

/**
 * Sağlık testi öncesi: kilo/boy/doğum tarihi vb. eksikse profesyonel uyarı.
 * Tüm alanlar doluysa hiçbir şey render etmez.
 */
export default function HealthTestProfilePrepBanner({ profile }) {
  const missing = getMissingAnalysisProfileFields(profile)
  if (!missing.length) return null

  return (
    <aside
      className="relative overflow-hidden rounded-3xl border-2 border-amber-300/90 bg-gradient-to-br from-amber-50 via-white to-brand-50/40 shadow-md ring-1 ring-amber-200/80"
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-500 to-brand-500" aria-hidden />
      <div className="flex flex-col gap-4 p-5 pl-6 sm:flex-row sm:items-start sm:gap-5 sm:p-6 sm:pl-7">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm ring-1 ring-amber-200">
          <AlertTriangle className="h-6 w-6" strokeWidth={2.25} aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-800/80">
              Analiz kalitesi için önemli
            </p>
            <h2 className="mt-1 font-display text-lg font-bold leading-snug text-cream-900 sm:text-xl">
              Sağlık testi tek başına yeterli değildir
            </h2>
          </div>

          <p className="text-sm leading-relaxed text-cream-800/85">
            Program ve sağlık analiziniz; test cevaplarının yanı sıra profilinizdeki
            <strong className="font-semibold text-cream-900"> boy, kilo ve doğum tarihi </strong>
            gibi ölçümlerle birlikte hesaplanır. Bu alanlar boşken sistem varsayılan değerler kullanır;
            sonuçlar size özel ve güvenilir olmayabilir.
          </p>
          <p className="text-sm leading-relaxed text-cream-800/85">
            Daha doğru bir değerlendirme için önce eksik profil bilgilerini tamamlayın,
            ardından sağlık testlerine geçin. Testleri şimdi de doldurabilirsiniz; ancak
            profili tamamladıktan sonra analiziniz belirgin şekilde iyileşir.
          </p>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/55">
              Eksik alanlar
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {missing.map((field) => {
                const Icon = FIELD_ICONS[field.key] || AlertTriangle
                return (
                  <li
                    key={field.key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-amber-950 shadow-sm"
                  >
                    <Icon className="h-3.5 w-3.5 text-amber-600" aria-hidden />
                    {field.label}
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-amber-700 hover:to-brand-700"
            >
              Profilimi tamamla
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <span className="text-xs text-cream-800/55">
              Profil → kişisel bilgilerden boy, kilo ve doğum tarihini girebilirsiniz.
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

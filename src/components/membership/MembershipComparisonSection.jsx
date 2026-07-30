import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  ClipboardList,
  Droplets,
  Dumbbell,
  HeartPulse,
  Library,
  MessageCircle,
  MessagesSquare,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Users,
  X,
  Headphones,
  Calculator,
} from 'lucide-react'
import { formatPlanPrice } from '../../data/membershipPlans'
import { RECOMMENDED_PLAN } from '../../data/membershipPlans'
import { getPlanTheme, planIcon } from './planTheme'
import MembershipComparisonAccordion from './MembershipComparisonAccordion'
import { scrollToContactSection } from '../../utils/scrollToContact'

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    label: 'Güvenli ve KVKK Uyumlu',
    tone: 'text-teal-600 bg-teal-50 ring-teal-100',
  },
  {
    icon: Users,
    label: 'Uzman Kadro',
    tone: 'text-sage-700 bg-sage-50 ring-sage-100',
  },
  {
    icon: CalendarDays,
    label: 'Esnek Planlama',
    tone: 'text-emerald-700 bg-emerald-50 ring-emerald-100',
  },
]

const FEATURE_ICONS = {
  'Yeniform Kişisel Sağlık Analizi': { Icon: HeartPulse, className: 'text-rose-500 bg-rose-50' },
  'Doktor tarafından kan tahlili analizi': { Icon: Droplets, className: 'text-red-500 bg-red-50' },
  'Manuel Kalori Hesaplama': { Icon: Calculator, className: 'text-sky-600 bg-sky-50' },
  'Fotoğraflı Kalori Tespiti': { Icon: Camera, className: 'text-violet-600 bg-violet-50' },
  'Diyetisyen Görüşmesi / Ay': { Icon: UserRound, className: 'text-emerald-600 bg-emerald-50' },
  'Koç Görüşmesi / Ay': { Icon: MessagesSquare, className: 'text-blue-600 bg-blue-50' },
  'Diyet Programı': { Icon: ClipboardList, className: 'text-teal-600 bg-teal-50' },
  'Spor Programı': { Icon: Dumbbell, className: 'text-indigo-600 bg-indigo-50' },
  'Hareket kütüphanesi': { Icon: Library, className: 'text-brand-600 bg-brand-50' },
  'İlerleme Raporları': { Icon: TrendingUp, className: 'text-sage-600 bg-sage-50' },
  Destek: { Icon: Headphones, className: 'text-amber-600 bg-amber-50' },
}

function LeafDecor({ className = '' }) {
  return (
    <svg aria-hidden viewBox="0 0 64 88" className={className}>
      <path
        d="M32 4C18 22 10 40 12 62c8-6 16-8 20-8s12 2 20 8C54 40 46 22 32 4Z"
        fill="currentColor"
        opacity="0.88"
      />
      <path
        d="M32 14v52"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M32 28c-6 6-10 14-11 22M32 34c6 5 9 12 10 20"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function CellValue({ value }) {
  if (value === false) {
    return (
      <span className="mx-auto flex h-6 w-6 items-center justify-center" aria-label="Yok">
        <X className="h-3.5 w-3.5 text-slate-300" strokeWidth={2.5} />
      </span>
    )
  }
  if (value === true) {
    return (
      <span
        className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sage-500 to-emerald-500 text-white shadow-sm shadow-sage-500/25"
        aria-label="Var"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    )
  }
  return <span className="text-xs font-semibold text-slate-700">{value}</span>
}

export default function MembershipComparisonSection({
  comparisonPlans,
  comparisonRows,
  isMember,
  membership,
  user,
}) {
  return (
    <section className="membership-compare-section relative overflow-visible">
      <LeafDecor className="membership-compare-leaf membership-compare-leaf-l text-sage-500/55" />
      <LeafDecor className="membership-compare-leaf membership-compare-leaf-r text-emerald-600/50" />

      <div className="relative z-[1]">
        <div className="text-center">
          <span className="plans-ref-badge">Detaylı Karşılaştırma</span>
          <h2 className="section-title mt-4 text-[clamp(1.45rem,3.2vw,2.15rem)]">
            Özellik{' '}
            <span className="bg-gradient-to-r from-sage-600 to-emerald-500 bg-clip-text text-transparent">
              özellik
            </span>{' '}
            yan yana
          </h2>
          <p className="section-subtitle mx-auto mt-2 max-w-xl text-sm">
            Abonelik planlarında 1, 3 veya 6 aylık süre; Doktor Paketi tek seferliktir.
          </p>

          <ul className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <li
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100/90 backdrop-blur-sm sm:text-xs"
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full ring-1 ${item.tone}`}>
                    <Icon className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden />
                  </span>
                  {item.label}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="mt-6 md:hidden">
          <MembershipComparisonAccordion
            plans={comparisonPlans}
            comparisonRows={comparisonRows}
            isMember={isMember}
            membership={membership}
            user={user}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="membership-compare-table-wrap mt-8 hidden overflow-hidden rounded-[1.5rem] border border-white/90 bg-white/95 shadow-[0_20px_50px_-28px_rgba(30,70,55,0.35)] backdrop-blur-sm md:block"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="w-64 py-5 pl-6 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Özellik
                  </th>
                  {comparisonPlans.map((plan) => {
                    const theme = getPlanTheme(plan)
                    const isVip = plan.id === RECOMMENDED_PLAN
                    return (
                      <th
                        key={plan.id}
                        className={`relative px-3 py-5 text-center align-bottom ${
                          isVip ? 'bg-gradient-to-b from-amber-50/90 to-orange-50/40' : ''
                        }`}
                      >
                        {isVip && (
                          <span className="absolute left-1/2 top-0 z-[1] -translate-x-1/2 rounded-b-lg bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm shadow-amber-500/30">
                            En kapsamlı
                          </span>
                        )}
                        <Link
                          to={`/onboarding?plan=${plan.id}`}
                          className={`group mx-auto flex max-w-[9rem] flex-col items-center gap-1.5 rounded-2xl px-2 py-1 transition hover:bg-white/70 ${isVip ? 'mt-3' : ''}`}
                        >
                          <span
                            className={`flex h-11 w-11 items-center justify-center rounded-full shadow-md transition group-hover:scale-105 ${theme.icon}`}
                          >
                            {planIcon(plan, 'h-5 w-5')}
                          </span>
                          <span className={`font-display text-[13px] font-bold leading-tight ${theme.label}`}>
                            {plan.name}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            {plan.price === 0 ? 'Ücretsiz' : formatPlanPrice(plan)}
                          </span>
                        </Link>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => {
                  const meta = FEATURE_ICONS[row.feature] || {
                    Icon: Check,
                    className: 'text-slate-500 bg-slate-50',
                  }
                  const RowIcon = meta.Icon
                  return (
                    <tr
                      key={row.feature}
                      className={`border-b border-slate-50 transition last:border-0 hover:bg-sage-50/25 ${
                        i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${meta.className}`}
                          >
                            <RowIcon className="h-4 w-4" strokeWidth={2} aria-hidden />
                          </span>
                          <span className="text-[13px] font-medium leading-snug text-slate-800">
                            {row.feature}
                          </span>
                        </div>
                      </td>
                      {comparisonPlans.map((plan) => {
                        const isVip = plan.id === RECOMMENDED_PLAN
                        return (
                          <td
                            key={plan.id}
                            className={`px-3 py-3.5 text-center ${isVip ? 'bg-amber-50/35' : ''}`}
                          >
                            <CellValue value={row[plan.id]} />
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        <div className="membership-compare-cta mt-6 flex flex-col items-start gap-4 rounded-2xl border border-sage-100/80 bg-gradient-to-r from-slate-50/90 via-white to-sage-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3 sm:items-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sage-700 ring-1 ring-sage-200/80">
              <MessageCircle className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <p className="text-sm leading-relaxed text-slate-600">
              {isMember
                ? 'Planınızı değiştirmek veya ek paket almak için profilinizden devam edebilirsiniz.'
                : 'Hangi planın size uygun olduğundan emin değil misiniz? Uzman ekibimiz size en uygun planı seçmeniz için yardımcı olsun.'}
            </p>
          </div>
          <Link
            to={isMember ? '/profile' : '/#bize-ulasin'}
            onClick={() => {
              if (!isMember) scrollToContactSection()
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-sage-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sage-600/25 transition hover:brightness-110"
          >
            {isMember ? 'Profilime dön' : 'Ücretsiz Danışmanlık Al'}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}

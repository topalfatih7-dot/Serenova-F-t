import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, ArrowRight, Dumbbell, Apple, Stethoscope } from 'lucide-react'
import TeamCarousel from './TeamCarousel'
import SectionBackdrop, { SectionHeader } from './SectionBackdrop'

const ROLE_STATS = [
  { icon: Dumbbell, label: 'Fitness Koçu', color: 'text-brand-600 bg-brand-500/10' },
  { icon: Apple, label: 'Diyetisyen', color: 'text-sage-600 bg-sage-500/10' },
  { icon: Stethoscope, label: 'Doktor', color: 'text-cream-700 bg-cream-800/10' },
]

export default function TeamSection({ staff = [] }) {
  const active = staff.filter((s) => s.active !== false)
  if (active.length === 0) return null

  return (
    <SectionBackdrop variant="team" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          dark
          badge="Kadromuz"
          badgeIcon={Users}
          title="Uzman Ekibimizle Tanışın"
          subtitle="Sertifikalı koç, diyetisyen ve doktorlarımız dönüşüm yolculuğunuzda yanınızda."
        />

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {ROLE_STATS.map(({ icon: Icon, label, color }) => (
            <span key={label} className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </span>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-10 rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6 md:p-8"
        >
          <TeamCarousel members={active} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/team/coaches" className="rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">
            Tüm Koçlar
          </Link>
          <Link to="/team/dietitians" className="rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">
            Tüm Diyetisyenler
          </Link>
          <Link to="/onboarding" className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-400 to-sage-400 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110">
            Kayıt ol ve eşleş
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </SectionBackdrop>
  )
}

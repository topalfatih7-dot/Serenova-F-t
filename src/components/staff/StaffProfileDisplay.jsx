import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Award, BookOpen, Briefcase, CalendarDays, Clock, Globe, GraduationCap,
} from 'lucide-react'
import { staffRoleMeta } from '../../utils/staffRoles'
import { normalizeStaffProfile } from '../../data/staffProfile'
import { teamListPathForRole } from '../../config/seo'
import { weekdayLabel } from '../package/supportScheduleConstants'

function Section({ title, icon: Icon, children }) {
  if (!children) return null
  return (
    <section className="rounded-2xl border border-cream-100 bg-white p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-900">
        {Icon && <Icon className="h-5 w-5 text-brand-500" />}
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function StaffProfileDisplay({ member }) {
  const profile = normalizeStaffProfile(member)
  const meta = staffRoleMeta(member.role)
  const RoleIcon = meta.icon
  const roleGradient = {
    coach: 'from-brand-500 to-brand-700',
    dietitian: 'from-sage-500 to-sage-700',
    doctor: 'from-cream-700 to-cream-900',
  }[member.role] || 'from-brand-500 to-brand-700'

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        to={teamListPathForRole(member.role)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-cream-800/60 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {meta.label} listesine dön
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm"
      >
        <div className={`relative bg-gradient-to-br ${roleGradient} px-6 py-8 sm:px-10 sm:py-10`}>
          <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end">
            <div className="relative mx-auto shrink-0 sm:mx-0">
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt={profile.name}
                  className="h-36 w-36 rounded-2xl border-4 border-white/30 object-cover shadow-xl sm:h-44 sm:w-44"
                />
              ) : (
                <div className="flex h-36 w-36 items-center justify-center rounded-2xl border-4 border-white/30 bg-white/20 sm:h-44 sm:w-44">
                  <span className="font-display text-5xl font-bold text-white/80">{profile.name?.charAt(0)}</span>
                </div>
              )}
              <span className="absolute -bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-cream-900 shadow-md">
                <RoleIcon className="h-3.5 w-3.5 text-brand-600" />
                {meta.label}
              </span>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{profile.name}</h1>
              {profile.title && <p className="mt-1 text-lg text-white/90">{profile.title}</p>}
              {profile.specialty && <p className="mt-2 text-sm font-semibold text-white/80">{profile.specialty}</p>}

              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                {profile.experienceYears > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                    <Briefcase className="h-3.5 w-3.5" />
                    {profile.experienceYears} yıl deneyim
                  </span>
                )}
                {profile.languages.map((lang) => (
                  <span key={lang} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                    <Globe className="h-3.5 w-3.5" />
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-8">
          {profile.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.specialties.map((tag) => (
                <span key={tag} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {profile.bio ? (
            <Section title="Hakkında" icon={BookOpen}>
              <p className="text-sm leading-relaxed text-cream-800/75 whitespace-pre-line">{profile.bio}</p>
            </Section>
          ) : (
            <Section title="Hakkında" icon={BookOpen}>
              <p className="text-sm leading-relaxed text-cream-800/75">
                {profile.name}, Yeni Form {meta.label.toLowerCase()} kadrosunda yer alır.
                {member.role === 'dietitian' && ' Online diyetisyen görüşmeleri video üzerinden yürütülür; kişiye özel beslenme programı üye panelinde takip edilir.'}
                {member.role === 'coach' && ' Online koçluk seansları video üzerinden yapılır; kişiye özel antrenman programı ve egzersiz kütüphanesi panelde sunulur.'}
                {member.role === 'doctor' && ' Online sağlık danışmanlığı wellness sürecinizi destekler; tıbbi teşhis veya tedavi yerine geçmez.'}
              </p>
            </Section>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            {profile.education.length > 0 && (
              <Section title="Eğitim" icon={GraduationCap}>
                <ul className="space-y-4">
                  {profile.education.map((edu, i) => (
                    <li key={i} className="border-l-2 border-brand-200 pl-4">
                      <p className="font-semibold text-cream-900">{edu.degree}</p>
                      <p className="text-sm text-cream-800/70">{edu.school}</p>
                      {edu.year && <p className="mt-0.5 text-xs text-cream-800/50">{edu.year}</p>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {profile.experiences.length > 0 && (
              <Section title="Deneyim" icon={Briefcase}>
                <ul className="space-y-4">
                  {profile.experiences.map((exp, i) => (
                    <li key={i} className="border-l-2 border-sage-200 pl-4">
                      <p className="font-semibold text-cream-900">{exp.title}</p>
                      <p className="text-sm text-cream-800/70">{exp.organization}</p>
                      {exp.period && <p className="mt-0.5 text-xs font-medium text-brand-600">{exp.period}</p>}
                      {exp.description && <p className="mt-1 text-sm text-cream-800/60">{exp.description}</p>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>

          {profile.certificates.length > 0 && (
            <Section title="Sertifika & Diplomalar" icon={Award}>
              <div className="grid gap-3 sm:grid-cols-2">
                {profile.certificates.map((cert, i) => (
                  <div key={i} className="rounded-xl border border-cream-100 bg-cream-50/50 p-4">
                    <p className="font-semibold text-cream-900">{cert.name}</p>
                    <p className="mt-1 text-sm text-cream-800/65">{cert.issuer}</p>
                    {cert.year && <p className="mt-1 text-xs text-cream-800/45">{cert.year}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {profile.workDays?.length > 0 && (
            <Section title="Çalışma Saatleri" icon={Clock}>
              <p className="flex items-start gap-2 text-sm text-cream-800/80">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-cream-800/40" />
                <span>
                  {profile.workDays.map(weekdayLabel).join(', ')}
                  <span className="block text-xs text-cream-800/50">
                    {profile.workStart} – {profile.workEnd}
                  </span>
                </span>
              </p>
            </Section>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Programa Katıl
            </Link>
            <Link
              to="/membership"
              className="inline-flex items-center justify-center rounded-xl border border-cream-200 px-6 py-3 text-sm font-semibold text-cream-800 hover:border-brand-200 hover:text-brand-600"
            >
              Üyelik Seçenekleri
            </Link>
            {member.role === 'dietitian' && (
              <Link
                to="/online-diyetisyen"
                className="inline-flex items-center justify-center rounded-xl border border-sage-200 px-6 py-3 text-sm font-semibold text-sage-800 hover:border-sage-400"
              >
                Online Diyetisyen
              </Link>
            )}
            {member.role === 'coach' && (
              <Link
                to="/online-kocluk"
                className="inline-flex items-center justify-center rounded-xl border border-brand-200 px-6 py-3 text-sm font-semibold text-brand-800 hover:border-brand-400"
              >
                Online Koçluk
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </article>
  )
}

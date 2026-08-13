import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Briefcase, CalendarDays, Clock, Crown, Globe, GraduationCap,
  Play, Trophy, User,
} from 'lucide-react'
import { staffRoleMeta } from '../../utils/staffRoles'
import {
  normalizeStaffProfile,
  publicCertificates,
  publicEducation,
  publicExperiences,
  hasPublicWorkSchedule,
  hasAvailabilitySlots,
  isMeaningfulProfileText,
  formatStaffDisplayName,
} from '../../data/staffProfile'
import { teamListPathForRole } from '../../config/seo'
import { weekdayLabel } from '../package/supportScheduleConstants'
import { formatAvailabilityRanges } from '../../services/availability'
import { certificateVisual, expertiseIconForRole } from './staffProfileVisuals'
import StaffSpecialtyShowcase from './StaffSpecialtyShowcase'

function InfoCard({ title, icon: Icon, tone, children, delay = 0 }) {
  if (!children) return null
  const iconBg = {
    teal: 'bg-teal-500',
    violet: 'bg-violet-500',
    orange: 'bg-orange-400',
    sage: 'bg-sage-500',
  }[tone] || 'bg-brand-500'

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex h-full flex-col rounded-2xl border border-cream-100 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg} text-white shadow-md shadow-black/10`}>
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <h2 className="font-display text-lg font-bold text-cream-900">{title}</h2>
      </div>
      <div className="text-sm leading-relaxed text-cream-800/75">{children}</div>
    </motion.section>
  )
}

export default function StaffProfileDisplay({ member }) {
  const profile = normalizeStaffProfile(member)
  const meta = staffRoleMeta(member.role)
  const RoleIcon = meta.icon
  const ExpertiseIcon = expertiseIconForRole(member.role)
  const displayName = formatStaffDisplayName(profile.name)
  const certificates = publicCertificates(profile.certificates)
  const education = publicEducation(profile.education)
  const experiences = publicExperiences(profile.experiences)
  const bio = profile.bio?.trim() || ''
  const specialty = profile.specialty || profile.specialties[0] || ''
  const tags = profile.specialties.length ? profile.specialties : specialty ? [specialty] : []
  const showHours = hasPublicWorkSchedule(profile)
  const heroClass = {
    coach: 'staff-profile-hero--coach',
    dietitian: 'staff-profile-hero--dietitian',
    doctor: 'staff-profile-hero--doctor',
  }[member.role] || 'staff-profile-hero--coach'

  const secondaryCount = [education.length, experiences.length].filter(Boolean).length

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
        className="overflow-hidden rounded-[1.75rem] border border-cream-200/80 bg-white shadow-[0_18px_50px_-24px_rgba(26,35,50,0.28)]"
      >
        <div className={`staff-profile-hero ${heroClass} px-5 py-8 sm:px-8 sm:py-10 lg:px-10`}>
          <div aria-hidden className="staff-profile-hero-wash" />
          <div aria-hidden className="staff-profile-hero-wave" />
          <div aria-hidden className="staff-profile-hero-wave-2" />
          <div aria-hidden className="staff-profile-hero-dots" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-6 lg:contents">
              <div className="relative w-fit shrink-0 pb-2">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt={displayName}
                    className="h-40 w-40 rounded-2xl object-cover shadow-2xl ring-[5px] ring-white sm:h-44 sm:w-44 lg:h-48 lg:w-48"
                  />
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-white/20 shadow-2xl ring-[5px] ring-white sm:h-44 sm:w-44 lg:h-48 lg:w-48">
                    <span className="font-display text-5xl font-bold text-white/85">{displayName.charAt(0)}</span>
                  </div>
                )}
                <span className="absolute bottom-0 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3.5 py-1 text-xs font-semibold text-cream-900 shadow-lg">
                  <RoleIcon className="h-3.5 w-3.5 text-brand-600" />
                  {meta.label}
                </span>
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-white/80">
                    {member.role === 'dietitian' ? 'Online Diyetisyen' : member.role === 'coach' ? 'Online Fitness Koçu' : meta.label}
                  </span>
                  {displayName}
                </h1>
                {profile.title && (
                  <p className="mt-1 text-base font-medium text-white/90 sm:text-lg">{profile.title}</p>
                )}

                <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {profile.experienceYears > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      <Briefcase className="h-3.5 w-3.5" />
                      {profile.experienceYears} Yıl Deneyim
                    </span>
                  )}
                  {profile.languages.map((lang) => (
                    <span key={lang} className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      <Globe className="h-3.5 w-3.5" />
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {specialty && (
              <div className="mx-auto w-full max-w-xs shrink-0 rounded-2xl bg-white p-4 shadow-xl sm:mx-0 lg:w-56">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-500">
                    <ExpertiseIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-cream-800/45">Uzmanlık Alanı</p>
                    <p className="mt-0.5 truncate font-display text-sm font-bold text-cream-900">{specialty}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-8">
          {bio ? (
            <InfoCard title="Hakkında" icon={User} tone="teal" delay={0.05}>
              <p className="whitespace-pre-line">{bio}</p>
            </InfoCard>
          ) : null}

          {tags.length > 0 && (
            <StaffSpecialtyShowcase tags={tags} role={member.role} />
          )}

          {secondaryCount > 0 && (
            <div className={`grid gap-4 ${secondaryCount === 2 ? 'sm:grid-cols-2' : ''}`}>
              {education.length > 0 && (
                <InfoCard title="Eğitim" icon={GraduationCap} tone="violet" delay={0.1}>
                  <ul className="space-y-3">
                    {education.map((edu, i) => (
                      <li key={i}>
                        {isMeaningfulProfileText(edu.degree) && (
                          <p className="font-semibold text-cream-900">{edu.degree}</p>
                        )}
                        {isMeaningfulProfileText(edu.school) && (
                          <p className="text-sm text-cream-800/70">{edu.school}</p>
                        )}
                        {isMeaningfulProfileText(edu.year) && (
                          <p className="mt-0.5 text-xs text-cream-800/50">{edu.year}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </InfoCard>
              )}

              {experiences.length > 0 && (
                <InfoCard title="Deneyim" icon={Briefcase} tone="sage" delay={0.12}>
                  <ul className="space-y-3">
                    {experiences.map((exp, i) => (
                      <li key={i}>
                        {isMeaningfulProfileText(exp.title) && (
                          <p className="font-semibold text-cream-900">{exp.title}</p>
                        )}
                        {isMeaningfulProfileText(exp.organization) && (
                          <p className="text-sm text-cream-800/70">{exp.organization}</p>
                        )}
                        {isMeaningfulProfileText(exp.period) && (
                          <p className="mt-0.5 text-xs font-medium text-brand-600">{exp.period}</p>
                        )}
                        {isMeaningfulProfileText(exp.description) && (
                          <p className="mt-1 text-sm text-cream-800/60">{exp.description}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </InfoCard>
              )}
            </div>
          )}

          {certificates.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2.5 font-display text-lg font-bold text-cream-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white shadow-md shadow-brand-500/25">
                  <Trophy className="h-4 w-4" />
                </span>
                Sertifika & Diplomalar
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {certificates.map((cert, i) => {
                  const visual = certificateVisual(cert, i)
                  const CertIcon = visual.Icon
                  return (
                    <div
                      key={`${cert.name}-${i}`}
                      className={`flex items-center gap-3 rounded-2xl ${visual.wrap} px-3.5 py-3`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${visual.icon}`}>
                        <CertIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-cream-900">{cert.name}</p>
                        {isMeaningfulProfileText(cert.issuer) && (
                          <p className="truncate text-xs text-cream-800/55">{cert.issuer}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {showHours && (
            <InfoCard title="Çalışma Saatleri" icon={Clock} tone="orange" delay={0.18}>
              {hasAvailabilitySlots(profile.availability) ? (
                <ul className="space-y-2">
                  {formatAvailabilityRanges(profile.availability).map((d) => (
                    <li key={d.value}>
                      <p className="font-semibold text-cream-900">{d.label}</p>
                      <p className="text-xs text-cream-800/55">{d.ranges.join(', ')}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  <span className="font-semibold text-cream-900">
                    {profile.workDays.map(weekdayLabel).join(', ')}
                  </span>
                  {(profile.workStart || profile.workEnd) && (
                    <span className="mt-1 block text-sm text-cream-800/60">
                      {[profile.workStart, profile.workEnd].filter(Boolean).join(' – ')}
                    </span>
                  )}
                </p>
              )}
            </InfoCard>
          )}

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:justify-center">
            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sage-500 to-teal-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sage-500/25 transition hover:brightness-105"
            >
              <CalendarDays className="h-4 w-4" />
              Programa Katıl
            </Link>
            <Link
              to="/membership"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-brand-400 bg-white px-7 py-3.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              <Crown className="h-4 w-4" />
              Üyelik Seçenekleri
            </Link>
            {member.role === 'dietitian' && (
              <Link
                to="/online-diyetisyen"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-brand-400 bg-white px-7 py-3.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                <Play className="h-4 w-4" />
                Online Diyetisyen
              </Link>
            )}
            {member.role === 'coach' && (
              <Link
                to="/online-kocluk"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-brand-400 bg-white px-7 py-3.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                <Play className="h-4 w-4" />
                Online Koçluk
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </article>
  )
}

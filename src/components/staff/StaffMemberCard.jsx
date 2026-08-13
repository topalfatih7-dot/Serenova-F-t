import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Award, Briefcase } from 'lucide-react'
import { staffRoleMeta } from '../../utils/staffRoles'
import { normalizeStaffProfile, publicCertificates, formatStaffDisplayName } from '../../data/staffProfile'
import { staffProfilePath } from '../../config/seo'
import { tagToneClass } from './staffProfileVisuals'

function labelKey(value) {
  return String(value || '').trim().toLocaleLowerCase('tr')
}

export default function StaffMemberCard({ member, config, index = 0 }) {
  const profile = normalizeStaffProfile(member)
  const meta = staffRoleMeta(member.role)
  const displayName = formatStaffDisplayName(profile.name)
  const certificateCount = publicCertificates(profile.certificates).length
  const RoleIcon = meta.icon
  const title = profile.title?.trim() || ''
  const specialty = profile.specialty?.trim() || ''
  const subtitle = title || specialty
  const tags = (profile.specialties.length ? profile.specialties : specialty ? [specialty] : [])
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .filter((tag, i, list) => {
      const key = labelKey(tag)
      if (subtitle && key === labelKey(subtitle)) return false
      return list.findIndex((item) => labelKey(item) === key) === i
    })
    .slice(0, 4)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.5 }}
    >
      <Link
        to={staffProfilePath(member)}
        className={`team-member-card team-member-card--${config.key} group`}
      >
        <div className="team-member-card__media">
          {profile.photo ? (
            <img src={profile.photo} alt="" />
          ) : (
            <div className={`team-member-card__fallback flex items-center justify-center bg-gradient-to-br ${config.light}`}>
              <span className={`font-display text-7xl font-bold opacity-30 ${config.accent}`}>
                {displayName.charAt(0)}
              </span>
            </div>
          )}
          <div aria-hidden className="team-member-card__shade" />
          <div aria-hidden className="team-member-card__orb" />

          {profile.experienceYears > 0 && (
            <span className="absolute right-4 top-4 z-[1] inline-flex items-center gap-1 rounded-full border border-white/35 bg-white/90 px-2.5 py-1 text-xs font-semibold text-cream-900 shadow-sm backdrop-blur">
              <Briefcase className="h-3 w-3" />
              {profile.experienceYears}+ yıl
            </span>
          )}

          <div className="team-member-card__caption">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-cream-900 shadow-md">
              <RoleIcon className={`h-3.5 w-3.5 ${config.accent}`} />
              {meta.label}
            </span>
            <h3 className="font-display text-xl font-bold leading-tight tracking-tight text-white drop-shadow-sm">
              {displayName}
            </h3>
            {subtitle && (
              <p className="mt-1 text-sm font-medium text-white/85">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
          {profile.bio?.trim() && (
            <p className="line-clamp-2 text-sm leading-relaxed text-cream-800/70">{profile.bio.trim()}</p>
          )}

          {tags.length > 0 && (
            <div className={`${profile.bio?.trim() ? 'mt-3' : ''} flex flex-wrap gap-1.5`}>
              {tags.map((tag, i) => (
                <span
                  key={tag}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tagToneClass(i)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-cream-100/80 pt-4">
            {certificateCount > 0 ? (
              <p className="flex items-center gap-1.5 text-xs text-cream-800/50">
                <Award className="h-3.5 w-3.5 shrink-0" />
                {certificateCount} sertifika
              </p>
            ) : (
              <span />
            )}
            <span className="team-member-card__cta">
              Profili Gör <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Award, Briefcase } from 'lucide-react'
import { staffRoleMeta } from '../../utils/staffRoles'
import { normalizeStaffProfile } from '../../data/staffProfile'
import { staffProfilePath } from '../../config/seo'

export default function StaffMemberCard({ member, config, index = 0 }) {
  const profile = normalizeStaffProfile(member)
  const meta = staffRoleMeta(member.role)
  const RoleIcon = meta.icon
  const tags = profile.specialties.slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.5 }}
    >
      <Link
        to={staffProfilePath(member)}
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-cream-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
      >
        <div className="relative aspect-[4/5] max-h-72 overflow-hidden sm:max-h-none sm:aspect-auto sm:h-64">
          {profile.photo ? (
            <img
              src={profile.photo}
              alt={profile.name}
              className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${config.light}`}>
              <span className={`font-display text-7xl font-bold opacity-30 ${config.accent}`}>
                {profile.name?.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <span className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${config.badge}/90 backdrop-blur`}>
            <RoleIcon className="h-3 w-3" />
            {meta.label}
          </span>
          {profile.experienceYears > 0 && (
            <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-cream-900 backdrop-blur">
              <Briefcase className="h-3 w-3" />
              {profile.experienceYears}+ yıl
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-bold text-cream-900 transition-colors group-hover:text-brand-600">
                {profile.name}
              </h3>
              {profile.title && (
                <p className="mt-0.5 text-sm font-medium text-cream-800/70">{profile.title}</p>
              )}
              {profile.specialty && (
                <p className={`mt-1 text-sm font-semibold ${config.accent}`}>{profile.specialty}</p>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-cream-800/65">{profile.bio}</p>
          )}

          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-cream-100 px-2.5 py-0.5 text-xs font-medium text-cream-800/70">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {profile.certificates?.length > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-cream-800/50">
              <Award className="h-3.5 w-3.5 shrink-0" />
              {profile.certificates.length} sertifika
            </p>
          )}

          <div className="mt-auto flex items-center justify-end border-t border-cream-50 pt-4">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${config.accent} bg-cream-50 transition-colors group-hover:bg-brand-50`}>
              Profili Gör <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

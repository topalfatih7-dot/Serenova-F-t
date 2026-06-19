import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Dumbbell, Apple, Stethoscope, Mail, Phone, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { staffRoleMeta } from '../utils/staffRoles'

const roleConfig = {
  coaches: {
    key: 'coach',
    label: 'Koçlarımız',
    sub: 'Deneyimli fitness koçlarıyla hedefinize ulaşın',
    icon: Dumbbell,
    gradient: 'from-brand-500 to-brand-700',
    light: 'from-brand-50 to-white',
    badge: 'bg-brand-500',
    accent: 'text-brand-600',
    ring: 'ring-brand-200',
  },
  dietitians: {
    key: 'dietitian',
    label: 'Diyetisyenlerimiz',
    sub: 'Uzman diyetisyenlerle sağlıklı ve kalıcı beslenme alışkanlıkları kazanın',
    icon: Apple,
    gradient: 'from-sage-500 to-sage-700',
    light: 'from-sage-50 to-white',
    badge: 'bg-sage-500',
    accent: 'text-sage-600',
    ring: 'ring-sage-200',
  },
  doctors: {
    key: 'doctor',
    label: 'Doktorlarımız',
    sub: 'Sağlık sürecinizde yanınızda olan uzman doktorlar',
    icon: Stethoscope,
    gradient: 'from-cream-700 to-cream-900',
    light: 'from-cream-50 to-white',
    badge: 'bg-cream-800',
    accent: 'text-cream-700',
    ring: 'ring-cream-200',
  },
}

function MemberCard({ member, config, index }) {
  const meta = staffRoleMeta(member.role)
  const RoleIcon = meta.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.5 }}
    >
      <Link
        to={`/team/${member.id}`}
        className={`group block overflow-hidden rounded-3xl border border-cream-100 bg-white shadow-sm transition hover:shadow-lg hover:-translate-y-1 duration-300`}
      >
        <div className="relative h-56 overflow-hidden">
          {member.photo ? (
            <img
              src={member.photo}
              alt={member.name}
              className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${config.light}`}>
              <span className={`font-display text-7xl font-bold opacity-30 ${config.accent}`}>
                {member.name?.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <span className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${config.badge}/90 backdrop-blur`}>
            <RoleIcon className="h-3 w-3" />
            {meta.label}
          </span>
        </div>

        <div className="p-5">
          <h3 className="font-display text-lg font-bold text-cream-900 group-hover:text-brand-600 transition-colors">
            {member.name}
          </h3>
          {member.specialty && (
            <p className={`mt-1 text-sm font-medium ${config.accent}`}>{member.specialty}</p>
          )}
          {(member.bio || member.description) && (
            <p className="mt-3 line-clamp-2 text-sm text-cream-800/60 leading-relaxed">
              {member.bio || member.description}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-cream-50 pt-4">
            <div className="flex flex-col gap-1">
              {member.email && (
                <span className="flex items-center gap-1.5 text-xs text-cream-800/50">
                  <Mail className="h-3 w-3" />
                  {member.email}
                </span>
              )}
              {member.phone && (
                <span className="flex items-center gap-1.5 text-xs text-cream-800/50">
                  <Phone className="h-3 w-3" />
                  {member.phone}
                </span>
              )}
            </div>
            <span className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${config.accent} bg-cream-50 group-hover:bg-brand-50 transition-colors`}>
              Profil <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function TeamListPage({ role: roleProp }) {
  const params = useParams()
  const role = roleProp || params.role
  const { staff } = useApp()
  const config = roleConfig[role]

  if (!config) return <Navigate to="/" replace />

  const members = (staff || []).filter((s) => s.active !== false && s.role === config.key)
  const RoleIcon = config.icon

  return (
    <div className="min-h-screen">
      <div className={`relative overflow-hidden bg-gradient-to-br ${config.gradient} py-16`}>
        <div aria-hidden className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute -right-8 bottom-0 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Ana Sayfaya Dön
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <RoleIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{config.label}</h1>
              <p className="mt-1 text-white/75">{config.sub}</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {members.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center"
          >
            <RoleIcon className={`mx-auto h-16 w-16 opacity-20 ${config.accent}`} />
            <p className="mt-4 text-cream-800/50">Henüz kayıtlı uzman bulunmuyor.</p>
          </motion.div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m, i) => (
              <MemberCard key={m.id} member={m} config={config} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

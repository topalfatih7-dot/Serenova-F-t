import { Link, Navigate, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Dumbbell, Apple, Stethoscope } from 'lucide-react'
import { useApp } from '../context/AppContext'
import JsonLd from '../components/seo/JsonLd'
import StaffMemberCard from '../components/staff/StaffMemberCard'
import { buildItemListSchema, staffProfilePath } from '../config/seo'
import { TEAM_HERO_IMAGES } from '../utils/teamHeroImages'

const roleConfig = {
  coaches: {
    key: 'coach',
    label: 'Online Fitness Koçlarımız',
    sub: 'Sertifikalı fitness koçlarımızla hedefinize güvenle ulaşın',
    icon: Dumbbell,
    placeholder: 'from-brand-700 to-brand-900',
    gradient: 'from-brand-900/75 via-brand-800/55 to-brand-700/70',
    light: 'from-brand-50 to-white',
    badge: 'bg-brand-500',
    accent: 'text-brand-600',
  },
  dietitians: {
    key: 'dietitian',
    label: 'Online Diyetisyenlerimiz',
    sub: 'Uzman diyetisyenlerle sürdürülebilir beslenme alışkanlıkları kazanın',
    icon: Apple,
    placeholder: 'from-sage-600 to-sage-900',
    gradient: 'from-sage-900/75 via-sage-800/55 to-sage-700/70',
    light: 'from-sage-50 to-white',
    badge: 'bg-sage-500',
    accent: 'text-sage-600',
  },
  doctors: {
    key: 'doctor',
    label: 'Doktorlarımız',
    sub: 'Wellness yolculuğunuzda sağlık sürecinizi destekleyen uzman doktorlar',
    icon: Stethoscope,
    placeholder: 'from-cream-800 to-cream-950',
    gradient: 'from-cream-950/80 via-cream-900/60 to-cream-800/70',
    light: 'from-cream-50 to-white',
    badge: 'bg-cream-800',
    accent: 'text-cream-700',
  },
}

export default function TeamListPage({ role: roleProp }) {
  const params = useParams()
  const role = roleProp || params.role
  const { staff } = useApp()
  const config = roleConfig[role]
  const hero = TEAM_HERO_IMAGES[role]

  // Hook'lar koşulsuz çağrılmalı (Rules of Hooks); erken return aşağıda.
  const members = useMemo(
    () => (staff || []).filter((s) => s.active !== false && s.role === config?.key),
    [staff, config?.key]
  )

  const teamListSchema = useMemo(
    () =>
      config
        ? buildItemListSchema({
            name: config.label,
            path: `/team/${role}`,
            items: members.map((m) => ({ name: m.name, path: staffProfilePath(m) })),
          })
        : null,
    [members, config, role]
  )

  if (!config || !hero) return <Navigate to="/" replace />

  const RoleIcon = config.icon

  return (
    <div className={`team-list-page team-list-page--${role}`}>
      <JsonLd data={teamListSchema} />
      <div className="relative overflow-hidden py-14 sm:py-20">
        {/* Anında gradient; görsel gelince üstüne biner — boş flash olmaz */}
        <div aria-hidden className={`absolute inset-0 bg-gradient-to-br ${config.placeholder}`} />
        <img
          src={hero.src}
          srcSet={`${hero.srcSm} 800w, ${hero.src} 1400w`}
          sizes="100vw"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          width={1400}
          height={700}
        />
        <div aria-hidden className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/20" />
        <div aria-hidden className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute -right-8 bottom-0 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Link
            to={role === 'dietitians' ? '/online-diyetisyen' : role === 'coaches' ? '/online-kocluk' : '/'}
            className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
            {role === 'dietitians' ? 'Online diyetisyen' : role === 'coaches' ? 'Online koçluk' : 'Ana sayfa'}
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur sm:h-16 sm:w-16">
              <RoleIcon className="h-7 w-7 text-white sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">{config.label}</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base">{config.sub}</p>
            </div>
          </motion.div>
        </div>
        <span className="sr-only">{hero.alt}</span>
      </div>

      <section className="team-list-board">
        <div aria-hidden className="team-list-board__dots" />
        <div aria-hidden className="team-list-board__blob team-list-board__blob--a" />
        <div aria-hidden className="team-list-board__blob team-list-board__blob--b" />
        <div aria-hidden className="team-list-board__ring" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          {members.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
              <RoleIcon className={`mx-auto h-16 w-16 opacity-20 ${config.accent}`} />
              <p className="mt-4 text-cream-800/50">Henüz kayıtlı uzman bulunmuyor.</p>
            </motion.div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {members.map((m, i) => (
                <StaffMemberCard key={m.id} member={m} config={config} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

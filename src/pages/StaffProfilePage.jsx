import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Phone, Clock, CalendarDays } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { staffRoleMeta } from '../utils/staffRoles'
import { weekdayLabel } from '../components/package/SupportScheduler'

export default function StaffProfilePage() {
  const { id } = useParams()
  const { staff } = useApp()
  const member = (staff || []).find((s) => s.id === id && s.active !== false)

  if (!member) {
    return <Navigate to="/" replace />
  }

  const meta = staffRoleMeta(member.role)
  const RoleIcon = meta.icon

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link to={{ pathname: '/', hash: 'kadromuz' }} className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-cream-800/60 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" />
        Kadromuza dön
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm"
      >
        <div className="grid gap-0 md:grid-cols-5">
          <div className="relative md:col-span-2">
            {member.photo ? (
              <img src={member.photo} alt={member.name} className="h-72 w-full object-cover md:h-full md:min-h-[420px]" />
            ) : (
              <div className="flex h-72 w-full items-center justify-center bg-gradient-to-br from-brand-100 to-sage-100 md:h-full md:min-h-[420px]">
                <span className="font-display text-7xl font-bold text-brand-500/60">{member.name?.charAt(0)}</span>
              </div>
            )}
            <span className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${
              member.role === 'coach' ? 'bg-brand-500/90' : member.role === 'dietitian' ? 'bg-sage-500/90' : 'bg-cream-900/90'
            }`}>
              <RoleIcon className="h-3.5 w-3.5" />
              {meta.label}
            </span>
          </div>

          <div className="p-6 sm:p-8 md:col-span-3">
            <h1 className="font-display text-3xl font-bold text-cream-900">{member.name}</h1>
            {member.specialty && (
              <p className="mt-2 text-sm font-semibold text-brand-600">{member.specialty}</p>
            )}
            {(member.bio || member.description) && (
              <p className="mt-5 text-sm leading-relaxed text-cream-800/70">{member.bio || member.description}</p>
            )}

            <div className="mt-8 space-y-3 rounded-2xl bg-cream-50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-cream-800/50">İletişim & Çalışma</h2>
              {member.email && (
                <p className="flex items-center gap-2 text-sm text-cream-800/80">
                  <Mail className="h-4 w-4 shrink-0 text-cream-800/40" />
                  {member.email}
                </p>
              )}
              {member.phone && (
                <p className="flex items-center gap-2 text-sm text-cream-800/80">
                  <Phone className="h-4 w-4 shrink-0 text-cream-800/40" />
                  {member.phone}
                </p>
              )}
              {member.workDays?.length > 0 && (
                <p className="flex items-start gap-2 text-sm text-cream-800/80">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-cream-800/40" />
                  <span>{member.workDays.map(weekdayLabel).join(', ')}</span>
                </p>
              )}
              {(member.workStart || member.workEnd) && (
                <p className="flex items-center gap-2 text-sm text-cream-800/80">
                  <Clock className="h-4 w-4 shrink-0 text-cream-800/40" />
                  {member.workStart || '09:00'} – {member.workEnd || '17:00'}
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
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
            </div>
          </div>
        </div>
      </motion.div>
    </article>
  )
}

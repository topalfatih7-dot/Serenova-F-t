import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { staffRoleMeta } from '../../utils/staffRoles'
import { normalizeStaffProfile } from '../../data/staffProfile'

function wrapOffset(raw, count) {
  let offset = raw
  if (offset > count / 2) offset -= count
  if (offset < -count / 2) offset += count
  return offset
}

export default function TeamCarousel({ members }) {
  const navigate = useNavigate()
  const list = members || []
  const [index, setIndex] = useState(0)
  const count = list.length

  const go = useCallback((dir) => {
    setIndex((i) => (i + dir + count) % count)
  }, [count])

  if (count === 0) return null

  return (
    <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
      <div className="relative flex h-[420px] items-center justify-center touch-pan-y">
        {list.map((m, i) => {
          const offset = wrapOffset(i - index, count)
          if (Math.abs(offset) > 1) return null

          const isCenter = offset === 0
          const profile = normalizeStaffProfile(m)
          const meta = staffRoleMeta(m.role)
          const RoleIcon = meta.icon

          return (
            <motion.article
              key={m.id || m.email || m.name}
              animate={{
                opacity: isCenter ? 1 : 0.45,
                scale: isCenter ? 1 : 0.86,
                x: `${offset * 62}%`,
                zIndex: isCenter ? 10 : 5,
              }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={() => {
                if (isCenter) navigate(`/team/${m.id}`)
                else go(offset > 0 ? 1 : -1)
              }}
              className={`absolute w-[260px] will-change-transform overflow-hidden rounded-3xl border bg-white shadow-sm sm:w-[300px] ${
                isCenter ? 'cursor-pointer border-brand-200 shadow-xl hover:shadow-2xl' : 'cursor-pointer border-cream-200'
              }`}
            >
              <div className="relative h-64 overflow-hidden bg-cream-100 sm:h-72">
                {profile.photo ? (
                  <img src={profile.photo} alt={profile.name} className="h-full w-full object-cover" draggable={false} loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-sage-100">
                    <span className="font-display text-5xl font-bold text-brand-500/70">{profile.name?.charAt(0)}</span>
                  </div>
                )}
                <span className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur ${
                  m.role === 'coach' ? 'bg-brand-500/90' : m.role === 'dietitian' ? 'bg-sage-500/90' : 'bg-cream-900/90'
                }`}>
                  <RoleIcon className="h-3.5 w-3.5" />
                  {meta.label}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-bold text-cream-900">{profile.name}</h3>
                {profile.title && <p className="mt-0.5 text-xs text-cream-800/60">{profile.title}</p>}
                {profile.specialty && <p className="mt-0.5 text-xs font-semibold text-brand-600">{profile.specialty}</p>}
                {(profile.headline || profile.bio) && (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-cream-800/65">{profile.headline || profile.bio}</p>
                )}
                {isCenter && (
                  <p className="mt-3 text-xs font-semibold text-brand-600">Detayları gör →</p>
                )}
              </div>
            </motion.article>
          )
        })}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Önceki"
              className="absolute left-0 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-cream-200 bg-white/90 text-cream-800 shadow-md backdrop-blur transition hover:border-brand-300 hover:text-brand-600 sm:-left-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Sonraki"
              className="absolute right-0 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-cream-200 bg-white/90 text-cream-800 shadow-md backdrop-blur transition hover:border-brand-300 hover:text-brand-600 sm:-right-2"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {list.map((m, i) => (
            <button
              key={m.id || m.email || i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}. ekip üyesi`}
              aria-current={i === index ? 'true' : undefined}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-brand-500' : 'w-2 bg-cream-300 hover:bg-cream-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

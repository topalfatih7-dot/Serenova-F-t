/** Yerel optimize WebP hero arka planları (Unsplash yerine aynı origin). */
export const TEAM_HERO_IMAGES = {
  coaches: {
    src: '/team/coaches.webp',
    srcSm: '/team/coaches-sm.webp',
    alt: 'Fitness koçu ile antrenman seansı',
  },
  dietitians: {
    src: '/team/dietitians.webp',
    srcSm: '/team/dietitians-sm.webp',
    alt: 'Sağlıklı beslenme ve diyetisyen danışmanlığı',
  },
  doctors: {
    src: '/team/doctors.webp',
    srcSm: '/team/doctors-sm.webp',
    alt: 'Sağlık danışmanlığı yapan uzman doktor',
  },
}

const preloaded = new Set()

/** Nav hover / odak sırasında hero görselini önceden yükle. */
export function preloadTeamHero(role) {
  const img = TEAM_HERO_IMAGES[role]
  if (!img || preloaded.has(role) || typeof window === 'undefined') return
  preloaded.add(role)
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = window.matchMedia('(max-width: 640px)').matches ? img.srcSm : img.src
  link.type = 'image/webp'
  document.head.appendChild(link)
}

/** Üye paneli sayfa görselleri — Unsplash CDN (blogImages.js ile aynı desen). */

const unsplash = (id, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

export const PANEL_IMAGES = {
  dashboardHero: {
    url: unsplash('photo-1571019613454-1cb2f99b2d8b', 1200),
    alt: 'Güne enerjik bir başlangıç',
  },
  profileCover: {
    url: unsplash('photo-1506126613408-eca07ce68773', 1400),
    alt: 'Wellness ve denge',
  },
  healthTest: {
    url: unsplash('photo-1505751172876-fa1923c5c528'),
    alt: 'Sağlık kontrolü',
  },
  calendar: {
    url: unsplash('photo-1506784983877-45594efa4cbe'),
    alt: 'Haftalık plan',
  },
  calorie: {
    url: unsplash('photo-1512621776951-a57141f2eefd'),
    alt: 'Sağlıklı beslenme tabağı',
  },
  programs: {
    url: unsplash('photo-1517836357463-d25dfeac3438'),
    alt: 'Antrenman ekipmanları',
  },
  programWorkout: {
    url: unsplash('photo-1541534741688-6078c6bfb5c5', 1100),
    alt: 'Antrenman programı',
  },
  programNutrition: {
    url: unsplash('photo-1490645935967-10de6ba17061', 1100),
    alt: 'Beslenme programı',
  },
  library: {
    url: unsplash('photo-1518611012118-696072aa579a'),
    alt: 'Egzersiz kütüphanesi',
  },
  scheduleCoach: {
    url: unsplash('photo-1571019614242-c5c5dee9f50b'),
    alt: 'Koç antrenmanı',
  },
  scheduleDietitian: {
    url: unsplash('photo-1498837167922-ddd27525d352'),
    alt: 'Beslenme danışmanlığı',
  },
  scheduleDoctor: {
    url: unsplash('photo-1576091160399-112ba8d25d1d'),
    alt: 'Online doktor görüşmesi',
  },
  messages: {
    url: unsplash('photo-1522202176988-66273c2fd55f'),
    alt: 'Uzmanlarınızla iletişim',
  },
  notifications: {
    url: unsplash('photo-1517838277536-f5f99be501cd'),
    alt: 'Motivasyon',
  },
  support: {
    url: unsplash('photo-1521737604893-d14cc237f11d'),
    alt: 'Destek ekibi',
  },
}

import {
  LayoutDashboard, Bell, HelpCircle, Crown,
  Settings, ClipboardList, Library, CalendarDays, Flame, Wallet,
  MessageCircle, HeartPulse, CalendarCheck,
} from 'lucide-react'

/** Üye paneli sidebar / mobil menü — tek kaynak.
 * iconTone / labelTone: sidebar / mobil menü renkleri. */
export const MEMBER_NAV = [
  { to: '/profile', icon: Settings, label: 'Profil', iconTone: 'text-slate-500', labelTone: 'text-slate-600' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Panel', iconTone: 'text-brand-500', labelTone: 'text-brand-700' },
  { to: '/health-test', icon: HeartPulse, label: 'Kişisel Sağlık Analizi', healthTestBadge: true, iconTone: 'text-rose-500', labelTone: 'text-rose-700/80' },
  { to: '/calendar', icon: CalendarDays, label: 'Takvim', iconTone: 'text-sage-500', labelTone: 'text-sage-700' },
  { to: '/calorie', icon: Flame, label: 'Kalori Hesapla', iconTone: 'text-orange-500', labelTone: 'text-orange-700/80' },
  { to: '/messages', icon: MessageCircle, label: 'Mesajlar', chatBadge: true, iconTone: 'text-sky-500', labelTone: 'text-sky-700/80' },
  { to: '/schedule', icon: CalendarCheck, label: 'Randevularım', iconTone: 'text-teal-600', labelTone: 'text-teal-700/80' },
  { to: '/programs', icon: ClipboardList, label: 'Programlarım', iconTone: 'text-brand-600', labelTone: 'text-brand-800/80' },
  { to: '/library', icon: Library, label: 'Kütüphane', iconTone: 'text-stone-500', labelTone: 'text-stone-600' },
  { to: '/notifications', icon: Bell, label: 'Bildirimler', notificationsBadge: true, iconTone: 'text-amber-500', labelTone: 'text-amber-700/80' },
  { to: '/support', icon: HelpCircle, label: 'Destek', supportBadge: true, iconTone: 'text-sage-600', labelTone: 'text-sage-800/80' },
  { to: '/profile/payments', icon: Wallet, label: 'Ödeme Yönetimi', iconTone: 'text-emerald-500', labelTone: 'text-emerald-700/80' },
]

export const MEMBER_UPGRADE_NAV = {
  to: '/plans',
  icon: Crown,
  label: 'Planları İncele',
  iconTone: 'text-gold-500',
  labelTone: 'text-gold-500',
}

export function buildMemberNavItems({
  membership,
  chatUnreadCount = 0,
  notificationUnreadCount = 0,
  openSupportTicketsCount = 0,
  healthTestIncomplete = false,
} = {}) {
  const base = membership === 'free'
    ? [...MEMBER_NAV, MEMBER_UPGRADE_NAV]
    : MEMBER_NAV

  return base.map((item) => ({
    ...item,
    badgeCount: item.chatBadge
      ? chatUnreadCount
      : item.notificationsBadge
        ? notificationUnreadCount
        : item.supportBadge
          ? openSupportTicketsCount
          : item.healthTestBadge && healthTestIncomplete
            ? 1
            : 0,
  }))
}

import {
  LayoutDashboard, Bell, HelpCircle, Crown,
  Settings, ClipboardList, Library, CalendarDays, Flame, Wallet,
  MessageCircle, HeartPulse, CalendarCheck,
} from 'lucide-react'

/** Üye paneli sidebar / mobil menü — tek kaynak. */
export const MEMBER_NAV = [
  { to: '/profile', icon: Settings, label: 'Profil' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
  { to: '/health-test', icon: HeartPulse, label: 'Kişisel Sağlık Analizi', healthTestBadge: true },
  { to: '/calendar', icon: CalendarDays, label: 'Takvim' },
  { to: '/calorie', icon: Flame, label: 'Kalori Hesapla' },
  { to: '/messages', icon: MessageCircle, label: 'Mesajlar', chatBadge: true },
  { to: '/schedule', icon: CalendarCheck, label: 'Randevularım' },
  { to: '/programs', icon: ClipboardList, label: 'Programlarım' },
  { to: '/library', icon: Library, label: 'Kütüphane' },
  { to: '/notifications', icon: Bell, label: 'Bildirimler', notificationsBadge: true },
  { to: '/support', icon: HelpCircle, label: 'Destek', supportBadge: true },
  { to: '/profile/payments', icon: Wallet, label: 'Ödeme Yönetimi' },
]

export const MEMBER_UPGRADE_NAV = {
  to: '/membership',
  icon: Crown,
  label: 'Planları İncele',
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

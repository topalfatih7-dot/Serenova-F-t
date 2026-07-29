import {
  LayoutDashboard, Users, Calendar, MessageSquare, MessageCircle,
  BarChart3, Activity, Stethoscope, BookOpen, Library, Sparkles, Crown, Package, Wallet, UserPlus, Shield, Bot, Dumbbell,
} from 'lucide-react'

/** Admin paneli sidebar / mobil menü — tek kaynak. */
export const ADMIN_NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Genel Bakış', end: true },
  { to: '/admin/members', icon: Users, label: 'Üyeler' },
  { to: '/admin/plans', icon: Package, label: 'Paketler' },
  { to: '/admin/premium', icon: Crown, label: 'Premium Yönetimi' },
  { to: '/admin/programs', icon: Dumbbell, label: 'Programlar' },
  { to: '/admin/applications', icon: UserPlus, label: 'Başvurular', applicationsBadge: true },
  { to: '/admin/library', icon: Library, label: 'Kütüphane' },
  { to: '/admin/staff', icon: Stethoscope, label: 'Kadromuz' },
  { to: '/admin/payments', icon: Wallet, label: 'Finans & Ödemeler' },
  { to: '/admin/sessions', icon: Calendar, label: 'Seanslar' },
  { to: '/admin/messages', icon: MessageCircle, label: 'Mesajlar', chatBadge: true },
  { to: '/admin/support', icon: MessageSquare, label: 'Destek Talepleri', supportBadge: true },
  { to: '/admin/blog', icon: BookOpen, label: 'Blog' },
  { to: '/admin/content', icon: Sparkles, label: 'İçerik' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analitik' },
  { to: '/admin/ai-costs', icon: Bot, label: 'YZ Gider' },
  { to: '/admin/activity', icon: Activity, label: 'Aktivite' },
  { to: '/admin/account', icon: Shield, label: 'Hesap Ayarları' },
]

export function buildAdminNavItems({
  pendingApplicationsCount = 0,
  adminStaffUnreadCount = 0,
  openSupportTicketsCount = 0,
} = {}) {
  return ADMIN_NAV.map((item) => ({
    ...item,
    badgeCount: item.applicationsBadge
      ? pendingApplicationsCount
      : item.chatBadge
        ? adminStaffUnreadCount
        : item.supportBadge
          ? openSupportTicketsCount
          : 0,
  }))
}

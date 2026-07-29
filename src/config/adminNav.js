import {
  LayoutDashboard, Users, Calendar, MessageSquare, MessageCircle,
  BarChart3, Activity, Stethoscope, BookOpen, Library, Sparkles, Crown, Package, Wallet, UserPlus, Shield, Bot, Dumbbell,
} from 'lucide-react'

/** Admin paneli sidebar / mobil menü — tek kaynak.
 * iconTone / labelTone: masaüstü rail renkleri (üye paneliyle aynı model). */
export const ADMIN_NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Genel Bakış', end: true, iconTone: 'text-brand-500', labelTone: 'text-brand-700' },
  { to: '/admin/members', icon: Users, label: 'Üyeler', iconTone: 'text-sky-500', labelTone: 'text-sky-700/80' },
  { to: '/admin/plans', icon: Package, label: 'Paketler', iconTone: 'text-violet-500', labelTone: 'text-violet-700/80' },
  { to: '/admin/premium', icon: Crown, label: 'Premium Yönetimi', iconTone: 'text-gold-500', labelTone: 'text-gold-500' },
  { to: '/admin/programs', icon: Dumbbell, label: 'Programlar', iconTone: 'text-brand-600', labelTone: 'text-brand-800/80' },
  { to: '/admin/applications', icon: UserPlus, label: 'Başvurular', applicationsBadge: true, iconTone: 'text-teal-600', labelTone: 'text-teal-700/80' },
  { to: '/admin/library', icon: Library, label: 'Kütüphane', iconTone: 'text-stone-500', labelTone: 'text-stone-600' },
  { to: '/admin/staff', icon: Stethoscope, label: 'Kadromuz', iconTone: 'text-rose-500', labelTone: 'text-rose-700/80' },
  { to: '/admin/payments', icon: Wallet, label: 'Finans & Ödemeler', iconTone: 'text-emerald-500', labelTone: 'text-emerald-700/80' },
  { to: '/admin/sessions', icon: Calendar, label: 'Seanslar', iconTone: 'text-teal-600', labelTone: 'text-teal-700/80' },
  { to: '/admin/messages', icon: MessageCircle, label: 'Mesajlar', chatBadge: true, iconTone: 'text-sky-500', labelTone: 'text-sky-700/80' },
  { to: '/admin/support', icon: MessageSquare, label: 'Destek Talepleri', supportBadge: true, iconTone: 'text-sage-600', labelTone: 'text-sage-800/80' },
  { to: '/admin/blog', icon: BookOpen, label: 'Blog', iconTone: 'text-amber-500', labelTone: 'text-amber-700/80' },
  { to: '/admin/content', icon: Sparkles, label: 'İçerik', iconTone: 'text-orange-500', labelTone: 'text-orange-700/80' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analitik', iconTone: 'text-violet-500', labelTone: 'text-violet-700/80' },
  { to: '/admin/ai-costs', icon: Bot, label: 'YZ Gider', iconTone: 'text-slate-500', labelTone: 'text-slate-600' },
  { to: '/admin/activity', icon: Activity, label: 'Aktivite', iconTone: 'text-sage-500', labelTone: 'text-sage-700' },
  { to: '/admin/account', icon: Shield, label: 'Hesap Ayarları', iconTone: 'text-cream-800', labelTone: 'text-cream-800' },
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

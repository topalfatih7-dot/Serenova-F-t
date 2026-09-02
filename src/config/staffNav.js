import {
  LayoutDashboard, Users, Users2, ClipboardList, Library, List, Wallet,
  MessageCircle, Shield, UserCircle, Bell,
} from 'lucide-react'
import { normalizeStaffRole } from '../utils/staffRoles'

/** Personel paneli sidebar / mobil menü — rol bazlı tek kaynak.
 * iconTone / labelTone: masaüstü rail renkleri (üye paneliyle aynı model). */
export function staffNavForRole(role) {
  const base = [
    { to: '/staff', icon: LayoutDashboard, label: 'Genel Bakış', end: true, iconTone: 'text-brand-500', labelTone: 'text-brand-700' },
    { to: '/staff/profile', icon: UserCircle, label: 'Profilim', iconTone: 'text-slate-500', labelTone: 'text-slate-600' },
    { to: '/staff/clients', icon: Users, label: 'Danışanlarım', iconTone: 'text-sky-500', labelTone: 'text-sky-700/80' },
    { to: '/staff/notifications', icon: Bell, label: 'Bildirimler', notifBadge: true, iconTone: 'text-amber-500', labelTone: 'text-amber-700/80' },
    { to: '/staff/messages', icon: MessageCircle, label: 'Mesajlar', chatBadge: true, iconTone: 'text-sky-500', labelTone: 'text-sky-700/80' },
  ]
  const normalizedRole = normalizeStaffRole(role)
  if (normalizedRole === 'coach' || normalizedRole === 'dietitian') {
    base.push({
      to: '/staff/collab-messages',
      icon: Users2,
      label: 'Ekip Mesajları',
      collabChatBadge: true,
      iconTone: 'text-violet-500',
      labelTone: 'text-violet-700/80',
    })
  }
  base.push({
    to: '/staff/admin-messages',
    icon: Shield,
    label: 'Admin Mesajları',
    adminChatBadge: true,
    iconTone: 'text-rose-500',
    labelTone: 'text-rose-700/80',
  })
  if (normalizedRole === 'dietitian') {
    return [
      ...base,
      { to: '/staff/lists', icon: List, label: 'Listeler', iconTone: 'text-sage-500', labelTone: 'text-sage-700' },
      { to: '/staff/payments', icon: Wallet, label: 'Ödeme Yönetimi', iconTone: 'text-emerald-500', labelTone: 'text-emerald-700/80' },
    ]
  }
  const items = [
    ...base,
    { to: '/staff/programs', icon: ClipboardList, label: 'Programlar', iconTone: 'text-brand-600', labelTone: 'text-brand-800/80' },
  ]
  if (normalizedRole === 'coach') {
    items.push({ to: '/staff/library', icon: Library, label: 'Kütüphane', iconTone: 'text-stone-500', labelTone: 'text-stone-600' })
  }
  items.push({ to: '/staff/payments', icon: Wallet, label: 'Ödeme Yönetimi', iconTone: 'text-emerald-500', labelTone: 'text-emerald-700/80' })
  return items
}

export function buildStaffNavItems({
  role,
  chatUnreadCount = 0,
  staffAdminUnreadCount = 0,
  staffCollabUnreadCount = 0,
  notificationUnreadCount = 0,
} = {}) {
  return staffNavForRole(role).map((item) => ({
    ...item,
    badgeCount: item.chatBadge
      ? chatUnreadCount
      : item.adminChatBadge
        ? staffAdminUnreadCount
        : item.collabChatBadge
          ? staffCollabUnreadCount
          : item.notifBadge
            ? notificationUnreadCount
            : 0,
  }))
}

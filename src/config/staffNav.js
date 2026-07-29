import {
  LayoutDashboard, Users, Users2, ClipboardList, Library, List, Wallet,
  MessageCircle, Shield, UserCircle, Bell,
} from 'lucide-react'
import { normalizeStaffRole } from '../utils/staffRoles'

/** Personel paneli sidebar / mobil menü — rol bazlı tek kaynak. */
export function staffNavForRole(role) {
  const base = [
    { to: '/staff', icon: LayoutDashboard, label: 'Genel Bakış', end: true },
    { to: '/staff/profile', icon: UserCircle, label: 'Profilim' },
    { to: '/staff/clients', icon: Users, label: 'Danışanlarım' },
    { to: '/staff/notifications', icon: Bell, label: 'Bildirimler', notifBadge: true },
    { to: '/staff/messages', icon: MessageCircle, label: 'Mesajlar', chatBadge: true },
  ]
  const normalizedRole = normalizeStaffRole(role)
  if (normalizedRole === 'coach' || normalizedRole === 'dietitian') {
    base.push({ to: '/staff/collab-messages', icon: Users2, label: 'Ekip Mesajları', collabChatBadge: true })
  }
  base.push({ to: '/staff/admin-messages', icon: Shield, label: 'Admin Mesajları', adminChatBadge: true })
  if (normalizedRole === 'dietitian') {
    return [
      ...base,
      { to: '/staff/lists', icon: List, label: 'Listeler' },
      { to: '/staff/payments', icon: Wallet, label: 'Ödeme Yönetimi' },
    ]
  }
  const items = [
    ...base,
    { to: '/staff/programs', icon: ClipboardList, label: 'Programlar' },
  ]
  if (normalizedRole === 'coach') {
    items.push({ to: '/staff/library', icon: Library, label: 'Kütüphane' })
  }
  items.push({ to: '/staff/payments', icon: Wallet, label: 'Ödeme Yönetimi' })
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

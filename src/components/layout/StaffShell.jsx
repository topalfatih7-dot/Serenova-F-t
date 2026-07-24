import { useMemo, useState, useCallback } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, Users, Users2, ClipboardList, LogOut, Library, List, Wallet, MessageCircle, Shield, UserCircle, Loader2, Bell } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import BrandLogo from '../ui/BrandLogo'
import PanelMobileMenu from './PanelMobileMenu'
import AnimatedBackground from '../ui/AnimatedBackground'
import NoIndexHead from '../seo/NoIndexHead'
import { BRAND } from '../../config/brand'
import { normalizeStaffRole, staffRoleMeta } from '../../utils/staffRoles'
import { resolveFirstName } from '../../utils/displayName'
import StaffForcePasswordChange from '../auth/StaffForcePasswordChange'
import { supabase } from '../../services/supabaseClient'

const STAFF_EMOJIS = ['📋', '💪', '🥗', '📊', '🧘', '⭐', '🎯', '💚', '🏅', '🤝']

function staffNavForRole(role) {
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

export default function StaffShell() {
  const {
    staffUser, logout, loggingOut, chatUnreadCount, staffAdminUnreadCount,
    staffCollabUnreadCount, notificationUnreadCount, refresh,
  } = useApp()

  // İlk giriş kontrolü: geçici şifreyle giriş yapan personel için şifre değiştirme zorunluluğu
  const mustChangePassword = Boolean(staffUser?.data?.tempPasswordIssued)
  const [passwordChanged, setPasswordChanged] = useState(false)

  const handlePasswordChanged = useCallback(async () => {
    // Supabase kaydının ardından staffUser.data.tempPasswordIssued'ı sıfırla
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        await supabase
          .from('staff')
          .update({ data: { ...(staffUser?.data || {}), tempPasswordIssued: false } })
          .eq('id', staffUser.id)
      }
    } catch {
      // Güncelleme başarısız olsa bile kullanıcıya devam ettir; bir sonraki girişte yeniden sorar.
    }
    await refresh().catch(() => {})
    setPasswordChanged(true)
  }, [staffUser, refresh])

  const showForceChange = mustChangePassword && !passwordChanged

  const meta = staffRoleMeta(staffUser.role)
  const RoleIcon = meta.icon
  const roleLabel = meta.label
  const unread = notificationUnreadCount || 0
  const staffNav = useMemo(() => staffNavForRole(staffUser.role).map((item) => ({
    ...item,
    badgeCount: item.chatBadge
      ? chatUnreadCount
      : item.adminChatBadge
        ? staffAdminUnreadCount
        : item.collabChatBadge
          ? staffCollabUnreadCount
          : item.notifBadge
            ? unread
            : 0,
  })), [staffUser.role, chatUnreadCount, staffAdminUnreadCount, staffCollabUnreadCount, unread])

  const bellLink = (
    <Link to="/staff/notifications" className="relative rounded-lg p-2 hover:bg-cream-50" aria-label="Bildirimler">
      <Bell className="h-5 w-5 text-cream-800" />
      {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />}
    </Link>
  )

  return (
    <div className="staff-panel-bg relative flex h-dvh overflow-hidden">
      <NoIndexHead />
      <AnimatedBackground emojis={STAFF_EMOJIS} accent="staff" />

      {/* Geçici şifre değiştirme ekranı — ilk girişte gösterilir */}
      {showForceChange && (
        <StaffForcePasswordChange
          staffName={staffUser?.name}
          onDone={handlePasswordChanged}
        />
      )}
      <aside className="relative hidden w-56 shrink-0 flex-col border-r border-cream-200 bg-white/90 backdrop-blur-sm md:flex lg:w-64">
        <div className="border-b border-cream-100 p-5">
          <div className="flex items-start justify-between gap-2">
            <BrandLogo linkTo="/staff" />
            {bellLink}
          </div>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            <RoleIcon className="h-3 w-3" /> {roleLabel} Paneli
          </span>
          <p className="mt-3 truncate text-sm text-cream-800/60">
            {resolveFirstName({ name: staffUser.name, email: staffUser.email, fallback: roleLabel })}
          </p>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
          {staffNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-500 text-white' : 'text-cream-800 hover:bg-cream-100'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.badgeCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                  {item.badgeCount > 9 ? '9+' : item.badgeCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-cream-100 p-3">
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream-800/60 hover:bg-cream-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            {loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}
          </button>
        </div>
      </aside>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <PanelMobileMenu
          navItems={staffNav}
          brandLink="/staff"
          badge={{ label: `${roleLabel} Paneli`, icon: RoleIcon, className: 'bg-brand-500 text-white' }}
          userName={resolveFirstName({ name: staffUser.name, email: staffUser.email, fallback: roleLabel })}
          accent="staff"
          logout={logout}
          loggingOut={loggingOut}
          headerRight={bellLink}
        />

        <main data-panel-scroll className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-8 py-4 sm:px-10 sm:py-6 lg:px-12">
          <div className="flex min-h-0 flex-1 flex-col">
            <Outlet />
          </div>
        </main>
        <footer className="shrink-0 border-t border-cream-200 bg-white/80 px-6 py-3 text-center text-[10px] text-cream-800/40 backdrop-blur-sm">
          {BRAND.name} · {roleLabel} Paneli
        </footer>
      </div>
    </div>
  )
}

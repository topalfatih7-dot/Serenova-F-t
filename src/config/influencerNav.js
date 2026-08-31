import {
  LayoutDashboard, UserCircle, Wallet,
} from 'lucide-react'

export const INFLUENCER_NAV = [
  { to: '/influencer', icon: LayoutDashboard, label: 'Genel Bakış', end: true, iconTone: 'text-brand-500', labelTone: 'text-brand-700' },
  { to: '/influencer/payments', icon: Wallet, label: 'Ödeme Yönetimi', iconTone: 'text-emerald-500', labelTone: 'text-emerald-700/80' },
  { to: '/influencer/profile', icon: UserCircle, label: 'Profilim', iconTone: 'text-slate-500', labelTone: 'text-slate-600' },
]

import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import TopBar from './TopBar'
import ConsentBanner from '../ui/ConsentBanner'
import { useApp } from '../../context/AppContext'
import { BRAND } from '../../config/brand'

export default function AppShell() {
  const { isAuthenticated, isAdmin } = useApp()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col pb-20 lg:pb-0">
        <TopBar />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
        <footer className="hidden border-t border-cream-200 bg-white px-6 py-3 text-center text-[10px] text-cream-800/40 lg:block">
          {BRAND.name} · Bu platform tıbbi teşhis veya tedavi sunmaz.
        </footer>
      </div>
      <MobileNav />
      <ConsentBanner />
    </div>
  )
}

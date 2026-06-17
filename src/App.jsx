import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import PublicLayout from './components/layout/PublicLayout'
import AppShell from './components/layout/AppShell'
import AdminShell from './components/layout/AdminShell'
import StaffShell from './components/layout/StaffShell'
import RequireAuth from './components/auth/RequireAuth'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import OnboardingPage from './pages/OnboardingPage'
import MembershipComparisonPage from './pages/MembershipComparisonPage'
import DashboardPage from './pages/DashboardPage'
import CoachSchedulePage from './pages/CoachSchedulePage'
import DietitianSchedulePage from './pages/DietitianSchedulePage'
import NotificationsPage from './pages/NotificationsPage'
import SupportPage from './pages/SupportPage'
import ProfilePage from './pages/ProfilePage'
import ProgramsPage from './pages/ProgramsPage'
import CalendarPage from './pages/CalendarPage'
import CalorieCalculatorPage from './pages/CalorieCalculatorPage'
import ExerciseLibraryPage from './pages/ExerciseLibraryPage'
import SuccessStoriesPage from './pages/SuccessStoriesPage'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import StaffProfilePage from './pages/StaffProfilePage'
import NotFoundPage from './pages/NotFoundPage'

import StaffOverviewPage from './pages/staff/StaffOverviewPage'
import StaffClientsPage from './pages/staff/StaffClientsPage'
import StaffProgramsPage from './pages/staff/StaffProgramsPage'

import AdminOverviewPage from './pages/admin/AdminOverviewPage'
import AdminMembersPage from './pages/admin/AdminMembersPage'
import AdminStaffPage from './pages/admin/AdminStaffPage'
import AdminBlogPage from './pages/admin/AdminBlogPage'
import AdminSubscriptionsPage from './pages/admin/AdminSubscriptionsPage'
import AdminSessionsPage from './pages/admin/AdminSessionsPage'
import AdminSupportPage from './pages/admin/AdminSupportPage'
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage'
import AdminActivityPage from './pages/admin/AdminActivityPage'
import AdminLibraryPage from './pages/admin/AdminLibraryPage'
import AdminRequestsPage from './pages/admin/AdminRequestsPage'
import AdminContentPage from './pages/admin/AdminContentPage'
import AdminPremiumPage from './pages/admin/AdminPremiumPage'
import AdminPlansPage from './pages/admin/AdminPlansPage'
import VideoCallPage from './pages/VideoCallPage'

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<Navigate to="/onboarding" replace />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="onboarding" element={<OnboardingPage />} />
              <Route path="membership" element={<MembershipComparisonPage />} />
              <Route path="builder" element={<Navigate to="/membership" replace />} />
              <Route path="stories" element={<SuccessStoriesPage />} />
              <Route path="blog" element={<BlogPage />} />
              <Route path="blog/:id" element={<BlogPostPage />} />
              <Route path="team/:id" element={<StaffProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            <Route element={<RequireAuth role="member" />}>
              <Route path="call/:sessionType/:sessionId" element={<VideoCallPage audience="member" />} />
              <Route element={<AppShell />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="calorie" element={<CalorieCalculatorPage />} />
                <Route path="schedule/coach" element={<CoachSchedulePage />} />
                <Route path="schedule/dietitian" element={<DietitianSchedulePage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="support" element={<SupportPage />} />
                <Route path="programs" element={<ProgramsPage />} />
                <Route path="library" element={<ExerciseLibraryPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>

            <Route element={<RequireAuth role="staff" />}>
              <Route path="staff/call/:sessionType/:sessionId" element={<VideoCallPage audience="staff" />} />
              <Route element={<StaffShell />}>
                <Route path="staff" element={<StaffOverviewPage />} />
                <Route path="staff/clients" element={<StaffClientsPage />} />
                <Route path="staff/programs" element={<StaffProgramsPage />} />
                <Route path="staff/library" element={<ExerciseLibraryPage />} />
              </Route>
            </Route>

            <Route element={<RequireAuth role="admin" />}>
              <Route element={<AdminShell />}>
                <Route path="admin" element={<AdminOverviewPage />} />
                <Route path="admin/members" element={<AdminMembersPage />} />
                <Route path="admin/plans" element={<AdminPlansPage />} />
                <Route path="admin/premium" element={<AdminPremiumPage />} />
                <Route path="admin/requests" element={<AdminRequestsPage />} />
                <Route path="admin/library" element={<AdminLibraryPage />} />
                <Route path="admin/staff" element={<AdminStaffPage />} />
                <Route path="admin/blog" element={<AdminBlogPage />} />
                <Route path="admin/content" element={<AdminContentPage />} />
                <Route path="admin/subscriptions" element={<AdminSubscriptionsPage />} />
                <Route path="admin/sessions" element={<AdminSessionsPage />} />
                <Route path="admin/support" element={<AdminSupportPage />} />
                <Route path="admin/analytics" element={<AdminAnalyticsPage />} />
                <Route path="admin/activity" element={<AdminActivityPage />} />
              </Route>
            </Route>

          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  )
}

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import PublicLayout from './components/layout/PublicLayout'
import AppShell from './components/layout/AppShell'
import AdminShell from './components/layout/AdminShell'
import StaffShell from './components/layout/StaffShell'
import RequireAuth from './components/auth/RequireAuth'
import ProfileCompletionGate from './components/auth/ProfileCompletionGate'
import NotificationToastBridge from './components/notifications/NotificationToastBridge'
import NotificationAudioUnlock from './components/notifications/NotificationAudioUnlock'
import GoogleAnalytics from './components/analytics/GoogleAnalytics'

import AuthRedirectHandler from './components/auth/AuthRedirectHandler'
import LandingPage from './pages/LandingPage'

const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const AuthCallbackPage = lazy(() => import('./pages/auth/AuthCallbackPage'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))
const MembershipComparisonPage = lazy(() => import('./pages/MembershipComparisonPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage'))
const HealthTestPage = lazy(() => import('./pages/HealthTestPage'))
const HealthTestSectionPage = lazy(() => import('./pages/HealthTestSectionPage'))
const HealthTestFinishPage = lazy(() => import('./pages/HealthTestFinishPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const SupportPage = lazy(() => import('./pages/SupportPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const ProgramsPage = lazy(() => import('./pages/ProgramsPage'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const CalorieCalculatorPage = lazy(() => import('./pages/CalorieCalculatorPage'))
const ExerciseLibraryPage = lazy(() => import('./pages/ExerciseLibraryPage'))
const SuccessStoriesPage = lazy(() => import('./pages/SuccessStoriesPage'))
const BlogPage = lazy(() => import('./pages/BlogPage'))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'))
const StaffProfilePage = lazy(() => import('./pages/StaffProfilePage'))
const CorporatePage = lazy(() => import('./pages/CorporatePage'))
const CorporateApplicationPage = lazy(() => import('./pages/CorporateApplicationPage'))
const StaffApplicationPage = lazy(() => import('./pages/StaffApplicationPage'))
const TeamListPage = lazy(() => import('./pages/TeamListPage'))
const LegalDocumentPage = lazy(() => import('./pages/legal/LegalDocumentPage'))

const StaffOverviewPage = lazy(() => import('./pages/staff/StaffOverviewPage'))
const StaffSelfProfilePage = lazy(() => import('./pages/staff/StaffSelfProfilePage'))
const StaffClientsPage = lazy(() => import('./pages/staff/StaffClientsPage'))
const StaffClientProgramPage = lazy(() => import('./pages/staff/StaffClientProgramPage'))
const StaffProgramsPage = lazy(() => import('./pages/staff/StaffProgramsPage'))
const StaffListsPage = lazy(() => import('./pages/staff/StaffListsPage'))
const StaffMessagesPage = lazy(() => import('./pages/staff/StaffMessagesPage'))
const StaffAdminMessagesPage = lazy(() => import('./pages/staff/StaffAdminMessagesPage'))
const StaffCollabMessagesPage = lazy(() => import('./pages/staff/StaffCollabMessagesPage'))
const MessagesPage = lazy(() => import('./pages/MessagesPage'))
const StaffLibraryGate = lazy(() => import('./components/staff/StaffLibraryGate'))
const PaymentManagementPage = lazy(() => import('./pages/payments/PaymentManagementPage'))

const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage'))
const AdminMembersPage = lazy(() => import('./pages/admin/AdminMembersPage'))
const AdminStaffPage = lazy(() => import('./pages/admin/AdminStaffPage'))
const AdminBlogPage = lazy(() => import('./pages/admin/AdminBlogPage'))
const AdminSubscriptionsPage = lazy(() => import('./pages/admin/AdminSubscriptionsPage'))
const AdminSessionsPage = lazy(() => import('./pages/admin/AdminSessionsPage'))
const AdminSupportPage = lazy(() => import('./pages/admin/AdminSupportPage'))
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'))
const AdminMessagesPage = lazy(() => import('./pages/admin/AdminMessagesPage'))
const AdminActivityPage = lazy(() => import('./pages/admin/AdminActivityPage'))
const AdminLibraryPage = lazy(() => import('./pages/admin/AdminLibraryPage'))
const AdminApplicationsPage = lazy(() => import('./pages/admin/AdminApplicationsPage'))
const AdminContentPage = lazy(() => import('./pages/admin/AdminContentPage'))
const AdminPremiumPage = lazy(() => import('./pages/admin/AdminPremiumPage'))
const AdminPlansPage = lazy(() => import('./pages/admin/AdminPlansPage'))
const VideoCallPage = lazy(() => import('./pages/VideoCallPage'))
const MemberHealthProfilePage = lazy(() => import('./pages/shared/MemberHealthProfilePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ToastProvider>
          <NotificationAudioUnlock />
          <NotificationToastBridge />
          <GoogleAnalytics />
          <AuthRedirectHandler />
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Navbar/footer olmadan tam ekran auth akışları */}
            <Route path="auth/callback" element={<AuthCallbackPage />} />

            <Route element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<Navigate to="/onboarding" replace />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route path="onboarding" element={<OnboardingPage />} />
              <Route path="membership" element={<MembershipComparisonPage />} />
              <Route path="builder" element={<Navigate to="/membership" replace />} />
              <Route path="stories" element={<SuccessStoriesPage />} />
              <Route path="blog" element={<BlogPage />} />
              <Route path="blog/:id" element={<BlogPostPage />} />
              <Route path="team/coaches" element={<TeamListPage role="coaches" />} />
              <Route path="team/dietitians" element={<TeamListPage role="dietitians" />} />
              <Route path="team/doctors" element={<TeamListPage role="doctors" />} />
              <Route path="team/apply" element={<StaffApplicationPage />} />
              <Route path="corporate" element={<CorporatePage />} />
              <Route path="corporate/apply" element={<CorporateApplicationPage />} />
              <Route path="team/:id" element={<StaffProfilePage />} />
              <Route path="legal/:slug" element={<LegalDocumentPage />} />
              <Route path="kvkk" element={<Navigate to="/legal/kvkk" replace />} />
              <Route path="privacy" element={<Navigate to="/legal/gizlilik-politikasi" replace />} />
              <Route path="terms" element={<Navigate to="/legal/uyelik-ve-abonelik-sozlesmesi" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            <Route element={<RequireAuth role="member" />}>
              <Route element={<ProfileCompletionGate />}>
              <Route path="call/:sessionType/:sessionId" element={<VideoCallPage audience="member" />} />
              <Route element={<AppShell />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="health-test" element={<HealthTestPage />} />
                <Route path="health-test/finish" element={<HealthTestFinishPage />} />
                <Route path="health-test/:sectionId" element={<HealthTestSectionPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="calorie" element={<CalorieCalculatorPage />} />
                <Route path="schedule" element={<AppointmentsPage />} />
                <Route path="schedule/coach" element={<Navigate to="/schedule?tab=coach" replace />} />
                <Route path="schedule/dietitian" element={<Navigate to="/schedule?tab=dietitian" replace />} />
                <Route path="schedule/doctor" element={<Navigate to="/schedule?tab=doctor" replace />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="messages/:role" element={<MessagesPage />} />
                <Route path="support" element={<SupportPage />} />
                <Route path="programs" element={<ProgramsPage />} />
                <Route path="library" element={<ExerciseLibraryPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="profile/payments" element={<PaymentManagementPage audience="member" />} />
              </Route>
              </Route>
            </Route>

            <Route element={<RequireAuth role="staff" />}>
              <Route path="staff/call/:sessionType/:sessionId" element={<VideoCallPage audience="staff" />} />
              <Route element={<StaffShell />}>
                <Route path="staff" element={<StaffOverviewPage />} />
                <Route path="staff/clients" element={<StaffClientsPage />} />
                <Route path="staff/clients/:memberId/health" element={<MemberHealthProfilePage audience="staff" />} />
                <Route path="staff/clients/:memberId/program" element={<StaffClientProgramPage />} />
                <Route path="staff/messages" element={<StaffMessagesPage />} />
                <Route path="staff/messages/:memberId" element={<StaffMessagesPage />} />
                <Route path="staff/admin-messages" element={<StaffAdminMessagesPage />} />
                <Route path="staff/collab-messages" element={<StaffCollabMessagesPage />} />
                <Route path="staff/collab-messages/:memberId" element={<StaffCollabMessagesPage />} />
                <Route path="staff/programs" element={<StaffProgramsPage />} />
                <Route path="staff/lists" element={<StaffListsPage />} />
                <Route path="staff/library" element={<StaffLibraryGate />} />
                <Route path="staff/payments" element={<PaymentManagementPage audience="staff" />} />
                <Route path="staff/profile" element={<StaffSelfProfilePage />} />
              </Route>
            </Route>

            <Route element={<RequireAuth role="admin" />}>
              <Route element={<AdminShell />}>
                <Route path="admin" element={<AdminOverviewPage />} />
                <Route path="admin/members" element={<AdminMembersPage />} />
                <Route path="admin/members/:memberId/health" element={<MemberHealthProfilePage audience="admin" />} />
                <Route path="admin/plans" element={<AdminPlansPage />} />
                <Route path="admin/premium" element={<AdminPremiumPage />} />
                <Route path="admin/applications" element={<AdminApplicationsPage />} />
                <Route path="admin/library" element={<AdminLibraryPage />} />
                <Route path="admin/staff" element={<AdminStaffPage />} />
                <Route path="admin/blog" element={<AdminBlogPage />} />
                <Route path="admin/content" element={<AdminContentPage />} />
                <Route path="admin/subscriptions" element={<AdminSubscriptionsPage />} />
                <Route path="admin/payments" element={<PaymentManagementPage audience="admin" />} />
                <Route path="admin/sessions" element={<AdminSessionsPage />} />
                <Route path="admin/support" element={<AdminSupportPage />} />
                <Route path="admin/messages" element={<AdminMessagesPage />} />
                <Route path="admin/messages/staff/:staffId" element={<AdminMessagesPage />} />
                <Route path="admin/messages/audit" element={<AdminMessagesPage />} />
                <Route path="admin/messages/audit/:threadId" element={<AdminMessagesPage />} />
                <Route path="admin/messages/collab" element={<AdminMessagesPage />} />
                <Route path="admin/messages/collab/:threadId" element={<AdminMessagesPage />} />
                <Route path="admin/analytics" element={<AdminAnalyticsPage />} />
                <Route path="admin/activity" element={<AdminActivityPage />} />
              </Route>
            </Route>

          </Routes>
          </Suspense>
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
  )
}

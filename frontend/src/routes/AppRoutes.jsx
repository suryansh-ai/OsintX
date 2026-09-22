import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Lazy-loaded page components
const Index = lazy(() => import('../pages/Index'));
const Loader = lazy(() => import('../pages/Loader'));

const Login = lazy(() => import('../pages/auth/Login'));
const Signup = lazy(() => import('../pages/auth/Signup'));
const RoleSelection = lazy(() => import('../pages/auth/RoleSelection'));
const OAuthCallback = lazy(() => import('../pages/auth/OAuthCallback'));

const RestrictedFieldInterface = lazy(() => import('../pages/dashboards/student/RestrictedFieldInterface'));
const ToolAccess = lazy(() => import('../pages/dashboards/student/ToolAccess'));
const CaseFiles = lazy(() => import('../pages/dashboards/student/CaseFiles'));
const Profile = lazy(() => import('../pages/dashboards/student/Profile'));
const Settings = lazy(() => import('../pages/dashboards/student/Settings'));
const Search = lazy(() => import('../pages/dashboards/student/Search'));
const HelpCenter = lazy(() => import('../pages/dashboards/student/HelpCenter'));
const Notifications = lazy(() => import('../pages/dashboards/student/Notifications'));
const ProgressReports = lazy(() => import('../pages/dashboards/student/ProgressReports'));
const Feedback = lazy(() => import('../pages/dashboards/student/Feedback'));

const CyberAvatarDashboard = lazy(() => import('../pages/dashboards/user/CyberAvatarDashboard'));
const InvestigationWorkspace = lazy(() => import('../pages/dashboards/user/InvestigationWorkspace'));
const ActiveCases = lazy(() => import('../pages/dashboards/user/ActiveCases'));
const CaseDetailPage = lazy(() => import('../pages/dashboards/user/CaseDetailPage'));
const EvidenceBoard = lazy(() => import('../pages/dashboards/user/EvidenceBoard'));
const ProfileSettings = lazy(() => import('../pages/dashboards/user/ProfileSettings'));
const NotificationsPage = lazy(() => import('../pages/dashboards/user/NotificationsPage'));
const RechargeCredits = lazy(() => import('../pages/dashboards/user/RechargeCredits'));
const TelegramSettings = lazy(() => import('../pages/dashboards/user/TelegramSettings'));
const TelegramTools = lazy(() => import('../pages/dashboards/user/TelegramTools'));

// Public Route wrapper (redirects if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  return children;
};

// Dashboard redirect based on role
const DashboardRedirect = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/dashboard/${user.role}`} replace />;
};

const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      <p className="text-gray-500 text-sm font-mono tracking-wider">LOADING...</p>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
      {/* Landing Page */}
      <Route path="/" element={<Index />} />
      
      {/* Boot Loader */}
      <Route path="/loading" element={<Loader />} />

      {/* Public Routes */}
      <Route
        path="/select-role"
        element={
          <PublicRoute>
            <RoleSelection />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      {/* OAuth Callback */}
      <Route path="/auth/callback" element={<OAuthCallback />} />

      {/* Dashboard Redirect */}
      <Route
        path="/dashboard"
        element={<DashboardRedirect />}
      />

      {/* Student Investigation Interface Routes */}
      <Route
        path="/dashboard/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <RestrictedFieldInterface />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/student/tools"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ToolAccess />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/student/cases"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <CaseFiles />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/student/profile"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/student/settings"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/student/search"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Search />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/student/help"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <HelpCenter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/student/notifications"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/student/progress"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ProgressReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/student/feedback"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Feedback />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/student/telegram"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <TelegramSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/student/telegram-tools"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <TelegramTools />
          </ProtectedRoute>
        }
      />

      {/* User Investigation Workspace Routes */}
      <Route
        path="/dashboard/user"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <CyberAvatarDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/user/workspace"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <InvestigationWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/user/cases"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <ActiveCases />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/user/cases/:caseId"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <CaseDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/user/evidence"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <EvidenceBoard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/user/settings"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <ProfileSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/user/notifications"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/user/recharge"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <RechargeCredits />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/user/telegram"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <TelegramSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/user/telegram-tools"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <TelegramTools />
          </ProtectedRoute>
        }
      />

      {/* Root redirect - now goes to landing page */}
      <Route
        path="/"
        element={<Index />}
      />

      {/* 404 Fallback */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-4 relative overflow-hidden">
            {/* Background grid */}
            <div className="absolute inset-0 investigation-grid-student opacity-20" />
            
            {/* Glitch effect container */}
            <div className="relative z-10 text-center">
              <h1 className="text-8xl font-mono font-bold text-red-500 mb-4 animate-glitch">
                404
              </h1>
              <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-red-500 to-transparent mb-6" />
              <p className="text-gray-400 mb-2 font-mono text-sm tracking-wider">
                TARGET NOT FOUND
              </p>
              <p className="text-gray-600 mb-8 font-mono text-xs">
                The requested intelligence data does not exist in the database
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-300 font-mono text-sm hover:border-cyan-500/50 hover:text-cyan-400 transition-all duration-300"
              >
                <span>←</span>
                <span>RETURN TO BASE</span>
              </a>
            </div>
          </div>
        }
      />
    </Routes>
    </Suspense>
  );
};

export default AppRoutes;

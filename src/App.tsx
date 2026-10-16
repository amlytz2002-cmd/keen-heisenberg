import React from 'react';
import { ConfigProvider, theme } from 'antd';
import trTR from 'antd/locale/tr_TR';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

// Synchronize global Dayjs calendar locale with Turkish Ant Design configuration
dayjs.locale('tr');

import { AuthProvider, useAuth, UserRole } from './context/AuthContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Skeleton } from './components/ui/skeleton';
import { supabase } from './lib/supabaseClient';

// Public views
import { LandingView } from './views/Public/LandingView';
import { FeaturesView } from './views/Public/FeaturesView';
import { HowItWorksView } from './views/Public/HowItWorksView';
import { LegalView } from './views/Public/LegalView';
import { AuthView } from './views/Public/AuthView';
import { InviteRedeemView } from './views/Public/InviteRedeemView';

// Student views
import { TodayView } from './views/Student/TodayView';
import { ClassroomsView } from './views/Student/ClassroomsView';
import { CourseDetailView } from './views/Student/CourseDetailView';
import { StudySessionView } from './views/Student/StudySessionView';
import { ReviewQueueView } from './views/Student/ReviewQueueView';
import { ExamsListView } from './views/Student/ExamsListView';
import { ExamTakeView } from './views/Student/ExamTakeView';
import { ExamResultsView } from './views/Student/ExamResultsView';
import { ProgressView } from './views/Student/ProgressView';
import { SkillTreeView } from './views/Student/SkillTreeView';
import { InteractiveLessonPlayer } from './views/Student/InteractiveLessonPlayer';
import { MissionPlayer } from './views/Student/MissionPlayer';
import { MicrolearningProvider } from './context/MicrolearningContext';

// Instructor views
import { TeachDashboardView } from './views/Instructor/TeachDashboardView';
import { ClassroomManagerView } from './views/Instructor/ClassroomManagerView';
import { CourseManagerView } from './views/Instructor/CourseManagerView';
import { ResourceManagerView } from './views/Instructor/ResourceManagerView';
import { ContentReviewWorkspace } from './views/Instructor/ContentReviewWorkspace';
import { InstructorAnalyticsView } from './views/Instructor/InstructorAnalyticsView';

// Admin views
import { AdminAuditView } from './views/Admin/AdminAuditView';

import { ErrorBoundary } from './components/ErrorBoundary';

const RouteLoadingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[#060B14] p-6 lg:p-12 max-w-7xl mx-auto space-y-6">
    <div className="flex items-center justify-between pb-6 border-b border-slate-800">
      <Skeleton className="h-8 w-48 bg-slate-800" />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-24 bg-slate-800" />
        <Skeleton className="h-9 w-32 bg-slate-800" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton className="h-44 rounded-xl bg-slate-900 border border-slate-800" />
      <Skeleton className="h-44 rounded-xl bg-slate-900 border border-slate-800" />
      <Skeleton className="h-44 rounded-xl bg-slate-900 border border-slate-800" />
    </div>
    <Skeleton className="h-96 rounded-xl bg-slate-900 border border-slate-800" />
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const { path, navigate } = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      navigate(`/auth/login?redirect=${encodeURIComponent(path)}`);
    }
  }, [user, loading, path, navigate]);

  if (loading) {
    return <RouteLoadingSkeleton />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

const RoleGuard: React.FC<{ allowedRoles: UserRole[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const { activeRole, profile, loading } = useAuth();
  const { navigate } = useRouter();

  const userRoles = profile?.roles || [activeRole];
  const hasPermission = allowedRoles.some((r) => r === activeRole || userRoles.includes(r));

  React.useEffect(() => {
    if (!loading && !hasPermission) {
      navigate('/app/today');
    }
  }, [loading, hasPermission, navigate]);

  if (loading) return <RouteLoadingSkeleton />;
  if (!hasPermission) return null;

  return <>{children}</>;
};

const AuthCallbackHandler: React.FC = () => {
  const { refreshProfile } = useAuth();
  const { navigate } = useRouter();

  React.useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const resolved = await refreshProfile(session.user.id);
        navigate(resolved.activeRole === 'instructor' ? '/app/teach' : '/app/today');
      } else {
        navigate('/auth/login?verified=1');
      }
    });
  }, [refreshProfile, navigate]);

  return <RouteLoadingSkeleton />;
};

const AppRoutes: React.FC = () => {
  const { path, navigate } = useRouter();
  const { user, activeRole, loading } = useAuth();

  // Fullscreen clinical mission player or interactive lesson player (zero-distraction immersion without navbar/footer)
  if (path.startsWith('/learn/mission') || path.startsWith('/learn/lesson/')) {
    const isMission =
      path.startsWith('/learn/mission') ||
      path.includes('/lesson/mission-');

    return (
      <ProtectedRoute>
        <ErrorBoundary>
          {isMission ? <MissionPlayer key={path} /> : <InteractiveLessonPlayer key={path} />}
        </ErrorBoundary>
      </ProtectedRoute>
    );
  }

  // Route matching logic
  const renderRoute = () => {
    // 1. Exact Public Routes
    // Never hijack '/' away from the cover landing page!
    if (path === '/' || path === '') return <LandingView />;
    if (path === '/features') return <FeaturesView />;
    if (path === '/how-it-works') return <HowItWorksView />;
    if (path === '/privacy') return <LegalView initialTab="privacy" />;
    if (path === '/terms') return <LegalView initialTab="terms" />;
    
    // Auth Routes: if user is already logged in, redirect them to dashboard
    if (path === '/auth/login' || path === '/login') {
      if (!loading && user) {
        navigate(activeRole === 'instructor' ? '/app/teach' : '/app/today');
        return <RouteLoadingSkeleton />;
      }
      return <AuthView initialMode="login" />;
    }
    if (path === '/auth/register' || path === '/register') {
      if (!loading && user) {
        navigate(activeRole === 'instructor' ? '/app/teach' : '/app/today');
        return <RouteLoadingSkeleton />;
      }
      return <AuthView initialMode="register" />;
    }
    if (path === '/auth/forgot-password' || path === '/forgot-password') {
      return <AuthView initialMode="forgot" />;
    }
    if (path === '/auth/callback') {
      return <AuthCallbackHandler />;
    }

    // 2. Invitation redemption pattern: /invite/:token
    if (path.startsWith('/invite/')) return <InviteRedeemView />;

    // 3. Curriculum / Skill Tree Route (Protected)
    if (path === '/learn') {
      return (
        <ProtectedRoute>
          <SkillTreeView />
        </ProtectedRoute>
      );
    }

    // 4. Student Routes (Protected)
    if (path === '/app/today') return <ProtectedRoute><TodayView /></ProtectedRoute>;
    if (path === '/app/classrooms') return <ProtectedRoute><ClassroomsView /></ProtectedRoute>;
    if (path.startsWith('/app/courses/')) return <ProtectedRoute><CourseDetailView /></ProtectedRoute>;
    if (path.startsWith('/app/study/')) return <ProtectedRoute><StudySessionView /></ProtectedRoute>;
    if (path === '/app/review') return <ProtectedRoute><ReviewQueueView /></ProtectedRoute>;
    if (path === '/app/exams') return <ProtectedRoute><ExamsListView /></ProtectedRoute>;
    if (path.startsWith('/app/exams/') && path.includes('/take')) return <ProtectedRoute><ExamTakeView /></ProtectedRoute>;
    if (path.startsWith('/app/exam-attempts/') && path.includes('/results')) return <ProtectedRoute><ExamResultsView /></ProtectedRoute>;
    if (path === '/app/progress') return <ProtectedRoute><ProgressView /></ProtectedRoute>;

    // 5. Instructor Routes (Protected + Role Guard)
    if (path.startsWith('/app/teach')) {
      return (
        <ProtectedRoute>
          <RoleGuard allowedRoles={['instructor', 'admin']}>
            {path === '/app/teach' && <TeachDashboardView />}
            {path === '/app/teach/classrooms' && <ClassroomManagerView />}
            {path === '/app/teach/courses' && <CourseManagerView />}
            {path === '/app/teach/resources' && <ResourceManagerView />}
            {path === '/app/teach/content-review' && <ContentReviewWorkspace />}
            {path === '/app/teach/analytics' && <InstructorAnalyticsView />}
          </RoleGuard>
        </ProtectedRoute>
      );
    }

    // 6. Admin Routes (Protected + Admin Role Guard)
    if (path.startsWith('/app/admin')) {
      return (
        <ProtectedRoute>
          <RoleGuard allowedRoles={['admin']}>
            <AdminAuditView />
          </RoleGuard>
        </ProtectedRoute>
      );
    }

    // 7. Fallback: 404 or redirect to Landing
    return <LandingView />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#060B14] text-slate-100">
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          {renderRoute()}
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ConfigProvider
        locale={trTR}
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#0EA5E9',
            colorSuccess: '#10B981',
            colorWarning: '#F59E0B',
            colorError: '#F43F5E',
            colorInfo: '#0EA5E9',
            colorBgBase: '#060B14',
            colorBgContainer: '#0F172A',
            colorBgElevated: '#1E293B',
            colorBorder: '#1E293B',
            colorBorderSecondary: '#334155',
            colorText: '#F8FAFC',
            colorTextSecondary: '#94A3B8',
            borderRadius: 10,
            fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
          },
        }}
      >
        <RouterProvider>
          <AuthProvider>
            <MicrolearningProvider>
              <AppRoutes />
            </MicrolearningProvider>
          </AuthProvider>
        </RouterProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;

import React from 'react';
import { ConfigProvider } from 'antd';
import trTR from 'antd/locale/tr_TR';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

// Synchronize global Dayjs calendar locale with Turkish Ant Design configuration
dayjs.locale('tr');

import { AuthProvider, useAuth } from './context/AuthContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

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

const AppRoutes: React.FC = () => {
  const { path } = useRouter();
  const { user, activeRole } = useAuth();

  // Fullscreen clinical mission player or interactive lesson player (zero-distraction immersion without navbar/footer)
  if (path.startsWith('/learn/mission') || path.startsWith('/learn/lesson/')) {
    const isMission =
      path.startsWith('/learn/mission') ||
      path.includes('/lesson/mission-');

    return (
      <ErrorBoundary>
        {isMission ? <MissionPlayer key={path} /> : <InteractiveLessonPlayer key={path} />}
      </ErrorBoundary>
    );
  }

  // Route matching logic
  const renderRoute = () => {
    // 1. Exact Public Routes & Aliases
    if (path === '/' || path === '') return user ? (activeRole === 'instructor' ? <TeachDashboardView /> : <SkillTreeView />) : <LandingView />;
    if (path === '/learn') return <SkillTreeView />;
    if (path === '/features') return <FeaturesView />;
    if (path === '/how-it-works') return <HowItWorksView />;
    if (path === '/privacy') return <LegalView initialTab="privacy" />;
    if (path === '/terms') return <LegalView initialTab="terms" />;
    if (path === '/auth/login' || path === '/login') return <AuthView initialMode="login" />;
    if (path === '/auth/register' || path === '/register') return <AuthView initialMode="register" />;
    if (path === '/auth/forgot-password' || path === '/forgot-password') return <AuthView initialMode="forgot" />;

    // 2. Invitation redemption pattern: /invite/:token
    if (path.startsWith('/invite/')) return <InviteRedeemView />;

    // 3. Student Routes
    if (path === '/app/today') return <TodayView />;
    if (path === '/app/classrooms') return <ClassroomsView />;
    if (path.startsWith('/app/courses/')) return <CourseDetailView />;
    if (path.startsWith('/app/study/')) return <StudySessionView />;
    if (path === '/app/review') return <ReviewQueueView />;
    if (path === '/app/exams') return <ExamsListView />;
    if (path.startsWith('/app/exams/') && path.includes('/take')) return <ExamTakeView />;
    if (path.startsWith('/app/exam-attempts/') && path.includes('/results')) return <ExamResultsView />;
    if (path === '/app/progress') return <ProgressView />;

    // 4. Instructor Routes
    if (path === '/app/teach') return <TeachDashboardView />;
    if (path === '/app/teach/classrooms') return <ClassroomManagerView />;
    if (path === '/app/teach/courses') return <CourseManagerView />;
    if (path === '/app/teach/resources') return <ResourceManagerView />;
    if (path === '/app/teach/content-review') return <ContentReviewWorkspace />;
    if (path === '/app/teach/analytics') return <InstructorAnalyticsView />;

    // 5. Admin Routes
    if (path === '/app/admin/audit') return <AdminAuditView />;

    // 6. Fallback
    return user ? (activeRole === 'instructor' ? <TeachDashboardView /> : <SkillTreeView />) : <LandingView />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
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
          token: {
            colorPrimary: '#2563EB',
            colorSuccess: '#059669',
            colorWarning: '#D97706',
            colorError: '#DC2626',
            colorInfo: '#0284C7',
            borderRadius: 8,
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

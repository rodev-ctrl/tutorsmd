import { lazy } from 'react';
import { createBrowserRouter, RouterProvider as RRProvider, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useSessionManager } from '@app/hooks/useSessionManager';

// AUTH
const LoginPage              = lazy(() => import('@pages/auth/LoginPage'));
const RegisterPage           = lazy(() => import('@pages/auth/RegisterPage'));
const ActivatePage           = lazy(() => import('@pages/auth/ActivatePage'));
const ResendVerificationPage = lazy(() => import('@pages/auth/ResendVerificationPage'));
const ForgotPasswordPage     = lazy(() => import('@pages/auth/ForgotPasswordPage'));
const ResetPasswordPage      = lazy(() => import('@pages/auth/ResetPasswordPage'));

// PUBLIC
const HomePage    = lazy(() => import('@pages/home/HomePage'));
const TutorsPage  = lazy(() => import('@pages/tutors/TutorsPage'));
const TutorPage   = lazy(() => import('@pages/tutors/TutorPage'));
const AboutPage   = lazy(() => import('@pages/about/AboutPage'));
const FaqPage     = lazy(() => import('@pages/faq/FaqPage'));
const PrivacyPage = lazy(() => import('@pages/privacy/PrivacyPage'));

// PRIVATE
const DashboardPage    = lazy(() => import('@pages/dashboard/DashboardPage'));
const LessonsPage      = lazy(() => import('@pages/lesson/LessonsPage'));
const LessonPage       = lazy(() => import('@pages/lesson/LessonPage'));
const SettingsPage     = lazy(() => import('@pages/settings/SettingsPage'));
const MediaCheckPage   = lazy(() => import('@pages/settings/sections/media-check/MediaCheckPage'));
const SupportChatPage  = lazy(() => import('@pages/support-chat/SupportChatPage'));
const LikedTutorsPage  = lazy(() => import('@pages/liked-tutors/LikedTutorsPage'));

// ADMIN
const AdminMessagesPage = lazy(() => import('@pages/admin/AdminMessagesPage'));

const AppShell = () => {
  useSessionManager();
  return <Outlet />;
};

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
  // PUBLIC
  { path: '/',                      element: <HomePage /> },
  { path: '/tutors',                element: <TutorsPage /> },
  { path: '/tutors/:tutorId',       element: <TutorPage /> },
  { path: '/about',                 element: <AboutPage /> },
  { path: '/faq',                   element: <FaqPage /> },
  { path: '/privacy',               element: <PrivacyPage /> },

  // AUTH
  { path: '/login',                 element: <LoginPage /> },
  { path: '/register',              element: <RegisterPage /> },
  { path: '/activate/:token',       element: <ActivatePage /> },
  { path: '/resend-verification',   element: <ResendVerificationPage /> },
  { path: '/forgot-password',       element: <ForgotPasswordPage /> },
  { path: '/reset-password/:token', element: <ResetPasswordPage /> },

  // PRIVATE (любой залогиненный)
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard',           element: <DashboardPage /> },
      { path: '/lessons',             element: <LessonsPage /> },
      { path: '/lessons/:lessonId',   element: <LessonPage /> },
      { path: '/settings',            element: <SettingsPage /> },
      { path: '/settings/media',      element: <MediaCheckPage /> },
      { path: '/support',             element: <SupportChatPage /> },
      { path: '/liked-tutors',        element: <LikedTutorsPage /> },
    ],
  },

  // ADMIN
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      { path: '/admin/messages', element: <AdminMessagesPage /> },
    ],
  },

  // FALLBACK
  { path: '*', element: <Navigate to="/" replace /> },
    ]
  }
 
]);

export const RouterProvider = () => <RRProvider router={router} />;

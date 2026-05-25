import { lazy } from 'react';
import { createBrowserRouter, RouterProvider as RRProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// ─── Public pages ─────────────────────────────────────────────
const HomePage          = lazy(() => import('@pages/home/HomePage'));
const TutorsPage        = lazy(() => import('@pages/tutors/TutorsPage'));
const AboutPage         = lazy(() => import('@pages/about/AboutPage'));
const PrivacyPage       = lazy(() => import('@pages/privacy/PrivacyPage'));
const FaqPage           = lazy(() => import('@pages/faq/FaqPage'));
const ForgotPasswordPage = lazy(() => import('@pages/auth/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('@pages/auth/ResetPasswordPage'));
const ActivatePage            = lazy(() => import('@pages/auth/ActivatePage'));
const ResendVerificationPage  = lazy(() => import('@pages/auth/ResendVerificationPage'));

// ─── Protected pages ──────────────────────────────────────────
const DashboardPage     = lazy(() => import('@pages/dashboard/DashboardPage'));
const LessonPage        = lazy(() => import('@pages/lesson/LessonPage'));
const SettingsPage      = lazy(() => import('@pages/settings/SettingsPage'));
const MediaCheckPage    = lazy(() => import('@pages/settings/MediaCheckPage'));
const LikedTutorsPage   = lazy(() => import('@pages/liked-tutors/LikedTutorsPage'));

// ─── Admin only ───────────────────────────────────────────────
const AdminMessagesPage = lazy(() => import('@pages/admin/AdminMessagesPage'));

const router = createBrowserRouter([
  // ─── Публичные ────────────────────────────────────────────
  { path: '/',                    element: <HomePage /> },
  { path: '/tutors',              element: <TutorsPage /> },
  { path: '/about',               element: <AboutPage /> },
  { path: '/privacy',             element: <PrivacyPage /> },
  { path: '/faq',                 element: <FaqPage /> },
  { path: '/forgot-password',     element: <ForgotPasswordPage /> },
  { path: '/reset-password/:token', element: <ResetPasswordPage /> },
  { path: '/activate/:token',       element: <ActivatePage /> },
  { path: '/resend-verification',   element: <ResendVerificationPage /> },

  // ─── Любой залогиненный ───────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard',                    element: <DashboardPage /> },
      { path: '/lessons/:lessonId',            element: <LessonPage /> },
      { path: '/settings',                     element: <SettingsPage /> },
      { path: '/settings/media',               element: <MediaCheckPage /> },
      { path: '/liked-tutors',                 element: <LikedTutorsPage /> },
    ],
  },


  // ─── Только admin ─────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      { path: '/admin/messages', element: <AdminMessagesPage /> },
    ],
  },

  // ─── Fallback ─────────────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
]);

export const RouterProvider = () => <RRProvider router={router} />;

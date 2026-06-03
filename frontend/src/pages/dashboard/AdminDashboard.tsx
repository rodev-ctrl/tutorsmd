import { Lesson } from '@entities/lesson/model/types';
import {
  useGetPendingTutorsQuery,
  useApproveTutorMutation,
  useRejectTutorMutation,
  useStartReviewMutation,
} from '@shared/api/tutor/tutorApi';
import { Spinner, useGetUserLessonsQuery } from '@shared/index';
import { LessonCard } from '@widgets/lesson-card/index';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export const AdminDashboard = () => {
  const { t } = useTranslation('dashboard');

  const { data: tutorsData, isLoading: tutorsLoading } = useGetPendingTutorsQuery();
  const { data: lessonsData, isLoading: lessonsLoading } = useGetUserLessonsQuery({});

  const [approve, { isLoading: approving }] = useApproveTutorMutation();
  const [reject] = useRejectTutorMutation();

  const [startReview] = useStartReviewMutation();
const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
const [rejectOpen, setRejectOpen] = useState<string | null>(null);

  const pendingTutors    = tutorsData?.tutors ?? [];
  const allLessons       = lessonsData?.lessons ?? [];
  const pendingLessons   = allLessons.filter((l: Lesson) => l.status === 'pending');
  const confirmedLessons = allLessons.filter((l: Lesson) => l.status === 'confirmed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        {t('admin.title')}
      </h1>

      {/* Pending tutors */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          {t('admin.pendingTutors.title')} ({pendingTutors.length})
        </h2>

        {tutorsLoading ? (
          <Spinner />
        ) : pendingTutors.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-10 text-center">
            <p className="text-slate-500 text-sm">{t('admin.pendingTutors.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
           {pendingTutors.map((tutor) => (
  <div key={tutor.tutorId}
    className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-semibold text-slate-900">{tutor.name} {tutor.surname}</p>
        <p className="text-sm text-slate-500">{tutor.email}</p>
        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium
          ${tutor.approvalStatus === 'submitted' ? 'bg-blue-100 text-blue-700' : ''}
          ${tutor.approvalStatus === 'under_review' ? 'bg-amber-100 text-amber-700' : ''}
        `}>
          {tutor.approvalStatus}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap justify-end">
        {tutor.approvalStatus === 'submitted' && (
          <button onClick={() => startReview(tutor.tutorId)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700
              text-xs px-3 py-1.5 rounded-lg transition">
            Prüfung starten
          </button>
        )}
        <button onClick={() => approve({ tutorId: tutor.tutorId })}
          disabled={approving}
          className="bg-green-600 hover:bg-green-700 text-white
            text-xs px-3 py-1.5 rounded-lg transition">
          Freischalten
        </button>
        <button onClick={() => setRejectOpen(tutor.tutorId)}
          className="bg-red-50 hover:bg-red-100 text-red-600
            text-xs px-3 py-1.5 rounded-lg transition border border-red-200">
          Ablehnen
        </button>
      </div>
    </div>

    {/* Reject form */}
    {rejectOpen === tutor.tutorId && (
      <div className="border-t border-slate-100 pt-4 space-y-2">
        <textarea
          placeholder="Ablehnungsgrund (optional)..."
          rows={2}
          value={rejectReason[tutor.tutorId] ?? ''}
          onChange={(e) => setRejectReason(prev => ({
            ...prev, [tutor.tutorId]: e.target.value
          }))}
          className="w-full border border-slate-300 rounded-xl px-3 py-2
            text-sm focus:outline-none focus:ring-2 focus:ring-red-100 resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              reject({ tutorId: tutor.tutorId, reason: rejectReason[tutor.tutorId] });
              setRejectOpen(null);
            }}
            className="bg-red-600 hover:bg-red-700 text-white
              text-xs px-4 py-1.5 rounded-lg transition">
            Bestätigen
          </button>
          <button onClick={() => setRejectOpen(null)}
            className="text-slate-500 text-xs px-4 py-1.5 rounded-lg
              hover:bg-slate-100 transition">
            Abbrechen
          </button>
        </div>
      </div>
    )}
  </div>
))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAction to="/lessons"         icon="📅" label={t('admin.quickActions.lessons')} />
          <QuickAction to="/settings"        icon="📝" label={t('admin.quickActions.profile')} />
          <QuickAction to="/settings/media"  icon="🎥" label={t('admin.quickActions.camera')} />
        </div>
      </section>

      {/* Pending lessons */}
      {pendingLessons.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {t('admin.pendingLessons.title')} ({pendingLessons.length})
          </h2>
          <div className="space-y-3">
            {pendingLessons.map((lesson: Lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} role="tutor" />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming lessons */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <h2 className="text-lg font-semibold text-slate-900">
            {t('admin.upcomingLessons.title')}
          </h2>
          <Link
            to="/lessons"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline self-start sm:self-auto"
          >
            {t('admin.upcomingLessons.viewAll')}
          </Link>
        </div>

        {lessonsLoading ? (
          <Spinner />
        ) : confirmedLessons.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-10 text-center">
            <p className="text-slate-500 text-sm">{t('admin.upcomingLessons.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {confirmedLessons.slice(0, 5).map((lesson: Lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} role="tutor" />
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

const QuickAction = ({ to, icon, label }: { to: string; icon: string; label: string }) => (
  <Link
    to={to}
    className="bg-white rounded-3xl border border-slate-200
      p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
      flex items-center gap-3 group"
  >
    <span className="text-2xl">{icon}</span>
    <p className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
      {label}
    </p>
  </Link>
);
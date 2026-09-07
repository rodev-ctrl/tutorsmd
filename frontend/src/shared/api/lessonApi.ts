import { baseApi } from './baseApi';

export type LessonStatus =
  | 'pending'
  | 'pending_reschedule'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_client'
  | 'cancelled_by_tutor'
  | 'rescheduled'
  | 'no_show_client'
  | 'no_show_tutor';

export type LessonType = 'trial' | 'regular';

export interface Lesson {
  id:                  string;
  clientId:            string;
  tutorId:             string;
  subjectId:           string;
  type:                LessonType;
  status:              LessonStatus;
  scheduledAt:         string;
  durationMinutes:     number;
  cancellationReason:  string | null;
  proposedScheduledAt: string | null;
  proposedExpiresAt:   string | null;
  startedAt:           string | null;
  completedAt:         string | null;
  createdAt:           string;
  updatedAt:           string;
  tutor?:  { name: string; surname: string; avatarUrl: string | null };
  client?: { name: string; surname: string; avatarUrl: string | null };
}

export type LessonSummaryResult =
  | { status: 'not_ready' }
  | { status: 'ready'; content: string; model: string; createdAt: string };

export const lessonApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    // GET /lessons/:lessonId
    getLesson: build.query<Lesson, string>({
      query: (id) => `/lessons/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Lesson', id }],
    }),

    // GET /lessons/:lessonId/summary
    getLessonSummary: build.query<LessonSummaryResult, string>({
      query: (lessonId) => `/lessons/${lessonId}/summary`,
      providesTags: (_r, _e, lessonId) => [{ type: 'Lesson', id: lessonId }],
    }),

    // GET /lessons
    getUserLessons: build.query<{ lessons: Lesson[] }, {
      status?: LessonStatus;
      from?: string;
      to?: string;
    }>({
      query: (params) => ({ url: '/lessons', params }),
      providesTags: ['Lesson'],
    }),

    // POST /lessons/trial
    createTrialLesson: build.mutation<{ lessonId: string; scheduledAt: string; status: string }, {
      tutorId:          string;
      subjectId:        string;
      scheduledAt:      string;
      durationMinutes?: number;
    }>({
      query: (body) => ({ url: '/lessons/trial', method: 'POST', body }),
      invalidatesTags: ['Lesson'],
    }),

    // POST /lessons/:lessonId/confirm  (тьютор подтверждает)
    confirmLesson: build.mutation<void, string>({
      query: (id) => ({ url: `/lessons/${id}/confirm`, method: 'POST' }),
      invalidatesTags: ['Lesson'],
    }),

    // POST /lessons/:lessonId/reject  (тьютор отклоняет)
    rejectLesson: build.mutation<void, string>({
      query: (id) => ({ url: `/lessons/${id}/reject`, method: 'POST' }),
      invalidatesTags: ['Lesson'],
    }),

    // POST /lessons/:lessonId/cancel/client
    cancelByClient: build.mutation<void, { lessonId: string; reason?: string }>({
      query: ({ lessonId, reason }) => ({
        url: `/lessons/${lessonId}/cancel/client`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Lesson'],
    }),

    // POST /lessons/:lessonId/cancel/tutor
    cancelByTutor: build.mutation<void, { lessonId: string; reason?: string }>({
      query: ({ lessonId, reason }) => ({
        url: `/lessons/${lessonId}/cancel/tutor`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Lesson'],
    }),

    // POST /lessons/:lessonId/reschedule/propose  (тьютор предлагает перенос)
    proposeReschedule: build.mutation<void, {
      lessonId:       string;
      newScheduledAt: string;
    }>({
      query: ({ lessonId, newScheduledAt }) => ({
        url: `/lessons/${lessonId}/reschedule/propose`,
        method: 'POST',
        body: { newScheduledAt },
      }),
      invalidatesTags: ['Lesson'],
    }),

    // POST /lessons/:lessonId/reschedule/accept  (клиент принимает перенос)
    acceptReschedule: build.mutation<{ newLessonId: string; scheduledAt: string }, string>({
      query: (id) => ({ url: `/lessons/${id}/reschedule/accept`, method: 'POST' }),
      invalidatesTags: ['Lesson'],
    }),

    // POST /lessons/:lessonId/reschedule/decline  (клиент отклоняет перенос)
    declineReschedule: build.mutation<void, string>({
      query: (id) => ({ url: `/lessons/${id}/reschedule/decline`, method: 'POST' }),
      invalidatesTags: ['Lesson'],
    }),

    // POST /lessons/:lessonId/reschedule/client  (клиент сам переносит)
    rescheduleByClient: build.mutation<{ newLessonId: string; scheduledAt: string }, {
      lessonId:         string;
      newScheduledAt:   string;
      durationMinutes?: number;
    }>({
      query: ({ lessonId, ...body }) => ({
        url: `/lessons/${lessonId}/reschedule/client`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Lesson'],
    }),

  }),
});

export const {
  useGetLessonQuery,
  useGetLessonSummaryQuery,
  useGetUserLessonsQuery,
  useCreateTrialLessonMutation,
  useConfirmLessonMutation,
  useRejectLessonMutation,
  useCancelByClientMutation,
  useCancelByTutorMutation,
  useProposeRescheduleMutation,
  useAcceptRescheduleMutation,
  useDeclineRescheduleMutation,
  useRescheduleByClientMutation,
} = lessonApi;
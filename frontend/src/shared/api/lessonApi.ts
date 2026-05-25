// src/shared/api/lessonApi.ts
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
  id:                 string;
  clientId:           string;
  tutorId:            string;
  subjectId:          string;
  type:               LessonType;
  status:             LessonStatus;
  scheduledAt:        string;
  durationMinutes:    number;
  cancellationReason: string | null;
  proposedScheduledAt: string | null;
  proposedExpiresAt:   string | null;
  startedAt:          string | null;
  completedAt:        string | null;
  createdAt:          string;
  // Populated relations
  tutor?: { name: string; surname: string; avatarUrl: string | null };
  client?: { name: string; surname: string; avatarUrl: string | null };
}

export const lessonApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    // GET /lessons/:lessonId
    getLesson: build.query<Lesson, string>({
      query: (id) => `/lessons/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Lesson', id }],
    }),

    // GET /lessons — список уроков текущего пользователя
    getUserLessons: build.query<{ lessons: Lesson[] }, {
      status?: LessonStatus;
      from?: string;
      to?: string;
    }>({
      query: (params) => ({ url: '/lessons', params }),
      providesTags: ['Lesson'],
    }),

    // POST /lessons/trial
    createTrialLesson: build.mutation<{ lessonId: string }, {
      tutorId:         string;
      subjectId:       string;
      scheduledAt:     string;
      durationMinutes?: number;
    }>({
      query: (body) => ({ url: '/lessons/trial', method: 'POST', body }),
      invalidatesTags: ['Lesson'],
    }),

    // POST /lessons/:lessonId/confirm
    confirmLesson: build.mutation<void, string>({
      query: (id) => ({ url: `/lessons/${id}/confirm`, method: 'POST' }),
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

    // POST /lessons/:lessonId/reschedule/propose
    proposeReschedule: build.mutation<void, {
      lessonId:       string;
      newScheduledAt: string;
      expiresAt:      string;
    }>({
      query: ({ lessonId, ...body }) => ({
        url: `/lessons/${lessonId}/reschedule/propose`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Lesson'],
    }),

    // POST /lessons/:lessonId/reschedule/accept
    acceptReschedule: build.mutation<void, string>({
      query: (id) => ({ url: `/lessons/${id}/reschedule/accept`, method: 'POST' }),
      invalidatesTags: ['Lesson'],
    }),

    // POST /lessons/:lessonId/reschedule/decline
    declineReschedule: build.mutation<void, string>({
      query: (id) => ({ url: `/lessons/${id}/reschedule/decline`, method: 'POST' }),
      invalidatesTags: ['Lesson'],
    }),

  }),
});

export const {
  useGetLessonQuery,
  useGetUserLessonsQuery,
  useCreateTrialLessonMutation,
  useConfirmLessonMutation,
  useCancelByClientMutation,
  useCancelByTutorMutation,
  useProposeRescheduleMutation,
  useAcceptRescheduleMutation,
  useDeclineRescheduleMutation,
} = lessonApi;
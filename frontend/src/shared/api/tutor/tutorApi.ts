import { baseApi } from '../baseApi';

export interface TutorPublic {
  id:             string;
  userId:         string;
  name:           string;
  surname:        string;
  nameDe:         string | null;
  nameRu:         string | null;
  surnameDe:      string | null;
  surnameRu:      string | null;
  avatarUrl:      string | null;
  hourlyRate:     number | null;
  ratingAvg:      number;
  ratingCount:    number;
  highlightDe:    string | null;
  highlightRu:    string | null;
  fulldescribeDe: string | null;
  fulldescribeRu: string | null;
  approvalStatus: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  rejectionReason: string | null;
  subjects:       TutorSubject[];
}

export interface TutorSubject {
  id:   string;
  name: string;
}

export interface UpdateTutorProfileDto {
  nameDe?:         string | null;
  nameRu?:         string | null;
  surnameDe?:      string | null;
  surnameRu?:      string | null;
  hourlyRate?:     number | null;
  highlightDe?:    string | null;
  highlightRu?:    string | null;
  fulldescribeDe?: string | null;
  fulldescribeRu?: string | null;
}

export interface PendingTutor {
  tutorId:   string;
  userId:    string;
  name:      string;
  surname:   string;
  email:     string;
  nameDe:    string | null;
  nameRu:    string | null;
  approvalStatus: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  createdAt: string;
}

export const tutorApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    // GET /tutor/profile — тьютор видит свой профиль
    getTutorProfile: build.query<TutorPublic, void>({
      query: () => '/tutor/profile',
      providesTags: ['Tutor'],
    }),

    // PUT /tutor/profile — тьютор обновляет профиль
    updateTutorProfile: build.mutation<TutorPublic, UpdateTutorProfileDto>({
      query: (body) => ({
        url: '/tutor/profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Tutor'],
    }),

    // GET /tutor/pending — admin
    getPendingTutors: build.query<{ tutors: PendingTutor[] }, void>({
      query: () => '/tutor/pending',
      providesTags: ['Tutor'],
    }),

   
// POST /tutor/submit — тьютор подаёт заявку
submitApplication: build.mutation<void, void>({
  query: () => ({
    url: '/tutor/submit',
    method: 'POST',
  }),
  invalidatesTags: ['Tutor'],
}),

// GET /tutor/:tutorId/admin/review — админ смотрит профиль
getReviewProfile: build.query<{ profile: TutorPublic }, string>({
  query: (tutorId) => `/tutor/${tutorId}/admin/review`,
  providesTags: ['Tutor'],
}),

// POST /tutor/:tutorId/admin/start-review
startReview: build.mutation<void, string>({
  query: (tutorId) => ({
    url: `/tutor/${tutorId}/admin/start-review`,
    method: 'POST',
  }),
  invalidatesTags: ['Tutor'],
}),

    // POST /tutor/:tutorId/approve — admin
    approveTutor: build.mutation<void, { tutorId: string }>({
      query: ({ tutorId }) => ({
        url: `/tutor/${tutorId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Tutor'],
    }),

    // POST /tutor/:tutorId/reject — admin
    rejectTutor: build.mutation<void, { tutorId: string; reason?: string }>({
      query: ({ tutorId, reason }) => ({
        url: `/tutor/${tutorId}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Tutor'],
    }),

    updateTutorSubjects: build.mutation<void, string[]>({
  query: (subjectIds) => ({
    url: '/tutor/subjects',
    method: 'PUT',
    body: { subjectIds },
  }),
  invalidatesTags: ['Tutor'],
}),

  }),
});

export const {
  useGetTutorProfileQuery,
  useUpdateTutorProfileMutation,
  useGetPendingTutorsQuery,
  useApproveTutorMutation,
  useRejectTutorMutation,
  useSubmitApplicationMutation,
  useGetReviewProfileQuery,
  useStartReviewMutation,
} = tutorApi;
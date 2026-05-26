// Публичные tutor endpoints 

import { baseApi } from '../baseApi';
import type { TutorPublic } from './tutorApi';

export interface TutorListParams {
  subjectId?: string;
  minRate?:   number;
  maxRate?:   number;
  search?:    string;
  page?:      number;
  limit?:     number;
}

export interface TutorListResponse {
  tutors: TutorPublic[];
  total:  number;
  page:   number;
}

export const tutorPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    // GET /tutors
    getTutors: build.query<TutorListResponse, TutorListParams>({
      query: (params) => ({ url: '/tutors', params }),
      providesTags: ['Tutor'],
    }),

    // GET /tutors/:tutorId
    getTutorById: build.query<TutorPublic, string>({
      query: (id) => `/tutors/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Tutor', id }],
    }),

    // GET /slots/tutor/:tutorId
    getTutorSlots: build.query<{ slots: AvailableSlot[] }, string>({
      query: (tutorId) => `/slots/tutor/${tutorId}`,
      providesTags: ['Slot'],
    }),

  }),
});

export interface AvailableSlot {
  id:        string;
  dayOfWeek: number; // 0=Вс, 1=Пн ... 6=Сб
  startTime: string; // "HH:MM"
  endTime:   string;
  isActive:  boolean;
}

export const {
  useGetTutorsQuery,
  useGetTutorByIdQuery,
  useGetTutorSlotsQuery,
} = tutorPublicApi;
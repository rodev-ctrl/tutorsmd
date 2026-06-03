import { baseApi } from './baseApi';
import type { LanguageCode } from '@entities/user/model/types';

export interface UpdateProfileDto {
  name?:         string;
  surname?:      string;
  username?:     string;
  timezone?:     string;
  languageCode?: LanguageCode;
  avatarUrl?:    string | null;
}

export interface UserProfile {
  id:              string;
  name:            string;
  surname:         string;
  username:        string;
  email:           string;
  avatarUrl:       string | null;
  timezone:        string;
  languageCode:    LanguageCode;
  isEmailVerified: boolean;
  roles:           string[];
  client?: {
    id:        string;
    createdAt: string;
  };
  tutor?: {
    id:             string;
    approvalStatus: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';
    hourlyRate:     number | null;
    ratingAvg:      number;
    ratingCount:    number;
    nameDe:         string | null;
    nameRu:         string | null;
    surnameDe:      string | null;
    surnameRu:      string | null;
    highlightDe:    string | null;
    highlightRu:    string | null;
    fulldescribeDe: string | null;
    fulldescribeRu: string | null;
  };
}

export const profileApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    // GET /profile/me
    getUserProfile: build.query<UserProfile, void>({
      query: () => '/profile/me',
      transformResponse: (response: { profile: UserProfile }) => response.profile,
      providesTags: ['User'],
    }),

    // PUT /profile/me
    updateUserProfile: build.mutation<UserProfile, UpdateProfileDto>({
      query: (body) => ({
        url: '/profile/me',
        method: 'PUT',
        body,
      }),
      transformResponse: (response: { profile: UserProfile }) => response.profile,
      invalidatesTags: ['User'],
    }),

  }),
});

export const {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
} = profileApi;
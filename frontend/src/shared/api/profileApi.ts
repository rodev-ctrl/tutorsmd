import { baseApi } from './baseApi';
import type { User, LanguageCode } from '@entities/user/model/types';

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
    approvalStatus: 'pending' | 'approved' | 'rejected';
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
      providesTags: ['User'],
    }),

    // PUT /profile/me
    updateUserProfile: build.mutation<UserProfile, UpdateProfileDto>({
      query: (body) => ({
        url: '/profile/me',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
    }),

  }),
});

export const {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
} = profileApi;
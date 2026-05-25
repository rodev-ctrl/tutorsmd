import { baseApi } from './baseApi';
import { tokenManager } from '@shared/lib/tokenManager';
import { setCredentials, clearCredentials } from '@entities/user/model/authSlice';
import type { Role, AuthResponse } from '@entities/user/model/types';

export interface LoginDto {
  email:      string;
  password:   string;
  activeRole: Role;
  deviceInfo?: string;
}

export interface RegisterDto {
  name:         string;
  surname:      string;
  email:        string;
  password:     string;
  timezone?:    string;
  languageCode?: 'en' | 'de' | 'ru';
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    // POST /auth/register/client
    registerClient: build.mutation<void, RegisterDto>({
      query: (body) => ({
        url: '/auth/register/client',
        method: 'POST',
        body,
      }),
    }),

    // POST /auth/register/tutor
    registerTutor: build.mutation<void, RegisterDto>({
      query: (body) => ({
        url: '/auth/register/tutor',
        method: 'POST',
        body,
      }),
    }),

    // POST /auth/login
    login: build.mutation<AuthResponse, LoginDto>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          tokenManager.set(data.accessToken);
          dispatch(setCredentials({
            userId:     data.user.id,
            activeRole: data.user.activeRole,
          }));
        } catch {
          // ошибка обрабатывается в компоненте
        }
      },
    }),

    // POST /auth/logout
    logout: build.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
        } finally {
          // Разлогиниваем в любом случае
          tokenManager.clear();
          dispatch(clearCredentials());
        }
      },
    }),

    // POST /auth/refresh — вызывается при старте приложения
    refresh: build.mutation<{ accessToken: string }, { activeRole?: Role }>({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          tokenManager.set(data.accessToken);
        } catch {
          tokenManager.clear();
          dispatch(clearCredentials());
        }
      },
    }),

    // POST /auth/forgot-password
    forgotPassword: build.mutation<void, { email: string }>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    // POST /auth/reset-password/:token
    resetPassword: build.mutation<void, { token: string; newPassword: string }>({
      query: ({ token, newPassword }) => ({
        url: `/auth/reset-password/${token}`,
        method: 'POST',
        body: { newPassword },
      }),
    }),

    // PUT /auth/change-password
    changePassword: build.mutation<void, { oldPassword: string; newPassword: string }>({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'PUT',
        body,
      }),
    }),

    // POST /auth/switch-role
    switchRole: build.mutation<{ accessToken: string }, { newRole: Role }>({
      query: (body) => ({
        url: '/auth/switch-role',
        method: 'POST',
        body,
      }),
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          tokenManager.set(data.accessToken);
          dispatch(setCredentials({
            userId:     _arg.newRole, // userId не меняется — обновим только роль
            activeRole: _arg.newRole,
          }));
        } catch {}
      },
    }),

    // POST /auth/activate/:token
    activateAccount: build.mutation<void, { token: string }>({
      query: ({ token }) => ({
        url: `/auth/activate/${token}`,
        method: 'POST',
      }),
    }),

    // POST /auth/resend-verification
    resendVerification: build.mutation<void, string>({
        query: (email) => ({
            url: '/auth/resend-verification',
            method: 'POST',
            body: { email },
        }),
    }),

// Добавить в экспорты:
// useResendVerificationMutation,

    // GET /auth/sessions
    getSessions: build.query<{ sessions: Session[] }, void>({
      query: () => '/auth/sessions',
      providesTags: ['Session'],
    }),

    // DELETE /auth/sessions
    revokeAllSessions: build.mutation<void, void>({
      query: () => ({
        url: '/auth/sessions',
        method: 'DELETE',
      }),
      invalidatesTags: ['Session'],
    }),

    // DELETE /auth/sessions/:tokenHash
    revokeSession: build.mutation<void, { tokenHash: string }>({
      query: ({ tokenHash }) => ({
        url: `/auth/sessions/${tokenHash}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Session'],
    }),
  }),
});

interface Session {
  tokenHash:  string;
  deviceInfo: string | null;
  createdAt:  string;
  expiresAt:  string;
}

export const {
  useRegisterClientMutation,
  useRegisterTutorMutation,
  useLoginMutation,
  useLogoutMutation,
  useRefreshMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useSwitchRoleMutation,
  useActivateAccountMutation,
  useGetSessionsQuery,
  useRevokeAllSessionsMutation,
  useRevokeSessionMutation,
} = authApi;
/*
useGetUserProfileQuery()
    ↓
baseQueryWithReauth(args, api, extraOptions)
    ↓
1. pre-check: токен истекает? → doRefresh()
    ↓
2. rawBaseQuery() → реальный HTTP запрос
    ↓
3. если 401 → doRefresh() → повтор rawBaseQuery()
*/

import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { tokenManager } from '../lib/TokenManager';
import { clearCredentials } from '@entities/user/model/authSlice';
import type { RootState } from '@app/store';
import { jwtDecode } from 'jwt-decode';


let refreshPromise: Promise<string | null> | null = null;

function isExpiringSoon(token: string): boolean {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return exp * 1000 < Date.now() + 60_000;
  } catch {
    return true;
  }
}

// Базовый запрос с accessToken из памяти
const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: 'include',          
  prepareHeaders: (headers) => {
    const token = tokenManager.get();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});



async function doRefresh(api: any, extraOptions: any): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const activeRole = (api.getState() as RootState).auth.activeRole;
      const result = await rawBaseQuery(
        { url: '/auth/refresh', method: 'POST', body: { activeRole } },
        api,
        extraOptions,
      );
      if (result.data) {
        const { accessToken } = result.data as { accessToken: string };
        tokenManager.set(accessToken);
        window.dispatchEvent(new Event('auth:token-refreshed'));
        return accessToken;
      }
      // Проверяем что токен не был обновлён параллельным запросом
      if (!tokenManager.get()) {
        tokenManager.clear();
        api.dispatch(clearCredentials());
      }
      return null;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}


// refresh при 401
// RTK Query вызывает её автоматически при каждом useGetXxxQuery или useXxxMutation
// Я передаю её в createApi({ baseQuery: baseQueryWithReauth }) — это и есть точка входа для всех запросов
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {

   // Пропускаем pre-check для самого refresh endpoint
  const url = typeof args === 'string' ? args : args.url;
  if (!url.includes('/auth/refresh')) {
    const token = tokenManager.get();
    if (token && isExpiringSoon(token)) {
      await doRefresh(api, extraOptions);
    }
  }


  let result = await rawBaseQuery(args, api, extraOptions);

  // Fallback 401 - только 1 retry, чтобы не было "circular wait"
  if (result.error?.status === 401 && !(extraOptions as any)?._retry) {
    // Пробуем обновить токен
    const newToken = await doRefresh(api, extraOptions);
    if(newToken) {
      result = await rawBaseQuery(args, api, {
        ...(extraOptions as object),
        // именно "_retry", а не "retry"
        _retry: true,
      })
    } 
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Tutor', 'Lesson', 'Review', 'Slot', 'Quiz', 'Appeal', 'Session', 'Support'],
  endpoints: () => ({}),
});
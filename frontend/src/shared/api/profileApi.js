import { baseApi } from './baseApi';
export const profileApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        // GET /profile/me
        getUserProfile: build.query({
            query: () => '/profile/me',
            transformResponse: (response) => response.profile,
            providesTags: ['User'],
        }),
        // PUT /profile/me
        updateUserProfile: build.mutation({
            query: (body) => ({
                url: '/profile/me',
                method: 'PUT',
                body,
            }),
            transformResponse: (response) => response.profile,
            invalidatesTags: ['User'],
        }),
    }),
});
export const { useGetUserProfileQuery, useUpdateUserProfileMutation, } = profileApi;

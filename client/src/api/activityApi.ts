import { baseApi } from './baseApi';
import type { Activity } from '../types';

export interface ActivityListResponse {
  statusCode: number;
  message: string;
  data: Activity[];
}

export const activityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBoardActivity: builder.query<ActivityListResponse, string>({
      query: (boardId) => `/activities/${boardId}`,
      providesTags: (_result, _error, boardId) => [{ type: 'Activity', id: boardId }],
    }),
  }),
});

export const { useGetBoardActivityQuery } = activityApi;

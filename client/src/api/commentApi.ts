import { baseApi } from './baseApi';
import type { Comment } from '../types';

export interface CommentsListResponse {
  statusCode: number;
  message: string;
  data: Comment[];
}

export interface SingleCommentResponse {
  statusCode: number;
  message: string;
  data: Comment;
}

export const commentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTaskComments: builder.query<CommentsListResponse, string>({
      query: (taskId) => `/comments/task/${taskId}`,
      providesTags: (_result, _error, taskId) => [{ type: 'Comment', id: taskId }],
    }),
    createComment: builder.mutation<SingleCommentResponse, { taskId: string; content: string }>({
      query: ({ taskId, content }) => ({
        url: `/comments/task/${taskId}`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (_result, _error, { taskId }) => [{ type: 'Comment', id: taskId }],
    }),
  }),
});

export const { useGetTaskCommentsQuery, useCreateCommentMutation } = commentApi;

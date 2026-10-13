import { baseApi } from './baseApi';

export interface UploadResponse {
  statusCode: number;
  message: string;
  data: {
    url: string;
    public_id: string;
  };
}

export const uploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadImage: builder.mutation<UploadResponse, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('image', file);
        return {
          url: '/upload',
          method: 'POST',
          body: formData,
        };
      },
    }),
  }),
});

export const { useUploadImageMutation } = uploadApi;

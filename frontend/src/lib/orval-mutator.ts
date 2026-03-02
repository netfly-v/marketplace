import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { api } from '@/lib/api';

export const customInstance = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const response: AxiosResponse<T> = await api({
    ...config,
    ...options,
  });

  return response.data;
};

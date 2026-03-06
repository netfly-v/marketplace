import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth.store';
import type { AuthResponse } from '@/types';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const AUTH_ENDPOINTS = new Set([
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/auth/register',
]);

let refreshPromise: Promise<AuthResponse> | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function isExcludedFromRefresh(url?: string): boolean {
  if (!url) {
    return true;
  }

  return AUTH_ENDPOINTS.has(url);
}

async function refreshAccessToken(): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/auth/refresh');
  return response.data;
}

function handleAuthFailure(): void {
  if (!isBrowser()) {
    return;
  }

  useAuthStore.getState().clearAuthState();
}

export const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!(error instanceof AxiosError)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isExcludedFromRefresh(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const refreshedUser = await refreshPromise;
      useAuthStore.getState().setAuthenticatedUser(refreshedUser);

      return await api(originalRequest);
    } catch (refreshError) {
      handleAuthFailure();
      return Promise.reject(refreshError);
    }
  },
);

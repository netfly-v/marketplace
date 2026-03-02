import { api } from "@/lib/api";
import type { AuthResponse } from "@/types";

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  register: (data: RegisterData) =>
    api.post<AuthResponse>("/auth/register", data).then((r) => r.data),

  login: (data: LoginData) =>
    api.post<AuthResponse>("/auth/login", data).then((r) => r.data),

  logout: () => api.post("/auth/logout").then((r) => r.data),

  refresh: () => api.post<AuthResponse>("/auth/refresh").then((r) => r.data),

  getMe: () => api.get<AuthResponse>("/auth/me").then((r) => r.data),
};

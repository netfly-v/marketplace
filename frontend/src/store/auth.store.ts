"use client";

import { create } from "zustand";
import { clearProtectedQueries } from "@/lib/auth-cache";
import { getQueryClient } from "@/lib/query-client";
import type { User } from "@/types";
import { authService, type LoginData, type RegisterData } from "@/services/auth.service";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setAuthenticatedUser: (user: User | null) => void;
  clearAuthState: () => void;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setAuthenticatedUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  clearAuthState: () => {
    const queryClient = getQueryClient();
    clearProtectedQueries(queryClient);
    set({ user: null, isAuthenticated: false });
  },

  login: async (data) => {
    const user = await authService.login(data);
    set({ user, isAuthenticated: true });
  },

  register: async (data) => {
    await authService.register(data);
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      get().clearAuthState();
    }
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const user = await authService.getMe();
      set({ user, isAuthenticated: true });
    } catch {
      get().clearAuthState();
    } finally {
      set({ isLoading: false });
    }
  },
}));

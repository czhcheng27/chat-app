import { create } from "zustand";
import type { AuthState, AuthUser, LoginData, SignupData } from "../types/auth";
import api from "../lib/apiClient";

export const useAuthStore = create<AuthState>((set) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],

  checkAuth: async () => {
    const res = await api.get<AuthUser>("/auth/check", {
      silent: true, // 不显示 toast
      onError: () => {
        set({ authUser: null });
      },
    });

    if (res) {
      set({ authUser: res });
    }

    set({ isCheckingAuth: false });
  },

  signup: async (data: SignupData) => {
    set({ isSigningUp: true });
    const res = await api.post<AuthUser>("/auth/signup", data, {
      successMessage: "Account created successfully",
      errorMessage: "Signup failed",
      onError: () => {
        set({ authUser: null });
      },
    });
    if (res) {
      set({ authUser: res });
    }

    set({ isSigningUp: false });
  },

  login: async (data: LoginData) => {
    set({ isLoggingIn: true });
    const res = await api.post<AuthUser>("/auth/login", data, {
      successMessage: "Logged in successfully",
      errorMessage: "Login failed",
    });
    if (res) {
      set({ authUser: res });
    }
    set({ isLoggingIn: false });
  },

  logout: async () => {
    const res = await api.post<void>("/auth/logout", undefined, {
      successMessage: "Logged out successfully",
      errorMessage: "Logout failed",
      onError: () => {
        set({ authUser: null });
      },
    });
    if (res !== null) {
      // 请求成功，做成功逻辑
      set({ authUser: null });
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    const res = await api.put<AuthUser>("/auth/update-profile", data, {
      successMessage: "Profile updated successfully",
      errorMessage: "Failed to update profile",
      onError: () => {
        set({ authUser: null });
      },
    });
    if (res) set({ authUser: res });
    set({ isUpdatingProfile: false });
  },
}));

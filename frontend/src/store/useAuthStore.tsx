import { create } from "zustand";
import { io } from "socket.io-client";
import type { AuthState, AuthUser, LoginData, SignupData } from "../types/auth";
import api from "../lib/apiClient";
import { useChatStore } from "./useChatStore";
import { sortUsers } from "../lib/utils";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : "https://chat-app-backend-chat-app.up.railway.app";

export const useAuthStore = create<AuthState>((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    const res = await api.get<AuthUser>("/auth/check", {
      silent: true, // 不显示 toast
      onError: () => {
        set({ authUser: null });
      },
    });

    if (res) {
      set({ authUser: res });
      get().connectSocket();
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
      get().connectSocket();
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
      get().connectSocket();
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
      get().disconnectSocket();
      useChatStore.getState().setSelectedUser(null);
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

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
      transports: ["websocket", "polling"], // 增加稳定性
      withCredentials: true, // 必须开启，否则无法通过跨域 Cookie 校验
    });
    socket.connect();
    set({ socket });

    socket.on("getOnlineUsers", (onlineUsers: AuthUser[]) => {
      const { users, setUsers } = useChatStore.getState();

      // 将新用户合并进去（如果之前列表中没有）
      const mergedUsers = [...users];
      onlineUsers.forEach((user) => {
        if (user._id === authUser._id) return; // 跳过自己
        const existing = users.find((u) => u._id === user._id);
        if (!existing) mergedUsers.push(user);
      });

      const sorted = sortUsers(
        mergedUsers,
        onlineUsers.map((u) => u._id),
      );

      set({ onlineUsers: onlineUsers.map((u) => u._id) });
      setUsers(sorted);
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) socket.disconnect();
  },
}));

import { create } from "zustand";
import api from "../lib/apiClient";
import type { ChatState } from "../types/chat";
import type { AuthUser } from "../types/auth";

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    const res = await api.get<AuthUser[]>("/messages/users");
    res && set({ users: res });
    set({ isUsersLoading: false });
  },

  getMessages: async (userId: string) => {
    set({ isMessagesLoading: true });
    const res = await api.get<object[]>(`/messages/${userId}`);
    res && set({ messages: res });
    set({ isMessagesLoading: false });
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));

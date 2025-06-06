import { create } from "zustand";
import api from "../lib/apiClient";
import type { ChatState, Message } from "../types/chat";
import type { AuthUser } from "../types/auth";

export const useChatStore = create<ChatState>((set, get) => ({
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

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    const res = await api.get<Message[]>(`/messages/${userId}`);
    res && set({ messages: res });
    set({ isMessagesLoading: false });
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const res = await api.post<Message>(
      `/messages/send/${selectedUser?._id}`,
      messageData
    );
    if (res) set({ messages: [...messages, res] });
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));

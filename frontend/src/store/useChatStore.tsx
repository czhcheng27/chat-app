import { create } from "zustand";
import api from "../lib/apiClient";
import type { ChatState, Message } from "../types/chat";
import type { AuthUser } from "../types/auth";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  setUsers: (users: AuthUser[]) => set({ users }),

  setSelectedUser: (selectedUser) => {
    const { users } = get();
    // 清除 unreadCount
    const updatedUsers = users.map((user) =>
      user._id === selectedUser?._id ? { ...user, unreadCount: 0 } : user
    );

    set({
      selectedUser,
      users: updatedUsers,
    });
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    const res = await api.get<AuthUser[]>("/messages/users");
    res && set({ users: res });
    set({ isUsersLoading: false });
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });

    // 1. 请求聊天记录
    const res = await api.get<Message[]>(`/messages/${userId}`);
    res && set({ messages: res });

    // 2. 同时将该用户发来的消息标记为已读
    await api.patch(`/messages/mark-as-read/${userId}`);

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

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    if (!socket) return;

    socket.on("newMessage", (newMessage: Message) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket && socket.off("newMessage");
  },
}));

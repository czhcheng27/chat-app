import { create } from "zustand";
import api from "../lib/apiClient";
import type { ChatState, Message, SendMsg } from "../types/chat";
import type { AuthUser, LastMessage } from "../types/auth";
import { useAuthStore } from "./useAuthStore";
import { sortUsers } from "../lib/utils";

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
    if (res) set({ users: res });
    set({ isUsersLoading: false });
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });

    // 1. 请求聊天记录
    const res = await api.get<Message[]>(`/messages/${userId}`);
    if (res) set({ messages: res });

    // 2. 同时将该用户发来的消息标记为已读
    await api.patch(`/messages/mark-as-read/${userId}`);

    set({ isMessagesLoading: false });
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, users } = get();
    const res = await api.post<Message>(
      `/messages/send/${selectedUser?._id}`,
      messageData
    );

    if (!res) return;

    set({ messages: [...messages, res] });

    // 更新 sidebar 中对应用户的 lastMessageAt
    const updatedUsers = [...users];
    const index = updatedUsers.findIndex((u) => u._id === selectedUser?._id);

    const extractLastMessage = (msgData: SendMsg): LastMessage => {
      if (msgData.image) {
        return { type: "image", content: "" };
      }
      return { type: "text", content: msgData.text ?? "" };
    };

    if (index !== -1) {
      updatedUsers[index] = {
        ...updatedUsers[index],
        lastMessageAt: res.createdAt,
        lastMessage: extractLastMessage(messageData),
      };
    }

    // 使用 onlineUsers 排序
    const { onlineUsers } = useAuthStore.getState();
    const sorted = sortUsers(updatedUsers, onlineUsers);

    set({ users: sorted });
  },

  initMessageListener: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // 防止重复监听
    socket.off("newMessage");

    socket.on("newMessage", (newMessage: Message) => {
      const { selectedUser, messages, users } = get();
      console.log(`newMessage`, newMessage, "selectedUser");
      const isFromSelectedUser = selectedUser?._id === newMessage.senderId;

      const lastMessagePreview: AuthUser["lastMessage"] = newMessage.image
        ? { type: "image", content: "" }
        : { type: "text", content: newMessage.text ?? "" };

      if (isFromSelectedUser) {
        // 正在和这个用户聊天，追加消息
        set({ messages: [...messages, newMessage] });
      }

      // 不论是否正在聊天，都更新 sidebar 用户列表
      const updatedUsers = users.map((user) => {
        if (user._id === newMessage.senderId) {
          return {
            ...user,
            unreadCount: isFromSelectedUser ? 0 : (user.unreadCount || 0) + 1,
            lastMessageAt: newMessage.createdAt,
            lastMessage: lastMessagePreview,
          };
        }
        return user;
      });

      const { onlineUsers } = useAuthStore.getState();
      const sorted = sortUsers(updatedUsers, onlineUsers);

      set({ users: sorted });

    });
  },
}));

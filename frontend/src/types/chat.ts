import type { AuthUser } from "./auth";

export interface ChatState {
  messages: Array<Message>;
  users: Array<AuthUser>;
  selectedUser: AuthUser | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  getUsers: () => Promise<void>;
  getMessages: (data: string) => Promise<void>;
  sendMessage: (data: SendMsg) => Promise<void>;
  setSelectedUser: (data: AuthUser | null) => void;
}
interface SendMsg {
  text: string;
  image?: string | null;
}
export interface Message extends SendMsg {
  senderId: string;
  receiverId: string;
  _id: string;
  createdAt: string;
}

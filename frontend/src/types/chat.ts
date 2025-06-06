import type { AuthUser } from "./auth";

export interface ChatState {
  messages: Array<object>;
  users: Array<AuthUser>;
  selectedUser: AuthUser | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  getUsers: () => Promise<void>;
  getMessages: (data: string) => Promise<void>;
  setSelectedUser: (data: AuthUser | null) => void;
}

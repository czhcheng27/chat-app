import type { AuthUser } from "../types/auth";

export function formatMessageTime(date: string) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

//formatLastMessageTime("2024-12-25T10:20:00Z"); // => "2024 Dec 25"
export function formatLastMessageTime(lastMessageAt: string | null): string {
  if (!lastMessageAt) return "";

  const messageDate = new Date(lastMessageAt);
  const now = new Date();

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isYesterday = (d: Date) => {
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    return isSameDay(d, yesterday);
  };

  const timeStr = messageDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isSameDay(messageDate, now)) {
    return timeStr;
  }

  if (isYesterday(messageDate)) {
    return "Yesterday";
  }

  const optionsThisYear: Intl.DateTimeFormatOptions = {
    month: "short", // Jun
    day: "numeric", // 5
  };

  const optionsOtherYear: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  return messageDate.toLocaleDateString(
    "en-US",
    messageDate.getFullYear() === now.getFullYear()
      ? optionsThisYear
      : optionsOtherYear
  );
}

/**
 * 联系人列表中用户排序规则：

1、在线用户在前面

2、在线用户中，与我最近聊天的排更前

3、离线用户也按最近聊天时间排

4、如果没有聊天记录，就按名字字母排序
 */
export function sortUsers(users: AuthUser[], onlineUserIds: string[]) {
  return [...users]
    .map((user) => ({
      ...user,
      isOnline: onlineUserIds.includes(user._id),
    }))
    .sort((a, b) => {
      // 1. 在线优先
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;

      // 2. 聊天时间倒序
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;

      // 3. 没有聊天记录时按名字
      return a.fullName.localeCompare(b.fullName);
    });
}

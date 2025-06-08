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

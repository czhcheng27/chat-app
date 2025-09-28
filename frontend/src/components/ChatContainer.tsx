import { useEffect, useRef, useCallback } from "react";
import { Loader } from "lucide-react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const { messages, getMessages, isMessagesLoading, selectedUser } =
    useChatStore();
  const { authUser } = useAuthStore();

  const messageEndRef = useRef<HTMLDivElement | null>(null);

  // 滚动到底部函数，useCallback 保持引用稳定
  const scrollToBottom = useCallback(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, []);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser?._id, getMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isMessagesLoading, scrollToBottom]);

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      {isMessagesLoading ? (
        <div className="flex items-center justify-center h-screen">
          <Loader className="size-10 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => {
            const { _id, senderId, text, createdAt, image } = message;
            const isUser = senderId === authUser?._id;
            return (
              <div
                key={_id}
                className={`chat ${isUser ? "chat-end" : "chat-start"}`}
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border">
                    <img
                      src={
                        isUser
                          ? authUser.profilePic || "/avatar.png"
                          : selectedUser?.profilePic || "/avatar.png"
                      }
                      alt="profile pic"
                    />
                  </div>
                </div>
                <div className="chat-header mb-1">
                  <time className="text-xs opacity-50 ml-1">
                    {formatMessageTime(createdAt)}
                  </time>
                </div>
                <div className="chat-bubble flex flex-col">
                  {image && (
                    <img
                      src={image}
                      alt="Attachment"
                      className="sm:max-w-[200px] rounded-md mb-2"
                      onLoad={() => {
                        // 图片加载完成后再滚动到底部
                        scrollToBottom();
                      }}
                    />
                  )}
                  {text && <p>{text}</p>}
                </div>
              </div>
            );
          })}
          <div ref={messageEndRef}></div>
        </div>
      )}
      <MessageInput />
    </div>
  );
};

export default ChatContainer;

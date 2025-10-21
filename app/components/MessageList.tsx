import { useEffect, useState } from "react";
import type { Message } from "~/types/chat";
import { ChatMessage } from "./ChatMessage";

interface MessageListProps {
  messages: Message[];
  bannedUsers: Set<string>;
  currentUserId: string | null;
  scrollRef: React.RefObject<HTMLDivElement>;
  isUserScrolling: boolean;
  scrollToBottom: () => void;
  onDeleteMessage: (messageId: string) => void;
  onBanUser: (userId: string) => void;
}

export function MessageList({
  messages,
  bannedUsers,
  currentUserId,
  scrollRef,
  isUserScrolling,
  scrollToBottom,
  onDeleteMessage,
  onBanUser,
}: MessageListProps) {
  const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Pin announcements for 30 seconds
    const newAnnouncements = messages.filter(
      (msg) =>
        msg.type === "ANNOUNCEMENT" &&
        !msg.deleted &&
        Date.now() - msg.timestamp < 30000
    );

    const newPinned = new Set(newAnnouncements.map((msg) => msg.id));
    setPinnedMessages(newPinned);

    // Clear pins after 30 seconds
    const timeouts = newAnnouncements.map((msg) => {
      const remainingTime = 30000 - (Date.now() - msg.timestamp);
      return setTimeout(() => {
        setPinnedMessages((prev) => {
          const updated = new Set(prev);
          updated.delete(msg.id);
          return updated;
        });
      }, remainingTime);
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [messages]);

  const pinnedMessageList = messages.filter((msg) => pinnedMessages.has(msg.id));
  const regularMessages = messages.filter((msg) => !pinnedMessages.has(msg.id));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Pinned Messages */}
      {pinnedMessageList.length > 0 && (
        <div className="bg-purple-900/30 border-b border-purple-700 p-3 space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
          {pinnedMessageList.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isBanned={bannedUsers.has(message.userId)}
              isCurrentUser={message.userId === currentUserId}
              onDelete={onDeleteMessage}
              onBan={onBanUser}
              isPinned
            />
          ))}
        </div>
      )}

      {/* Regular Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin"
      >
        {regularMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          regularMessages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isBanned={bannedUsers.has(message.userId)}
              isCurrentUser={message.userId === currentUserId}
              onDelete={onDeleteMessage}
              onBan={onBanUser}
            />
          ))
        )}
      </div>

      {/* Scroll to bottom button */}
      {isUserScrolling && (
        <div className="absolute bottom-24 right-6">
          <button
            onClick={scrollToBottom}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 shadow-lg transition-all hover:scale-105 flex items-center gap-2"
          >
            <span>↓</span>
            <span className="text-sm">New messages</span>
          </button>
        </div>
      )}
    </div>
  );
}


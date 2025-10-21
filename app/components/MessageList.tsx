/**
 * MessageList Component
 * 
 * Displays chat messages with intelligent scroll behavior
 * 
 * Features:
 * - Pinned announcements (displayed for 30 seconds at top)
 * - Regular messages in scrollable container
 * - Auto-scroll to new messages (only when user is at bottom)
 * - "New messages" button when user is reading history
 * - Respects user's scroll position (no forced scrolling)
 * 
 * Scroll Behavior:
 * - When user is at bottom: New messages auto-scroll to bottom
 * - When user scrolls up (reading history): New messages DON'T force scroll
 * - Instead, a "New messages ↓" button appears for manual scrolling
 * 
 * @param scrollRef - Ref to attach to scrollable container (from useAutoScroll)
 * @param isUserScrolling - True when user has scrolled up to read history
 * @param scrollToBottom - Function to manually scroll to bottom
 */

import { useEffect, useState } from "react";
import type { Message } from "~/types/chat";
import { ChatMessage } from "./ChatMessage";

interface MessageListProps {
  messages: Message[];
  bannedUsers: Set<string>;
  currentUserId: string | null;
  scrollRef: React.RefObject<HTMLDivElement>;        // From useAutoScroll hook
  isUserScrolling: boolean;                          // True if user scrolled up
  scrollToBottom: () => void;                        // Function to scroll to bottom
  onDeleteMessage: (messageId: string) => void;
  onBanUser: (userId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  canModerate?: boolean;
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
  onReact,
  canModerate = true,
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
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Pinned Messages */}
      {pinnedMessageList.length > 0 && (
        <div className="flex-shrink-0 bg-purple-900/30 border-b border-purple-700 p-3 space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
          {pinnedMessageList.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isBanned={bannedUsers.has(message.userId)}
              isCurrentUser={message.userId === currentUserId}
              onDelete={onDeleteMessage}
              onBan={onBanUser}
              onReact={onReact}
              canModerate={canModerate}
              isPinned
            />
          ))}
        </div>
      )}

      {/* Regular Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-scroll p-4 space-y-3 scrollbar-thin"
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
              onReact={onReact}
              canModerate={canModerate}
            />
          ))
        )}
      </div>

      {/* New Messages Button - Appears when user has scrolled up */}
      {isUserScrolling && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all animate-bounce z-10"
          aria-label="Scroll to new messages"
        >
          <span>New messages</span>
          <span>↓</span>
        </button>
      )}
    </div>
  );
}


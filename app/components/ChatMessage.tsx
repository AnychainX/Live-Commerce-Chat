/**
 * ChatMessage Component
 * 
 * Displays individual chat messages with smart alignment:
 * - Current user's messages: Right-aligned (green tint)
 * - Other users' messages: Left-aligned
 * - Host messages: Highlighted with blue background and crown badge
 * 
 * Features:
 * - Emoji reactions
 * - Moderation controls (hover to show)
 * - Pinned message indicator
 * - Avatar with color coding
 * - Timestamps
 */

import { useState } from "react";
import type { Message } from "~/types/chat";

interface ChatMessageProps {
  message: Message;
  isBanned: boolean;
  isCurrentUser: boolean;
  isHost?: boolean;         // Is this message from the room host?
  onDelete: (messageId: string) => void;
  onBan: (userId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  canModerate?: boolean;
  isPinned?: boolean;
}

export function ChatMessage({
  message,
  isBanned,
  isCurrentUser,
  isHost = false,
  onDelete,
  onBan,
  onReact,
  canModerate = true,
  isPinned = false,
}: ChatMessageProps) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const quickEmojis = ["❤️", "👍", "🔥", "😂", "👏"];

  const getAvatar = (username: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-indigo-500",
    ];
    const index =
      username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`group relative flex gap-3 p-3 rounded-lg transition-all z-10 ${
        showEmojiPicker ? "z-[60]" : ""  // Increase z-index when emoji picker is open
      } ${
        isCurrentUser ? "flex-row-reverse" : ""  // Right align for current user
      } ${
        isPinned
          ? "bg-purple-900/50 border border-purple-500 shadow-lg shadow-purple-900/50"
          : message.type === "ANNOUNCEMENT"
          ? "bg-purple-900/30 border border-purple-700"
          : isHost
          ? "bg-gradient-to-r from-blue-900/60 to-blue-800/40 border-l-4 border-l-blue-400 border border-blue-600/50 shadow-lg shadow-blue-900/50"  // Strong host highlight
          : isCurrentUser
          ? "bg-green-900/20 border border-green-800/50"  // Subtle highlight for own messages
          : "hover:bg-gray-800 border border-transparent"
      } ${isBanned ? "opacity-50" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Host Badge - Top Left Corner */}
      {isHost && (
        <div className="absolute -top-2 -left-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg z-10 animate-pulse">
          <span className="text-sm">👑</span>
          <span className="font-bold">HOST</span>
        </div>
      )}

      {/* Avatar */}
      <div
        className={`${getAvatar(message.username)} w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
          isHost ? "ring-4 ring-blue-400 ring-offset-2 ring-offset-gray-900 shadow-lg shadow-blue-500/50" : ""  // Strong ring for host avatar
        }`}
      >
        {message.username.charAt(0).toUpperCase()}
      </div>

      {/* Message Content */}
      <div className={`flex-1 min-w-0`}>
        <div className={`flex items-center gap-2 mb-1 flex-wrap ${isCurrentUser ? "flex-row-reverse" : ""}`}>
          <span className={`font-semibold text-sm ${isHost ? "text-blue-300 text-base" : "text-white"}`}>
            {message.username}
          </span>
          {isCurrentUser && (
            <span className="text-xs text-green-400 font-medium">(You)</span>
          )}
          {message.type === "ANNOUNCEMENT" && (
            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
              📢 Announcement
            </span>
          )}
          {isPinned && (
            <span className="px-2 py-0.5 bg-purple-700 text-white text-xs rounded-full">
              📌 Pinned
            </span>
          )}
          {isBanned && (
            <span className="text-xs text-red-400 font-medium">BANNED</span>
          )}
          <span className="text-xs text-gray-500">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        <p className={`text-sm break-words ${isCurrentUser ? "text-right" : ""} ${
          isHost ? "text-blue-100 font-medium" : "text-gray-200"
        }`}>
          {message.deleted ? (
            <span className="italic text-gray-500">[Message deleted]</span>
          ) : (
            message.text
          )}
        </p>

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-2 ${isCurrentUser ? "justify-end" : ""}`}>
            {Object.entries(message.reactions).map(([emoji, userIds]) => (
              <button
                key={emoji}
                onClick={() => onReact?.(message.id, emoji)}
                className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded-full text-xs flex items-center gap-1 transition-colors"
              >
                <span>{emoji}</span>
                <span className="text-gray-300">{userIds.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover Actions - Only show emoji button for OTHER users' messages */}
      {showActions && !message.deleted && !isCurrentUser && (
        <div className="flex-shrink-0 flex gap-1">
          {/* Emoji Reaction Button */}
          {onReact && (
            <div className="relative z-50">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                title="React"
              >
                😊
              </button>
              
              {/* Emoji Picker - Positioned below and to the left of button */}
              {showEmojiPicker && (
                <div 
                  className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-600 rounded-md px-2 py-1.5 flex gap-1.5 shadow-lg z-[9999] whitespace-nowrap"
                >
                  {quickEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(message.id, emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="hover:scale-110 transition-transform text-base hover:bg-gray-700 rounded px-1"
                      title={`React with ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Moderation Actions (Host Only) */}
      {showActions && !message.deleted && canModerate && (
        <div className={`flex-shrink-0 flex gap-1 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
          <button
            onClick={() => onDelete(message.id)}
            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
            title="Delete message"
          >
            Delete
          </button>
          {!isCurrentUser && (
            <button
              onClick={() => onBan(message.userId)}
              className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors"
              title="Ban user"
            >
              Ban
            </button>
          )}
        </div>
      )}
    </div>
  );
}

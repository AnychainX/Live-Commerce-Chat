import { useState } from "react";
import type { Message } from "~/types/chat";

interface ChatMessageProps {
  message: Message;
  isBanned: boolean;
  isCurrentUser: boolean;
  onDelete: (messageId: string) => void;
  onBan: (userId: string) => void;
  canModerate?: boolean;
  isPinned?: boolean;
}

export function ChatMessage({
  message,
  isBanned,
  isCurrentUser,
  onDelete,
  onBan,
  canModerate = true,
  isPinned = false,
}: ChatMessageProps) {
  const [showActions, setShowActions] = useState(false);

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

  const messageStyles = () => {
    if (message.deleted) return "bg-gray-800 border-gray-700 opacity-60";
    if (isPinned) return "bg-purple-900/50 border-purple-600";
    if (message.type === "ANNOUNCEMENT")
      return "bg-blue-900/50 border-blue-600";
    if (isBanned) return "bg-gray-800 border-gray-600 opacity-50";
    return "bg-gray-800 border-gray-700 hover:bg-gray-750";
  };

  return (
    <div
      className={`relative border rounded-lg p-3 transition-colors ${messageStyles()}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {isPinned && (
        <div className="absolute -top-2 left-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
          📌 Pinned
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full ${getAvatar(
            message.username
          )} flex items-center justify-center text-white font-semibold text-sm`}
        >
          {message.username.charAt(0).toUpperCase()}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-semibold text-sm text-white">
              {message.username}
            </span>
            {isBanned && (
              <span className="text-xs text-red-400 font-medium">BANNED</span>
            )}
            {message.type === "ANNOUNCEMENT" && (
              <span className="text-xs text-blue-400 font-medium">
                📢 ANNOUNCEMENT
              </span>
            )}
            <span className="text-xs text-gray-500">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>

          <p className="text-sm text-gray-200 break-words">
            {message.deleted ? (
              <span className="italic text-gray-500">[Message deleted]</span>
            ) : (
              message.text
            )}
          </p>
        </div>

        {/* Hover Actions */}
        {showActions && !message.deleted && canModerate && (
          <div className="flex-shrink-0 flex gap-1">
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
    </div>
  );
}


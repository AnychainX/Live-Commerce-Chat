import { useState, useEffect } from "react";
import type { MetaFunction } from "@remix-run/node";
import { useSocket } from "~/hooks/useSocket";
import { useAutoScroll } from "~/hooks/useAutoScroll";
import { ConnectionStatus } from "~/components/ConnectionStatus";
import { MessageList } from "~/components/MessageList";
import { MessageInput } from "~/components/MessageInput";
import { ModeratorPanel } from "~/components/ModeratorPanel";
import { VideoPlayer } from "~/components/VideoPlayer";

export const meta: MetaFunction = () => {
  return [
    { title: "Live Stream Chat" },
    {
      name: "description",
      content: "Real-time chat for live commerce streaming",
    },
  ];
};

export default function Index() {
  const [username, setUsername] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [showVideo, setShowVideo] = useState(true);

  // Load username from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem("chat_username");
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  const {
    connectionStatus,
    connected,
    messages,
    bannedUsers,
    slowMode,
    currentUserId,
    sendMessage,
    deleteMessage,
    banUser,
    clearAllMessages,
    toggleSlowMode,
  } = useSocket(username);

  const { scrollRef, isUserScrolling, scrollToBottom } = useAutoScroll([
    messages.length,
  ]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem("chat_username", username);
      setHasJoined(true);
    }
  };

  const handleConfirmClearAll = () => {
    if (
      window.confirm("Are you sure you want to clear all messages? This cannot be undone.")
    ) {
      clearAllMessages();
    }
  };

  // Check if current user is banned
  const isCurrentUserBanned =
    currentUserId && bannedUsers.has(currentUserId);

  if (!hasJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              🎬 Live Stream Chat
            </h1>
            <p className="text-gray-400">Enter your name to join the chat</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                maxLength={20}
                required
              />
            </div>

            <button
              type="submit"
              disabled={!username.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col lg:flex-row">
      {/* Video Player Section */}
      {showVideo && (
        <div className="lg:w-2/3 bg-black p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">📺 Live Stream</h2>
            <button
              onClick={() => setShowVideo(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              Hide Video
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-4xl">
              <VideoPlayer />
            </div>
          </div>
        </div>
      )}

      {/* Chat Section */}
      <div
        className={`flex-1 flex flex-col ${
          showVideo ? "lg:w-1/3" : "w-full"
        } bg-gray-900`}
      >
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">💬 Live Chat</h1>
              <p className="text-sm text-gray-400">
                Welcome, <span className="text-blue-400">{username}</span>!
              </p>
            </div>
            {!showVideo && (
              <button
                onClick={() => setShowVideo(true)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                Show Video
              </button>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <ConnectionStatus status={connectionStatus} />

        {/* Moderator Panel */}
        <ModeratorPanel
          slowMode={slowMode}
          onToggleSlowMode={toggleSlowMode}
          onClearAll={handleConfirmClearAll}
        />

        {/* Banned User Warning */}
        {isCurrentUserBanned && (
          <div className="bg-red-900/50 border-b border-red-700 p-3 text-center">
            <p className="text-red-200 text-sm font-semibold">
              ⚠️ You have been banned from chatting
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 relative overflow-hidden">
          <MessageList
            messages={messages}
            bannedUsers={bannedUsers}
            currentUserId={currentUserId}
            scrollRef={scrollRef}
            isUserScrolling={isUserScrolling}
            scrollToBottom={scrollToBottom}
            onDeleteMessage={deleteMessage}
            onBanUser={banUser}
          />
        </div>

        {/* Message Input */}
        <MessageInput
          onSendMessage={sendMessage}
          disabled={!connected || isCurrentUserBanned}
          slowMode={slowMode}
        />

        {/* Stats Footer */}
        <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{messages.length} messages</span>
            <span>
              {bannedUsers.size} banned user{bannedUsers.size !== 1 ? "s" : ""}
            </span>
            <span>Max 300 messages in memory</span>
          </div>
        </div>
      </div>
    </div>
  );
}


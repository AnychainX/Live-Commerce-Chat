import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/node";
import { useRoom } from "~/hooks/useRoom";
import { useAutoScroll } from "~/hooks/useAutoScroll";
import { ConnectionStatus } from "~/components/ConnectionStatus";
import { MessageList } from "~/components/MessageList";
import { MessageInput } from "~/components/MessageInput";
import { ModeratorPanel } from "~/components/ModeratorPanel";
import { VideoPlayer } from "~/components/VideoPlayer";
import { HostInfoPanel } from "~/components/HostInfoPanel";

export const meta: MetaFunction = () => {
  return [
    { title: "Live Shopping Room" },
    {
      name: "description",
      content: "Watch live product showcase and shop in real-time",
    },
  ];
};

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const isHost = searchParams.get("host") === "true";
  
  const [username, setUsername] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [showVideo, setShowVideo] = useState(true);

  // Load username from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem("chat_username");
    if (savedUsername) {
      setUsername(savedUsername);
      setHasJoined(true);
    }
  }, []);

  const {
    connectionStatus,
    connected,
    room,
    messages,
    bannedUsers,
    slowMode,
    currentUser,
    viewerCount,
    sendMessage,
    deleteMessage,
    banUser,
    clearAllMessages,
    toggleSlowMode,
    addReaction,
  } = useRoom(roomId || "", username, isHost);

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

  const handleBuyNow = () => {
    const url = room?.shopifyUrl || "https://www.shopify.com";
    window.open(url, "_blank");
  };

  const handleShareRoom = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: room?.name || "Live Shopping Room",
        text: `Join me watching ${room?.productName}!`,
        url: url,
      }).catch(() => {
        // Fallback to copy
        navigator.clipboard.writeText(url);
        alert("Room link copied to clipboard!");
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("Room link copied to clipboard!");
    }
  };

  const isUserHost = currentUser?.role === "host";
  const isCurrentUserBanned =
    !!(currentUser && bannedUsers.has(currentUser.id));

  if (!hasJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              🛍️ Join Live Shopping
            </h1>
            <p className="text-gray-400">Enter your name to join the stream</p>
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
              Join Room
            </button>

            <Link
              to="/"
              className="block text-center text-gray-400 hover:text-white text-sm"
            >
              ← Back to all rooms
            </Link>
          </form>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-gray-400">Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">{room.name}</h1>
              <p className="text-sm text-gray-400">
                Host: {room.hostName} • 👥 {viewerCount} watching
              </p>
            </div>
          </div>

          {isUserHost && (
            <span className="px-3 py-1 bg-purple-600 text-white text-sm font-semibold rounded-full">
              🎬 Host
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Video Section */}
        {showVideo && (
          <div className="lg:w-2/3 bg-black p-4 flex flex-col overflow-hidden">
            {/* Video Player - Smaller Height to Fit Buy Button */}
            <div className="w-full flex-shrink-0" style={{ height: "calc(100% - 250px)" }}>
              <VideoPlayer videoUrl={room.videoUrl} />
            </div>
            
            {/* Product Showcase - Fixed Height, Fills to Bottom */}
            <div className="h-[240px] mt-4 flex-shrink-0 bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-gray-800 rounded-lg p-4 border border-purple-500/30 shadow-xl">
              {/* Product Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  🎁 FEATURED
                </span>
                <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  🔥 LIVE DEAL
                </span>
              </div>

              {/* Product Info */}
              <h3 className="text-xl font-bold text-white mb-1 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                {room.productName}
              </h3>
              <p className="text-gray-300 text-xs mb-3 leading-relaxed">
                {room.productDescription}
              </p>

              {/* Product Stats */}
              <div className="flex items-center gap-3 mb-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                  <span className="text-gray-400">(4.9)</span>
                </div>
                <div className="text-gray-400">
                  👥 {viewerCount} watching
                </div>
              </div>

              {/* Buy Button */}
              <button
                onClick={handleBuyNow}
                className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-bold py-3 rounded-xl transition-all hover:scale-105 hover:shadow-2xl shadow-lg flex items-center justify-center gap-2 text-base relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                <span className="relative text-xl">🛒</span>
                <span className="relative">Shop Now on Shopify</span>
                <span className="relative">→</span>
              </button>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-3 mt-3 text-xs text-gray-400">
                <div className="flex items-center gap-0.5">
                  <span>✓</span>
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <span>✓</span>
                  <span>Fast Ship</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <span>✓</span>
                  <span>Returns</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Section - Fixed Height with Internal Scrolling */}
        <div
          className={`flex-1 ${
            showVideo ? "lg:w-1/3" : "w-full"
          } bg-gray-900 flex flex-col overflow-hidden`}
        >
          {/* Chat Header */}
          <div className="bg-gray-800 border-b border-gray-700 p-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">💬 Live Chat</h2>
              {!showVideo && (
                <button
                  onClick={() => setShowVideo(true)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                >
                  Show Video
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {isUserHost ? "You're the host" : `Chatting as ${username}`}
            </p>
          </div>

          {/* Host Info Panel */}
          <div className="flex-shrink-0">
            <HostInfoPanel
              room={room}
              viewerCount={viewerCount}
              onShare={handleShareRoom}
            />
          </div>

          {/* Connection Status */}
          <div className="flex-shrink-0">
            <ConnectionStatus status={connectionStatus} />
          </div>

          {/* Moderator Panel (Host Only) */}
          {isUserHost && (
            <div className="flex-shrink-0">
              <ModeratorPanel
                slowMode={slowMode}
                onToggleSlowMode={toggleSlowMode}
                onClearAll={handleConfirmClearAll}
              />
            </div>
          )}

          {/* Banned User Warning */}
          {isCurrentUserBanned && (
            <div className="bg-red-900/50 border-b border-red-700 p-3 text-center flex-shrink-0">
              <p className="text-red-200 text-sm font-semibold">
                ⚠️ You have been banned from chatting
              </p>
            </div>
          )}

          {/* Messages - This scrolls, not the whole page */}
          <div className="flex-1 overflow-hidden">
            <MessageList
              messages={messages}
              bannedUsers={bannedUsers}
              currentUserId={currentUser?.id || null}
              scrollRef={scrollRef}
              isUserScrolling={isUserScrolling}
              scrollToBottom={scrollToBottom}
              onDeleteMessage={deleteMessage}
              onBanUser={banUser}
              onReact={addReaction}
              canModerate={isUserHost}
            />
          </div>

          {/* Message Input */}
          <div className="flex-shrink-0">
            <MessageInput
              onSendMessage={sendMessage}
              disabled={!connected || isCurrentUserBanned}
              slowMode={slowMode}
              canSendAnnouncements={isUserHost}
            />
          </div>

          {/* Stats Footer */}
          <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex-shrink-0">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{messages.length} messages</span>
              <span>
                {bannedUsers.size} banned user{bannedUsers.size !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


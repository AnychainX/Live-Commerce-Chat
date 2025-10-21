import { useState, useEffect } from "react";
import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { io, Socket } from "socket.io-client";
import type { Room } from "~/types/chat";

export const meta: MetaFunction = () => {
  return [
    { title: "Live Shopping Rooms - Shopify Live Commerce" },
    {
      name: "description",
      content: "Browse live shopping streams and join product showcases",
    },
  ];
};

const SOCKET_URL = "http://localhost:3001";

export default function Index() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("get_rooms");
    });

    newSocket.on("rooms_list", (roomsList: Room[]) => {
      setRooms(roomsList);
    });

    newSocket.on("room_added", (room: Room) => {
      setRooms((prev) => [...prev, room]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-gray-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🛍️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">LeftLane Marketing</h1>
                <p className="text-sm text-gray-400">Live Shopping Platform</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateRoom(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <span className="text-xl">📹</span>
              <span>Create Room</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-5xl font-bold text-white mb-4">
          Shop Live with Your Favorite Brands
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Watch live product demonstrations, chat with sellers, and buy products in real-time.
          It's like QVC meets Instagram Live! 🎉
        </p>
      </div>

      {/* Rooms Grid */}
      <div className="container mx-auto px-4 pb-20">
        {rooms.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-2xl font-semibold text-white mb-2">No Live Streams Yet</h3>
            <p className="text-gray-400 mb-6">Be the first to create a live shopping room!</p>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Create First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Link
                key={room.id}
                to={`/room/${room.id}`}
                className="group bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500 transition-all hover:scale-105 hover:shadow-2xl"
              >
                {/* Live Badge */}
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
                    <span className="text-6xl">🎬</span>
                  </div>
                  <div className="absolute top-3 left-3 bg-red-600 px-3 py-1 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-white text-sm font-bold">LIVE</span>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-white text-sm">👥 {room.viewerCount}</span>
                  </div>
                </div>

                {/* Room Info */}
                <div className="p-4">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                    {room.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-sm font-semibold">
                      {room.hostName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-300 text-sm">{room.hostName}</span>
                  </div>

                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {room.productDescription}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(room.createdAt)}
                    </span>
                    <span className="text-xs text-purple-400">
                      💬 {room.messageCount} messages
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <CreateRoomModal
          socket={socket}
          onClose={() => setShowCreateRoom(false)}
        />
      )}
    </div>
  );
}

function CreateRoomModal({
  socket,
  onClose,
}: {
  socket: Socket | null;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    productName: "",
    productDescription: "",
    shopifyUrl: "",
    hostName: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket) return;

    socket.emit("create_room", formData);
    socket.once("room_created", (room: Room) => {
      window.location.href = `/room/${room.id}?host=true`;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
          <h2 className="text-2xl font-bold text-white">Create Live Shopping Room</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Room Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Summer Fashion Collection 2024"
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Your Name (Host) *
            </label>
            <input
              type="text"
              required
              value={formData.hostName}
              onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
              placeholder="Your name or brand name"
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="e.g., Designer Handbag Collection"
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Product Description *
            </label>
            <textarea
              required
              value={formData.productDescription}
              onChange={(e) =>
                setFormData({ ...formData, productDescription: e.target.value })
              }
              placeholder="Describe your product and what makes it special..."
              rows={3}
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Shopify Product URL (optional)
            </label>
            <input
              type="url"
              value={formData.shopifyUrl}
              onChange={(e) =>
                setFormData({ ...formData, shopifyUrl: e.target.value })
              }
              placeholder="https://your-store.myshopify.com/products/..."
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use default Shopify homepage
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
            >
              Create Room & Go Live 🎬
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

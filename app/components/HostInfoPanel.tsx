import { useState } from "react";
import type { Room } from "~/types/chat";

interface HostInfoPanelProps {
  room: Room;
  viewerCount: number;
  onShare: () => void;
}

export function HostInfoPanel({ room, viewerCount, onShare }: HostInfoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-800 border-b border-gray-700">
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {room.hostName.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">{room.hostName}</h3>
            <p className="text-xs text-gray-400">👥 {viewerCount} watching</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
          >
            <span>🔗</span>
            <span>Share</span>
          </button>
          <span className="text-gray-400 text-sm">
            {isExpanded ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {/* Expanded Info */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-700 pt-3">
          <div className="space-y-3">
            {/* Stats */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span>⭐</span>
                <span className="text-gray-300">4.9 Rating</span>
              </div>
              <div className="flex items-center gap-1">
                <span>📦</span>
                <span className="text-gray-300">1.2k Sales</span>
              </div>
              <div className="flex items-center gap-1">
                <span>✓</span>
                <span className="text-green-400">Verified Seller</span>
              </div>
            </div>

            {/* About */}
            <div>
              <h4 className="text-xs font-semibold text-white mb-1">About</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Professional seller with high-quality products. Ships worldwide with fast delivery. 
                Join live shows for exclusive deals!
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors">
                📋 More Products
              </button>
              <button className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors">
                ⭐ Follow Seller
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


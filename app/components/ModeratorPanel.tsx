interface ModeratorPanelProps {
  slowMode: {
    enabled: boolean;
    interval: number;
  };
  onToggleSlowMode: (enabled: boolean) => void;
  onClearAll: () => void;
}

export function ModeratorPanel({
  slowMode,
  onToggleSlowMode,
  onClearAll,
}: ModeratorPanelProps) {
  return (
    <div className="bg-gray-800 border-b border-gray-700 p-3">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm font-semibold text-gray-300">
          🛡️ Moderator Controls:
        </span>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={slowMode.enabled}
            onChange={(e) => onToggleSlowMode(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-300">
            Slow Mode ({slowMode.interval / 1000}s)
          </span>
        </label>

        <button
          onClick={onClearAll}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
        >
          Clear All Messages
        </button>

        <div className="ml-auto text-xs text-gray-500">
          Hover over messages to delete or ban users
        </div>
      </div>
    </div>
  );
}


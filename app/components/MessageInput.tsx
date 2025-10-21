import { useState, useRef, useEffect } from "react";

interface MessageInputProps {
  onSendMessage: (text: string, type: "CHAT" | "ANNOUNCEMENT") => void;
  disabled: boolean;
  slowMode: {
    enabled: boolean;
    interval: number;
  };
  canSendAnnouncements?: boolean;
}

export function MessageInput({
  onSendMessage,
  disabled,
  slowMode,
  canSendAnnouncements = true,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLength = 500;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSendMessage(text, isAnnouncement ? "ANNOUNCEMENT" : "CHAT");
      setText("");
      setIsAnnouncement(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const remainingChars = maxLength - text.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="border-t border-gray-700 bg-gray-800 p-4">
      {slowMode.enabled && (
        <div className="mb-2 text-xs text-yellow-400 flex items-center gap-2">
          <span>⏱️</span>
          <span>
            Slow mode: {slowMode.interval / 1000}s between messages
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? "Disconnected..."
                : "Type a message... (Press Enter to send)"
            }
            disabled={disabled}
            className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            rows={3}
            maxLength={maxLength + 50} // Allow typing over to show warning
          />
          <div
            className={`absolute bottom-3 right-3 text-xs ${
              isOverLimit
                ? "text-red-400 font-bold"
                : remainingChars < 50
                ? "text-yellow-400"
                : "text-gray-500"
            }`}
          >
            {remainingChars}
          </div>
        </div>

        <div className="flex items-center justify-between">
          {canSendAnnouncements && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnnouncement}
                onChange={(e) => setIsAnnouncement(e.target.checked)}
                disabled={disabled}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">
                📢 Send as Announcement
              </span>
            </label>
          )}
          {!canSendAnnouncements && <div />}

          <button
            type="submit"
            disabled={disabled || !text.trim() || isOverLimit}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}


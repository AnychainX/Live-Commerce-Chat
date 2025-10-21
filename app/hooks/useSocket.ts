import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { Message, ConnectionStatus, SlowModeConfig } from "~/types/chat";

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  connectionStatus: ConnectionStatus;
  messages: Message[];
  bannedUsers: Set<string>;
  slowMode: SlowModeConfig;
  currentUserId: string | null;
  sendMessage: (text: string, type: "CHAT" | "ANNOUNCEMENT") => void;
  deleteMessage: (messageId: string) => void;
  banUser: (userId: string) => void;
  unbanUser: (userId: string) => void;
  clearAllMessages: () => void;
  toggleSlowMode: (enabled: boolean) => void;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
const MAX_MESSAGES = 300;

export function useSocket(username: string): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [messages, setMessages] = useState<Message[]>([]);
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set());
  const [slowMode, setSlowMode] = useState<SlowModeConfig>({
    enabled: false,
    interval: 10000,
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setConnected(true);
      setConnectionStatus("connected");
      setCurrentUserId(newSocket.id || null);
      newSocket.emit("join", { username });
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setConnected(false);
      setConnectionStatus("disconnected");
    });

    newSocket.on("connect_error", () => {
      setConnectionStatus("reconnecting");
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!newSocket.connected) {
          setConnectionStatus("disconnected");
        }
      }, 5000);
    });

    newSocket.on("reconnecting", () => {
      setConnectionStatus("reconnecting");
    });

    newSocket.on("initial_data", (data: {
      messages: Message[];
      bannedUsers: string[];
      slowMode: SlowModeConfig;
    }) => {
      setMessages(data.messages.slice(-MAX_MESSAGES));
      setBannedUsers(new Set(data.bannedUsers));
      setSlowMode(data.slowMode);
    });

    newSocket.on("new_message", (message: Message) => {
      setMessages((prev) => {
        const updated = [...prev, message];
        return updated.slice(-MAX_MESSAGES);
      });
    });

    newSocket.on("message_deleted", ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, deleted: true } : msg
        )
      );
    });

    newSocket.on("user_banned", ({ userId }: { userId: string }) => {
      setBannedUsers((prev) => new Set(prev).add(userId));
    });

    newSocket.on("user_unbanned", ({ userId }: { userId: string }) => {
      setBannedUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    newSocket.on("messages_cleared", () => {
      setMessages([]);
    });

    newSocket.on("slow_mode_changed", (config: SlowModeConfig) => {
      setSlowMode(config);
    });

    newSocket.on("error", ({ message }: { message: string }) => {
      console.error("Socket error:", message);
      alert(message);
    });

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      newSocket.close();
    };
  }, [username]);

  const sendMessage = useCallback(
    (text: string, type: "CHAT" | "ANNOUNCEMENT") => {
      if (socket && connected && text.trim()) {
        socket.emit("send_message", { text: text.trim(), type, username });
      }
    },
    [socket, connected, username]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (socket && connected) {
        socket.emit("delete_message", { messageId });
      }
    },
    [socket, connected]
  );

  const banUser = useCallback(
    (userId: string) => {
      if (socket && connected) {
        socket.emit("ban_user", { userId });
      }
    },
    [socket, connected]
  );

  const unbanUser = useCallback(
    (userId: string) => {
      if (socket && connected) {
        socket.emit("unban_user", { userId });
      }
    },
    [socket, connected]
  );

  const clearAllMessages = useCallback(() => {
    if (socket && connected) {
      socket.emit("clear_all_messages");
    }
  }, [socket, connected]);

  const toggleSlowMode = useCallback(
    (enabled: boolean) => {
      if (socket && connected) {
        socket.emit("toggle_slow_mode", { enabled });
      }
    },
    [socket, connected]
  );

  return {
    socket,
    connected,
    connectionStatus,
    messages,
    bannedUsers,
    slowMode,
    currentUserId,
    sendMessage,
    deleteMessage,
    banUser,
    unbanUser,
    clearAllMessages,
    toggleSlowMode,
  };
}


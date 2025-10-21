import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { Message, ConnectionStatus, SlowModeConfig, Room, User } from "~/types/chat";

interface UseRoomReturn {
  socket: Socket | null;
  connected: boolean;
  connectionStatus: ConnectionStatus;
  room: Room | null;
  messages: Message[];
  bannedUsers: Set<string>;
  slowMode: SlowModeConfig;
  currentUser: User | null;
  viewerCount: number;
  sendMessage: (text: string, type: "CHAT" | "ANNOUNCEMENT") => void;
  deleteMessage: (messageId: string) => void;
  banUser: (userId: string) => void;
  clearAllMessages: () => void;
  toggleSlowMode: (enabled: boolean) => void;
  addReaction: (messageId: string, emoji: string) => void;
}

const SOCKET_URL = "http://localhost:3001";
const MAX_MESSAGES = 300;

export function useRoom(roomId: string, username: string, isHost: boolean): UseRoomReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set());
  const [slowMode, setSlowMode] = useState<SlowModeConfig>({
    enabled: false,
    interval: 10000,
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
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
      newSocket.emit("join_room", { roomId, username, isHost });
      
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

    newSocket.on("room_joined", (data: {
      room: Room;
      messages: Message[];
      bannedUsers: string[];
      slowMode: SlowModeConfig;
      user: User;
    }) => {
      setRoom(data.room);
      setMessages(data.messages.slice(-MAX_MESSAGES));
      setBannedUsers(new Set(data.bannedUsers));
      setSlowMode(data.slowMode);
      setCurrentUser(data.user);
      setViewerCount(data.room.viewerCount);
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

    newSocket.on("messages_cleared", () => {
      setMessages([]);
    });

    newSocket.on("slow_mode_changed", (config: SlowModeConfig) => {
      setSlowMode(config);
    });

    newSocket.on("viewer_count_updated", (count: number) => {
      setViewerCount(count);
    });

    newSocket.on("reaction_updated", ({ messageId, reactions }: { messageId: string; reactions: any }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, reactions } : msg
        )
      );
    });

    newSocket.on("error", ({ message }: { message: string }) => {
      console.error("Socket error:", message);
      alert(message);
    });

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      newSocket.emit("leave_room", { roomId });
      newSocket.close();
    };
  }, [roomId, username, isHost]);

  const sendMessage = useCallback(
    (text: string, type: "CHAT" | "ANNOUNCEMENT") => {
      if (socket && connected && text.trim()) {
        socket.emit("send_message", { roomId, text: text.trim(), type, username });
      }
    },
    [socket, connected, roomId, username]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (socket && connected) {
        socket.emit("delete_message", { roomId, messageId });
      }
    },
    [socket, connected, roomId]
  );

  const banUser = useCallback(
    (userId: string) => {
      if (socket && connected) {
        socket.emit("ban_user", { roomId, userId });
      }
    },
    [socket, connected, roomId]
  );

  const clearAllMessages = useCallback(() => {
    if (socket && connected) {
      socket.emit("clear_all_messages", { roomId });
    }
  }, [socket, connected, roomId]);

  const toggleSlowMode = useCallback(
    (enabled: boolean) => {
      if (socket && connected) {
        socket.emit("toggle_slow_mode", { roomId, enabled });
      }
    },
    [socket, connected, roomId]
  );

  const addReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (socket && connected) {
        socket.emit("add_reaction", { roomId, messageId, emoji });
      }
    },
    [socket, connected, roomId]
  );

  return {
    socket,
    connected,
    connectionStatus,
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
  };
}


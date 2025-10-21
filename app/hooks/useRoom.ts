/**
 * useRoom Hook
 * 
 * Manages WebSocket connection and state for a single live shopping room.
 * Handles real-time communication, message synchronization, moderation actions,
 * and connection status management.
 * 
 * This is the central hook that connects the UI to the Socket.IO server.
 * It provides:
 * - Real-time message updates
 * - Connection status management with automatic reconnection
 * - User role management (host vs. viewer)
 * - Moderation functions (ban, delete, slow mode)
 * - Emoji reactions
 * - Viewer count tracking
 * 
 * @example
 * ```tsx
 * const {
 *   messages,
 *   sendMessage,
 *   deleteMessage,
 *   connectionStatus
 * } = useRoom("room-123", "Alice", true);
 * ```
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { Message, ConnectionStatus, SlowModeConfig, Room, User } from "~/types/chat";

/**
 * Return type for useRoom hook
 * Provides all state and functions needed to interact with a room
 */
interface UseRoomReturn {
  socket: Socket | null;                                          // Raw Socket.IO connection
  connected: boolean;                                             // Simple connection status
  connectionStatus: ConnectionStatus;                             // Detailed status (connected/reconnecting/disconnected)
  room: Room | null;                                              // Room metadata (product info, host, etc.)
  messages: Message[];                                            // All chat messages (max 300)
  bannedUsers: Set<string>;                                       // Set of banned user IDs
  slowMode: SlowModeConfig;                                       // Slow mode configuration
  currentUser: User | null;                                       // Current user's info (includes role)
  viewerCount: number;                                            // Real-time viewer count
  sendMessage: (text: string, type: "CHAT" | "ANNOUNCEMENT") => void;  // Send a message
  deleteMessage: (messageId: string) => void;                     // Delete a message (host only)
  banUser: (userId: string) => void;                              // Ban a user (host only)
  clearAllMessages: () => void;                                   // Clear all messages (host only)
  toggleSlowMode: (enabled: boolean) => void;                     // Toggle slow mode (host only)
  addReaction: (messageId: string, emoji: string) => void;        // Add emoji reaction
}

// Socket.IO server URL - imported from environment variables
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

// Maximum messages to keep in memory (same as server-side limit)
const MAX_MESSAGES = 300;

/**
 * Custom hook for connecting to and managing a live shopping room
 * 
 * @param roomId - Unique identifier for the room to join
 * @param username - Display name for the current user
 * @param isHost - Whether current user is the room creator/host
 * @returns Object containing room state and interaction functions
 */
export function useRoom(roomId: string, username: string, isHost: boolean): UseRoomReturn {
  // WebSocket connection state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  
  // Room and user state
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set());
  const [slowMode, setSlowMode] = useState<SlowModeConfig>({
    enabled: false,
    interval: 10000, // 10 seconds
  });
  
  // Ref to manage reconnection timeout
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Main effect: Establish WebSocket connection and set up event listeners
   * Runs once on mount and cleans up on unmount
   */
  useEffect(() => {
    // Create Socket.IO connection with auto-reconnection enabled
    const newSocket = io(SOCKET_URL, {
      reconnection: true,          // Enable automatic reconnection
      reconnectionAttempts: 10,    // Try up to 10 times
      reconnectionDelay: 1000,     // Start with 1 second delay
      reconnectionDelayMax: 5000,  // Cap at 5 seconds between attempts
    });

    setSocket(newSocket);

    /**
     * Connection Event: Connected
     * Triggered when Socket.IO successfully connects or reconnects
     */
    newSocket.on("connect", () => {
      console.log("Connected to server");
      setConnected(true);
      setConnectionStatus("connected");
      
      // Immediately join the room after connecting
      newSocket.emit("join_room", { roomId, username, isHost });
      
      // Clear any pending reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    });

    /**
     * Connection Event: Disconnected
     * Triggered when connection is lost (will automatically attempt reconnection)
     */
    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setConnected(false);
      setConnectionStatus("disconnected");
    });

    /**
     * Connection Event: Connection Error
     * Triggered when connection attempt fails
     * Set timeout to update status if reconnection doesn't succeed quickly
     */
    newSocket.on("connect_error", () => {
      setConnectionStatus("reconnecting");
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!newSocket.connected) {
          setConnectionStatus("disconnected");
        }
      }, 5000);
    });

    /**
     * Connection Event: Reconnecting
     * Triggered when Socket.IO is actively attempting to reconnect
     */
    newSocket.on("reconnecting", () => {
      setConnectionStatus("reconnecting");
    });

    /**
     * Room Event: room_joined
     * Received immediately after joining a room
     * Provides complete initial state of the room
     */
    newSocket.on("room_joined", (data: {
      room: Room;
      messages: Message[];
      bannedUsers: string[];
      slowMode: SlowModeConfig;
      user: User;
    }) => {
      setRoom(data.room);
      setMessages(data.messages.slice(-MAX_MESSAGES)); // Cap at MAX_MESSAGES
      setBannedUsers(new Set(data.bannedUsers));
      setSlowMode(data.slowMode);
      setCurrentUser(data.user);
      setViewerCount(data.room.viewerCount);
    });

    /**
     * Chat Event: new_message
     * Received when any user sends a message
     * Automatically caps messages at MAX_MESSAGES (rolling window)
     */
    newSocket.on("new_message", (message: Message) => {
      setMessages((prev) => {
        const updated = [...prev, message];
        // Keep only the latest MAX_MESSAGES
        return updated.slice(-MAX_MESSAGES);
      });
    });

    /**
     * Moderation Event: message_deleted
     * Marks a message as deleted in local state
     */
    newSocket.on("message_deleted", ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, deleted: true } : msg
        )
      );
    });

    /**
     * Moderation Event: user_banned
     * Adds user to banned list, preventing them from chatting
     */
    newSocket.on("user_banned", ({ userId }: { userId: string }) => {
      setBannedUsers((prev) => new Set(prev).add(userId));
    });

    /**
     * Moderation Event: messages_cleared
     * Clears all messages from local state (host action)
     */
    newSocket.on("messages_cleared", () => {
      setMessages([]);
    });

    /**
     * Moderation Event: slow_mode_changed
     * Updates slow mode configuration when host toggles it
     */
    newSocket.on("slow_mode_changed", (config: SlowModeConfig) => {
      setSlowMode(config);
    });

    /**
     * Room Event: viewer_count_updated
     * Updates real-time viewer count when users join/leave
     */
    newSocket.on("viewer_count_updated", (count: number) => {
      setViewerCount(count);
    });

    /**
     * Social Event: reaction_updated
     * Updates emoji reactions on a message in real-time
     */
    newSocket.on("reaction_updated", ({ messageId, reactions }: { messageId: string; reactions: any }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, reactions } : msg
        )
      );
    });

    /**
     * Error Event: error
     * Handles server-side errors (e.g., permission denied, banned user tries to chat)
     */
    newSocket.on("error", ({ message }: { message: string }) => {
      console.error("Socket error:", message);
      alert(message); // Simple alert for demo; in production, use toast notifications
    });

    /**
     * Cleanup function - runs when component unmounts or dependencies change
     * Ensures proper disconnection and cleanup
     */
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Notify server we're leaving the room
      newSocket.emit("leave_room", { roomId });
      // Close the WebSocket connection
      newSocket.close();
    };
  }, [roomId, username, isHost]); // Re-create connection if room/user changes

  /**
   * Action: Send a message
   * Emits a message to the server which broadcasts to all room participants
   * 
   * @param text - Message content
   * @param type - "CHAT" for regular messages, "ANNOUNCEMENT" for pinned host messages
   */
  const sendMessage = useCallback(
    (text: string, type: "CHAT" | "ANNOUNCEMENT") => {
      if (socket && connected && text.trim()) {
        socket.emit("send_message", { roomId, text: text.trim(), type, username });
      }
    },
    [socket, connected, roomId, username]
  );

  /**
   * Action: Delete a message (HOST ONLY)
   * Marks message as deleted for all users
   * 
   * @param messageId - ID of message to delete
   */
  const deleteMessage = useCallback(
    (messageId: string) => {
      if (socket && connected) {
        socket.emit("delete_message", { roomId, messageId });
      }
    },
    [socket, connected, roomId]
  );

  /**
   * Action: Ban a user (HOST ONLY)
   * Prevents user from sending messages (they can still watch stream)
   * 
   * @param userId - Socket ID of user to ban
   */
  const banUser = useCallback(
    (userId: string) => {
      if (socket && connected) {
        socket.emit("ban_user", { roomId, userId });
      }
    },
    [socket, connected, roomId]
  );

  /**
   * Action: Clear all messages (HOST ONLY)
   * Removes all messages from the room chat
   */
  const clearAllMessages = useCallback(() => {
    if (socket && connected) {
      socket.emit("clear_all_messages", { roomId });
    }
  }, [socket, connected, roomId]);

  /**
   * Action: Toggle slow mode (HOST ONLY)
   * Enables/disables message rate limiting for viewers
   * 
   * @param enabled - true to enable slow mode, false to disable
   */
  const toggleSlowMode = useCallback(
    (enabled: boolean) => {
      if (socket && connected) {
        socket.emit("toggle_slow_mode", { roomId, enabled });
      }
    },
    [socket, connected, roomId]
  );

  /**
   * Action: Add emoji reaction
   * Reacts to a message with an emoji (toggle: click again to remove)
   * 
   * @param messageId - ID of message to react to
   * @param emoji - Emoji string (e.g., "❤️", "👍", "🔥")
   */
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


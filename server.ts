/**
 * Socket.IO Server for Live Shopping Platform
 * 
 * This server manages real-time communication for a multi-room live shopping
 * platform similar to QVC meets Instagram Live. Sellers can create rooms,
 * broadcast live video (simulated with HLS streams), and interact with buyers
 * through chat while showcasing products.
 * 
 * Key Features:
 * - Multi-room support with isolated chat contexts
 * - Role-based permissions (hosts/sellers vs. viewers/buyers)
 * - Real-time chat with moderation tools
 * - Emoji reactions for quick engagement
 * - In-memory data storage (suitable for demo/testing)
 */

import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { Socket } from "socket.io";

/**
 * Message Interface
 * Represents a single chat message in a room
 * 
 * @property id - Unique message identifier (format: socketId-timestamp)
 * @property userId - Socket ID of the user who sent the message
 * @property username - Display name of the message sender
 * @property text - Message content (max 500 characters)
 * @property type - Message type: "CHAT" for regular messages, "ANNOUNCEMENT" for pinned host messages
 * @property timestamp - Unix timestamp when message was sent
 * @property deleted - Flag indicating if message was deleted by moderator
 * @property reactions - Object mapping emoji strings to arrays of user IDs who reacted
 */
interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  type: "CHAT" | "ANNOUNCEMENT";
  timestamp: number;
  deleted: boolean;
  reactions?: { [emoji: string]: string[] };
}

/**
 * User Interface
 * Represents a connected user in a specific room
 * 
 * @property id - Socket ID (unique per connection)
 * @property username - Display name chosen by user
 * @property banned - Whether user is banned from chatting in this room
 * @property lastMessageTime - Timestamp of last message (used for slow mode enforcement)
 * @property role - "host" (room creator/seller with moderation powers) or "viewer" (buyer/customer)
 */
interface User {
  id: string;
  username: string;
  banned: boolean;
  lastMessageTime: number;
  role: "host" | "viewer";
}

/**
 * Room Interface
 * Represents a live shopping room with product information
 * 
 * @property id - Unique room identifier (format: room-timestamp-random)
 * @property name - Room display name (e.g., "Summer Fashion Collection")
 * @property productName - Featured product name
 * @property productDescription - Product details and selling points
 * @property shopifyUrl - Link to product page on Shopify (defaults to shopify.com homepage)
 * @property hostId - Socket ID of the room creator/host
 * @property hostName - Display name of the seller/host
 * @property videoUrl - HLS stream URL (NOTE: This is a TEMPLATE/DEMO URL. In production, 
 *                      sellers would provide their own live stream URL from a service like Mux)
 * @property createdAt - Unix timestamp when room was created
 * @property viewerCount - Current number of connected users in room
 * @property messageCount - Total messages sent in this room (lifetime counter)
 */
interface Room {
  id: string;
  name: string;
  productName: string;
  productDescription: string;
  shopifyUrl: string;
  hostId: string;
  hostName: string;
  videoUrl: string;  // TEMPLATE: In production, this would be a real live stream from the seller
  createdAt: number;
  viewerCount: number;
  messageCount: number;
}

/**
 * RoomData Interface
 * Complete server-side state for a single room
 * Combines room metadata with chat state and moderation settings
 * 
 * @property room - Public room information
 * @property messages - Array of chat messages (capped at MAX_MESSAGES)
 * @property users - Map of connected users by their socket ID
 * @property bannedUsers - Set of banned user socket IDs
 * @property slowModeEnabled - Whether slow mode is active
 * @property slowModeInterval - Milliseconds users must wait between messages (default: 10000ms = 10s)
 */
interface RoomData {
  room: Room;
  messages: Message[];
  users: Map<string, User>;
  bannedUsers: Set<string>;
  slowModeEnabled: boolean;
  slowModeInterval: number;
}

/**
 * In-Memory Database
 * Stores all room data in memory. This is suitable for demos and testing.
 * 
 * PRODUCTION NOTE: For production use, replace with a persistent database like:
 * - PostgreSQL (with pg library) for relational data
 * - MongoDB for flexible document storage
 * - Redis for fast key-value storage with pub/sub
 * 
 * Current limitations:
 * - Data lost on server restart
 * - Not scalable across multiple server instances
 * - No data persistence or backup
 */
const db: {
  rooms: Map<string, RoomData>;
} = {
  rooms: new Map(),
};

/**
 * Maximum messages to keep in memory per room
 * Older messages are automatically removed when this limit is exceeded
 * This prevents memory issues during long-running streams
 */
const MAX_MESSAGES = 300;

/**
 * Create a new live shopping room
 * Initializes room with empty chat state and default moderation settings
 * 
 * @param roomInfo - Room metadata (without computed fields)
 * @returns Created room object with all fields populated
 */
function createRoom(roomInfo: Omit<Room, "viewerCount" | "messageCount">): Room {
  const room: Room = {
    ...roomInfo,
    viewerCount: 0,
    messageCount: 0,
  };
  
  // Initialize room state with default moderation settings
  const roomData: RoomData = {
    room,
    messages: [],
    users: new Map(),
    bannedUsers: new Set(),
    slowModeEnabled: false,
    slowModeInterval: 10000, // 10 seconds between messages in slow mode
  };
  
  db.rooms.set(room.id, roomData);
  return room;
}

/**
 * Get room data by ID
 * @param roomId - Unique room identifier
 * @returns Room data if found, undefined otherwise
 */
function getRoomData(roomId: string): RoomData | undefined {
  return db.rooms.get(roomId);
}

/**
 * Get all active rooms
 * Used for displaying the room list in the main lobby
 * @returns Array of all room objects (metadata only, no messages)
 */
function getAllRooms(): Room[] {
  return Array.from(db.rooms.values()).map((data) => data.room);
}

/**
 * Add a message to a room's chat history
 * Automatically enforces MAX_MESSAGES limit by removing oldest messages
 * 
 * @param roomId - Target room ID
 * @param message - Message object to add
 */
function addMessage(roomId: string, message: Message) {
  const roomData = getRoomData(roomId);
  if (!roomData) return;
  
  roomData.messages.push(message);
  roomData.room.messageCount++;
  
  // Keep only the latest MAX_MESSAGES messages to prevent memory issues
  if (roomData.messages.length > MAX_MESSAGES) {
    roomData.messages = roomData.messages.slice(-MAX_MESSAGES);
  }
}

/**
 * Create and configure Socket.IO server
 * Sets up all real-time event handlers for the live shopping platform
 * 
 * @param httpServer - HTTP server instance to attach Socket.IO to
 * @returns Configured Socket.IO server instance
 */
export function createSocketServer(httpServer: ReturnType<typeof createServer>) {
  // Initialize Socket.IO with CORS enabled for local development
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // PRODUCTION NOTE: Restrict this to your actual domain(s)
      methods: ["GET", "POST"],
    },
  });

  /**
   * Main connection handler
   * Triggered when any client connects to the server
   * Sets up all event listeners for this connection
   */
  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    /**
     * EVENT: get_rooms
     * Fetches list of all active rooms for the lobby page
     * Response: rooms_list with array of Room objects
     */
    socket.on("get_rooms", () => {
      const rooms = getAllRooms();
      socket.emit("rooms_list", rooms);
    });

    /**
     * EVENT: create_room
     * Creates a new live shopping room
     * Only the creator becomes the host with full moderation powers
     * 
     * Params:
     * - name: Room title (e.g., "Summer Fashion Show")
     * - productName: Featured product name
     * - productDescription: Product details
     * - shopifyUrl: Link to Shopify product page
     * - hostName: Seller's display name
     * - videoUrl: HLS stream URL (optional, uses default demo stream)
     * 
     * NOTE: videoUrl is a TEMPLATE in this demo. In production, sellers would:
     * 1. Start a live stream using a service like Mux, AWS IVS, or similar
     * 2. Receive an HLS playback URL from that service
     * 3. Provide that URL when creating the room
     * 
     * Responses:
     * - room_created: Sent to creator with new room details
     * - room_added: Broadcast to all clients to update lobby
     */
    socket.on(
      "create_room",
      ({
        name,
        productName,
        productDescription,
        shopifyUrl,
        hostName,
        videoUrl,
      }: {
        name: string;
        productName: string;
        productDescription: string;
        shopifyUrl: string;
        hostName: string;
        videoUrl?: string;
      }) => {
        // Generate unique room ID using timestamp and random string
        const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const room = createRoom({
          id: roomId,
          name,
          productName,
          productDescription,
          shopifyUrl: shopifyUrl || "https://www.shopify.com",
          hostId: socket.id,
          hostName,
          // Default to a demo HLS stream for testing purposes
          // PRODUCTION: Replace with actual live stream URL from seller's streaming service
          videoUrl: videoUrl || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
          createdAt: Date.now(),
        });
        
        // Notify creator
        socket.emit("room_created", room);
        // Notify all users to update lobby list
        io.emit("room_added", room);
      }
    );

    /**
     * EVENT: join_room
     * User joins an existing room as either host or viewer
     * 
     * Params:
     * - roomId: Target room identifier
     * - username: User's chosen display name
     * - isHost: Whether user is the room creator (defaults to false)
     * 
     * Response: room_joined with:
     * - room: Room metadata
     * - messages: All existing messages (up to MAX_MESSAGES)
     * - bannedUsers: List of banned user IDs
     * - slowMode: Current slow mode configuration
     * - user: The user's own User object with role assignment
     * 
     * Broadcast: viewer_count_updated to all users in room
     */
    socket.on(
      "join_room",
      ({ roomId, username, isHost }: { roomId: string; username: string; isHost?: boolean }) => {
        const roomData = getRoomData(roomId);
        if (!roomData) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Add socket to the room for targeted broadcasts
        socket.join(roomId);
        
        // Create user object with role-based permissions
        const user: User = {
          id: socket.id,
          username,
          banned: roomData.bannedUsers.has(socket.id), // Check if previously banned
          lastMessageTime: 0,
          role: isHost ? "host" : "viewer", // Host gets moderation powers
        };
        
        roomData.users.set(socket.id, user);
        roomData.room.viewerCount = roomData.users.size;

        // Send complete room state to the joining user
        socket.emit("room_joined", {
          room: roomData.room,
          messages: roomData.messages,
          bannedUsers: Array.from(roomData.bannedUsers),
          slowMode: {
            enabled: roomData.slowModeEnabled,
            interval: roomData.slowModeInterval,
          },
          user,
        });

        // Update viewer count for all users in the room
        io.to(roomId).emit("viewer_count_updated", roomData.room.viewerCount);
      }
    );

    /**
     * EVENT: send_message
     * User sends a chat message in a room
     * 
     * Params:
     * - roomId: Target room ID
     * - text: Message content (will be truncated to 500 chars)
     * - type: "CHAT" for regular messages, "ANNOUNCEMENT" for pinned host messages
     * - username: Sender's display name
     * 
     * Validation:
     * - Banned users cannot send messages
     * - Only hosts can send announcements
     * - Slow mode enforced for non-host users (if enabled)
     * 
     * Broadcast: new_message to all users in room
     */
    socket.on(
      "send_message",
      ({
        roomId,
        text,
        type,
        username,
      }: {
        roomId: string;
        text: string;
        type: "CHAT" | "ANNOUNCEMENT";
        username: string;
      }) => {
        const roomData = getRoomData(roomId);
        if (!roomData) return;

        const user = roomData.users.get(socket.id);
        if (!user) return;

        // VALIDATION 1: Check if user is banned
        if (user.banned || roomData.bannedUsers.has(socket.id)) {
          socket.emit("error", { message: "You are banned from chatting" });
          return;
        }

        // VALIDATION 2: Only hosts can send announcements (pinned messages)
        if (type === "ANNOUNCEMENT" && user.role !== "host") {
          socket.emit("error", { message: "Only the host can send announcements" });
          return;
        }

        // VALIDATION 3: Enforce slow mode for viewers (not hosts)
        if (roomData.slowModeEnabled && user.role !== "host") {
          const now = Date.now();
          const timeSinceLastMessage = now - user.lastMessageTime;
          if (
            user.lastMessageTime > 0 &&
            timeSinceLastMessage < roomData.slowModeInterval
          ) {
            const waitTime = Math.ceil(
              (roomData.slowModeInterval - timeSinceLastMessage) / 1000
            );
            socket.emit("error", {
              message: `Slow mode: wait ${waitTime}s before sending another message`,
            });
            return;
          }
          user.lastMessageTime = now;
        }

        // Create message object with unique ID
        const message: Message = {
          id: `${socket.id}-${Date.now()}`, // Unique ID: socketId-timestamp
          userId: socket.id,
          username: user.username,
          text: text.slice(0, 500), // Enforce 500 character limit
          type,
          timestamp: Date.now(),
          deleted: false,
          reactions: {}, // Initialize empty reactions object
        };

        addMessage(roomId, message);
        // Broadcast to all users in the room
        io.to(roomId).emit("new_message", message);
      }
    );

    /**
     * EVENT: delete_message (HOST ONLY)
     * Marks a message as deleted (soft delete)
     * Message remains in history but displays as "[Message deleted]"
     * 
     * Params:
     * - roomId: Target room ID
     * - messageId: ID of message to delete
     * 
     * Authorization: Only room hosts can delete messages
     * Broadcast: message_deleted to all users in room
     */
    socket.on(
      "delete_message",
      ({ roomId, messageId }: { roomId: string; messageId: string }) => {
        const roomData = getRoomData(roomId);
        if (!roomData) return;

        // Check if requester is the host
        const user = roomData.users.get(socket.id);
        if (!user || user.role !== "host") {
          socket.emit("error", { message: "Only the host can delete messages" });
          return;
        }

        // Find and mark message as deleted
        const message = roomData.messages.find((m) => m.id === messageId);
        if (message) {
          message.deleted = true;
          io.to(roomId).emit("message_deleted", { messageId });
        }
      }
    );

    /**
     * EVENT: ban_user (HOST ONLY)
     * Permanently bans a user from chatting in this room
     * Banned users can still watch the stream but cannot send messages
     * 
     * Params:
     * - roomId: Target room ID
     * - userId: Socket ID of user to ban
     * 
     * Authorization: Only room hosts can ban users
     * Broadcast: user_banned to all users in room
     */
    socket.on(
      "ban_user",
      ({ roomId, userId }: { roomId: string; userId: string }) => {
        const roomData = getRoomData(roomId);
        if (!roomData) return;

        // Check if requester is the host
        const user = roomData.users.get(socket.id);
        if (!user || user.role !== "host") {
          socket.emit("error", { message: "Only the host can ban users" });
          return;
        }

        // Add to banned list and update user object
        roomData.bannedUsers.add(userId);
        const bannedUser = roomData.users.get(userId);
        if (bannedUser) {
          bannedUser.banned = true;
        }
        io.to(roomId).emit("user_banned", { userId });
      }
    );

    /**
     * EVENT: clear_all_messages (HOST ONLY)
     * Removes all messages from the room
     * Useful for resetting chat during stream intermissions
     * 
     * Params:
     * - roomId: Target room ID
     * 
     * Authorization: Only room hosts can clear all messages
     * Broadcast: messages_cleared to all users in room
     */
    socket.on("clear_all_messages", ({ roomId }: { roomId: string }) => {
      const roomData = getRoomData(roomId);
      if (!roomData) return;

      // Check if requester is the host
      const user = roomData.users.get(socket.id);
      if (!user || user.role !== "host") {
        socket.emit("error", { message: "Only the host can clear messages" });
        return;
      }

      // Clear all messages
      roomData.messages = [];
      io.to(roomId).emit("messages_cleared");
    });

    /**
     * EVENT: toggle_slow_mode (HOST ONLY)
     * Enables/disables slow mode for the room
     * When enabled, viewers can only send 1 message per 10 seconds
     * Hosts are exempt from slow mode restrictions
     * 
     * Params:
     * - roomId: Target room ID
     * - enabled: true to enable, false to disable
     * 
     * Authorization: Only room hosts can toggle slow mode
     * Broadcast: slow_mode_changed to all users in room
     */
    socket.on(
      "toggle_slow_mode",
      ({ roomId, enabled }: { roomId: string; enabled: boolean }) => {
        const roomData = getRoomData(roomId);
        if (!roomData) return;

        // Check if requester is the host
        const user = roomData.users.get(socket.id);
        if (!user || user.role !== "host") {
          socket.emit("error", { message: "Only the host can toggle slow mode" });
          return;
        }

        // Update slow mode setting
        roomData.slowModeEnabled = enabled;
        io.to(roomId).emit("slow_mode_changed", {
          enabled,
          interval: roomData.slowModeInterval,
        });
      }
    );

    /**
     * EVENT: leave_room
     * User explicitly leaves a room
     * Updates viewer count and removes user from room state
     * 
     * Params:
     * - roomId: Room to leave
     * 
     * Broadcast: viewer_count_updated to remaining users
     */
    socket.on("leave_room", ({ roomId }: { roomId: string }) => {
      const roomData = getRoomData(roomId);
      if (roomData) {
        roomData.users.delete(socket.id);
        roomData.room.viewerCount = roomData.users.size;
        socket.leave(roomId); // Remove from Socket.IO room
        io.to(roomId).emit("viewer_count_updated", roomData.room.viewerCount);
      }
    });

    /**
     * EVENT: add_reaction
     * User reacts to a message with an emoji
     * Clicking the same emoji again removes the reaction (toggle behavior)
     * 
     * Params:
     * - roomId: Target room ID
     * - messageId: ID of message to react to
     * - emoji: Emoji string (e.g., "❤️", "👍", "🔥")
     * 
     * Behavior:
     * - First click: Adds reaction
     * - Second click: Removes reaction
     * - Each user can only react once per emoji per message
     * 
     * Broadcast: reaction_updated to all users in room
     */
    socket.on(
      "add_reaction",
      ({ roomId, messageId, emoji }: { roomId: string; messageId: string; emoji: string }) => {
        const roomData = getRoomData(roomId);
        if (!roomData) return;

        const message = roomData.messages.find((m) => m.id === messageId);
        if (message) {
          // Initialize reactions if needed
          if (!message.reactions) message.reactions = {};
          if (!message.reactions[emoji]) message.reactions[emoji] = [];
          
          // Toggle reaction: add if not present, remove if already present
          const userIndex = message.reactions[emoji].indexOf(socket.id);
          if (userIndex === -1) {
            // Add reaction
            message.reactions[emoji].push(socket.id);
          } else {
            // Remove reaction
            message.reactions[emoji].splice(userIndex, 1);
            // Clean up empty emoji arrays
            if (message.reactions[emoji].length === 0) {
              delete message.reactions[emoji];
            }
          }
          
          // Broadcast updated reactions to all users
          io.to(roomId).emit("reaction_updated", { messageId, reactions: message.reactions });
        }
      }
    );

    /**
     * EVENT: disconnect
     * Triggered when client connection is lost
     * Removes user from all rooms they were in and updates viewer counts
     * 
     * This is automatically triggered by Socket.IO when:
     * - User closes browser/tab
     * - Network connection lost
     * - Client explicitly disconnects
     */
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      
      // Clean up user from all rooms they might be in
      db.rooms.forEach((roomData, roomId) => {
        if (roomData.users.has(socket.id)) {
          roomData.users.delete(socket.id);
          roomData.room.viewerCount = roomData.users.size;
          // Notify remaining users of updated count
          io.to(roomId).emit("viewer_count_updated", roomData.room.viewerCount);
        }
      });
    });
  });

  return io;
}

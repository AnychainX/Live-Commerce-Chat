import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { Socket } from "socket.io";

// In-memory database
interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  type: "CHAT" | "ANNOUNCEMENT";
  timestamp: number;
  deleted: boolean;
}

interface User {
  id: string;
  username: string;
  banned: boolean;
  lastMessageTime: number;
  role: "host" | "viewer";
}

interface Room {
  id: string;
  name: string;
  productName: string;
  productDescription: string;
  shopifyUrl: string;
  hostId: string;
  hostName: string;
  videoUrl: string;
  createdAt: number;
  viewerCount: number;
  messageCount: number;
}

interface RoomData {
  room: Room;
  messages: Message[];
  users: Map<string, User>;
  bannedUsers: Set<string>;
  slowModeEnabled: boolean;
  slowModeInterval: number;
}

const db: {
  rooms: Map<string, RoomData>;
} = {
  rooms: new Map(),
};

const MAX_MESSAGES = 300;

function createRoom(roomInfo: Omit<Room, "viewerCount" | "messageCount">): Room {
  const room: Room = {
    ...roomInfo,
    viewerCount: 0,
    messageCount: 0,
  };
  
  const roomData: RoomData = {
    room,
    messages: [],
    users: new Map(),
    bannedUsers: new Set(),
    slowModeEnabled: false,
    slowModeInterval: 10000,
  };
  
  db.rooms.set(room.id, roomData);
  return room;
}

function getRoomData(roomId: string): RoomData | undefined {
  return db.rooms.get(roomId);
}

function getAllRooms(): Room[] {
  return Array.from(db.rooms.values()).map((data) => data.room);
}

function addMessage(roomId: string, message: Message) {
  const roomData = getRoomData(roomId);
  if (!roomData) return;
  
  roomData.messages.push(message);
  roomData.room.messageCount++;
  
  if (roomData.messages.length > MAX_MESSAGES) {
    roomData.messages = roomData.messages.slice(-MAX_MESSAGES);
  }
}

export function createSocketServer(httpServer: ReturnType<typeof createServer>) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Handle room listing (non-Socket.IO endpoint simulation)
  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    // Get all rooms
    socket.on("get_rooms", () => {
      const rooms = getAllRooms();
      socket.emit("rooms_list", rooms);
    });

    // Create new room
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
        const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const room = createRoom({
          id: roomId,
          name,
          productName,
          productDescription,
          shopifyUrl: shopifyUrl || "https://www.shopify.com",
          hostId: socket.id,
          hostName,
          videoUrl: videoUrl || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
          createdAt: Date.now(),
        });
        
        socket.emit("room_created", room);
        io.emit("room_added", room);
      }
    );

    // Join room
    socket.on(
      "join_room",
      ({ roomId, username, isHost }: { roomId: string; username: string; isHost?: boolean }) => {
        const roomData = getRoomData(roomId);
        if (!roomData) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        socket.join(roomId);
        
        const user: User = {
          id: socket.id,
          username,
          banned: roomData.bannedUsers.has(socket.id),
          lastMessageTime: 0,
          role: isHost ? "host" : "viewer",
        };
        
        roomData.users.set(socket.id, user);
        roomData.room.viewerCount = roomData.users.size;

        // Send initial data to the joining user
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

        // Notify room about viewer count
        io.to(roomId).emit("viewer_count_updated", roomData.room.viewerCount);
      }
    );

    // Send message
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

        // Check if user is banned
        if (user.banned || roomData.bannedUsers.has(socket.id)) {
          socket.emit("error", { message: "You are banned from chatting" });
          return;
        }

        // Only host can send announcements
        if (type === "ANNOUNCEMENT" && user.role !== "host") {
          socket.emit("error", { message: "Only the host can send announcements" });
          return;
        }

        // Check slow mode
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

        const message: Message = {
          id: `${socket.id}-${Date.now()}`,
          userId: socket.id,
          username: user.username,
          text: text.slice(0, 500),
          type,
          timestamp: Date.now(),
          deleted: false,
        };

        addMessage(roomId, message);
        io.to(roomId).emit("new_message", message);
      }
    );

    // Delete message (host only)
    socket.on(
      "delete_message",
      ({ roomId, messageId }: { roomId: string; messageId: string }) => {
        const roomData = getRoomData(roomId);
        if (!roomData) return;

        const user = roomData.users.get(socket.id);
        if (!user || user.role !== "host") {
          socket.emit("error", { message: "Only the host can delete messages" });
          return;
        }

        const message = roomData.messages.find((m) => m.id === messageId);
        if (message) {
          message.deleted = true;
          io.to(roomId).emit("message_deleted", { messageId });
        }
      }
    );

    // Ban user (host only)
    socket.on(
      "ban_user",
      ({ roomId, userId }: { roomId: string; userId: string }) => {
        const roomData = getRoomData(roomId);
        if (!roomData) return;

        const user = roomData.users.get(socket.id);
        if (!user || user.role !== "host") {
          socket.emit("error", { message: "Only the host can ban users" });
          return;
        }

        roomData.bannedUsers.add(userId);
        const bannedUser = roomData.users.get(userId);
        if (bannedUser) {
          bannedUser.banned = true;
        }
        io.to(roomId).emit("user_banned", { userId });
      }
    );

    // Clear all messages (host only)
    socket.on("clear_all_messages", ({ roomId }: { roomId: string }) => {
      const roomData = getRoomData(roomId);
      if (!roomData) return;

      const user = roomData.users.get(socket.id);
      if (!user || user.role !== "host") {
        socket.emit("error", { message: "Only the host can clear messages" });
        return;
      }

      roomData.messages = [];
      io.to(roomId).emit("messages_cleared");
    });

    // Toggle slow mode (host only)
    socket.on(
      "toggle_slow_mode",
      ({ roomId, enabled }: { roomId: string; enabled: boolean }) => {
        const roomData = getRoomData(roomId);
        if (!roomData) return;

        const user = roomData.users.get(socket.id);
        if (!user || user.role !== "host") {
          socket.emit("error", { message: "Only the host can toggle slow mode" });
          return;
        }

        roomData.slowModeEnabled = enabled;
        io.to(roomId).emit("slow_mode_changed", {
          enabled,
          interval: roomData.slowModeInterval,
        });
      }
    );

    // Leave room
    socket.on("leave_room", ({ roomId }: { roomId: string }) => {
      const roomData = getRoomData(roomId);
      if (roomData) {
        roomData.users.delete(socket.id);
        roomData.room.viewerCount = roomData.users.size;
        socket.leave(roomId);
        io.to(roomId).emit("viewer_count_updated", roomData.room.viewerCount);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      
      // Update viewer counts for all rooms
      db.rooms.forEach((roomData, roomId) => {
        if (roomData.users.has(socket.id)) {
          roomData.users.delete(socket.id);
          roomData.room.viewerCount = roomData.users.size;
          io.to(roomId).emit("viewer_count_updated", roomData.room.viewerCount);
        }
      });
    });
  });

  return io;
}

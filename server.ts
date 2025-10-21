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
}

interface AppData {
  messages: Message[];
  users: Map<string, User>;
  bannedUsers: Set<string>;
  slowModeEnabled: boolean;
  slowModeInterval: number; // in milliseconds
}

const db: AppData = {
  messages: [],
  users: new Map(),
  bannedUsers: new Set(),
  slowModeEnabled: false,
  slowModeInterval: 10000, // 10 seconds
};

// Keep only last 300 messages
const MAX_MESSAGES = 300;

function addMessage(message: Message) {
  db.messages.push(message);
  if (db.messages.length > MAX_MESSAGES) {
    db.messages = db.messages.slice(-MAX_MESSAGES);
  }
}

function getUser(userId: string): User | undefined {
  return db.users.get(userId);
}

function createUser(userId: string, username: string): User {
  const user: User = {
    id: userId,
    username,
    banned: db.bannedUsers.has(userId),
    lastMessageTime: 0,
  };
  db.users.set(userId, user);
  return user;
}

export function createSocketServer(httpServer: ReturnType<typeof createServer>) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    // Send initial data
    socket.emit("initial_data", {
      messages: db.messages,
      bannedUsers: Array.from(db.bannedUsers),
      slowMode: {
        enabled: db.slowModeEnabled,
        interval: db.slowModeInterval,
      },
    });

    // Handle user join
    socket.on("join", ({ username }: { username: string }) => {
      let user = getUser(socket.id);
      if (!user) {
        user = createUser(socket.id, username);
      }
      socket.emit("user_joined", { userId: socket.id, user });
    });

    // Handle new message
    socket.on(
      "send_message",
      ({
        text,
        type,
        username,
      }: {
        text: string;
        type: "CHAT" | "ANNOUNCEMENT";
        username: string;
      }) => {
        const user = getUser(socket.id) || createUser(socket.id, username);

        // Check if user is banned
        if (user.banned || db.bannedUsers.has(socket.id)) {
          socket.emit("error", { message: "You are banned from chatting" });
          return;
        }

        // Check slow mode
        if (db.slowModeEnabled) {
          const now = Date.now();
          const timeSinceLastMessage = now - user.lastMessageTime;
          if (
            user.lastMessageTime > 0 &&
            timeSinceLastMessage < db.slowModeInterval
          ) {
            const waitTime = Math.ceil(
              (db.slowModeInterval - timeSinceLastMessage) / 1000
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
          text: text.slice(0, 500), // Enforce 500 char limit
          type,
          timestamp: Date.now(),
          deleted: false,
        };

        addMessage(message);
        io.emit("new_message", message);
      }
    );

    // Handle delete message
    socket.on("delete_message", ({ messageId }: { messageId: string }) => {
      const message = db.messages.find((m) => m.id === messageId);
      if (message) {
        message.deleted = true;
        io.emit("message_deleted", { messageId });
      }
    });

    // Handle ban user
    socket.on("ban_user", ({ userId }: { userId: string }) => {
      db.bannedUsers.add(userId);
      const user = getUser(userId);
      if (user) {
        user.banned = true;
      }
      io.emit("user_banned", { userId });
    });

    // Handle unban user
    socket.on("unban_user", ({ userId }: { userId: string }) => {
      db.bannedUsers.delete(userId);
      const user = getUser(userId);
      if (user) {
        user.banned = false;
      }
      io.emit("user_unbanned", { userId });
    });

    // Handle clear all messages
    socket.on("clear_all_messages", () => {
      db.messages = [];
      io.emit("messages_cleared");
    });

    // Handle slow mode toggle
    socket.on(
      "toggle_slow_mode",
      ({ enabled }: { enabled: boolean }) => {
        db.slowModeEnabled = enabled;
        io.emit("slow_mode_changed", {
          enabled,
          interval: db.slowModeInterval,
        });
      }
    );

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}


export interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  type: "CHAT" | "ANNOUNCEMENT";
  timestamp: number;
  deleted: boolean;
  reactions?: { [emoji: string]: string[] }; // emoji -> array of userIds
}

export interface User {
  id: string;
  username: string;
  banned: boolean;
  lastMessageTime: number;
  role: "host" | "viewer";
}

export interface Room {
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

export type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

export interface SlowModeConfig {
  enabled: boolean;
  interval: number;
}

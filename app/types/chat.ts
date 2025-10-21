export interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  type: "CHAT" | "ANNOUNCEMENT";
  timestamp: number;
  deleted: boolean;
}

export interface User {
  id: string;
  username: string;
  banned: boolean;
  lastMessageTime: number;
}

export type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

export interface SlowModeConfig {
  enabled: boolean;
  interval: number;
}


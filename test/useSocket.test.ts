import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSocket } from "../app/hooks/useSocket";
import { io } from "socket.io-client";

describe("useSocket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should connect to socket server and emit join event", async () => {
    const mockSocket = io();
    const { result } = renderHook(() => useSocket("TestUser"));

    await waitFor(() => {
      expect(io).toHaveBeenCalledWith(
        "http://localhost:3001",
        expect.objectContaining({
          reconnection: true,
          reconnectionAttempts: 10,
        })
      );
    });

    expect(mockSocket.on).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(
      "initial_data",
      expect.any(Function)
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      "new_message",
      expect.any(Function)
    );
  });

  it("should send messages through socket", async () => {
    const mockSocket = io();
    const { result } = renderHook(() => useSocket("TestUser"));

    await waitFor(() => {
      expect(result.current.socket).toBeTruthy();
    });

    result.current.sendMessage("Hello, World!", "CHAT");

    expect(mockSocket.emit).toHaveBeenCalledWith("send_message", {
      text: "Hello, World!",
      type: "CHAT",
      username: "TestUser",
    });
  });

  it("should handle message deletion", async () => {
    const mockSocket = io();
    const { result } = renderHook(() => useSocket("TestUser"));

    await waitFor(() => {
      expect(result.current.socket).toBeTruthy();
    });

    result.current.deleteMessage("message-123");

    expect(mockSocket.emit).toHaveBeenCalledWith("delete_message", {
      messageId: "message-123",
    });
  });

  it("should handle user ban", async () => {
    const mockSocket = io();
    const { result } = renderHook(() => useSocket("TestUser"));

    await waitFor(() => {
      expect(result.current.socket).toBeTruthy();
    });

    result.current.banUser("user-456");

    expect(mockSocket.emit).toHaveBeenCalledWith("ban_user", {
      userId: "user-456",
    });
  });

  it("should track connection status", async () => {
    const { result } = renderHook(() => useSocket("TestUser"));

    expect(result.current.connectionStatus).toBe("disconnected");

    await waitFor(() => {
      expect(result.current.socket).toBeTruthy();
    });
  });

  it("should handle reconnection attempts", async () => {
    const mockSocket = io();
    const { result } = renderHook(() => useSocket("TestUser"));

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith(
        "connect_error",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "reconnecting",
        expect.any(Function)
      );
    });
  });

  it("should clean up socket on unmount", async () => {
    const mockSocket = io();
    const { result, unmount } = renderHook(() => useSocket("TestUser"));

    await waitFor(() => {
      expect(result.current.socket).toBeTruthy();
    });

    unmount();

    expect(mockSocket.close).toHaveBeenCalled();
  });
});


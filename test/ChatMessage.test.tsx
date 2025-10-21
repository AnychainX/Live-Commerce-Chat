import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChatMessage } from "../app/components/ChatMessage";
import type { Message } from "../app/types/chat";

describe("ChatMessage", () => {
  const mockMessage: Message = {
    id: "msg-1",
    userId: "user-123",
    username: "TestUser",
    text: "Hello, this is a test message!",
    type: "CHAT",
    timestamp: Date.now(),
    deleted: false,
  };

  const mockOnDelete = vi.fn();
  const mockOnBan = vi.fn();

  it("should render message content", () => {
    render(
      <ChatMessage
        message={mockMessage}
        isBanned={false}
        isCurrentUser={false}
        onDelete={mockOnDelete}
        onBan={mockOnBan}
      />
    );

    expect(screen.getByText("TestUser")).toBeInTheDocument();
    expect(
      screen.getByText("Hello, this is a test message!")
    ).toBeInTheDocument();
  });

  it("should show deleted message text", () => {
    const deletedMessage = { ...mockMessage, deleted: true };
    render(
      <ChatMessage
        message={deletedMessage}
        isBanned={false}
        isCurrentUser={false}
        onDelete={mockOnDelete}
        onBan={mockOnBan}
      />
    );

    expect(screen.getByText("[Message deleted]")).toBeInTheDocument();
  });

  it("should show banned user indicator", () => {
    render(
      <ChatMessage
        message={mockMessage}
        isBanned={true}
        isCurrentUser={false}
        onDelete={mockOnDelete}
        onBan={mockOnBan}
      />
    );

    expect(screen.getByText("BANNED")).toBeInTheDocument();
  });

  it("should show announcement badge", () => {
    const announcement = { ...mockMessage, type: "ANNOUNCEMENT" as const };
    render(
      <ChatMessage
        message={announcement}
        isBanned={false}
        isCurrentUser={false}
        onDelete={mockOnDelete}
        onBan={mockOnBan}
      />
    );

    expect(screen.getByText(/ANNOUNCEMENT/i)).toBeInTheDocument();
  });

  it("should show moderation controls on hover", () => {
    render(
      <ChatMessage
        message={mockMessage}
        isBanned={false}
        isCurrentUser={false}
        onDelete={mockOnDelete}
        onBan={mockOnBan}
      />
    );

    const messageElement = screen.getByText("TestUser").closest("div");
    if (messageElement) {
      fireEvent.mouseEnter(messageElement);
      expect(screen.getByText("Delete")).toBeInTheDocument();
      expect(screen.getByText("Ban")).toBeInTheDocument();
    }
  });

  it("should not show ban button for current user", () => {
    render(
      <ChatMessage
        message={mockMessage}
        isBanned={false}
        isCurrentUser={true}
        onDelete={mockOnDelete}
        onBan={mockOnBan}
      />
    );

    const messageElement = screen.getByText("TestUser").closest("div");
    if (messageElement) {
      fireEvent.mouseEnter(messageElement);
      expect(screen.getByText("Delete")).toBeInTheDocument();
      expect(screen.queryByText("Ban")).not.toBeInTheDocument();
    }
  });

  it("should call onDelete when delete button clicked", () => {
    render(
      <ChatMessage
        message={mockMessage}
        isBanned={false}
        isCurrentUser={false}
        onDelete={mockOnDelete}
        onBan={mockOnBan}
      />
    );

    const messageElement = screen.getByText("TestUser").closest("div");
    if (messageElement) {
      fireEvent.mouseEnter(messageElement);
      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);
      expect(mockOnDelete).toHaveBeenCalledWith("msg-1");
    }
  });

  it("should call onBan when ban button clicked", () => {
    render(
      <ChatMessage
        message={mockMessage}
        isBanned={false}
        isCurrentUser={false}
        onDelete={mockOnDelete}
        onBan={mockOnBan}
      />
    );

    const messageElement = screen.getByText("TestUser").closest("div");
    if (messageElement) {
      fireEvent.mouseEnter(messageElement);
      const banButton = screen.getByText("Ban");
      fireEvent.click(banButton);
      expect(mockOnBan).toHaveBeenCalledWith("user-123");
    }
  });

  it("should show pinned badge", () => {
    render(
      <ChatMessage
        message={mockMessage}
        isBanned={false}
        isCurrentUser={false}
        onDelete={mockOnDelete}
        onBan={mockOnBan}
        isPinned={true}
      />
    );

    expect(screen.getByText("📌 Pinned")).toBeInTheDocument();
  });
});


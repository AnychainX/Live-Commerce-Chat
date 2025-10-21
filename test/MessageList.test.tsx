import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MessageList } from "../app/components/MessageList";
import type { Message } from "../app/types/chat";
import { useRef } from "react";

describe("MessageList", () => {
  const mockMessages: Message[] = [
    {
      id: "1",
      userId: "user1",
      username: "Alice",
      text: "Hello everyone!",
      type: "CHAT",
      timestamp: Date.now() - 60000,
      deleted: false,
    },
    {
      id: "2",
      userId: "user2",
      username: "Bob",
      text: "Important announcement",
      type: "ANNOUNCEMENT",
      timestamp: Date.now() - 30000,
      deleted: false,
    },
    {
      id: "3",
      userId: "user3",
      username: "Charlie",
      text: "This was deleted",
      type: "CHAT",
      timestamp: Date.now() - 20000,
      deleted: true,
    },
  ];

  const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    return <div ref={scrollRef}>{children}</div>;
  };

  it("should render all messages", () => {
    const scrollRef = { current: null };
    render(
      <MessageList
        messages={mockMessages}
        bannedUsers={new Set()}
        currentUserId="user1"
        scrollRef={scrollRef as any}
        isUserScrolling={false}
        scrollToBottom={vi.fn()}
        onDeleteMessage={vi.fn()}
        onBanUser={vi.fn()}
      />
    );

    expect(screen.getByText("Hello everyone!")).toBeInTheDocument();
    expect(screen.getByText("Important announcement")).toBeInTheDocument();
    expect(screen.getByText("[Message deleted]")).toBeInTheDocument();
  });

  it("should display announcement badge", () => {
    const scrollRef = { current: null };
    render(
      <MessageList
        messages={[mockMessages[1]]}
        bannedUsers={new Set()}
        currentUserId="user1"
        scrollRef={scrollRef as any}
        isUserScrolling={false}
        scrollToBottom={vi.fn()}
        onDeleteMessage={vi.fn()}
        onBanUser={vi.fn()}
      />
    );

    expect(screen.getByText(/ANNOUNCEMENT/i)).toBeInTheDocument();
  });

  it("should show banned user indicator", () => {
    const scrollRef = { current: null };
    render(
      <MessageList
        messages={[mockMessages[0]]}
        bannedUsers={new Set(["user1"])}
        currentUserId="user2"
        scrollRef={scrollRef as any}
        isUserScrolling={false}
        scrollToBottom={vi.fn()}
        onDeleteMessage={vi.fn()}
        onBanUser={vi.fn()}
      />
    );

    expect(screen.getByText("BANNED")).toBeInTheDocument();
  });

  it("should render empty state when no messages", () => {
    const scrollRef = { current: null };
    render(
      <MessageList
        messages={[]}
        bannedUsers={new Set()}
        currentUserId="user1"
        scrollRef={scrollRef as any}
        isUserScrolling={false}
        scrollToBottom={vi.fn()}
        onDeleteMessage={vi.fn()}
        onBanUser={vi.fn()}
      />
    );

    expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
  });

  it("should show scroll to bottom button when user is scrolling", () => {
    const scrollRef = { current: null };
    render(
      <MessageList
        messages={mockMessages}
        bannedUsers={new Set()}
        currentUserId="user1"
        scrollRef={scrollRef as any}
        isUserScrolling={true}
        scrollToBottom={vi.fn()}
        onDeleteMessage={vi.fn()}
        onBanUser={vi.fn()}
      />
    );

    expect(screen.getByText("New messages")).toBeInTheDocument();
  });

  it("should handle 300 messages limit", () => {
    const manyMessages: Message[] = Array.from({ length: 350 }, (_, i) => ({
      id: `msg-${i}`,
      userId: `user-${i}`,
      username: `User ${i}`,
      text: `Message ${i}`,
      type: "CHAT" as const,
      timestamp: Date.now() - i * 1000,
      deleted: false,
    }));

    const scrollRef = { current: null };
    render(
      <MessageList
        messages={manyMessages.slice(-300)}
        bannedUsers={new Set()}
        currentUserId="user1"
        scrollRef={scrollRef as any}
        isUserScrolling={false}
        scrollToBottom={vi.fn()}
        onDeleteMessage={vi.fn()}
        onBanUser={vi.fn()}
      />
    );

    // Should only render last 300 messages
    expect(screen.queryByText("Message 0")).not.toBeInTheDocument();
    expect(screen.getByText("Message 349")).toBeInTheDocument();
  });

  it("should pin recent announcements", () => {
    const recentAnnouncement: Message = {
      id: "announcement-1",
      userId: "admin",
      username: "Admin",
      text: "New feature launched!",
      type: "ANNOUNCEMENT",
      timestamp: Date.now() - 5000, // 5 seconds ago
      deleted: false,
    };

    const scrollRef = { current: null };
    render(
      <MessageList
        messages={[recentAnnouncement]}
        bannedUsers={new Set()}
        currentUserId="user1"
        scrollRef={scrollRef as any}
        isUserScrolling={false}
        scrollToBottom={vi.fn()}
        onDeleteMessage={vi.fn()}
        onBanUser={vi.fn()}
      />
    );

    expect(screen.getByText("📌 Pinned")).toBeInTheDocument();
  });
});


import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MessageInput } from "../app/components/MessageInput";
import userEvent from "@testing-library/user-event";

describe("MessageInput", () => {
  const mockSendMessage = vi.fn();
  const mockSlowMode = { enabled: false, interval: 10000 };

  it("should render input field and send button", () => {
    render(
      <MessageInput
        onSendMessage={mockSendMessage}
        disabled={false}
        slowMode={mockSlowMode}
      />
    );

    expect(
      screen.getByPlaceholderText(/Type a message/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("should enforce 500 character limit", async () => {
    const user = userEvent.setup();
    render(
      <MessageInput
        onSendMessage={mockSendMessage}
        disabled={false}
        slowMode={mockSlowMode}
      />
    );

    const textarea = screen.getByPlaceholderText(/Type a message/i);
    const longText = "a".repeat(600);

    await user.type(textarea, longText);

    // Should show negative remaining count
    expect(screen.getByText(/-\d+/)).toBeInTheDocument();
  });

  it("should send message on Enter key", async () => {
    const user = userEvent.setup();
    render(
      <MessageInput
        onSendMessage={mockSendMessage}
        disabled={false}
        slowMode={mockSlowMode}
      />
    );

    const textarea = screen.getByPlaceholderText(/Type a message/i);
    await user.type(textarea, "Hello World{Enter}");

    expect(mockSendMessage).toHaveBeenCalledWith("Hello World", "CHAT");
  });

  it("should not send message on Shift+Enter", async () => {
    const user = userEvent.setup();
    render(
      <MessageInput
        onSendMessage={mockSendMessage}
        disabled={false}
        slowMode={mockSlowMode}
      />
    );

    const textarea = screen.getByPlaceholderText(/Type a message/i);
    await user.type(textarea, "Line 1{Shift>}{Enter}{/Shift}Line 2");

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("should disable input when connection is lost", () => {
    render(
      <MessageInput
        onSendMessage={mockSendMessage}
        disabled={true}
        slowMode={mockSlowMode}
      />
    );

    const textarea = screen.getByPlaceholderText(/Disconnected/i);
    expect(textarea).toBeDisabled();
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("should toggle announcement mode", async () => {
    const user = userEvent.setup();
    render(
      <MessageInput
        onSendMessage={mockSendMessage}
        disabled={false}
        slowMode={mockSlowMode}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    const textarea = screen.getByPlaceholderText(/Type a message/i);
    await user.type(textarea, "Announcement{Enter}");

    expect(mockSendMessage).toHaveBeenCalledWith("Announcement", "ANNOUNCEMENT");
  });

  it("should show slow mode indicator when enabled", () => {
    const slowModeEnabled = { enabled: true, interval: 10000 };
    render(
      <MessageInput
        onSendMessage={mockSendMessage}
        disabled={false}
        slowMode={slowModeEnabled}
      />
    );

    expect(screen.getByText(/Slow mode: 10s/i)).toBeInTheDocument();
  });

  it("should clear input after sending", async () => {
    const user = userEvent.setup();
    render(
      <MessageInput
        onSendMessage={mockSendMessage}
        disabled={false}
        slowMode={mockSlowMode}
      />
    );

    const textarea = screen.getByPlaceholderText(
      /Type a message/i
    ) as HTMLTextAreaElement;
    await user.type(textarea, "Test message{Enter}");

    expect(textarea.value).toBe("");
  });

  it("should not send empty messages", async () => {
    const user = userEvent.setup();
    render(
      <MessageInput
        onSendMessage={mockSendMessage}
        disabled={false}
        slowMode={mockSlowMode}
      />
    );

    const textarea = screen.getByPlaceholderText(/Type a message/i);
    await user.type(textarea, "   {Enter}");

    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});


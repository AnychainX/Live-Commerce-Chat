# Founding Engineer Test Project – Live Stream Chat System

This document defines the **lean, 3-hour version** of the founding engineer technical test, including testing criteria, required deliverables, and evaluation rubric.

---

## 🧭 Objective

Build a **real-time chat interface** with basic moderation features for a live commerce platform using Remix + Socket.IO. The goal is to assess real-world problem solving, React + TypeScript proficiency, event-driven thinking, and testing discipline.

**Time expectation:** 2–3 hours\
**Compensation:** \$200\
**Submission:** GitHub repo with a README + working demo (no external dependencies)

---

## ⚙️ Stack (developer-chosen local setup)

- Remix (React + Node runtime)
- Socket.IO or alternative WebSocket implementation
- Any lightweight local database (SQLite, JSON, or in-memory)
- TailwindCSS or simple CSS
- TypeScript

> 💡 You must set up your own environment from scratch. Do not rely on a provided starter or hosted server. Everything should run locally via `npm run dev` or an equivalent script.

Optional familiarity with live video integration (e.g., Mux, HLS) is a bonus but not required.

---

## 🧩 Requirements

### Tier A (Required – target <3 hours)

- **Core Chat**

  - Render real-time messages over a WebSocket connection.
  - Auto-scroll to newest messages unless the user scrolls up.
  - Display username, timestamp, and avatar.
  - Style by message type: `CHAT`, `ANNOUNCEMENT`.

- **Input**

  - Textbox with 500-character limit and live counter.
  - Press Enter to send message.
  - Disabled while disconnected.
  - Toggle for `Announcement` mode.

- **Moderation**

  - Hover controls: **Delete message**, **Ban user**.
  - Deleted messages → show `[Message deleted]`.
  - Banned users → messages grayed out; cannot send new messages.

- **Connectivity**

  - Clear visual indicators for connected / reconnecting / disconnected.
  - Simple retry mechanism if the connection drops.

- **Performance baseline**

  - Renders 300 messages smoothly.
  - Keeps only the latest 300 in memory (rolling cap).

### Tier B (Stretch – optional if time remains)

- Pin announcements for 30 seconds.
- Simple slow mode (1 message / 10s per user).
- Moderator bulk actions (clear all messages).
- Optional video player with overlay banner for announcements.

---

## 🧪 Testing Requirements

### Automated Tests (required)

Use **Vitest + React Testing Library** (or similar). Provide \~3–4 focused tests covering core logic only.

#### Required coverage areas:

- **WebSocket hook / connection logic**: emits, receives, reconnects.
- **Message list rendering**: last 300 messages, auto-scroll behavior, styling by type.
- **Message input**: 500-char limit, disabled states, send on Enter, announcement toggle.
- **Moderation actions**: delete and ban functionality update UI correctly.

Mock WebSocket interactions — no live server needed.

### Manual QA Checklist

1. Open two local tabs: messages sync both ways.
2. Scroll behavior works (no forced scroll when reading history).
3. Delete and ban actions reflect across both tabs.
4. Reconnect behavior works after killing and restarting the server.
5. Smooth rendering with 300 messages; no lag or crashes.

---

## 🧠 Evaluation Rubric

| Category             | Weight | Description                                                     |
| -------------------- | ------ | --------------------------------------------------------------- |
| **Code Quality**     | 35%    | Clean, modular, readable, well-typed code.                      |
| **Functionality**    | 35%    | Real-time messaging, moderation, and recovery all work locally. |
| **Testing**          | 20%    | Focused, meaningful tests; manual checklist passes.             |
| **Performance & UX** | 10%    | Smooth scrolling (300 msgs), clear user feedback.               |

**Bonus (5%)**: Lightweight video overlay integration or creative UX enhancements.

---

## ✅ Deliverables

- A self-contained project that runs locally.
- All dependencies installed via `npm install`.
- Passing automated tests.
- README including:
  - Setup instructions
  - Implementation notes & trade-offs
  - Testing details (manual + automated)
  - Future improvements (performance, scalability, streaming)

---

## 🟢 Success Indicators

- All features run without external services or starter code.
- Real-time chat functions locally across tabs.
- Smooth UX under simulated load.
- Tests are clear and passing.
- README demonstrates strong technical judgment.

---

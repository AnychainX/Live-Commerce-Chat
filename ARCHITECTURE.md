# Architecture Overview

This document provides a deep dive into the technical architecture of the Live Stream Chat System.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser Client                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Remix App (React)                                     │ │
│  │  ├─ Routes (_index.tsx)                                │ │
│  │  ├─ Components (ChatMessage, MessageList, etc.)       │ │
│  │  ├─ Hooks (useSocket, useAutoScroll)                  │ │
│  │  └─ Video Player (HLS.js)                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           │ HTTP / WebSocket                 │
└───────────────────────────┼──────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌──────────────────┐                  ┌──────────────────┐
│  Remix Server    │                  │ Socket.IO Server │
│  (Port 3000)     │                  │  (Port 3001)     │
│                  │                  │                  │
│  • SSR/Hydration │                  │  • WebSocket     │
│  • Static Assets │                  │  • Event Routing │
│  • API Routes    │                  │  • Broadcasting  │
└──────────────────┘                  └────────┬─────────┘
                                               │
                                               ▼
                                    ┌──────────────────┐
                                    │  In-Memory DB    │
                                    │                  │
                                    │  • Messages[]    │
                                    │  • Users Map     │
                                    │  • Banned Set    │
                                    └──────────────────┘
```

## Data Flow

### 1. Message Send Flow

```
User types → MessageInput → useSocket.sendMessage()
                                   │
                                   ▼
                          socket.emit('send_message')
                                   │
                                   ▼
                          Socket.IO Server receives
                                   │
                                   ▼
                          Validate (ban check, slow mode)
                                   │
                                   ▼
                          Add to in-memory DB
                                   │
                                   ▼
                          io.emit('new_message') to ALL clients
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
              Tab 1 receives              Tab 2 receives
                     │                           │
                     ▼                           ▼
            useSocket hook updates      useSocket hook updates
                     │                           │
                     ▼                           ▼
              React re-renders            React re-renders
                     │                           │
                     ▼                           ▼
              MessageList updates         MessageList updates
                     │                           │
                     ▼                           ▼
              Auto-scroll triggers        Auto-scroll triggers
```

### 2. Moderation Flow (Delete Message)

```
Hover → Delete button → onDelete(messageId)
                              │
                              ▼
                    socket.emit('delete_message')
                              │
                              ▼
                    Socket.IO Server
                              │
                              ▼
                    Find message in DB
                              │
                              ▼
                    Set message.deleted = true
                              │
                              ▼
                    io.emit('message_deleted') to ALL
                              │
                              ▼
                    All tabs update message UI
                              │
                              ▼
                    Show "[Message deleted]"
```

### 3. Connection Lifecycle

```
Component Mount → useSocket() → io.connect()
                                      │
                                      ▼
                            Socket.IO handshake
                                      │
                      ┌───────────────┴───────────────┐
                      ▼                               ▼
              Event: 'connect'              Event: 'initial_data'
                      │                               │
                      ▼                               ▼
          Set status: connected        Load messages, banned users, config
                      │                               │
                      ▼                               ▼
          Emit 'join' with username         Update React state
                      │                               │
                      └───────────────┬───────────────┘
                                      ▼
                            Ready for real-time events
```

## Component Hierarchy

```
App (root.tsx)
└── Index (_index.tsx)
    ├── If not joined:
    │   └── Username Form
    │
    └── If joined:
        ├── Video Section (desktop)
        │   └── VideoPlayer
        │       ├── HLS.js instance
        │       └── Custom controls
        │
        └── Chat Section
            ├── Header (username, connection)
            ├── ConnectionStatus
            ├── ModeratorPanel
            │   ├── Slow Mode toggle
            │   └── Clear All button
            ├── Banned Warning (conditional)
            ├── MessageList
            │   ├── Pinned Messages area
            │   │   └── ChatMessage[] (pinned)
            │   ├── Regular Messages area
            │   │   └── ChatMessage[] (scrollable)
            │   └── Scroll to Bottom button
            ├── MessageInput
            │   ├── Textarea (500 char limit)
            │   ├── Character counter
            │   ├── Announcement toggle
            │   └── Send button
            └── Stats Footer
```

## State Management

### Server State (In-Memory DB)

```typescript
interface AppData {
  messages: Message[];           // Rolling cap at 300
  users: Map<string, User>;      // Socket ID → User
  bannedUsers: Set<string>;      // Set of banned socket IDs
  slowModeEnabled: boolean;
  slowModeInterval: number;      // milliseconds
}
```

### Client State (React)

Each client maintains:

```typescript
// useSocket hook state
{
  socket: Socket | null,
  connected: boolean,
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected',
  messages: Message[],           // Synced from server
  bannedUsers: Set<string>,      // Synced from server
  slowMode: { enabled, interval },
  currentUserId: string | null
}

// _index.tsx component state
{
  username: string,              // From localStorage
  hasJoined: boolean,
  showVideo: boolean
}

// useAutoScroll hook state
{
  isUserScrolling: boolean,
  scrollRef: RefObject<HTMLDivElement>
}
```

## Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{ username }` | User joins chat |
| `send_message` | `{ text, type, username }` | Send new message |
| `delete_message` | `{ messageId }` | Delete a message |
| `ban_user` | `{ userId }` | Ban a user |
| `unban_user` | `{ userId }` | Unban a user |
| `clear_all_messages` | - | Clear all messages |
| `toggle_slow_mode` | `{ enabled }` | Toggle slow mode |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `connect` | - | Connection established |
| `disconnect` | - | Connection lost |
| `initial_data` | `{ messages, bannedUsers, slowMode }` | Initial state on connect |
| `user_joined` | `{ userId, user }` | User joined confirmation |
| `new_message` | `Message` | New message broadcast |
| `message_deleted` | `{ messageId }` | Message was deleted |
| `user_banned` | `{ userId }` | User was banned |
| `user_unbanned` | `{ userId }` | User was unbanned |
| `messages_cleared` | - | All messages cleared |
| `slow_mode_changed` | `{ enabled, interval }` | Slow mode toggled |
| `error` | `{ message }` | Error occurred |

## Key Algorithms

### 1. Auto-Scroll Logic

```typescript
// In useAutoScroll.ts
function handleScroll() {
  const { scrollTop, scrollHeight, clientHeight } = scrollElement;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  
  if (distanceFromBottom < 50) {
    // Near bottom → enable auto-scroll
    setIsUserScrolling(false);
  } else {
    // Scrolled up → disable auto-scroll
    setIsUserScrolling(true);
  }
}

useEffect(() => {
  if (!isUserScrolling) {
    // Only scroll if not manually scrolling
    scrollToBottom();
  }
}, [messages.length]);
```

### 2. Message Rolling Cap

```typescript
// In server.ts
function addMessage(message: Message) {
  db.messages.push(message);
  
  if (db.messages.length > MAX_MESSAGES) {
    // Keep only last 300
    db.messages = db.messages.slice(-MAX_MESSAGES);
  }
}
```

### 3. Slow Mode Enforcement

```typescript
// In server.ts
if (db.slowModeEnabled) {
  const now = Date.now();
  const timeSinceLastMessage = now - user.lastMessageTime;
  
  if (user.lastMessageTime > 0 && 
      timeSinceLastMessage < db.slowModeInterval) {
    // Still in cooldown
    const waitTime = Math.ceil(
      (db.slowModeInterval - timeSinceLastMessage) / 1000
    );
    socket.emit('error', { 
      message: `Slow mode: wait ${waitTime}s` 
    });
    return;
  }
  
  user.lastMessageTime = now;
}
```

### 4. Announcement Pinning

```typescript
// In MessageList.tsx
useEffect(() => {
  const recentAnnouncements = messages.filter(msg =>
    msg.type === 'ANNOUNCEMENT' &&
    !msg.deleted &&
    Date.now() - msg.timestamp < 30000  // 30 seconds
  );
  
  setPinnedMessages(new Set(recentAnnouncements.map(m => m.id)));
  
  // Set timers to unpin after 30s
  const timeouts = recentAnnouncements.map(msg => {
    const remainingTime = 30000 - (Date.now() - msg.timestamp);
    return setTimeout(() => {
      setPinnedMessages(prev => {
        const updated = new Set(prev);
        updated.delete(msg.id);
        return updated;
      });
    }, remainingTime);
  });
  
  return () => timeouts.forEach(clearTimeout);
}, [messages]);
```

## Performance Optimizations

### 1. Message Rendering
- **Virtual scrolling**: Not implemented (not needed for 300 messages)
- **React key optimization**: Each message has unique `id` for stable keys
- **Memo optimization**: Could add `React.memo()` to ChatMessage component

### 2. Socket.IO Configuration
```typescript
const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});
```

### 3. Message Batching
- Currently: Each message emitted individually
- Future: Could batch messages sent within 100ms window

### 4. State Updates
- Use functional updates: `setState(prev => ...)`
- Prevents stale closure issues
- Ensures correct state in async callbacks

## Security Considerations

### Current Vulnerabilities

1. **No Input Sanitization**
   - XSS possible via message content
   - Solution: Use DOMPurify or similar

2. **No Authentication**
   - Anyone can join, ban, delete
   - Solution: Add JWT auth, role-based access

3. **No Rate Limiting**
   - Can spam server with messages
   - Solution: Add rate limiter middleware

4. **Client-Side Validation Only**
   - Can bypass char limits via DevTools
   - Solution: Validate on server

5. **No CSRF Protection**
   - WebSocket not affected, but HTTP routes would be
   - Solution: Add CSRF tokens

### Production Security Checklist

- [ ] Add authentication (OAuth/JWT)
- [ ] Implement RBAC for moderation
- [ ] Sanitize all user input (server-side)
- [ ] Add rate limiting (per user, per IP)
- [ ] Use HTTPS and WSS (TLS)
- [ ] Implement content security policy
- [ ] Add request validation (Zod, Yup)
- [ ] Log all moderation actions
- [ ] Encrypt sensitive data
- [ ] Regular security audits

## Scalability Path

### Current: Single Server
- Max: ~1,000 concurrent users
- Bottleneck: Memory, CPU, single WebSocket server

### Phase 1: Database + Redis
```
Clients → Socket.IO Servers (multiple) → Redis Pub/Sub
                                       → PostgreSQL (persistence)
```

### Phase 2: Microservices
```
Clients → Load Balancer
            ├─ Chat Service (Socket.IO)
            ├─ Moderation Service
            ├─ User Service (auth)
            └─ Video Service (streaming)
                │
                ├─ Redis (Pub/Sub + Cache)
                ├─ PostgreSQL (messages, users)
                └─ S3 (media storage)
```

### Phase 3: Global CDN
```
Edge Servers (CloudFlare/Fastly)
    ├─ Static Assets
    ├─ Video CDN (HLS segments)
    └─ WebSocket Termination
          └─ Regional Socket.IO clusters
```

## Technology Choices

### Why Remix?
- ✅ Server-side rendering for better SEO
- ✅ Progressive enhancement
- ✅ Built-in routing
- ✅ Great TypeScript support
- ✅ Modern React patterns

### Why Socket.IO?
- ✅ Automatic reconnection
- ✅ Room/namespace support
- ✅ HTTP long-polling fallback
- ✅ Battle-tested in production
- ✅ Great ecosystem

### Why TailwindCSS?
- ✅ Rapid prototyping
- ✅ Consistent design system
- ✅ No CSS file bloat
- ✅ Great DX with JIT mode
- ✅ Responsive utilities

### Why HLS.js?
- ✅ Industry standard for live streaming
- ✅ Cross-browser support
- ✅ Adaptive bitrate streaming
- ✅ Low latency options
- ✅ Mature ecosystem

### Why Vitest?
- ✅ Fast (native ESM)
- ✅ Vite integration
- ✅ Jest-compatible API
- ✅ Great TypeScript support
- ✅ Built-in coverage

## Future Technology Considerations

### If Scaling to Millions
- **Replace Socket.IO with**: Custom WebSocket or gRPC streaming
- **Replace in-memory DB with**: Redis + PostgreSQL + TimescaleDB
- **Add message queue**: Kafka or RabbitMQ
- **Add caching layer**: Redis or Memcached
- **Add CDN**: CloudFlare or Fastly
- **Add monitoring**: Datadog, New Relic, or Prometheus
- **Add tracing**: OpenTelemetry or Jaeger

### If Adding AI Features
- **Toxicity detection**: Perspective API or custom model
- **Auto-moderation**: TensorFlow.js or cloud ML
- **Translation**: Google Translate API
- **Sentiment analysis**: Natural API or custom BERT model

### If Going Mobile-First
- **React Native**: Share business logic
- **Expo**: Faster development
- **Native modules**: For video/audio optimization
- **Push notifications**: Firebase Cloud Messaging


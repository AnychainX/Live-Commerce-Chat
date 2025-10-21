# Manual Testing Guide

This document provides a comprehensive manual testing checklist for the Live Stream Chat System.

## Pre-Testing Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development servers**
   ```bash
   npm run dev
   ```
   
   You should see:
   - `[REMIX]` Remix running on http://localhost:3000
   - `[SOCKET]` Socket.IO running on http://localhost:3001

3. **Open browser tabs**
   - Open at least 2 tabs at http://localhost:3000
   - Use different usernames (e.g., "Alice" and "Bob")

## Test Checklist

### ✅ Basic Functionality

#### 1. Username Entry
- [ ] Can enter username on join screen
- [ ] Username is saved to localStorage
- [ ] Username persists after page reload
- [ ] Can't join without entering username

#### 2. Real-Time Messaging
- [ ] Type message in Tab 1, appears in Tab 2 instantly
- [ ] Type message in Tab 2, appears in Tab 1 instantly
- [ ] Messages show correct username
- [ ] Messages show timestamp in HH:MM format
- [ ] Avatar displays first letter of username
- [ ] Avatar colors are consistent per username

#### 3. Message Input Controls
- [ ] Can type up to 500 characters
- [ ] Character counter updates live
- [ ] Counter turns yellow below 50 chars remaining
- [ ] Counter turns red when over limit
- [ ] Send button disabled when over limit
- [ ] Can't send empty messages (spaces only)
- [ ] Enter key sends message
- [ ] Shift+Enter creates new line
- [ ] Input clears after sending

### ✅ Connection Management

#### 4. Connection Status Indicators
- [ ] Green dot + "Connected" when connected
- [ ] Yellow pulsing dot + "Reconnecting..." when reconnecting
- [ ] Red dot + "Disconnected" when disconnected

#### 5. Reconnection Behavior
- [ ] **Test**: Close terminal with Socket.IO server (Ctrl+C)
- [ ] Status changes to "Reconnecting..."
- [ ] Input becomes disabled
- [ ] **Test**: Restart server with `npm run dev:socket`
- [ ] Automatically reconnects within 5 seconds
- [ ] Input re-enables
- [ ] Can send messages again
- [ ] Previous messages are still visible

### ✅ Auto-Scroll Behavior

#### 6. Automatic Scrolling
- [ ] New messages automatically scroll to bottom
- [ ] Scroll position stays at bottom when new messages arrive
- [ ] "New messages" button hidden when at bottom

#### 7. Manual Scroll Detection
- [ ] Scroll up in message list
- [ ] "New messages" button appears at bottom right
- [ ] New messages don't force scroll to bottom
- [ ] Click "New messages" button → scrolls to bottom
- [ ] Button disappears after clicking

### ✅ Message Types & Styling

#### 8. Regular Chat Messages
- [ ] Default gray background
- [ ] Username in white
- [ ] Timestamp in gray

#### 9. Announcements
- [ ] Check "Send as Announcement" checkbox
- [ ] Send a message
- [ ] Message has blue background
- [ ] Shows "📢 ANNOUNCEMENT" badge
- [ ] Message is pinned at top
- [ ] Pinned section has purple background
- [ ] Message unpins after 30 seconds

### ✅ Moderation Features

#### 10. Delete Message
- [ ] Hover over any message
- [ ] "Delete" button appears
- [ ] Click "Delete"
- [ ] Message text changes to "[Message deleted]"
- [ ] Deleted message appears in all tabs
- [ ] Can't hover actions on deleted messages
- [ ] Deleted messages are grayed out

#### 11. Ban User
- [ ] Hover over message from another user
- [ ] "Ban" button appears (not on own messages)
- [ ] Click "Ban"
- [ ] All messages from that user show "BANNED" badge
- [ ] User's messages are grayed out
- [ ] Banned user sees warning banner
- [ ] Banned user can't send messages
- [ ] Ban persists across tabs

### ✅ Moderator Controls

#### 12. Slow Mode
- [ ] Click "Slow Mode" checkbox in moderator panel
- [ ] Yellow indicator shows "Slow mode: 10s between messages"
- [ ] Send a message
- [ ] Try to send another immediately
- [ ] Should show alert: "Slow mode: wait Xs before sending"
- [ ] Wait 10 seconds
- [ ] Can send message again
- [ ] Slow mode state syncs across tabs

#### 13. Clear All Messages
- [ ] Send several messages
- [ ] Click "Clear All Messages" button
- [ ] Confirmation dialog appears
- [ ] Click "OK"
- [ ] All messages cleared in all tabs
- [ ] Shows "No messages yet" empty state

### ✅ Performance & Scale

#### 14. 300 Message Limit
- [ ] Open browser console
- [ ] Run this script to send 350 messages:
   ```javascript
   for(let i = 1; i <= 350; i++) {
     setTimeout(() => {
       const input = document.querySelector('textarea');
       const button = document.querySelector('button[type="submit"]');
       input.value = `Test message ${i}`;
       input.dispatchEvent(new Event('input', { bubbles: true }));
       button.click();
     }, i * 50);
   }
   ```
- [ ] Check footer: Should show "300 messages"
- [ ] Scroll to top: First 50 messages should be gone
- [ ] Scrolling is still smooth
- [ ] No lag or freezing

### ✅ Video Player (Bonus Feature)

#### 15. HLS Video Playback
- [ ] Video player visible on left side (desktop)
- [ ] Video loads and plays HLS test stream
- [ ] "LIVE" badge visible with pulsing red dot
- [ ] Can pause/play video
- [ ] Volume control works
- [ ] Mute button works
- [ ] Video quality is smooth

#### 16. Responsive Layout
- [ ] Resize browser window
- [ ] On mobile/narrow: Video stacks on top of chat
- [ ] "Hide Video" button appears on mobile
- [ ] Can toggle video visibility
- [ ] Chat remains functional when video hidden

### ✅ UI/UX Polish

#### 17. Visual Feedback
- [ ] Buttons have hover states
- [ ] Smooth animations on new messages
- [ ] Color-coded avatars are visually distinct
- [ ] Dark theme is easy on the eyes
- [ ] Text is readable at various zoom levels

#### 18. Error Handling
- [ ] Try sending 501 character message → counter goes negative
- [ ] Try sending while disconnected → input disabled
- [ ] Try sending as banned user → shows warning

### ✅ Edge Cases

#### 19. Multiple Users Same Name
- [ ] Join with same username in two tabs
- [ ] Messages appear from both (different socket IDs)
- [ ] Banning one doesn't ban the other
- [ ] Avatars have same color

#### 20. Long Messages
- [ ] Send message with 500 characters
- [ ] Message wraps correctly
- [ ] No horizontal scrolling
- [ ] All text visible

#### 21. Special Characters
- [ ] Send message with emojis: "Hello 👋 🎉"
- [ ] Send message with unicode: "中文 العربية"
- [ ] Send message with code: `const x = 5;`
- [ ] All display correctly

#### 22. Rapid Fire Messages
- [ ] Disable slow mode
- [ ] Send 20 messages rapidly (spam Enter)
- [ ] All messages appear in order
- [ ] No duplicates
- [ ] Timestamps are sequential

## Automated Testing

Run the test suite:

```bash
npm test
```

Expected output:
- ✓ test/useSocket.test.ts (7 tests)
- ✓ test/MessageInput.test.tsx (9 tests)
- ✓ test/MessageList.test.tsx (7 tests)
- ✓ test/ChatMessage.test.tsx (10 tests)

All tests should pass.

## Performance Benchmarks

### Target Metrics
- [ ] Initial page load: < 2 seconds
- [ ] Message send-to-display latency: < 100ms
- [ ] Smooth scrolling with 300 messages: 60 FPS
- [ ] Memory usage: < 100MB for 300 messages
- [ ] CPU usage: < 10% idle, < 30% with active chat

### How to Measure
1. Open Chrome DevTools
2. Go to Performance tab
3. Record while sending messages
4. Check frame rate and memory usage

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Security Considerations

### Current Implementation
- ⚠️ No authentication (anyone can join)
- ⚠️ No authorization (everyone is moderator)
- ⚠️ No input sanitization (XSS possible)
- ⚠️ No rate limiting on server
- ⚠️ No HTTPS/WSS in production

### For Production
- [ ] Add authentication (OAuth, JWT)
- [ ] Implement role-based access control
- [ ] Sanitize all user input
- [ ] Add server-side rate limiting
- [ ] Use HTTPS and WSS
- [ ] Add CSRF protection
- [ ] Implement content security policy

## Known Limitations

1. **Single server only**: No horizontal scaling without Redis adapter
2. **In-memory storage**: Messages lost on server restart
3. **No message history**: Only last 300 messages kept
4. **No persistence**: Bans don't survive server restart
5. **No authentication**: Anyone can moderate
6. **Client-side security**: Easy to bypass restrictions

## Sign-Off

### Tester Information
- Name: _______________
- Date: _______________
- Environment: _______________

### Test Results
- [ ] All core features pass
- [ ] All moderation features pass
- [ ] Performance is acceptable
- [ ] No critical bugs found

### Notes
_________________________________
_________________________________
_________________________________


# Quick Start Guide

Get the Live Stream Chat System running in 5 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js version 20 or higher
- ✅ npm (comes with Node.js)
- ✅ A modern web browser (Chrome, Firefox, Safari, Edge)

Check your versions:
```bash
node --version    # Should be v20.0.0 or higher
npm --version     # Should be 9.0.0 or higher
```

## Installation (2 minutes)

### Step 1: Navigate to project directory
```bash
cd d:/test
```

### Step 2: Install dependencies
```bash
npm install
```

This will install:
- Remix framework
- Socket.IO (client and server)
- TailwindCSS
- HLS.js for video
- Vitest for testing
- And all other dependencies

⏱️ This takes about 1-2 minutes depending on your internet speed.

## Running the Application (30 seconds)

### Start the development servers
```bash
npm run dev
```

This single command starts:
1. **Remix dev server** on http://localhost:3000 (frontend)
2. **Socket.IO server** on http://localhost:3001 (WebSocket backend)

You should see output like:
```
[REMIX] REMIX DEV Server started
[REMIX] ➜ Local:   http://localhost:3000/
[SOCKET] ✅ Socket.IO server running on http://localhost:3001
```

### Open your browser
Navigate to: **http://localhost:3000**

## First Use (1 minute)

### 1. Join the chat
- You'll see a username entry screen
- Type any username (e.g., "Alice")
- Click "Join Chat"

### 2. Test real-time messaging
- Type a message in the text box
- Press Enter to send
- You'll see your message appear instantly!

### 3. Test multi-tab sync
- Open a new browser tab
- Go to http://localhost:3000 again
- Use a different username (e.g., "Bob")
- Send messages from both tabs
- Watch them sync in real-time! ✨

## Quick Feature Tour (2 minutes)

### Video Player
- The video player on the left shows a live HLS test stream
- Click play/pause to control playback
- Adjust volume with the slider
- Notice the "LIVE" badge indicating live streaming

### Chat Features

#### Send a regular message
1. Type in the text box at the bottom
2. Press Enter
3. Message appears with your username and timestamp

#### Send an announcement
1. Check the "📢 Send as Announcement" box
2. Type your message
3. Press Enter
4. Message appears with blue background and is pinned at top for 30 seconds

#### Delete a message
1. Hover over any message
2. Click "Delete" button
3. Message changes to "[Message deleted]"

#### Ban a user
1. Hover over a message from another user
2. Click "Ban" button
3. User's messages gray out and they can't send messages

#### Enable slow mode
1. Look at the top bar for "Moderator Controls"
2. Check "Slow Mode (10s)"
3. Try sending multiple messages quickly
4. You'll be rate-limited to one message every 10 seconds

#### Clear all messages
1. Click "Clear All Messages" in the moderator controls
2. Confirm the dialog
3. All messages are cleared

## Testing the App

### Run automated tests
```bash
npm test
```

All 33+ tests should pass! ✅

### Manual testing
See `TESTING.md` for a comprehensive manual testing checklist.

## Troubleshooting

### Issue: "Port 3000 is already in use"
**Solution**: Stop the other process or change the port in vite.config.ts

### Issue: "Port 3001 is already in use"
**Solution**: Stop the other process or change PORT in dev-server.js

### Issue: "Cannot connect to server"
**Solution**: 
1. Make sure both servers are running
2. Check the terminal for error messages
3. Restart with `npm run dev`

### Issue: "Video not playing"
**Solution**:
1. Check your internet connection (video uses external HLS stream)
2. Try a different browser
3. Check browser console for errors

### Issue: "Messages not syncing between tabs"
**Solution**:
1. Check that Socket.IO server is running on port 3001
2. Open browser DevTools → Network → WS to see WebSocket connection
3. Restart the servers

### Issue: npm install fails
**Solution**:
1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules: `rm -rf node_modules`
3. Delete package-lock.json: `rm package-lock.json`
4. Try again: `npm install`

## Next Steps

### For Developers
1. Read `README.md` for detailed project overview
2. Check `ARCHITECTURE.md` to understand the code structure
3. Review `app/components/` to see how components work
4. Explore `app/hooks/` to understand custom hooks

### For Testers
1. Follow the manual QA checklist in `TESTING.md`
2. Test all features systematically
3. Try edge cases (connection loss, banned users, etc.)
4. Report any bugs or issues

### For Deployment
1. Read `DEPLOYMENT.md` for production deployment guide
2. Follow the checklist for your chosen platform
3. Set up monitoring and logging
4. Configure environment variables

## Common Use Cases

### Use Case 1: Demo for stakeholders
1. Start the servers
2. Open on laptop + share screen
3. Open on phone as second user
4. Show real-time sync, moderation, announcements

### Use Case 2: Load testing
1. Open 10-20 browser tabs
2. Use different usernames
3. Send messages rapidly
4. Check performance stays smooth

### Use Case 3: Development
1. Start dev servers
2. Open VSCode
3. Make changes to components
4. See hot-reload in browser
5. Write tests as you go

## Keyboard Shortcuts

- **Enter**: Send message
- **Shift+Enter**: New line in message
- **Escape**: (Could add: Close dialogs, cancel actions)

## Tips & Tricks

### Tip 1: Test reconnection
```bash
# In terminal where Socket.IO server is running:
Ctrl+C to stop server
npm run dev:socket to restart
# Watch client reconnect automatically!
```

### Tip 2: Generate test messages
Open browser console and paste:
```javascript
// Send 10 test messages
for(let i = 1; i <= 10; i++) {
  setTimeout(() => {
    const input = document.querySelector('textarea');
    input.value = `Test message ${i}`;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const button = document.querySelector('button[type="submit"]');
    button.click();
  }, i * 200);
}
```

### Tip 3: Test different screen sizes
Open Chrome DevTools → Toggle device toolbar → Test on various devices

### Tip 4: Monitor WebSocket events
Open Chrome DevTools → Network tab → WS filter → See all WebSocket messages

### Tip 5: Check performance
Open Chrome DevTools → Performance tab → Record → Send messages → Stop → Analyze

## FAQ

**Q: Can I use a different video stream?**  
A: Yes! Edit `app/components/VideoPlayer.tsx` and change the `videoUrl` prop.

**Q: How do I add authentication?**  
A: See "Future Enhancements" in README.md for authentication implementation guide.

**Q: Can this handle 1000+ users?**  
A: Current setup handles ~500 users. See DEPLOYMENT.md for scaling to 10K+ users.

**Q: Where are messages stored?**  
A: In-memory on the server. They're lost on restart. See README.md for database persistence.

**Q: How do I customize the theme?**  
A: Edit `tailwind.config.ts` and `app/tailwind.css` for styling changes.

**Q: Can I deploy this to production?**  
A: Yes! See DEPLOYMENT.md for complete production deployment guide.

## Support

- 📖 Documentation: See README.md, ARCHITECTURE.md, DEPLOYMENT.md
- 🧪 Testing: See TESTING.md
- 🐛 Issues: Check terminal logs and browser console
- 💡 Questions: Review the comprehensive documentation

## Success Checklist

- [ ] Node.js 20+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Dev servers running (`npm run dev`)
- [ ] Browser shows chat interface
- [ ] Can send messages in one tab
- [ ] Messages appear in second tab
- [ ] Video player loads and plays
- [ ] All tests pass (`npm test`)

If all checkboxes are ✅, you're ready to go! 🎉

---

**Time to first message**: < 5 minutes  
**Time to understand codebase**: < 30 minutes  
**Time to production**: < 1 day (with DEPLOYMENT.md guide)

Enjoy building! 🚀


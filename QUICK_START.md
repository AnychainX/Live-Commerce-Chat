# Quick Start Guide

Get the Live Shopping Platform running in 5 minutes!

## 🛍️ What This Is

A **live shopping platform** for Shopify merchants (think QVC meets Instagram Live):
- Sellers create rooms to showcase products live
- Buyers watch, chat, and purchase in real-time
- Only sellers can moderate their rooms
- Each room has its own chat, product, and Shopify link

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

### As a Seller (Create a Room)

1. **On the lobby page**, click "Create Room" button
2. **Fill in the form:**
   - Room Name: "Summer Fashion Show"
   - Your Name: "FashionStore"
   - Product Name: "Designer Handbags"
   - Product Description: "Limited edition leather bags"
   - Shopify URL: (leave blank for default)
3. **Click** "Create Room & Go Live"
4. **You're now a host!** You can:
   - See the video with product info
   - Moderate chat (delete, ban, slow mode)
   - Send announcements
   - See "Host" badge

### As a Buyer (Join a Room)

1. **On the lobby page**, click any live room
2. **Enter your username** (e.g., "Shopper123")
3. **Click** "Join Room"
4. **You can now:**
   - Watch the live video
   - Chat with other viewers
   - Click "Buy Now on Shopify" to purchase
   
### Test Multi-Room Features

1. **Tab 1**: Create room as "Seller Alice"
2. **Tab 2**: Join Alice's room as "Buyer Bob"
3. **Tab 3**: Create a different room as "Seller Charlie"
4. **Tab 4**: Join Charlie's room as "Buyer Diana"
5. Each room has independent chat! ✨

## Quick Feature Tour (2 minutes)

### Main Lobby Features
- **Browse rooms**: See all active live shopping streams
- **Room info**: Host name, product, viewer count, message count
- **Create room**: Big button to start your own stream
- **Live badges**: Red "LIVE" indicator on active streams

### Room Features (As Host)

#### Video & Shopping
1. Video player shows your stream (test stream by default)
2. Product card below video shows:
   - Product name
   - Product description
   - "Buy Now on Shopify" button

#### Moderation Controls
1. **Moderator Panel** at top (only hosts see this)
2. **Send announcements**: Check announcement box, send
3. **Delete messages**: Hover over any message → "Delete"
4. **Ban users**: Hover over message → "Ban"
5. **Slow mode**: Toggle in moderator panel
6. **Clear all**: Nuclear option to clear all messages

### Room Features (As Viewer)

#### Shopping
1. Watch live video
2. See product information
3. Click "Buy Now on Shopify" → Opens Shopify in new tab

#### Chatting
1. Type messages in the chat
2. See other viewers' messages
3. See host's announcements (pinned at top)
4. No moderation controls (viewers can't moderate)

### Navigation
- **"Back" button** in room → Returns to lobby
- **"Back to all rooms"** link → Returns to lobby
- **Logo/title** → Could link to lobby (currently doesn't)

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

### Use Case 1: Live Shopping Demo
1. **Tab 1**: Create room as "Fashion Brand"
2. **Tab 2**: Join as buyer "Sarah"
3. **Tab 3**: Join as buyer "Mike"
4. **Demo flow**:
   - Host announces "50% off for next 5 minutes!"
   - Sarah asks "What sizes available?"
   - Host replies "XS to XL in stock!"
   - Mike clicks "Buy Now"
   - Show real-time engagement

### Use Case 2: Moderation Demo
1. **Tab 1**: Create room as host
2. **Tab 2**: Join as viewer, send spam
3. **Tab 1**: Host hovers → "Ban" spammer
4. **Tab 2**: Spammer sees "You are banned"
5. Show how host controls the room

### Use Case 3: Multi-Room Testing
1. Create 3 different rooms
2. Join different rooms in different tabs
3. Show independent chats
4. Show each room has own viewers, messages

### Use Case 4: Development
1. Start dev servers
2. Open VSCode
3. Make changes to components
4. See hot-reload in browser
5. Test across multiple rooms

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
- [ ] Lobby page shows at http://localhost:3000
- [ ] Can create a room
- [ ] Can join room in second tab
- [ ] Host can moderate (delete, ban, etc.)
- [ ] Viewer cannot moderate
- [ ] Messages sync between tabs
- [ ] "Buy Now" button works
- [ ] Video player loads and plays
- [ ] Only chat scrolls, not whole page

If all checkboxes are ✅, you're ready to go! 🎉

## What's Different from Original?

This is a **major evolution** of the original chat system:

| Feature | Original | Live Shopping Version |
|---------|----------|----------------------|
| Rooms | Single global | Multiple rooms ✨ |
| Users | All equal | Host vs Viewers ✨ |
| Moderation | Everyone | Host only ✨ |
| Commerce | None | Buy button + Shopify ✨ |
| Navigation | Direct to chat | Lobby → Rooms ✨ |
| Scrolling | Page scrolls | Only chat scrolls ✨ |

See `CHANGES.md` for complete details!

---

**Time to first message**: < 5 minutes  
**Time to understand codebase**: < 30 minutes  
**Time to production**: < 1 day (with DEPLOYMENT.md guide)

Enjoy building! 🚀


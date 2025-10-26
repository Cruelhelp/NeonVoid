# NEXUS VOID - Multiplayer Quick Start Guide

## 🚀 Get Playing in 2 Minutes!

### Step 1: Install Dependencies (One-Time Setup)

```bash
cd "/home/ruel/astroid game"
npm install
```

### Step 2: Start the Server

```bash
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║     NEXUS VOID - Multiplayer Server   ║
╚════════════════════════════════════════╝
Server running on port 3000
Local: http://localhost:3000
```

### Step 3: Open the Game

Open your browser to: **http://localhost:3000**

---

## 🎮 Playing Multiplayer

### Option 1: Create a Room

1. Click **"MULTIPLAYER"** from main menu
2. Click **"CREATE ROOM"**
3. Enter your name
4. Share the **room code** with friends
5. Wait for players to join
6. Mark **"READY"**
7. Click **"START GAME"** (host only)

### Option 2: Join a Room

1. Click **"MULTIPLAYER"** from main menu
2. Click **"JOIN ROOM"**
3. Enter the **room code** from your friend
4. Enter your name
5. Mark **"READY"**
6. Wait for host to start

### Option 3: Browse Rooms

1. Click **"MULTIPLAYER"** from main menu
2. Click **"BROWSE ROOMS"**
3. See all available rooms
4. Click **"JOIN"** on any room

---

## 🎯 Gameplay Tips

### Combat
- **Aim carefully** - Movement deltas with pointer lock
- **Lead your shots** - Predict enemy movement
- **Strafe** - Use WASD to dodge incoming fire
- **Use chat** - Coordinate with teammates

### Survival
- **Watch your health** - Top-left HUD
- **Avoid fire** - Enemy bullets deal 15-25 damage
- **Respawn quickly** - 5-second timer or manual respawn
- **Learn patterns** - Each ship has different speeds

### Scoring
- **1 Kill = 100 Points**
- **Most kills wins**
- **Deaths tracked separately**
- **Score persists for match duration**

---

## 💬 Chat Commands

Press **Enter** to open chat, type message, press **Enter** to send.

**Tips:**
- Keep messages short
- Use for strategy
- Be respectful
- Have fun!

---

## 🔧 Troubleshooting

### "Can't connect to server"
```bash
# Make sure server is running
npm start

# Check if port 3000 is in use
lsof -i :3000
```

### "Room not found"
- Double-check room code
- Room may have started already
- Room may have been deleted (empty rooms auto-delete)

### "Game already in progress"
- Room has started the match
- Wait for next round or create new room

### Lag/Delay
- Check internet connection
- Server may be on different network
- Try hosting locally
- Close other applications

---

## 🌐 Playing with Friends

### Same Network (LAN)
1. Start server on one computer
2. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Friends open: `http://YOUR_IP:3000`
4. Play together!

### Over Internet
**Option 1: Port Forwarding**
1. Forward port 3000 on router
2. Find public IP: https://whatismyipaddress.com
3. Friends use: `http://YOUR_PUBLIC_IP:3000`

**Option 2: ngrok (Easiest)**
```bash
# Install ngrok from: https://ngrok.com
npm install -g ngrok

# Start server
npm start

# In new terminal, run:
ngrok http 3000

# Share the ngrok URL with friends
```

**Option 3: Cloud Deployment**
See [MULTIPLAYER-COMPLETE.md](MULTIPLAYER-COMPLETE.md) for Heroku, AWS, DigitalOcean deployment.

---

## 📊 Server Stats

- **Max Players per Room**: 4
- **Update Rate**: 20 Hz (50ms)
- **Max Rooms**: Unlimited
- **Auto-Cleanup**: Inactive rooms deleted after 5 min
- **Chat History**: 50 messages

---

## ⚙️ Advanced Configuration

### Change Server Port

```bash
PORT=8080 npm start
```

### Production Mode

```bash
NODE_ENV=production npm start
```

### Using PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start server.js --name nexus-void
pm2 logs nexus-void
pm2 restart nexus-void
pm2 stop nexus-void
```

---

## 🎮 Game Modes

### Free-For-All (FFA)
- 2-4 players
- Everyone vs everyone
- Most kills wins
- Respawn enabled

### Team Deathmatch (Coming Soon)
- 2v2 teams
- Team score tracking
- Friendly fire off
- Team chat

### Capture the Flag (Coming Soon)
- Objective-based
- Flag capture mechanics
- Base defense
- Power-ups

---

## 🐛 Known Issues

1. **First respawn may be slow** - Server warmup
2. **Occasional desync** - Refresh if stuck
3. **Chat can overlap game** - Press ESC to pause
4. **Nametags may flicker** - Rendering optimization needed

---

## 🎉 Quick Tips for Best Experience

✅ **Use a modern browser** (Chrome, Firefox, Edge)
✅ **Stable internet connection** (WiFi or Ethernet)
✅ **Close unnecessary tabs** (reduce lag)
✅ **Fullscreen mode** (F11 for immersion)
✅ **Customize your ship** (before joining room)
✅ **Use headphones** (better audio experience)
✅ **Communicate** (use chat for strategy)

---

## 📞 Need Help?

**Documentation:**
- Full Guide: [MULTIPLAYER-COMPLETE.md](MULTIPLAYER-COMPLETE.md)
- Project Overview: [COMPLETE-PROJECT-SUMMARY.md](COMPLETE-PROJECT-SUMMARY.md)
- Main README: [README.md](README.md)

**Support:**
- Email: ruelmcneil@nexusvoid.game
- GitHub Issues: [Report Bug]

---

## 🏆 Enjoy the Game!

**NEXUS VOID** is now a complete multiplayer experience. Gather your friends, create a room, and battle it out in space!

*Remember: In the void, only skill matters.*

---

**Built by Ruel McNeil - 2025**
**Version 3.0 - Multiplayer Edition**

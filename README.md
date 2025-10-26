# NEXUS VOID - AAA 3D Space Combat Game

> The ultimate browser-based space combat experience with custom 3D software rendering + Real-Time Multiplayer PvP

![Version](https://img.shields.io/badge/version-3.0.0-cyan) ![Status](https://img.shields.io/badge/status-Multiplayer%20Ready-success) ![Players](https://img.shields.io/badge/players-up%20to%204-blue)

## 🎮 Overview

NEXUS VOID is a fully-featured 3D space combat game built entirely from scratch using vanilla JavaScript. No game engines, no 3D libraries - just pure code and mathematics. Now featuring **real-time multiplayer PvP battles** powered by Socket.io!

### Key Features

✨ **Custom 3D Software Renderer** - Built from the ground up
🌐 **Real-Time Multiplayer PvP** - Up to 4 players per room
🚀 **6 Unique Ships** - Each with distinct stats and abilities
⚔️ **4 Weapon Types** - Laser, Plasma, Missile, and Cannon
🤖 **AI Enemy Ships** - Progressive difficulty and behaviors (Singleplayer)
💪 **Health Bar System** - Real damage calculation with armor
🎯 **Room System** - Create, join, or browse game rooms
💬 **Real-Time Chat** - Communicate with other players
📊 **Kill/Death Tracking** - Score system and leaderboards
🎨 **AAA UI/UX** - Polygonal theme with smooth animations
🌐 **Landing Page** - Professional game showcase

## 🏗️ Project Structure

```
nexus-void/
├── index.html              # AAA Landing Page
├── game.html               # Game Entry Point
├── privacy.html            # Privacy Policy
├── terms.html              # Terms of Service
├── landing-style.css       # Landing Page Styles
├── landing-script.js       # Landing Page Scripts
├── game-style.css          # Game UI Styles
├── game-script.js          # Core Game Engine (1700+ lines)
├── game-config.js          # Game Configuration
├── game-enhancements.js    # Ship Preview & Stats
├── game-mechanics-upgrade.js # Health, AI, Weapons
├── game-ui-overhaul.js     # Fullscreen & Pointer Lock
├── game-multiplayer.js     # Multiplayer Client (550 lines)
├── server.js               # Node.js Multiplayer Server (470 lines)
├── package.json            # NPM Dependencies
├── setup.sh                # Quick Setup Script
├── .gitignore              # Git Ignore Rules
└── docs/
    ├── README.md           # This file
    ├── MULTIPLAYER-COMPLETE.md # Multiplayer Documentation
    ├── FINAL-FIXES-COMPLETE.md # Bug Fixes Documentation
    ├── AI-ENEMIES-COMPLETE.md  # AI System Documentation
    └── COMPLETE-PROJECT-SUMMARY.md # Full Project Overview
```

## 🎯 Game Mechanics

### Ship Types & Stats

| Ship | Speed | Armor | Damage | Health | Weapon |
|------|-------|-------|--------|--------|--------|
| **Interceptor** | 500 | 80 | 100 | 100 | Laser |
| **Fighter** | 400 | 120 | 120 | 120 | Plasma |
| **Bomber** | 300 | 100 | 200 | 100 | Missile |
| **Cruiser** | 350 | 180 | 110 | 150 | Laser |
| **Stealth** | 550 | 60 | 90 | 80 | Plasma |
| **Tank** | 250 | 250 | 130 | 200 | Cannon |

### Weapon Systems

- **Laser**: Fast, precise, standard damage
- **Plasma**: Moderate speed, increased damage
- **Missile**: Slow, explosive, high damage
- **Cannon**: Piercing rounds, medium-high damage

### Enemy AI

- **Scout**: Fast, weak, low aggression
- **Fighter**: Balanced, moderate aggression
- **Heavy**: Slow, tanky, high aggression

Enemies spawn from Level 3+ and become more aggressive each level.

## 🚀 Getting Started

### Singleplayer (No Setup Required)

1. Clone or download the repository
2. Open `index.html` in a modern browser
3. Click "PLAY NOW" or navigate to `game.html`
4. Select "SINGLEPLAYER" from main menu

No build process or dependencies required for singleplayer!

### Multiplayer (Server Required)

**Quick Setup:**
```bash
cd "/path/to/astroid game"
./setup.sh
npm start
```

**Manual Setup:**
```bash
# Install dependencies
npm install

# Start server
npm start

# Open browser to http://localhost:3000
```

**Playing Multiplayer:**
1. Start the server (see above)
2. Open http://localhost:3000 in browser
3. Click "MULTIPLAYER" from main menu
4. Create a room or join existing room
5. Wait for players and start the match!

**For detailed multiplayer setup, see [MULTIPLAYER-COMPLETE.md](MULTIPLAYER-COMPLETE.md)**

### Controls

- **WASD** - Move your ship
- **Mouse** - Aim
- **Left Click** - Shoot
- **ESC** - Pause game
- **Enter** - Send chat message (multiplayer)

## 🎨 Customization

Access ship customization from the main menu:

1. Choose from 10 color schemes
2. Select one of 6 ship types
3. View ship stats in real-time
4. See 3D preview with rotation

## 📊 Leaderboard System

- **Daily Rankings**: Reset every 24 hours
- **Weekly Rankings**: Reset every Monday
- **All-Time Rankings**: Permanent records

*Note: Currently frontend-only. Backend integration coming soon.*

## 🔧 Technical Details

### 3D Rendering Pipeline

1. **Vertex Transformations**: Rotation → Scale → Translation
2. **Camera Transformations**: World space → Camera space
3. **Projection**: Perspective divide for 2D screen
4. **Z-Sorting**: Painter's algorithm for depth
5. **Rasterization**: Wireframe or filled polygons
6. **Post-Processing**: Bloom effects

### Performance

- **Resolution**: 1200x800 (configurable)
- **Target FPS**: 60
- **Render Mode**: Wireframe with bloom
- **Polygons**: ~100-500 per frame

## 👨‍💻 Developer

**Ruel McNeil**
Solo AI Context Engineer & Web Developer
📍 Jamaica

Specializing in AI-driven development and immersive web applications.

## 📜 License

© 2025 Ruel McNeil. All rights reserved.

## 🗺️ Roadmap

### Phase 1: Core Game ✅
- [x] Custom 3D renderer
- [x] Ship customization
- [x] Health bar system
- [x] AI enemies
- [x] Weapon types
- [x] Progressive difficulty
- [x] Landing page

### Phase 2: Multiplayer (In Progress)
- [ ] Node.js backend
- [ ] WebSocket integration
- [ ] 1v1 PvP mode
- [ ] Matchmaking system
- [ ] Global chat

### Phase 3: Social Features
- [ ] User authentication
- [ ] Player profiles
- [ ] Friend system
- [ ] Guilds/Clans
- [ ] Tournaments

### Phase 4: Content Expansion
- [ ] More ships (10+ total)
- [ ] Power-ups
- [ ] Boss battles
- [ ] Campaign mode
- [ ] Custom arenas

## 🐛 Known Issues

- None currently reported!

## 📞 Contact

For questions, feedback, or bug reports:
- Email: ruelmcneil@nexusvoid.game
- GitHub: [Report Issue](#)

## 🙏 Acknowledgments

- Easing functions from [easings.net](https://easings.net)
- Fonts from Google Fonts (Orbitron, Rajdhani)
- Inspiration from classic arcade games

---

**Built with ❤️ and lots of coffee ☕**

*"In the void, only skill matters."*

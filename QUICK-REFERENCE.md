# NEXUS VOID - Quick Reference Guide

## 🚀 Launch Game
```bash
cd "/home/ruel/astroid game"
xdg-open index.html
```

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| **W/A/S/D** | Move ship |
| **Mouse** | Aim weapon |
| **Left Click** | Fire weapon |
| **ESC** | Pause/Resume |

---

## 🎯 Game Flow

```
Landing Page → Main Menu → Customize (optional) → Play
                    ↓
           ESC → Pause Menu → Resume/Quit
                    ↓
         Level Complete → Next Level (x10)
                    ↓
              Victory or Game Over
```

---

## 🛠️ Project Files

### Essential:
- `index.html` - Landing page (start here)
- `game.html` - Game itself
- `game-script.js` - Core engine (1365 lines)
- `game-style.css` - Game UI styles

### Extensions:
- `game-ui-overhaul.js` - Fullscreen/pointer lock
- `game-mechanics-upgrade.js` - Health/AI/weapons
- `game-enhancements.js` - Ship preview
- `game-config.js` - Ship/weapon stats

### Landing:
- `landing-style.css` - Homepage styles
- `landing-script.js` - Homepage animations

---

## 🎨 Customization

### Ship Types:
1. **Interceptor** - Fast, low armor
2. **Fighter** - Balanced
3. **Bomber** - High damage, slow
4. **Cruiser** - Heavy armor
5. **Stealth** - Ultra-fast, fragile
6. **Tank** - Maximum armor, slow

### Colors:
Cyan, Green, Blue, Purple, Pink, Red, Orange, Yellow, White, Gold

---

## 🐛 Troubleshooting

### Game won't load?
```bash
# Check browser console (F12)
# Clear cache (Ctrl+Shift+Del)
# Try different browser
```

### Cursor not hiding?
- Click canvas to activate pointer lock
- Check browser permissions
- Try fullscreen (F11)

### Preview too large?
- Preview canvas now locked to 300x300
- Should fit perfectly in blue border
- If not, check CSS `!important` rules

### Can't pause?
- Press ESC during gameplay
- Should work repeatedly now
- Check console for errors

---

## 📊 Stats

- **Ships:** 6 types
- **Weapons:** 4 types
- **Enemies:** 3 types
- **Levels:** 10
- **Colors:** 10
- **Animations:** 15+

---

## 🎯 Quick Tests

```bash
# Test 1: Landing page
xdg-open index.html
# ✓ See ship logo
# ✓ See animated illustration
# ✓ Audiowide font

# Test 2: Gameplay
# Click START MISSION
# ✓ Fullscreen activates
# ✓ Mouse hides
# ✓ Crosshair appears

# Test 3: Pause
# Press ESC
# ✓ Game pauses
# ✓ Cursor shows
# Press ESC again
# ✓ Game resumes
# ✓ Cursor hides

# Test 4: Customization
# Click CUSTOMIZE SHIP
# ✓ Preview in blue box
# ✓ No overflow
# ✓ Different shapes per ship
```

---

## 📁 Documentation

1. `README.md` - Project overview
2. `FEATURES.md` - Complete feature list
3. `QUICKSTART.md` - Beginner guide
4. `COMPLETE-PROJECT-SUMMARY.md` - Full summary
5. `QUICK-REFERENCE.md` - This file

---

## 🔑 Key Features

✅ Custom 3D engine
✅ Fullscreen gameplay
✅ Pointer lock
✅ 6 ship types
✅ 4 weapon types
✅ AI enemies
✅ 10 levels
✅ Low-poly branding
✅ Persistent pause
✅ Ship customization

---

## 🎨 Branding

- **Font:** Audiowide (all headings)
- **Colors:** Cyan (#00ffff), Green (#00ff88), Blue (#0088ff)
- **Logo:** Hexagon with low-poly ship
- **Theme:** Futuristic low-poly tech

---

## 🚀 Next Steps

1. Open `index.html`
2. Click "START MISSION"
3. Enjoy the game!

---

**Quick help:** Check browser console (F12) for any errors
**Full docs:** See other .md files in project folder
**Contact:** ruelmcneil@nexusvoid.game

---

*Built by Ruel McNeil - 2025*

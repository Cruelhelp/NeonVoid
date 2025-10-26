/**
 * NEON VOID - Game Enhancements
 * Advanced features: Health bars, AI enemies, weapon types, ship stats
 * This file extends the base game with AAA features
 */

// Import ship stats from config
const SHIP_STATS = {
   'Interceptor': { speed: 500, armor: 80, damage: 100, fireRate: 0.12, health: 100, weaponType: 'laser' },
   'Fighter': { speed: 400, armor: 120, damage: 120, fireRate: 0.15, health: 120, weaponType: 'plasma' },
   'Bomber': { speed: 300, armor: 100, damage: 200, fireRate: 0.25, health: 100, weaponType: 'missile' },
   'Cruiser': { speed: 350, armor: 180, damage: 110, fireRate: 0.18, health: 150, weaponType: 'laser' },
   'Stealth': { speed: 550, armor: 60, damage: 90, fireRate: 0.10, health: 80, weaponType: 'plasma' },
   'Tank': { speed: 250, armor: 250, damage: 130, fireRate: 0.20, health: 200, weaponType: 'cannon' }
};

const WEAPON_TYPES = {
   'laser': { name: 'Laser', color: '#00ffff', speed: 1200, size: 8, damage: 1, piercing: false },
   'plasma': { name: 'Plasma', color: '#00ff88', speed: 1000, size: 12, damage: 1.2, piercing: false },
   'missile': { name: 'Missile', color: '#ff8800', speed: 800, size: 15, damage: 2, piercing: false, explosive: true },
   'cannon': { name: 'Cannon', color: '#ff0044', speed: 900, size: 14, damage: 1.5, piercing: true }
};

const ENEMY_TYPES = {
   'Scout': { speed: 200, health: 50, damage: 10, color: '#ff00ff', size: 15, fireRate: 2, aggression: 0.3 },
   'Fighter': { speed: 150, health: 80, damage: 15, color: '#ff0088', size: 18, fireRate: 1.5, aggression: 0.5 },
   'Heavy': { speed: 100, health: 150, damage: 25, color: '#ff4400', size: 25, fireRate: 3, aggression: 0.7 }
};

// Enhanced Game State
window.gameEnhancements = {
   playerHealth: 100,
   maxHealth: 100,
   shield: 0,
   maxShield: 0,
   weaponType: 'laser',
   enemies: [],
   powerups: []
};

// Add ship preview to customization
function createShipPreview() {
   const previewContainer = document.getElementById('ship-preview');
   if (!previewContainer) return;

   const previewCanvas = document.createElement('canvas');
   previewCanvas.width = 300;
   previewCanvas.height = 300;
   previewCanvas.id = 'preview-canvas';
   previewContainer.innerHTML = '';
   previewContainer.appendChild(previewCanvas);

   // Use ship-specific preview from game-ui-overhaul.js
   const shipType = window.gameState?.playerConfig?.shipType || 'Interceptor';
   const color = window.gameState?.playerConfig?.color || '#00ff88';

   if (typeof window.createShipPreviewFixed === 'function') {
      window.createShipPreviewFixed(shipType, color);
   }
}

// Update customization to show stats
function enhanceCustomization() {
   const colorOptions = document.querySelectorAll('.color-option');
   const shipOptions = document.querySelectorAll('.ship-option');

   colorOptions.forEach(option => {
      option.addEventListener('click', () => {
         createShipPreview();
      });
   });

   shipOptions.forEach(option => {
      option.addEventListener('click', () => {
         createShipPreview();
         updateShipStatsDisplay();
      });
   });

   createShipPreview();
}

function updateShipStatsDisplay() {
   const shipType = window.gameState?.playerConfig?.shipType || 'Interceptor';
   const stats = SHIP_STATS[shipType];
   
   // Add stats display to customization
   let statsDisplay = document.getElementById('ship-stats-display');
   if (!statsDisplay) {
      statsDisplay = document.createElement('div');
      statsDisplay.id = 'ship-stats-display';
      statsDisplay.style.cssText = `
         margin-top: 20px;
         padding: 20px;
         background: rgba(0, 40, 80, 0.3);
         border: 2px solid rgba(0, 255, 255, 0.3);
         border-radius: 10px;
      `;
      document.querySelector('.custom-options')?.appendChild(statsDisplay);
   }

   statsDisplay.innerHTML = `
      <h4 style="color: #00ffff; margin-bottom: 15px; font-family: Orbitron;">Ship Statistics</h4>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; color: rgba(255,255,255,0.8);">
         <div>
            <div style="font-size: 12px; color: rgba(0,255,255,0.7);">SPEED</div>
            <div style="font-size: 20px; font-weight: 700; color: #00ffff;">${stats.speed}</div>
            <div class="stat-bar"><div style="width: ${(stats.speed/600)*100}%; background: #00ffff;"></div></div>
         </div>
         <div>
            <div style="font-size: 12px; color: rgba(0,255,255,0.7);">ARMOR</div>
            <div style="font-size: 20px; font-weight: 700; color: #00ffff;">${stats.armor}</div>
            <div class="stat-bar"><div style="width: ${(stats.armor/300)*100}%; background: #00ff88;"></div></div>
         </div>
         <div>
            <div style="font-size: 12px; color: rgba(0,255,255,0.7);">DAMAGE</div>
            <div style="font-size: 20px; font-weight: 700; color: #00ffff;">${stats.damage}</div>
            <div class="stat-bar"><div style="width: ${(stats.damage/200)*100}%; background: #ff8800;"></div></div>
         </div>
         <div>
            <div style="font-size: 12px; color: rgba(0,255,255,0.7);">HEALTH</div>
            <div style="font-size: 20px; font-weight: 700; color: #00ffff;">${stats.health}</div>
            <div class="stat-bar"><div style="width: ${(stats.health/200)*100}%; background: #ff0044;"></div></div>
         </div>
      </div>
      <div style="margin-top: 15px; padding: 10px; background: rgba(0,255,255,0.1); border-radius: 5px;">
         <strong style="color: #00ff88;">Weapon:</strong> ${WEAPON_TYPES[stats.weaponType].name}
      </div>
   `;
}

// Add CSS for stat bars
const statBarStyle = document.createElement('style');
statBarStyle.textContent = `
   .stat-bar {
      width: 100%;
      height: 4px;
      background: rgba(0,255,255,0.2);
      border-radius: 2px;
      margin-top: 5px;
      overflow: hidden;
   }
   .stat-bar > div {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s ease;
   }
`;
document.head.appendChild(statBarStyle);

// Initialize enhancements when DOM is ready
if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', () => {
      setTimeout(enhanceCustomization, 500);
   });
} else {
   setTimeout(enhanceCustomization, 500);
}

console.log('%c⚡ Game Enhancements Loaded', 'color: #00ff88; font-weight: bold; font-size: 14px;');

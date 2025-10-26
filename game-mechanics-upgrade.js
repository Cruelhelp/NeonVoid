/**
 * NEON VOID - Advanced Game Mechanics
 * This file patches the game with health bars, AI enemies, weapons, and more
 * Load this AFTER game-script.js
 */

// Override/extend game initialization
(function() {
   'use strict';

   console.log('%c⚡ Advanced Mechanics Loading...', 'color: #00ffff; font-weight: bold;');

   // Ship Stats Configuration
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

   // Enhanced Player Stats
   const originalStartGame = window.startGame;
   if (originalStartGame) {
      window.startGame = function() {
         originalStartGame();

         // Initialize player health system
         const stats = SHIP_STATS[gameState.playerConfig.shipType];
         gameState.playerHealth = stats.health;
         gameState.maxHealth = stats.health;
         gameState.playerShield = 0;
         gameState.maxShield = stats.armor / 2;

         updateHealthBar();
         addHealthBarToHUD();
         addWeaponDisplay();
         addControlsToMenu();

         console.log('%c✓ Health system initialized', 'color: #00ff88;');
      };
   }

   // Add Health Bar to HUD
   function addHealthBarToHUD() {
      const hudPanel = document.querySelector('.hud-top');
      if (!hudPanel) return;

      let healthPanel = document.getElementById('health-panel');
      if (!healthPanel) {
         healthPanel = document.createElement('div');
         healthPanel.id = 'health-panel';
         healthPanel.className = 'hud-panel health-container';
         healthPanel.innerHTML = `
            <div class="hud-label">Health</div>
            <div class="health-bar-wrapper">
               <div class="health-bar" id="player-health-bar" style="width: 100%;"></div>
               <div class="health-text" id="health-text">100/100</div>
            </div>
            <div class="shield-bar-wrapper" id="shield-wrapper" style="display: none;">
               <div class="shield-bar" id="player-shield-bar" style="width: 100%;"></div>
            </div>
            <div class="ship-stats-mini">
               <div class="stat-mini">
                  <div class="stat-mini-label">Speed</div>
                  <div class="stat-mini-value" id="stat-speed">500</div>
               </div>
               <div class="stat-mini">
                  <div class="stat-mini-label">Armor</div>
                  <div class="stat-mini-value" id="stat-armor">100</div>
               </div>
               <div class="stat-mini">
                  <div class="stat-mini-label">Damage</div>
                  <div class="stat-mini-value" id="stat-damage">100</div>
               </div>
            </div>
         `;
         hudPanel.insertBefore(healthPanel, hudPanel.firstChild);

         // Update stats display
         const stats = SHIP_STATS[gameState.playerConfig.shipType] || SHIP_STATS['Interceptor'];
         document.getElementById('stat-speed').textContent = stats.speed;
         document.getElementById('stat-armor').textContent = stats.armor;
         document.getElementById('stat-damage').textContent = stats.damage;
      }
   }

   // Add Weapon Display
   function addWeaponDisplay() {
      const hudPanel = document.querySelector('.hud-top');
      if (!hudPanel) return;

      let weaponPanel = document.getElementById('weapon-panel');
      if (!weaponPanel) {
         weaponPanel = document.createElement('div');
         weaponPanel.id = 'weapon-panel';
         weaponPanel.className = 'hud-panel weapon-display';

         const stats = SHIP_STATS[gameState.playerConfig.shipType] || SHIP_STATS['Interceptor'];
         const weapon = WEAPON_TYPES[stats.weaponType];

         weaponPanel.innerHTML = `
            <div class="hud-label">Weapon</div>
            <div class="weapon-name" id="weapon-name">${weapon.name}</div>
            <div style="font-size: 12px; color: rgba(0,255,255,0.7);">
               Damage: ${Math.round(weapon.damage * stats.damage)}
            </div>
         `;
         hudPanel.appendChild(weaponPanel);
      }
   }

   // Update Health Bar
   function updateHealthBar() {
      const healthBar = document.getElementById('player-health-bar');
      const healthText = document.getElementById('health-text');
      const shieldBar = document.getElementById('player-shield-bar');
      const shieldWrapper = document.getElementById('shield-wrapper');

      if (healthBar && healthText) {
         const healthPercent = (gameState.playerHealth / gameState.maxHealth) * 100;
         healthBar.style.width = healthPercent + '%';
         healthText.textContent = Math.round(gameState.playerHealth) + '/' + gameState.maxHealth;

         // Add visual states
         healthBar.classList.remove('low', 'critical');
         if (healthPercent < 30) {
            healthBar.classList.add('critical');
         } else if (healthPercent < 50) {
            healthBar.classList.add('low');
         }
      }

      if (shieldBar && shieldWrapper && gameState.maxShield > 0) {
         const shieldPercent = (gameState.playerShield / gameState.maxShield) * 100;
         shieldBar.style.width = shieldPercent + '%';
         shieldWrapper.style.display = 'block';
      }
   }

   // Damage System
   window.damagePlayer = function(amount) {
      const stats = SHIP_STATS[gameState.playerConfig.shipType] || SHIP_STATS['Interceptor'];
      const damageReduction = stats.armor / 1000; // Armor reduces damage
      const actualDamage = amount * (1 - damageReduction);

      // Shield absorbs damage first
      if (gameState.playerShield > 0) {
         gameState.playerShield -= actualDamage;
         if (gameState.playerShield < 0) {
            gameState.playerHealth += gameState.playerShield; // Overflow to health
            gameState.playerShield = 0;
         }
      } else {
         gameState.playerHealth -= actualDamage;
      }

      updateHealthBar();

      // Show damage number
      showDamageNumber(actualDamage);

      // Check for death
      if (gameState.playerHealth <= 0) {
         gameState.playerHealth = 0;
         updateHealthBar();
         if (typeof gameOver === 'function') {
            gameOver();
         }
      }
   };

   // Show Damage Numbers
   function showDamageNumber(damage) {
      const damageEl = document.createElement('div');
      damageEl.className = 'damage-number';
      damageEl.textContent = '-' + Math.round(damage);
      damageEl.style.left = '50%';
      damageEl.style.top = '40%';
      document.body.appendChild(damageEl);

      setTimeout(function() {
         damageEl.remove();
      }, 1000);
   }

   // Add Controls to Main Menu
   function addControlsToMenu() {
      const mainMenu = document.getElementById('main-menu');
      if (!mainMenu) return;

      let controlsPanel = document.getElementById('menu-controls');
      if (!controlsPanel && mainMenu.querySelector('.menu-buttons')) {
         controlsPanel = document.createElement('div');
         controlsPanel.id = 'menu-controls';
         controlsPanel.className = 'menu-controls-panel';
         controlsPanel.innerHTML = `
            <h3 style="font-family: Orbitron; color: #00ffff; text-align: center; margin-bottom: 20px;">CONTROLS</h3>
            <div class="controls-grid">
               <div class="control-item">
                  <div class="control-key">W</div>
                  <div class="control-desc">Move Forward</div>
               </div>
               <div class="control-item">
                  <div class="control-key">S</div>
                  <div class="control-desc">Move Backward</div>
               </div>
               <div class="control-item">
                  <div class="control-key">A</div>
                  <div class="control-desc">Move Left</div>
               </div>
               <div class="control-item">
                  <div class="control-key">D</div>
                  <div class="control-desc">Move Right</div>
               </div>
               <div class="control-item">
                  <div class="control-key">🖱️</div>
                  <div class="control-desc">Aim</div>
               </div>
               <div class="control-item">
                  <div class="control-key">LMB</div>
                  <div class="control-desc">Shoot</div>
               </div>
            </div>
         `;
         mainMenu.appendChild(controlsPanel);
      }
   }

   // Export for use elsewhere
   window.SHIP_STATS = SHIP_STATS;
   window.WEAPON_TYPES = WEAPON_TYPES;
   window.ENEMY_TYPES = ENEMY_TYPES;

   console.log('%c✓ Advanced Mechanics Loaded Successfully!', 'color: #00ff88; font-weight: bold;');
})();

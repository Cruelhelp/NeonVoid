/**
 * NEON VOID - UI Overhaul
 * Fullscreen, Pointer Lock, Low-Poly Menu System
 */

(function() {
   'use strict';

   console.log('%c🎨 UI Overhaul Loading...', 'color: #00ffff; font-weight: bold;');

   let isPointerLocked = false;
   let isFullscreen = false;

   // Fullscreen Management
   function enterFullscreen() {
      const elem = document.documentElement;

      if (elem.requestFullscreen) {
         elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
         elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
         elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
         elem.msRequestFullscreen();
      }

      isFullscreen = true;
   }

   function exitFullscreen() {
      if (document.exitFullscreen) {
         document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
         document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
         document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
         document.msExitFullscreen();
      }

      isFullscreen = false;
   }

   // Pointer Lock Management
   function lockPointer() {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      canvas.requestPointerLock = canvas.requestPointerLock ||
                                  canvas.mozRequestPointerLock ||
                                  canvas.webkitRequestPointerLock;

      canvas.requestPointerLock();
   }

   function unlockPointer() {
      document.exitPointerLock = document.exitPointerLock ||
                                 document.mozExitPointerLock ||
                                 document.webkitExitPointerLock;

      document.exitPointerLock();
   }

   // Pointer Lock Event Listeners
   document.addEventListener('pointerlockchange', handlePointerLockChange);
   document.addEventListener('mozpointerlockchange', handlePointerLockChange);
   document.addEventListener('webkitpointerlockchange', handlePointerLockChange);

   function handlePointerLockChange() {
      const canvas = document.querySelector('canvas');
      isPointerLocked = document.pointerLockElement === canvas ||
                       document.mozPointerLockElement === canvas ||
                       document.webkitPointerLockElement === canvas;

      // Show/hide cursor indicator and update canvas cursor
      updateCursorIndicator();

      if (canvas) {
         // When pointer is locked, ensure cursor is hidden
         // When unlocked (paused), allow default cursor to show
         canvas.style.cursor = isPointerLocked ? 'none' : 'default';
      }
   }

   // Custom Cursor Indicator (crosshair)
   function createCursorIndicator() {
      let indicator = document.getElementById('cursor-indicator');
      if (indicator) return;

      indicator = document.createElement('div');
      indicator.id = 'cursor-indicator';
      indicator.style.cssText = `
         position: fixed;
         top: 50%;
         left: 50%;
         transform: translate(-50%, -50%);
         width: 30px;
         height: 30px;
         pointer-events: none;
         z-index: 10000;
         display: none;
      `;

      indicator.innerHTML = `
         <svg width="30" height="30" viewBox="0 0 30 30">
            <circle cx="15" cy="15" r="2" fill="none" stroke="#00ffff" stroke-width="2"/>
            <line x1="15" y1="0" x2="15" y2="10" stroke="#00ffff" stroke-width="2"/>
            <line x1="15" y1="20" x2="15" y2="30" stroke="#00ffff" stroke-width="2"/>
            <line x1="0" y1="15" x2="10" y2="15" stroke="#00ffff" stroke-width="2"/>
            <line x1="20" y1="15" x2="30" y2="15" stroke="#00ffff" stroke-width="2"/>
         </svg>
      `;

      document.body.appendChild(indicator);
   }

   function updateCursorIndicator() {
      const indicator = document.getElementById('cursor-indicator');
      if (indicator) {
         indicator.style.display = isPointerLocked ? 'block' : 'none';
      }
   }

   // Override start game to enable fullscreen and pointer lock
   const originalStartGame = window.startGame;
   if (originalStartGame) {
      window.startGame = function() {
         originalStartGame();

         // Remove old controls panel
         const controlsInfo = document.querySelector('.controls-info');
         if (controlsInfo) controlsInfo.remove();

         // Enter fullscreen
         setTimeout(enterFullscreen, 100);

         // Create cursor indicator
         createCursorIndicator();

         // Lock pointer after canvas click
         const canvas = document.querySelector('canvas');
         if (canvas) {
            // Hide cursor on canvas
            canvas.style.cursor = 'none';

            // Auto-lock pointer when game starts
            setTimeout(() => {
               if (!gameState.isPaused) {
                  lockPointer();
               }
            }, 500);

            canvas.addEventListener('click', function() {
               if (!isPointerLocked && !gameState.isPaused) {
                  lockPointer();
               }
            });
         }

         // Create in-game menu
         createInGameMenu();

         console.log('%c✓ Fullscreen & Pointer Lock Ready', 'color: #00ff88;');
      };
   }

   // Create Low-Poly In-Game Menu
   function createInGameMenu() {
      // Remove if exists
      const existingMenu = document.getElementById('ingame-menu');
      if (existingMenu) existingMenu.remove();

      const menu = document.createElement('div');
      menu.id = 'ingame-menu';
      menu.className = 'ingame-menu';
      menu.innerHTML = `
         <button class="poly-menu-btn" id="menu-btn-pause" title="Pause (ESC)">
            <svg width="20" height="20" viewBox="0 0 20 20">
               <rect x="5" y="4" width="3" height="12" fill="currentColor"/>
               <rect x="12" y="4" width="3" height="12" fill="currentColor"/>
            </svg>
         </button>
         <button class="poly-menu-btn" id="menu-btn-sound" title="Toggle Sound">
            <svg width="20" height="20" viewBox="0 0 20 20">
               <polygon points="5,7 5,13 9,13 14,16 14,4 9,7" fill="currentColor"/>
               <path d="M 16 8 Q 17 10 16 12" stroke="currentColor" fill="none" stroke-width="2"/>
            </svg>
         </button>
         <button class="poly-menu-btn" id="menu-btn-fullscreen" title="Toggle Fullscreen">
            <svg width="20" height="20" viewBox="0 0 20 20">
               <polyline points="14,6 18,6 18,10" fill="none" stroke="currentColor" stroke-width="2"/>
               <polyline points="6,14 2,14 2,10" fill="none" stroke="currentColor" stroke-width="2"/>
               <polyline points="14,14 18,14 18,10" fill="none" stroke="currentColor" stroke-width="2"/>
               <polyline points="6,6 2,6 2,10" fill="none" stroke="currentColor" stroke-width="2"/>
            </svg>
         </button>
         <button class="poly-menu-btn" id="menu-btn-exit" title="Exit to Menu">
            <svg width="20" height="20" viewBox="0 0 20 20">
               <polygon points="10,2 18,10 10,18 2,10" fill="none" stroke="currentColor" stroke-width="2"/>
               <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" stroke-width="2"/>
               <polyline points="11,7 14,10 11,13" fill="none" stroke="currentColor" stroke-width="2"/>
            </svg>
         </button>
      `;

      document.body.appendChild(menu);

      // Event listeners
      document.getElementById('menu-btn-pause').addEventListener('click', handlePauseClick);
      document.getElementById('menu-btn-sound').addEventListener('click', toggleSound);
      document.getElementById('menu-btn-fullscreen').addEventListener('click', toggleFullscreen);
      document.getElementById('menu-btn-exit').addEventListener('click', exitToMenu);
   }

   function handlePauseClick() {
      if (typeof window.togglePause === 'function') {
         window.togglePause();
         if (gameState.isPaused) {
            unlockPointer();
         }
      }
   }

   function toggleSound() {
      // TODO: Implement sound system
      const btn = document.getElementById('menu-btn-sound');
      btn.classList.toggle('muted');
      console.log('Sound toggled');
   }

   function toggleFullscreen() {
      if (isFullscreen) {
         exitFullscreen();
      } else {
         enterFullscreen();
      }
   }

   function exitToMenu() {
      unlockPointer();
      exitFullscreen();

      if (typeof window.returnToMenu === 'function') {
         window.returnToMenu();
      }
   }

   // Monitor pause state changes to handle pointer lock
   let lastPauseState = false;
   setInterval(() => {
      if (typeof gameState !== 'undefined' && gameState.isPaused !== lastPauseState) {
         lastPauseState = gameState.isPaused;

         if (gameState.isPaused) {
            unlockPointer();
         } else if (gameState.currentScreen === 'playing') {
            // Re-lock pointer when resuming
            setTimeout(() => lockPointer(), 100);
         }
      }
   }, 100);

   // Add styles for in-game menu
   const style = document.createElement('style');
   style.textContent = `
      .ingame-menu {
         position: fixed;
         top: 20px;
         right: 20px;
         display: flex;
         gap: 10px;
         z-index: 9000;
         pointer-events: all;
      }

      .poly-menu-btn {
         width: 50px;
         height: 50px;
         background: linear-gradient(135deg, rgba(0, 40, 80, 0.9), rgba(0, 20, 40, 0.9));
         border: 2px solid rgba(0, 255, 255, 0.4);
         color: #00ffff;
         cursor: pointer;
         display: flex;
         align-items: center;
         justify-content: center;
         transition: all 0.3s ease;
         clip-path: polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%);
         box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
      }

      .poly-menu-btn:hover {
         background: linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(0, 255, 136, 0.3));
         border-color: #00ffff;
         box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
         transform: translateY(-2px);
      }

      .poly-menu-btn:active {
         transform: translateY(0);
      }

      .poly-menu-btn.muted {
         opacity: 0.5;
      }

      #cursor-indicator {
         filter: drop-shadow(0 0 5px #00ffff);
         animation: crosshairPulse 2s ease-in-out infinite;
      }

      @keyframes crosshairPulse {
         0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
         50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
      }

      /* Hide default cursor on game canvas only */
      body > canvas {
         cursor: none !important;
      }

      /* Ensure cursor visible in customization */
      #customization {
         cursor: default !important;
      }

      #customization * {
         cursor: default !important;
      }
   `;
   document.head.appendChild(style);

   // Fix ship preview for different ship types
   window.createShipPreviewFixed = function(shipType, color) {
      const previewCanvas = document.getElementById('preview-canvas');
      if (!previewCanvas) return;

      // Set canvas dimensions explicitly to match container
      previewCanvas.width = 300;
      previewCanvas.height = 300;

      const ctx = previewCanvas.getContext('2d');
      let rotation = 0;

      function drawShip() {
         ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

         ctx.save();
         ctx.translate(150, 150);
         ctx.rotate(rotation);

         ctx.strokeStyle = color || '#00ff88';
         ctx.fillStyle = color || '#00ff88';
         ctx.globalAlpha = 0.8;
         ctx.lineWidth = 3;
         ctx.shadowBlur = 20;
         ctx.shadowColor = color || '#00ff88';

         // Draw based on ship type
         switch(shipType) {
            case 'Interceptor':
               // Sharp pyramid
               ctx.beginPath();
               ctx.moveTo(0, -50);
               ctx.lineTo(-25, 35);
               ctx.lineTo(0, 25);
               ctx.lineTo(25, 35);
               ctx.closePath();
               ctx.stroke();
               ctx.globalAlpha = 0.2;
               ctx.fill();
               break;

            case 'Fighter':
               // Cube/Box
               ctx.strokeRect(-35, -35, 70, 70);
               ctx.globalAlpha = 0.2;
               ctx.fillRect(-35, -35, 70, 70);
               // Add center diamond
               ctx.globalAlpha = 0.8;
               ctx.beginPath();
               ctx.moveTo(0, -20);
               ctx.lineTo(20, 0);
               ctx.lineTo(0, 20);
               ctx.lineTo(-20, 0);
               ctx.closePath();
               ctx.stroke();
               break;

            case 'Bomber':
               // Large pyramid
               ctx.beginPath();
               ctx.moveTo(0, -60);
               ctx.lineTo(-40, 40);
               ctx.lineTo(0, 30);
               ctx.lineTo(40, 40);
               ctx.closePath();
               ctx.stroke();
               ctx.globalAlpha = 0.2;
               ctx.fill();
               // Wings
               ctx.globalAlpha = 0.8;
               ctx.beginPath();
               ctx.moveTo(-40, 20);
               ctx.lineTo(-60, 40);
               ctx.stroke();
               ctx.beginPath();
               ctx.moveTo(40, 20);
               ctx.lineTo(60, 40);
               ctx.stroke();
               break;

            case 'Cruiser':
               // Hexagon
               const size = 40;
               ctx.beginPath();
               for (let i = 0; i < 6; i++) {
                  const angle = (Math.PI / 3) * i;
                  const x = size * Math.cos(angle);
                  const y = size * Math.sin(angle);
                  if (i === 0) ctx.moveTo(x, y);
                  else ctx.lineTo(x, y);
               }
               ctx.closePath();
               ctx.stroke();
               ctx.globalAlpha = 0.2;
               ctx.fill();
               break;

            case 'Stealth':
               // Sleek triangle
               ctx.beginPath();
               ctx.moveTo(0, -55);
               ctx.lineTo(-20, 30);
               ctx.lineTo(0, 20);
               ctx.lineTo(20, 30);
               ctx.closePath();
               ctx.stroke();
               ctx.globalAlpha = 0.2;
               ctx.fill();
               break;

            case 'Tank':
               // Large square
               ctx.strokeRect(-45, -45, 90, 90);
               ctx.globalAlpha = 0.2;
               ctx.fillRect(-45, -45, 90, 90);
               // Cross reinforcement
               ctx.globalAlpha = 0.8;
               ctx.beginPath();
               ctx.moveTo(-45, 0);
               ctx.lineTo(45, 0);
               ctx.moveTo(0, -45);
               ctx.lineTo(0, 45);
               ctx.stroke();
               break;
         }

         ctx.restore();

         rotation += 0.015;
         requestAnimationFrame(drawShip);
      }

      drawShip();
   };

   console.log('%c✓ UI Overhaul Complete!', 'color: #00ff88; font-weight: bold;');
})();

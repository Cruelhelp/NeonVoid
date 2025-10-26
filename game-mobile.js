/**
 * NEON VOID - Mobile & Responsive Controls
 * Touch controls, dynamic resizing, and mobile optimization
 */

console.log('📱 Mobile Controls Loading...');

/**
 * ============================================
 * MOBILE DETECTION & CONFIGURATION
 * ============================================
 */

const mobileState = {
   isMobile: false,
   isTablet: false,
   hasTouch: false,
   orientation: 'landscape',
   dpr: window.devicePixelRatio || 1,

   // Touch state
   touches: new Map(),
   joystickActive: false,
   joystickOrigin: { x: 0, y: 0 },
   joystickCurrent: { x: 0, y: 0 },

   // Fire button state
   fireButtonPressed: false,
   fireButtonPos: { x: 0, y: 0 },

   // Resolution config
   baseWidth: 1920,
   baseHeight: 1080,
   minWidth: 320,
   minHeight: 568,
   maxScale: 2,
};

// Detect device type
function detectDeviceType() {
   const ua = navigator.userAgent.toLowerCase();
   const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

   mobileState.hasTouch = hasTouch;
   mobileState.isMobile = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
   mobileState.isTablet = /tablet|ipad|playbook|silk/i.test(ua) && !mobileState.isMobile;

   // Update orientation
   updateOrientation();

   console.log('📱 Device Detection:', {
      isMobile: mobileState.isMobile,
      isTablet: mobileState.isTablet,
      hasTouch: mobileState.hasTouch,
      orientation: mobileState.orientation,
      dpr: mobileState.dpr
   });
}

function updateOrientation() {
   const isPortrait = window.innerHeight > window.innerWidth;
   mobileState.orientation = isPortrait ? 'portrait' : 'landscape';
}

/**
 * ============================================
 * DYNAMIC CANVAS RESIZING
 * ============================================
 */

function resizeCanvas() {
   if (!window.canvas || !window.renderConfig) return;

   const canvas = window.canvas;
   const dpr = Math.min(mobileState.dpr, mobileState.maxScale);

   // Get viewport dimensions
   let width = window.innerWidth;
   let height = window.innerHeight;

   // Apply constraints
   width = Math.max(width, mobileState.minWidth);
   height = Math.max(height, mobileState.minHeight);

   // Update canvas display size
   canvas.style.width = width + 'px';
   canvas.style.height = height + 'px';

   // Update canvas render size (with device pixel ratio)
   canvas.width = width * dpr;
   canvas.height = height * dpr;

   // Update render config
   window.renderConfig.width = width;
   window.renderConfig.height = height;
   window.renderConfig.aspectRatio = width / height;

   // Scale context for high DPI
   const c = canvas.getContext('2d');
   c.scale(dpr, dpr);

   // Re-center the context
   c.translate(width / 2, height / 2);

   console.log('🖥️ Canvas Resized:', {
      display: `${width}x${height}`,
      render: `${canvas.width}x${canvas.height}`,
      dpr: dpr,
      aspectRatio: window.renderConfig.aspectRatio.toFixed(2)
   });

   // Update touch control positions if mobile
   if (mobileState.isMobile || mobileState.isTablet) {
      updateTouchControlPositions();
   }
}

// Debounced resize handler
let resizeTimeout;
function handleResize() {
   updateOrientation();

   clearTimeout(resizeTimeout);
   resizeTimeout = setTimeout(() => {
      resizeCanvas();

      // Show orientation warning on mobile in portrait
      if ((mobileState.isMobile || mobileState.isTablet) && mobileState.orientation === 'portrait') {
         showOrientationWarning();
      } else {
         hideOrientationWarning();
      }
   }, 100);
}

/**
 * ============================================
 * TOUCH CONTROLS - VIRTUAL JOYSTICK
 * ============================================
 */

const joystickConfig = {
   size: 120,
   deadzone: 10,
   maxDistance: 50,
   opacity: 0.4,
   activeOpacity: 0.7,
   position: { x: 150, y: 0 } // Offset from bottom-left
};

const fireButtonConfig = {
   size: 80,
   opacity: 0.4,
   activeOpacity: 0.9,
   position: { x: -150, y: 0 } // Offset from bottom-right
};

function updateTouchControlPositions() {
   // Position joystick at bottom-left
   joystickConfig.position.y = window.innerHeight - 150;

   // Position fire button at bottom-right
   fireButtonConfig.position.x = window.innerWidth - 150;
   fireButtonConfig.position.y = window.innerHeight - 150;
}

function drawTouchControls() {
   if (!mobileState.hasTouch) return;
   if (window.gameState && window.gameState.currentScreen !== 'playing') return;
   if (!window.canvas) return;

   const canvas = window.canvas;
   const ctx = canvas.getContext('2d');

   ctx.save();
   ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

   // Draw virtual joystick
   drawJoystick(ctx);

   // Draw fire button
   drawFireButton(ctx);

   ctx.restore();
}

function drawJoystick(c) {
   const baseX = joystickConfig.position.x;
   const baseY = joystickConfig.position.y;
   const size = joystickConfig.size;

   // Outer circle (base) - cyan color
   c.beginPath();
   c.arc(baseX, baseY, size / 2, 0, Math.PI * 2);
   c.strokeStyle = `rgba(0, 255, 212, ${mobileState.joystickActive ? joystickConfig.activeOpacity : joystickConfig.opacity})`;
   c.lineWidth = 3;
   c.stroke();

   // Glow effect
   if (mobileState.joystickActive) {
      c.shadowColor = 'rgba(0, 255, 212, 0.8)';
      c.shadowBlur = 15;
   }

   // Inner circle (stick)
   let stickX = baseX;
   let stickY = baseY;

   if (mobileState.joystickActive) {
      const dx = mobileState.joystickCurrent.x - mobileState.joystickOrigin.x;
      const dy = mobileState.joystickCurrent.y - mobileState.joystickOrigin.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDist = joystickConfig.maxDistance;

      if (distance > joystickConfig.deadzone) {
         const ratio = Math.min(distance, maxDist) / distance;
         stickX = baseX + dx * ratio;
         stickY = baseY + dy * ratio;
      }
   }

   c.beginPath();
   c.arc(stickX, stickY, size / 4, 0, Math.PI * 2);
   c.fillStyle = `rgba(0, 255, 212, ${mobileState.joystickActive ? 0.6 : 0.3})`;
   c.fill();
   c.strokeStyle = `rgba(0, 255, 212, ${mobileState.joystickActive ? 1 : 0.5})`;
   c.lineWidth = 2;
   c.stroke();

   c.shadowBlur = 0;
}

function drawFireButton(c) {
   const x = fireButtonConfig.position.x;
   const y = fireButtonConfig.position.y;
   const size = fireButtonConfig.size;

   // Outer circle - pink/magenta color
   c.beginPath();
   c.arc(x, y, size / 2, 0, Math.PI * 2);
   c.strokeStyle = `rgba(255, 0, 128, ${mobileState.fireButtonPressed ? fireButtonConfig.activeOpacity : fireButtonConfig.opacity})`;
   c.lineWidth = 3;
   c.stroke();

   // Glow effect
   if (mobileState.fireButtonPressed) {
      c.shadowColor = 'rgba(255, 0, 128, 0.8)';
      c.shadowBlur = 20;
      c.fillStyle = 'rgba(255, 0, 128, 0.3)';
      c.fill();
   }

   // Fire icon (triangle)
   c.save();
   c.translate(x, y);
   c.rotate(-Math.PI / 2);
   c.beginPath();
   c.moveTo(0, -size / 4);
   c.lineTo(-size / 6, size / 4);
   c.lineTo(size / 6, size / 4);
   c.closePath();
   c.fillStyle = `rgba(255, 0, 128, ${mobileState.fireButtonPressed ? 1 : 0.6})`;
   c.fill();
   c.restore();

   c.shadowBlur = 0;
}

/**
 * ============================================
 * TOUCH EVENT HANDLERS
 * ============================================
 */

function handleTouchStart(e) {
   e.preventDefault();

   for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = touch.clientX;
      const y = touch.clientY;

      // Check if touch is on joystick area (left side)
      if (x < window.innerWidth / 2) {
         mobileState.joystickActive = true;
         mobileState.joystickOrigin = { x, y };
         mobileState.joystickCurrent = { x, y };
         mobileState.touches.set(touch.identifier, 'joystick');
      }
      // Check if touch is on fire button area (right side)
      else {
         const dx = x - fireButtonConfig.position.x;
         const dy = y - fireButtonConfig.position.y;
         const distance = Math.sqrt(dx * dx + dy * dy);

         if (distance < fireButtonConfig.size) {
            mobileState.fireButtonPressed = true;
            mobileState.touches.set(touch.identifier, 'fire');

            // Trigger fire event
            if (window.player) {
               window.player.isFiring = true;
            }
         }
      }
   }
}

function handleTouchMove(e) {
   e.preventDefault();

   for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const type = mobileState.touches.get(touch.identifier);

      if (type === 'joystick') {
         mobileState.joystickCurrent = {
            x: touch.clientX,
            y: touch.clientY
         };

         // Update player movement
         updatePlayerFromJoystick();
      }
   }
}

function handleTouchEnd(e) {
   e.preventDefault();

   for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const type = mobileState.touches.get(touch.identifier);

      if (type === 'joystick') {
         mobileState.joystickActive = false;

         // Stop player movement
         if (window.player) {
            window.player.velocity = { x: 0, y: 0, z: 0 };
         }
      } else if (type === 'fire') {
         mobileState.fireButtonPressed = false;

         // Stop firing
         if (window.player) {
            window.player.isFiring = false;
         }
      }

      mobileState.touches.delete(touch.identifier);
   }
}

function updatePlayerFromJoystick() {
   if (!window.player || !mobileState.joystickActive) return;

   const dx = mobileState.joystickCurrent.x - mobileState.joystickOrigin.x;
   const dy = mobileState.joystickCurrent.y - mobileState.joystickOrigin.y;
   const distance = Math.sqrt(dx * dx + dy * dy);

   if (distance > joystickConfig.deadzone) {
      const maxDist = joystickConfig.maxDistance;
      const strength = Math.min(distance / maxDist, 1);
      const angle = Math.atan2(dy, dx);

      // Get ship stats for speed
      const shipStats = window.player.shipStats || { speed: 2 };
      const speed = shipStats.speed * strength * 1.5;

      window.player.velocity = {
         x: Math.cos(angle) * speed,
         y: Math.sin(angle) * speed,
         z: 0
      };
   }
}

/**
 * ============================================
 * ORIENTATION WARNING
 * ============================================
 */

function showOrientationWarning() {
   let warning = document.getElementById('orientation-warning');

   if (!warning) {
      warning = document.createElement('div');
      warning.id = 'orientation-warning';
      warning.innerHTML = `
         <div class="orientation-warning-content">
            <div class="rotate-icon">📱 ↻</div>
            <h2>Rotate Your Device</h2>
            <p>For the best experience, please rotate your device to landscape mode.</p>
         </div>
      `;
      document.body.appendChild(warning);
   }

   warning.style.display = 'flex';
}

function hideOrientationWarning() {
   const warning = document.getElementById('orientation-warning');
   if (warning) {
      warning.style.display = 'none';
   }
}

/**
 * ============================================
 * INITIALIZATION
 * ============================================
 */

function initMobileControls() {
   detectDeviceType();

   // Wait for canvas to be ready
   const checkCanvas = setInterval(() => {
      if (window.canvas && window.renderConfig) {
         clearInterval(checkCanvas);

         // Initial resize
         resizeCanvas();

         // Add resize listener
         window.addEventListener('resize', handleResize);
         window.addEventListener('orientationchange', handleResize);

         // Add touch event listeners if touch is supported
         if (mobileState.hasTouch) {
            const canvas = window.canvas;

            canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
            canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
            canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
            canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

            console.log('✓ Touch controls enabled');

            // Inject touch controls into render loop
            if (window.gameLoop) {
               const originalLoop = window.gameLoop;
               window.gameLoop = function() {
                  originalLoop();
                  drawTouchControls();
               };
            }
         }

         console.log('✓ Mobile Controls Loaded!');
      }
   }, 100);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', initMobileControls);
} else {
   initMobileControls();
}

// Export for external access
window.mobileState = mobileState;
window.resizeCanvas = resizeCanvas;
window.drawTouchControls = drawTouchControls;

/**
 * NEON VOID - Interactive Wireframe Background
 * Shooting ships and exploding asteroids
 */

class WireframeBackground {
   constructor(containerId, existingCanvasId = null) {
      // Check if using existing canvas (for game menu) or creating new one (for landing page)
      if (existingCanvasId) {
         this.canvas = document.getElementById(existingCanvasId);
         if (!this.canvas) return;
         this.container = this.canvas.parentElement;
         this.ctx = this.canvas.getContext('2d');
      } else {
         this.container = document.getElementById(containerId);
         if (!this.container) return;

         this.canvas = document.createElement('canvas');
         this.ctx = this.canvas.getContext('2d');
         this.container.appendChild(this.canvas);

         this.canvas.style.position = 'absolute';
         this.canvas.style.top = '0';
         this.canvas.style.left = '0';
         this.canvas.style.width = '100%';
         this.canvas.style.height = '100%';
         this.canvas.style.cursor = 'crosshair';
         this.canvas.style.zIndex = '1';
      }

      this.asteroids = [];
      this.ships = [];
      this.bullets = [];
      this.explosions = [];
      this.resize();

      // Event listeners
      window.addEventListener('resize', () => this.resize());
      this.canvas.addEventListener('click', (e) => this.handleClick(e));
      this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));

      this.mouseX = 0;
      this.mouseY = 0;

      this.init();
      this.animate();
   }

   resize() {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
   }

   init() {
      // Create asteroids - more on the right side for balance
      for (let i = 0; i < 10; i++) {
         // 70% chance to spawn on right half for balance
         const spawnRight = Math.random() < 0.7;
         const x = spawnRight
            ? (this.width * 0.5) + (Math.random() * this.width * 0.5)
            : Math.random() * this.width * 0.5;

         this.asteroids.push(new WireframeAsteroid(
            x,
            Math.random() * this.height,
            25 + Math.random() * 35,
            this.getRandomAsteroidColor()
         ));
      }

      // Create one main ship
      this.ships.push(new PolyShip(
         this.width / 2,
         this.height / 2,
         25
      ));
   }

   getRandomAsteroidColor() {
      const colors = ['#FF0080', '#FF8800', '#FF0044', '#FFD700'];
      return colors[Math.floor(Math.random() * colors.length)];
   }

   handleMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
   }

   handleClick(e) {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Check if clicked on asteroid
      this.asteroids.forEach((asteroid, index) => {
         const dx = asteroid.x - clickX;
         const dy = asteroid.y - clickY;
         const distance = Math.sqrt(dx * dx + dy * dy);

         if (distance < asteroid.size) {
            // Create explosion
            this.explosions.push(new Explosion(asteroid.x, asteroid.y, asteroid.color));
            // Remove asteroid
            this.asteroids.splice(index, 1);
            // Add new asteroid
            setTimeout(() => {
               this.asteroids.push(new WireframeAsteroid(
                  Math.random() * this.width,
                  Math.random() * this.height,
                  25 + Math.random() * 35,
                  this.getRandomAsteroidColor()
               ));
            }, 2000);
         }
      });
   }

   animate() {
      this.ctx.clearRect(0, 0, this.width, this.height);

      // Update and draw asteroids
      this.asteroids.forEach(asteroid => {
         asteroid.update(this.width, this.height);
         asteroid.draw(this.ctx);
      });

      // Update and draw ships
      this.ships.forEach(ship => {
         ship.update(this.width, this.height, this.asteroids, this.bullets);
         ship.draw(this.ctx);
      });

      // Update and draw bullets
      this.bullets.forEach((bullet, index) => {
         bullet.update();
         bullet.draw(this.ctx);

         // Check collision with asteroids
         this.asteroids.forEach((asteroid, aIndex) => {
            const dx = bullet.x - asteroid.x;
            const dy = bullet.y - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < asteroid.size) {
               // Hit!
               this.explosions.push(new Explosion(asteroid.x, asteroid.y, asteroid.color));
               this.asteroids.splice(aIndex, 1);
               this.bullets.splice(index, 1);

               // Spawn new asteroid
               setTimeout(() => {
                  this.asteroids.push(new WireframeAsteroid(
                     Math.random() * this.width,
                     Math.random() * this.height,
                     25 + Math.random() * 35,
                     this.getRandomAsteroidColor()
                  ));
               }, 2000);
            }
         });

         // Remove bullets off screen
         if (bullet.x < 0 || bullet.x > this.width || bullet.y < 0 || bullet.y > this.height) {
            this.bullets.splice(index, 1);
         }
      });

      // Update and draw explosions
      this.explosions.forEach((explosion, index) => {
         explosion.update();
         explosion.draw(this.ctx);

         if (explosion.isDead()) {
            this.explosions.splice(index, 1);
         }
      });

      requestAnimationFrame(() => this.animate());
   }
}

class WireframeAsteroid {
   constructor(x, y, size, color) {
      this.x = x;
      this.y = y;
      this.size = size;
      this.color = color;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.02;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.vertices = this.generateVertices();
   }

   generateVertices() {
      const vertices = [];
      const segments = 12 + Math.floor(Math.random() * 8);

      for (let i = 0; i < segments; i++) {
         const angle = (i / segments) * Math.PI * 2;
         const radius = this.size * (0.8 + Math.random() * 0.4);
         vertices.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
         });
      }

      return vertices;
   }

   update(width, height) {
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotationSpeed;

      // Wrap around screen
      if (this.x < -this.size) this.x = width + this.size;
      if (this.x > width + this.size) this.x = -this.size;
      if (this.y < -this.size) this.y = height + this.size;
      if (this.y > height + this.size) this.y = -this.size;
   }

   draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      // Draw wireframe
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      this.vertices.forEach((v, i) => {
         if (i === 0) {
            ctx.moveTo(v.x, v.y);
         } else {
            ctx.lineTo(v.x, v.y);
         }
      });
      ctx.closePath();
      ctx.stroke();

      // Draw internal connections
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < this.vertices.length; i += 3) {
         const v1 = this.vertices[i];
         const v2 = this.vertices[(i + 4) % this.vertices.length];
         ctx.beginPath();
         ctx.moveTo(v1.x, v1.y);
         ctx.lineTo(v2.x, v2.y);
         ctx.stroke();
      }

      ctx.restore();
   }
}

class PolyShip {
   constructor(x, y, size) {
      this.x = x;
      this.y = y;
      this.size = size;
      this.color = '#00FFD4';
      this.targetX = x;
      this.targetY = y;
      this.rotation = 0;
      this.shootTimer = 0;
      this.shootInterval = 120; // frames between shots
   }

   update(width, height, asteroids, bullets) {
      // Find nearest asteroid
      let nearestAsteroid = null;
      let minDistance = Infinity;

      asteroids.forEach(asteroid => {
         const dx = asteroid.x - this.x;
         const dy = asteroid.y - this.y;
         const distance = Math.sqrt(dx * dx + dy * dy);

         if (distance < minDistance) {
            minDistance = distance;
            nearestAsteroid = asteroid;
         }
      });

      if (nearestAsteroid) {
         // Aim at nearest asteroid
         this.targetX = nearestAsteroid.x;
         this.targetY = nearestAsteroid.y;

         // Calculate rotation to face target
         const dx = this.targetX - this.x;
         const dy = this.targetY - this.y;
         this.rotation = Math.atan2(dy, dx);

         // Shoot at asteroid
         this.shootTimer++;
         if (this.shootTimer >= this.shootInterval) {
            bullets.push(new Bullet(
               this.x + Math.cos(this.rotation) * this.size,
               this.y + Math.sin(this.rotation) * this.size,
               this.rotation,
               '#00FFD4'
            ));
            this.shootTimer = 0;
         }
      }

      // Slow drift movement
      this.x += Math.sin(Date.now() * 0.0002) * 0.3;
      this.y += Math.cos(Date.now() * 0.0003) * 0.3;

      // Keep in bounds
      this.x = Math.max(100, Math.min(width - 100, this.x));
      this.y = Math.max(100, Math.min(height - 100, this.y));
   }

   draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 20;

      // Main triangle body (like new logo)
      ctx.beginPath();
      ctx.moveTo(this.size * 1.2, 0);
      ctx.lineTo(-this.size * 0.6, -this.size);
      ctx.lineTo(-this.size * 0.2, 0);
      ctx.lineTo(-this.size * 0.6, this.size);
      ctx.closePath();
      ctx.stroke();

      // Center detail line
      ctx.beginPath();
      ctx.moveTo(this.size * 1.2, 0);
      ctx.lineTo(-this.size * 0.2, 0);
      ctx.stroke();

      // Top wing detail
      ctx.strokeStyle = '#00FFAA';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.size * 1.2, 0);
      ctx.lineTo(this.size * 0.6, -this.size * 0.4);
      ctx.lineTo(-this.size * 0.2, 0);
      ctx.stroke();

      // Bottom wing detail
      ctx.beginPath();
      ctx.moveTo(this.size * 1.2, 0);
      ctx.lineTo(this.size * 0.6, this.size * 0.4);
      ctx.lineTo(-this.size * 0.2, 0);
      ctx.stroke();

      // Engine glow
      ctx.fillStyle = '#00FFAA';
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(-this.size * 0.5, 0, this.size * 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
   }
}

class Bullet {
   constructor(x, y, angle, color) {
      this.x = x;
      this.y = y;
      this.vx = Math.cos(angle) * 8;
      this.vy = Math.sin(angle) * 8;
      this.color = color;
      this.life = 100;
   }

   update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
   }

   draw(ctx) {
      ctx.save();

      const alpha = this.life / 100;
      ctx.globalAlpha = alpha;

      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 2, this.y - this.vy * 2);
      ctx.stroke();

      ctx.restore();
   }
}

class Explosion {
   constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.particles = [];
      this.life = 30;

      // Create explosion particles
      for (let i = 0; i < 12; i++) {
         const angle = (i / 12) * Math.PI * 2;
         const speed = 2 + Math.random() * 3;
         this.particles.push({
            x: 0,
            y: 0,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 3
         });
      }
   }

   update() {
      this.life--;
      this.particles.forEach(p => {
         p.x += p.vx;
         p.y += p.vy;
         p.vx *= 0.95;
         p.vy *= 0.95;
      });
   }

   isDead() {
      return this.life <= 0;
   }

   draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);

      const alpha = this.life / 30;
      ctx.globalAlpha = alpha;

      this.particles.forEach(p => {
         ctx.fillStyle = this.color;
         ctx.shadowColor = this.color;
         ctx.shadowBlur = 15;

         ctx.beginPath();
         ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
         ctx.fill();
      });

      // Flash effect
      if (this.life > 25) {
         ctx.fillStyle = '#FFFFFF';
         ctx.globalAlpha = (30 - this.life) / 5;
         ctx.beginPath();
         ctx.arc(0, 0, 30, 0, Math.PI * 2);
         ctx.fill();
      }

      ctx.restore();
   }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
   // Add to hero background (landing page)
   const heroSection = document.querySelector('.hero');
   if (heroSection) {
      const bgContainer = document.createElement('div');
      bgContainer.id = 'wireframe-bg-container';
      bgContainer.style.position = 'absolute';
      bgContainer.style.top = '0';
      bgContainer.style.left = '0';
      bgContainer.style.width = '100%';
      bgContainer.style.height = '100%';
      bgContainer.style.zIndex = '1';
      bgContainer.style.pointerEvents = 'none';

      heroSection.insertBefore(bgContainer, heroSection.firstChild);
      new WireframeBackground('wireframe-bg-container');
   }

   // Game menu background is initialized manually in game-script.js after UI is created
});

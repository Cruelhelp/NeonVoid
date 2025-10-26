/**
 * NEON VOID - Landing Page Script
 * Animations, interactions, and dynamic content
 */

// Animated Statistics Counter
function animateCounter(element) {
   const target = parseInt(element.getAttribute('data-target'));
   const duration = 2000;
   const step = target / (duration / 16);
   let current = 0;

   const counter = setInterval(() => {
      current += step;
      if (current >= target) {
         element.textContent = target.toLocaleString();
         clearInterval(counter);
      } else {
         element.textContent = Math.floor(current).toLocaleString();
      }
   }, 16);
}

// Intersection Observer for Animations
const observerOptions = {
   threshold: 0.2,
   rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
   entries.forEach(entry => {
      if (entry.isIntersecting) {
         entry.target.classList.add('visible');

         // Trigger counter animation for stats
         if (entry.target.classList.contains('stat-number')) {
            animateCounter(entry.target);
         }
      }
   });
}, observerOptions);

// Observe elements
document.querySelectorAll('.feature-card, .stat-number').forEach(el => {
   observer.observe(el);
});

// Header scroll effect
window.addEventListener('scroll', () => {
   const header = document.querySelector('.header');
   const copyright = document.querySelector('.hero-copyright');

   if (window.scrollY > 100) {
      header.classList.add('scrolled');
      if (copyright) copyright.classList.add('hidden');
   } else {
      header.classList.remove('scrolled');
      if (copyright) copyright.classList.remove('hidden');
   }
});

// Mobile Navigation
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
   hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active');
   });
}

// Hero Canvas Animation
const heroCanvas = document.getElementById('hero-canvas');
if (heroCanvas) {
   const ctx = heroCanvas.getContext('2d');

   function resizeCanvas() {
      heroCanvas.width = window.innerWidth;
      heroCanvas.height = window.innerHeight;
   }

   resizeCanvas();
   window.addEventListener('resize', resizeCanvas);

   // Particle system
   class Particle {
      constructor() {
         this.reset();
      }

      reset() {
         this.x = Math.random() * heroCanvas.width;
         this.y = Math.random() * heroCanvas.height;
         this.vx = (Math.random() - 0.5) * 0.5;
         this.vy = (Math.random() - 0.5) * 0.5;
         this.size = Math.random() * 2 + 1;
         this.life = 1;
      }

      update() {
         this.x += this.vx;
         this.y += this.vy;
         this.life -= 0.001;

         if (this.life <= 0 || this.x < 0 || this.x > heroCanvas.width ||
             this.y < 0 || this.y > heroCanvas.height) {
            this.reset();
         }
      }

      draw() {
         ctx.fillStyle = `rgba(0, 255, 255, ${this.life * 0.5})`;
         ctx.fillRect(this.x, this.y, this.size, this.size);
      }
   }

   const particles = Array.from({ length: 100 }, () => new Particle());

   function animate() {
      ctx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);

      particles.forEach(particle => {
         particle.update();
         particle.draw();
      });

      requestAnimationFrame(animate);
   }

   animate();
}

// Leaderboard System
// TODO: Connect to backend API for real leaderboard data
// Placeholder showing empty state until database integration
function renderLeaderboard(type = 'daily') {
   const tbody = document.getElementById('leaderboard-body');
   if (!tbody) return;

   tbody.innerHTML = `
      <tr>
         <td colspan="5" style="text-align: center; padding: 40px; opacity: 0.6;">
            <div style="font-size: 24px; margin-bottom: 10px;">🎮</div>
            <div>No scores yet. Be the first to play!</div>
         </td>
      </tr>
   `;
}

// Leaderboard tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
   btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLeaderboard(btn.getAttribute('data-tab'));
   });
});

// Initial render
renderLeaderboard('daily');

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
   anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
         target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
         });
      }
   });
});

// Add glitch effect to title
function glitchEffect() {
   const title = document.querySelector('.hero-title');
   if (!title) return;

   setInterval(() => {
      if (Math.random() > 0.95) {
         title.style.textShadow = `
            ${Math.random() * 10 - 5}px ${Math.random() * 10 - 5}px 0 #ff0044,
            ${Math.random() * 10 - 5}px ${Math.random() * 10 - 5}px 0 #00ffff
         `;
         setTimeout(() => {
            title.style.textShadow = '0 0 80px rgba(0, 255, 255, 0.5)';
         }, 100);
      }
   }, 3000);
}

glitchEffect();

// Parallax effect on scroll
window.addEventListener('scroll', () => {
   const scrolled = window.pageYOffset;
   const parallaxElements = document.querySelectorAll('.hero-content');

   parallaxElements.forEach(el => {
      const speed = 0.5;
      el.style.transform = `translateY(${scrolled * speed}px)`;
   });
});

console.log('%cNEON VOID', 'font-size: 40px; color: #00ffff; font-weight: bold; text-shadow: 0 0 10px #00ffff;');
console.log('%cDeveloped by Ruel McNeil', 'font-size: 14px; color: #00ff88;');
console.log('%cBuilt with vanilla JavaScript and a custom 3D renderer', 'font-size: 12px; color: #0088ff;');

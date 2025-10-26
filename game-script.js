/**
 * NEON VOID - AAA 3D Space Combat Game
 * Custom Software 3D Renderer with Complete Game Systems
 */

/**
 * ============================================
 * UTILITY FUNCTIONS
 * ============================================
 */

// Easing Functions
function easeInExpo(x) {
   return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
}

function easeOutExpo(x) {
   return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

function easeInOutCubic(x) {
   return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// Vector Math Library
const v3 = (x, y, z) =>
   y === undefined && z === undefined
      ? { x, y: x, z: x }
      : z === undefined
      ? { x, y, z: x }
      : { x, y, z };

const v3array = (v) => [v.x, v.y, v.z];
const v3add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const v3sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const v3mul = (v, s) => ({ x: v.x * s, y: v.y * s, z: v.z * s });
const v3div = (v, s) => ({ x: v.x / s, y: v.y / s, z: v.z / s });
const v3dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const v3normalize = (v) => v3div(v, v3mag(v));
const v3mag = (v) => Math.sqrt(v3dot(v, v));
const v3distance = (a, b) => v3mag(v3sub(a, b));

// Animation Helper
const animate = (cb, targetTime, onEnd) => {
   const start = performance.now();

   requestAnimationFrame(function animateFrame(time) {
      const timeFraction = time - start;
      const progress = Math.min(timeFraction / targetTime, 1);

      cb(progress);

      if (progress < 1) {
         requestAnimationFrame(animateFrame);
      } else {
         onEnd?.();
      }
   });
};

/**
 * ============================================
 * GAME CONFIGURATION & STATE
 * ============================================
 */

const SHIP_COLORS = [
   { name: 'Cyan', value: '#00ffff' },
   { name: 'Green', value: '#00ff88' },
   { name: 'Blue', value: '#0088ff' },
   { name: 'Purple', value: '#8800ff' },
   { name: 'Pink', value: '#ff00ff' },
   { name: 'Red', value: '#ff0044' },
   { name: 'Orange', value: '#ff8800' },
   { name: 'Yellow', value: '#ffff00' },
   { name: 'White', value: '#ffffff' },
   { name: 'Gold', value: '#ffd700' }
];

const SHIP_TYPES = ['Interceptor', 'Fighter', 'Bomber', 'Cruiser', 'Stealth', 'Tank'];

const gameState = {
   currentScreen: 'menu', // menu, customize, playing, paused, levelComplete, gameOver
   score: 0,
   lives: 3,
   level: 1,
   maxLevel: 10,
   asteroidsDestroyed: 0,
   levelStartTime: 0,
   totalAsteroids: 0,
   isPaused: false,
   mouseX: 0,
   mouseY: 0,
   playerConfig: {
      color: '#00ff88',
      shipType: 'Interceptor',
      shipIndex: 0
   }
};

const renderConfig = {
   perspective: 500,
   width: window.innerWidth,
   height: window.innerHeight,
   aspectRatio: window.innerWidth / window.innerHeight,
   wireframe: true
};

/**
 * ============================================
 * 3D RENDERING ENGINE
 * ============================================
 */

const c = document.createElement("canvas").getContext("2d");
const { canvas } = c;

let polygonBuffer = [];
const meshBuffer = [];
const objectBuffer = [];

const camera = {
   position: { x: 0, y: 0, z: -renderConfig.perspective },
   rotation: { x: 0, y: 0, z: 0 }
};

class Mesh {
   #_polygons = [];

   position = { x: 0, y: 0, z: 0 };
   rotation = { x: 0, y: 0, z: 0 };
   scale = { x: 1, y: 1, z: 1 };
   alpha = 1;

   get polygons() {
      return this.#applyCameraTransformations(this.#applyTransformations());
   }

   constructor() {
      meshBuffer.push(this);
   }

   addPolygons(...polygons) {
      this.#_polygons.push(...polygons);
   }

   translate(x, y, z) {
      this.position.x += x;
      this.position.y += y;
      this.position.z += z;
   }

   rotate(x, y, z) {
      this.rotation.x += x;
      this.rotation.y += y;
      this.rotation.z += z;
   }

   destroy() {
      const index = meshBuffer.indexOf(this);
      if (index !== -1) {
         meshBuffer.splice(index, 1);
      }
   }

   #applyTransformations() {
      return this.applyTranslate(
         this.applyScale(this.applyRotation(this.#_polygons))
      );
   }

   #applyCameraTransformations(polygons) {
      return this.#applyCameraRotation(this.#applyCameraTranslate(polygons));
   }

   #applyCameraTranslate(polygons) {
      return this.applyTranslate(polygons, v3mul(camera.position, -1));
   }

   #applyCameraRotation(polygons) {
      const rotX = (polygons) => {
         const { x: rx } = camera.rotation;
         const sin = Math.sin(rx);
         const cos = Math.cos(rx);

         return polygons.map((polygon) => {
            const [x1, y1, z1, x2, y2, z2, x3, y3, z3, col] = polygon;
            return [
               x1, y1 * cos - z1 * sin, y1 * sin + z1 * cos,
               x2, y2 * cos - z2 * sin, y2 * sin + z2 * cos,
               x3, y3 * cos - z3 * sin, y3 * sin + z3 * cos,
               col, this.alpha
            ];
         });
      };

      const rotY = (polygons) => {
         const { y: ry } = camera.rotation;
         const sin = Math.sin(ry);
         const cos = Math.cos(ry);

         return polygons.map((polygon) => {
            const [x1, y1, z1, x2, y2, z2, x3, y3, z3, col] = polygon;
            return [
               x1 * cos + z1 * sin, y1, -x1 * sin + z1 * cos,
               x2 * cos + z2 * sin, y2, -x2 * sin + z2 * cos,
               x3 * cos + z3 * sin, y3, -x3 * sin + z3 * cos,
               col, this.alpha
            ];
         });
      };

      const rotZ = (polygons) => {
         const { z: rz } = camera.rotation;
         const sin = Math.sin(rz);
         const cos = Math.cos(rz);

         return polygons.map((polygon) => {
            const [x1, y1, z1, x2, y2, z2, x3, y3, z3, col] = polygon;
            return [
               x1 * cos - y1 * sin, x1 * sin + y1 * cos, z1,
               x2 * cos - y2 * sin, x2 * sin + y2 * cos, z2,
               x3 * cos - y3 * sin, x3 * sin + y3 * cos, z3,
               col, this.alpha
            ];
         });
      };

      return rotX(rotY(rotZ(polygons)));
   }

   applyTranslate(polygons, by) {
      const { x, y, z } = by || this.position;
      return polygons.map((polygon) => {
         const [x1, y1, z1, x2, y2, z2, x3, y3, z3, col] = polygon;
         return [x1 + x, y1 + y, z1 + z, x2 + x, y2 + y, z2 + z, x3 + x, y3 + y, z3 + z, col, this.alpha];
      });
   }

   applyScale(polygons, by) {
      const { x, y, z } = by || this.scale;
      return polygons.map((polygon) => {
         const [x1, y1, z1, x2, y2, z2, x3, y3, z3, col] = polygon;
         return [x1 * x, y1 * y, z1 * z, x2 * x, y2 * y, z2 * z, x3 * x, y3 * y, z3 * z, col, this.alpha];
      });
   }

   applyRotation(polygons, by) {
      const { x, y, z } = by || this.rotation;
      return this.applyRotateX(this.applyRotateY(this.applyRotateZ(polygons, z), y), x);
   }

   applyRotateX(polygons, rx) {
      rx = rx || this.rotation.x;
      const sin = Math.sin(rx);
      const cos = Math.cos(rx);

      return polygons.map((polygon) => {
         const [x1, y1, z1, x2, y2, z2, x3, y3, z3, col] = polygon;
         return [
            x1, y1 * cos - z1 * sin, y1 * sin + z1 * cos,
            x2, y2 * cos - z2 * sin, y2 * sin + z2 * cos,
            x3, y3 * cos - z3 * sin, y3 * sin + z3 * cos,
            col, this.alpha
         ];
      });
   }

   applyRotateY(polygons, ry) {
      ry = ry || this.rotation.y;
      const sin = Math.sin(ry);
      const cos = Math.cos(ry);

      return polygons.map((polygon) => {
         const [x1, y1, z1, x2, y2, z2, x3, y3, z3, col] = polygon;
         return [
            x1 * cos + z1 * sin, y1, -x1 * sin + z1 * cos,
            x2 * cos + z2 * sin, y2, -x2 * sin + z2 * cos,
            x3 * cos + z3 * sin, y3, -x3 * sin + z3 * cos,
            col, this.alpha
         ];
      });
   }

   applyRotateZ(polygons, rz) {
      rz = rz || this.rotation.z;
      const sin = Math.sin(rz);
      const cos = Math.cos(rz);

      return polygons.map((polygon) => {
         const [x1, y1, z1, x2, y2, z2, x3, y3, z3, col] = polygon;
         return [
            x1 * cos - y1 * sin, x1 * sin + y1 * cos, z1,
            x2 * cos - y2 * sin, x2 * sin + y2 * cos, z2,
            x3 * cos - y3 * sin, x3 * sin + y3 * cos, z3,
            col, this.alpha
         ];
      });
   }
}

// Rendering Functions
const clearBuffer = () => {
   polygonBuffer = [];
};

const polygonToScreenSpace = (polygon) => {
   const [x1, y1, z1, x2, y2, z2, x3, y3, z3, col, alpha] = polygon;

   const x1s = (x1 / z1) * renderConfig.perspective;
   const y1s = (y1 / z1) * renderConfig.perspective;
   const x2s = (x2 / z2) * renderConfig.perspective;
   const y2s = (y2 / z2) * renderConfig.perspective;
   const x3s = (x3 / z3) * renderConfig.perspective;
   const y3s = (y3 / z3) * renderConfig.perspective;

   return [x1s, y1s, x2s, y2s, x3s, y3s, col, alpha];
};

const renderPolygon = (polygon) => {
   const [x1s, y1s, x2s, y2s, x3s, y3s, col, alpha] = polygonToScreenSpace(polygon);

   const renderStyle = renderConfig.wireframe ? "stroke" : "fill";

   c.globalAlpha = alpha || 1;
   c[renderStyle + "Style"] = col;
   c.lineWidth = 2;

   c.beginPath();
   c.moveTo(x1s, y1s);
   c.lineTo(x2s, y2s);
   c.lineTo(x3s, y3s);
   c.closePath();
   c[renderStyle]();

   c.globalAlpha = 1;
};

const byAverageZ = (a, b) => {
   const az = (a[2] + a[5] + a[8]) / 3;
   const bz = (b[2] + b[5] + b[8]) / 3;
   return bz - az;
};

const byAbleToRender = (polygon) => {
   return polygon[2] > 0 && polygon[5] > 0 && polygon[8] > 0;
};

const clearScreen = () => {
   c.fillStyle = "#000";
   c.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

   // Add starfield background
   c.fillStyle = "rgba(255, 255, 255, 0.8)";
   for (let i = 0; i < 100; i++) {
      const x = (Math.random() - 0.5) * canvas.width;
      const y = (Math.random() - 0.5) * canvas.height;
      const size = Math.random() * 2;
      c.fillRect(x, y, size, size);
   }
};

const renderBloom = () => {
   c.save();
   c.filter = `blur(8px)`;
   c.globalCompositeOperation = "lighten";
   c.globalAlpha = 0.6;
   c.drawImage(c.canvas, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

   c.filter = `blur(16px)`;
   c.globalAlpha = 0.4;
   c.drawImage(c.canvas, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
   c.restore();
};

const addPolygonsFromMeshes = () => {
   meshBuffer.forEach((mesh) => {
      mesh.polygons.forEach((polygon) => {
         polygonBuffer.push(polygon);
      });
   });
};

const renderPolygons = () => {
   clearBuffer();
   addPolygonsFromMeshes();
   polygonBuffer.sort(byAverageZ).filter(byAbleToRender).forEach(renderPolygon);
};

const isPointOutOfCanvas = (x, y) => {
   const margin = 100;
   return (
      x < -canvas.width / 2 - margin ||
      x > canvas.width / 2 + margin ||
      y < -canvas.height / 2 - margin ||
      y > canvas.height / 2 + margin
   );
};

/**
 * ============================================
 * GEOMETRY GENERATORS
 * ============================================
 */

const createSphereGeometry = (radius, col) => {
   const vertices = [];
   const polys = [];
   const latitudes = 6;
   const longitudes = 6;

   for (let lat = 0; lat <= latitudes; lat++) {
      const theta = (lat * Math.PI) / latitudes;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let lon = 0; lon <= longitudes; lon++) {
         const phi = (lon * 2 * Math.PI) / longitudes;
         const sinPhi = Math.sin(phi);
         const cosPhi = Math.cos(phi);

         const x = cosPhi * sinTheta;
         const y = cosTheta;
         const z = sinPhi * sinTheta;

         vertices.push([radius * x, radius * y, radius * z]);
      }
   }

   for (let lat = 0; lat < latitudes; lat++) {
      for (let lon = 0; lon < longitudes; lon++) {
         const first = lat * (longitudes + 1) + lon;
         const second = first + longitudes + 1;

         polys.push(
            [...vertices[first], ...vertices[first + 1], ...vertices[second], col],
            [...vertices[first + 1], ...vertices[second + 1], ...vertices[second], col]
         );
      }
   }

   return polys;
};

const createPyramidGeometry = (size, col) => {
   const halfSize = size / 2;

   const p1 = [-halfSize, -halfSize, -halfSize];
   const p2 = [-halfSize, +halfSize, -halfSize];
   const p3 = [+halfSize, +halfSize, -halfSize];
   const p4 = [+halfSize, -halfSize, -halfSize];
   const p5 = [0, 0, +halfSize];

   return [
      [...p1, ...p2, ...p3, col],
      [...p1, ...p3, ...p4, col],
      [...p1, ...p2, ...p5, col],
      [...p1, ...p4, ...p5, col],
      [...p2, ...p3, ...p5, col],
      [...p3, ...p4, ...p5, col]
   ];
};

const createCubeGeometry = (size, col) => {
   const polys = [];
   const halfSize = size / 2;

   const p1 = [-halfSize, -halfSize, -halfSize];
   const p2 = [-halfSize, +halfSize, -halfSize];
   const p3 = [+halfSize, +halfSize, -halfSize];
   const p4 = [+halfSize, -halfSize, -halfSize];
   const p5 = [-halfSize, -halfSize, +halfSize];
   const p6 = [-halfSize, +halfSize, +halfSize];
   const p7 = [+halfSize, +halfSize, +halfSize];
   const p8 = [+halfSize, -halfSize, +halfSize];

   polys.push(
      [...p1, ...p2, ...p3, col], [...p1, ...p3, ...p4, col],
      [...p5, ...p6, ...p7, col], [...p5, ...p7, ...p8, col],
      [...p1, ...p2, ...p6, col], [...p1, ...p6, ...p5, col],
      [...p4, ...p3, ...p7, col], [...p4, ...p7, ...p8, col],
      [...p2, ...p3, ...p7, col], [...p2, ...p7, ...p6, col],
      [...p1, ...p4, ...p8, col], [...p1, ...p8, ...p5, col]
   );

   return polys;
};

const createShipGeometry = (type, col) => {
   switch (type) {
      case 'Interceptor':
         return createPyramidGeometry(20, col);
      case 'Fighter':
         return createCubeGeometry(18, col);
      case 'Bomber':
         return createPyramidGeometry(25, col);
      case 'Cruiser':
         return createCubeGeometry(22, col);
      case 'Stealth':
         return createPyramidGeometry(16, col);
      case 'Tank':
         return createCubeGeometry(25, col);
      default:
         return createPyramidGeometry(20, col);
   }
};

/**
 * ============================================
 * GAME ENTITIES
 * ============================================
 */

class Entity extends Mesh {
   constructor() {
      super();
      objectBuffer.push(this);
   }

   destroy() {
      super.destroy();
      const index = objectBuffer.indexOf(this);
      if (index !== -1) {
         objectBuffer.splice(index, 1);
      }
   }

   update(dt) {}
}

class GameManager extends Entity {
   static instance;

   #time = 0;
   #shakeValue = 0;

   constructor() {
      if (GameManager.instance) return GameManager.instance;
      super();
      GameManager.instance = this;
   }

   update(dt) {
      this.#time += dt;
      this.updateCameraShake(dt);
   }

   updateCameraShake(dt) {
      camera.position.x = Math.sin(this.#time * 120) * this.#shakeValue;
      camera.position.y = Math.cos(this.#time * 100) * this.#shakeValue;
      this.#shakeValue -= this.#shakeValue * dt * 5;
   }

   getShake() {
      return this.#shakeValue;
   }

   addShake(val) {
      this.#shakeValue += val;
   }
}

class Explosion extends Entity {
   constructor(radius, color = "#ffff00") {
      super();
      this.addPolygons(...createSphereGeometry(radius * 2, color));

      this.rotate(
         Math.random() * Math.PI * 2,
         Math.random() * Math.PI * 2,
         Math.random() * Math.PI * 2
      );

      animate(
         (percent) => {
            percent = easeOutExpo(percent);
            this.scale = v3add(v3(1), v3(percent * 2));
            this.alpha = 1 - percent;
         },
         800,
         () => this.destroy()
      );
   }
}

class AsteroidPiece extends Entity {
   #velocity = v3(0);
   #scaleRange = 0.5;

   scale = {
      x: 1 + Math.random() * this.#scaleRange - this.#scaleRange / 2,
      y: 1 + Math.random() * this.#scaleRange - this.#scaleRange / 2,
      z: 1 + Math.random() * this.#scaleRange - this.#scaleRange / 2
   };

   constructor(impulseVector, size, color) {
      super();
      this.addPolygons(...createPyramidGeometry(size, color));

      const impulseError = 10;
      const errorVector = v3mul(
         v3(Math.random(), Math.random(), Math.random()),
         impulseError
      );

      this.#velocity = v3add(this.#velocity, v3add(impulseVector, errorVector));
   }

   update(deltaTime) {
      this.translate(
         this.#velocity.x * deltaTime,
         this.#velocity.y * deltaTime,
         this.#velocity.z * deltaTime
      );

      this.rotate(...v3array(v3mul(this.#velocity, deltaTime * 0.01)));

      if (isPointOutOfCanvas(this.position.x, this.position.y)) {
         this.destroy();
      }
   }
}

class Asteroid extends Entity {
   #velocityRange = 80 + gameState.level * 10;
   #velocity = {
      x: Math.random() * this.#velocityRange - this.#velocityRange / 2,
      y: Math.random() * this.#velocityRange - this.#velocityRange / 2,
      z: 0
   };

   radius = 0;
   color = '#ff0044';

   constructor(radius) {
      super();

      // Varied asteroid colors
      const colors = ['#ff0044', '#ff4400', '#ff8800', '#ff0088', '#ff00ff'];
      this.color = colors[Math.floor(Math.random() * colors.length)];

      this.addPolygons(...createSphereGeometry(radius, this.color));
      this.radius = radius;
   }

   explode() {
      this.createAsteroidPieces();
      this.destroy();

      const exp = new Explosion(this.radius, this.color);
      exp.position = { ...this.position };

      GameManager.instance.addShake(8);

      // Award points based on asteroid size
      const points = Math.floor(100 / this.radius * 10);
      gameState.score += points;
      gameState.asteroidsDestroyed++;

      // Show damage number
      showDamageNumber(points, this.position);

      updateHUD();
      checkLevelComplete();
   }

   addVelocity(velocity) {
      this.#velocity = v3add(this.#velocity, velocity);
   }

   createAsteroidPieces() {
      const piecesRange = Math.floor(this.radius / 2);
      const piecesCount = Math.floor(Math.random() * piecesRange) + piecesRange / 2;

      for (let i = 0; i < piecesCount; i++) {
         const angle = Math.random() * Math.PI * 2;

         const tpos = {
            x: this.position.x + Math.cos(angle) * this.radius * 1.5,
            y: this.position.y + Math.sin(angle) * this.radius * 1.5,
            z: this.position.z
         };

         const diff = v3mul(v3sub(tpos, this.position), 7);
         const piece = new AsteroidPiece(diff, this.radius / 2, this.color);
         piece.translate(...v3array(tpos));
      }

      // Spawn smaller asteroids
      const additionalAsteroids = this.radius > 30 ? Math.floor(this.radius / 20) : 0;

      for (let i = 0; i < additionalAsteroids; i++) {
         const asteroid = new Asteroid(this.radius / 2);
         asteroid.translate(...v3array(this.position));
         asteroid.addVelocity(v3mul(v3(Math.random() - 0.5, Math.random() - 0.5, 0), 150));
      }
   }

   update(dt) {
      const ng = (this.#velocity.x * dt) / 100;
      const r = this.radius;

      this.rotate(ng, ng * 0.6, ng * 0.2);
      this.translate(this.#velocity.x * dt, this.#velocity.y * dt, this.#velocity.z * dt);

      // Wrap around screen edges
      if (this.position.x > canvas.width / 2 + r) {
         this.position.x = -canvas.width / 2 - r;
      }
      if (this.position.x < -canvas.width / 2 - r) {
         this.position.x = canvas.width / 2 + r;
      }
      if (this.position.y > canvas.height / 2 + r) {
         this.position.y = -canvas.height / 2 - r;
      }
      if (this.position.y < -canvas.height / 2 - r) {
         this.position.y = canvas.height / 2 + r;
      }
   }
}

class Enemy extends Entity {
   #velocity = v3(0);
   #moveSpeed = 150;
   #health = 80;
   #maxHealth = 80;
   #targetPosition = v3(0);
   #fireRate = 1.5;
   #timeSinceLastShot = 0;
   #aggression = 0.5;
   #enemyType = 'Fighter';

   constructor(enemyType = 'Fighter') {
      super();

      // Get enemy stats from ENEMY_TYPES if available
      if (typeof ENEMY_TYPES !== 'undefined' && ENEMY_TYPES[enemyType]) {
         const stats = ENEMY_TYPES[enemyType];
         this.#enemyType = enemyType;
         this.#moveSpeed = stats.speed;
         this.#health = stats.health;
         this.#maxHealth = stats.health;
         this.#fireRate = stats.fireRate;
         this.#aggression = stats.aggression;

         // Create enemy ship geometry with enemy color
         let polys = createPyramidGeometry(stats.size, stats.color);
         polys = this.applyRotateX(polys, Math.PI);
         this.addPolygons(...polys);
      } else {
         // Fallback if ENEMY_TYPES not loaded
         let polys = createPyramidGeometry(18, '#ff0088');
         polys = this.applyRotateX(polys, Math.PI);
         this.addPolygons(...polys);
      }
   }

   applyRotation(polygons, by) {
      const { x, y, z } = by || this.rotation;
      return this.applyRotateZ(this.applyRotateY(this.applyRotateX(polygons, x), y), z);
   }

   takeDamage(amount) {
      this.#health -= amount;

      // Show damage number
      showDamageNumber(amount, this.position);

      if (this.#health <= 0) {
         this.explode();
      }
   }

   explode() {
      // Create explosion effect
      for (let i = 0; i < 8; i++) {
         const piece = new AsteroidPiece(8);
         piece.translate(this.position.x, this.position.y, this.position.z);
         const angle = (Math.PI * 2 * i) / 8;
         const speed = 100 + Math.random() * 100;
         piece.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
            z: 0
         };
      }

      gameState.score += 100;
      this.destroy();
   }

   update(dt) {
      if (!player) return;

      this.#timeSinceLastShot += dt;

      // AI behavior: chase player with some randomness
      const dx = player.position.x - this.position.x;
      const dy = player.position.y - this.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Rotate to face player
      this.rotation.z = Math.atan2(dy, dx) + Math.PI;

      // Move towards player with aggression factor
      if (distance > 100) {
         const moveX = (dx / distance) * this.#moveSpeed * dt * this.#aggression;
         const moveY = (dy / distance) * this.#moveSpeed * dt * this.#aggression;
         this.translate(moveX, moveY, 0);
      }

      // Fire at player
      if (this.#timeSinceLastShot > this.#fireRate && distance < 500) {
         this.#timeSinceLastShot = 0;

         // Create bullet towards player
         const angle = Math.atan2(dy, dx);
         const bulletVec = { x: Math.cos(angle), y: Math.sin(angle), z: 0 };
         const bullet = new EnemyBullet(bulletVec, '#ff0088');
         bullet.translate(this.position.x, this.position.y, this.position.z);
         bullet.rotate(0, 0, angle);
      }

      // Check collision with player bullets
      this.checkBulletCollision();
   }

   checkBulletCollision() {
      objectBuffer
         .filter((obj) => obj instanceof Bullet)
         .find((bullet) => {
            const distance = v3distance(this.position, bullet.position);

            if (distance < 20) {
               this.takeDamage(25);
               bullet.destroy();
               return true;
            }
         });
   }
}

class EnemyBullet extends Entity {
   #moveVector = v3(0);
   #moveSpeed = 800;
   #lifetime = 0;
   #maxLifetime = 3;

   constructor(moveVector, color) {
      super();

      let polys = createPyramidGeometry(6, color || '#ff0088');
      polys = this.applyRotateX(polys, Math.PI / 2);
      polys = this.applyRotateZ(polys, Math.PI / 2);
      polys = this.applyTranslate(polys, { x: 3, y: 0, z: 0 });

      this.addPolygons(...polys);
      this.#moveVector = moveVector;
   }

   applyRotation(polygons, by) {
      const { x, y, z } = by || this.rotation;
      return this.applyRotateZ(this.applyRotateY(this.applyRotateX(polygons, x), y), z);
   }

   update(dt) {
      this.#lifetime += dt;

      if (this.#lifetime > this.#maxLifetime) {
         this.destroy();
         return;
      }

      this.translate(...v3array(v3mul(this.#moveVector, dt * this.#moveSpeed)));
      this.rotate(0.15, 0, 0);

      if (isPointOutOfCanvas(this.position.x, this.position.y)) {
         this.destroy();
         return;
      }

      this.checkPlayerCollision();
   }

   checkPlayerCollision() {
      if (!player) return;

      const distance = v3distance(this.position, player.position);

      if (distance < 25) {
         // Damage player
         if (typeof damagePlayer === 'function') {
            damagePlayer(15);
         } else {
            // Fallback to old lives system
            gameState.lives--;
            updateHUD();
         }
         this.destroy();
      }
   }
}

class Bullet extends Entity {
   #moveVector = v3(0);
   #moveSpeed = 1200;
   #lifetime = 0;
   #maxLifetime = 3;

   constructor(moveVector, color) {
      super();

      let polys = createPyramidGeometry(8, color || gameState.playerConfig.color);
      polys = this.applyRotateX(polys, Math.PI / 2);
      polys = this.applyRotateZ(polys, Math.PI / 2);
      polys = this.applyTranslate(polys, { x: 4, y: 0, z: 0 });

      this.addPolygons(...polys);
      this.#moveVector = moveVector;
   }

   applyRotation(polygons, by) {
      const { x, y, z } = by || this.rotation;
      return this.applyRotateZ(this.applyRotateY(this.applyRotateX(polygons, x), y), z);
   }

   update(dt) {
      this.#lifetime += dt;

      if (this.#lifetime > this.#maxLifetime) {
         this.destroy();
         return;
      }

      this.translate(...v3array(v3mul(this.#moveVector, dt * this.#moveSpeed)));
      this.rotate(0.15, 0, 0);

      if (isPointOutOfCanvas(this.position.x, this.position.y)) {
         this.destroy();
         return;
      }

      this.checkAsteroidsCollision();
   }

   checkAsteroidsCollision() {
      // Check asteroids
      const hitAsteroid = objectBuffer
         .filter((obj) => obj instanceof Asteroid)
         .find((asteroid) => {
            const distance = v3distance(this.position, asteroid.position);

            if (distance < asteroid.radius) {
               asteroid.explode();
               this.destroy();
               return true;
            }
         });

      if (hitAsteroid) return;

      // Check remote players in multiplayer
      if (gameState.mode === 'multiplayer' && typeof checkRemotePlayerHit === 'function') {
         checkRemotePlayerHit(this);
      }
   }
}

class Player extends Entity {
   #keyCodeMap = [];
   #velocity = v3(0);
   #acceleration = 500;
   #maxSpeed = 400;
   #fireRate = 0.15;
   #timeSinceLastShot = 0;
   #invulnerable = false;
   #invulnerableTime = 0;
   #blinkTimer = 0;

   constructor() {
      super();

      let polys = createShipGeometry(gameState.playerConfig.shipType, gameState.playerConfig.color);
      polys = this.applyRotateX(polys, Math.PI / 2);
      polys = this.applyRotateZ(polys, Math.PI / 2);
      polys = this.applyTranslate(polys, { x: 4, y: 0, z: 0 });

      this.addPolygons(...polys);

      // Bind methods for event listeners
      this.boundUpdateMousePos = this.#updateMousePos.bind(this);
      this.boundHandleMouseDown = this.#handleMouseDown.bind(this);
      this.boundOnKeyEvent = this.#onKeyEvent.bind(this);

      window.addEventListener("mousemove", this.boundUpdateMousePos);
      window.addEventListener("mousedown", this.boundHandleMouseDown);
      window.addEventListener("keydown", this.boundOnKeyEvent);
      window.addEventListener("keyup", this.boundOnKeyEvent);
   }

   destroy() {
      // Remove event listeners when player is destroyed
      if (this.boundUpdateMousePos) {
         window.removeEventListener("mousemove", this.boundUpdateMousePos);
         window.removeEventListener("mousedown", this.boundHandleMouseDown);
         window.removeEventListener("keydown", this.boundOnKeyEvent);
         window.removeEventListener("keyup", this.boundOnKeyEvent);
      }
      super.destroy();
   }

   applyRotation(polygons, by) {
      const { x, y, z } = by || this.rotation;
      return this.applyRotateZ(this.applyRotateY(this.applyRotateX(polygons, x), y), z);
   }

   update(dt) {
      if (gameState.isPaused) return;

      this.#timeSinceLastShot += dt;

      // Handle invulnerability
      if (this.#invulnerable) {
         this.#invulnerableTime -= dt;
         this.#blinkTimer += dt;

         if (this.#invulnerableTime <= 0) {
            this.#invulnerable = false;
            this.alpha = 1;
         } else {
            this.alpha = Math.sin(this.#blinkTimer * 20) * 0.5 + 0.5;
         }
      }

      this.rotate(2 * dt, 0, 0);

      // Check for mobile joystick input
      let leftRight = 0;
      let upDown = 0;

      if (window.mobileState && window.mobileState.joystickActive) {
         // Use joystick input
         const dx = window.mobileState.joystickCurrent.x - window.mobileState.joystickOrigin.x;
         const dy = window.mobileState.joystickCurrent.y - window.mobileState.joystickOrigin.y;
         const distance = Math.sqrt(dx * dx + dy * dy);

         if (distance > 10) { // Deadzone
            const maxDist = 50;
            const strength = Math.min(distance / maxDist, 1);
            leftRight = (dx / distance) * strength;
            upDown = (dy / distance) * strength;
         }
      } else {
         // Use keyboard input
         leftRight = this.#isPressed("D") - this.#isPressed("A");
         upDown = this.#isPressed("S") - this.#isPressed("W");
      }

      this.#velocity = v3add(
         this.#velocity,
         v3mul(v3(leftRight, upDown, 0), dt * this.#acceleration)
      );

      // Limit speed
      const speed = v3mag(this.#velocity);
      if (speed > this.#maxSpeed) {
         this.#velocity = v3mul(v3normalize(this.#velocity), this.#maxSpeed);
      }

      this.#applyVelocity(dt);
      this.#enforceBoundaries();
      this.#checkAsteroidCollision();

      // Check mobile firing
      this.checkMobileFiring();
   }

   #applyVelocity(dt) {
      const { x, y } = this.#velocity;
      this.translate(x * dt, y * dt, 0);
      this.#velocity = v3mul(this.#velocity, 0.98);
   }

   #enforceBoundaries() {
      const margin = 50;
      const halfWidth = canvas.width / 2 - margin;
      const halfHeight = canvas.height / 2 - margin;

      if (this.position.x > halfWidth) {
         this.position.x = halfWidth;
         this.#velocity.x *= -0.5;
      }
      if (this.position.x < -halfWidth) {
         this.position.x = -halfWidth;
         this.#velocity.x *= -0.5;
      }
      if (this.position.y > halfHeight) {
         this.position.y = halfHeight;
         this.#velocity.y *= -0.5;
      }
      if (this.position.y < -halfHeight) {
         this.position.y = -halfHeight;
         this.#velocity.y *= -0.5;
      }
   }

   #checkAsteroidCollision() {
      if (this.#invulnerable) return;

      objectBuffer
         .filter((obj) => obj instanceof Asteroid)
         .find((asteroid) => {
            const distance = v3distance(this.position, asteroid.position);

            if (distance < asteroid.radius + 20) {
               this.takeDamage();
               asteroid.explode();
               return true;
            }
         });
   }

   takeDamage() {
      gameState.lives--;
      GameManager.instance.addShake(20);

      this.#invulnerable = true;
      this.#invulnerableTime = 2;
      this.#blinkTimer = 0;

      updateHUD();

      if (gameState.lives <= 0) {
         gameOver();
      }
   }

   #shoot() {
      if (this.#timeSinceLastShot < this.#fireRate) return;
      if (gameState.isPaused) return;

      const { z } = this.rotation;
      const moveVector = v3normalize(v3(Math.cos(z), Math.sin(z), 0));
      moveVector.z = 0;

      const bullet = new Bullet(moveVector, gameState.playerConfig.color);
      bullet.translate(...v3array(this.position));
      bullet.rotation.z = this.rotation.z;

      // Send shot to multiplayer server
      if (typeof sendShot === 'function' && gameState.mode === 'multiplayer') {
         sendShot({
            position: this.position,
            direction: moveVector,
            color: gameState.playerConfig.color
         });
      }

      this.#timeSinceLastShot = 0;
   }

   #handleMouseDown(e) {
      if (e.button === 0) { // Left click
         this.#shoot();
      }
   }

   // Called by mobile controls
   checkMobileFiring() {
      if (window.mobileState && window.mobileState.fireButtonPressed) {
         this.#shoot();
      }
   }

   #updateMousePos(e) {
      // Improved absolute position tracking
      const rect = canvas.getBoundingClientRect();

      // Calculate mouse position in canvas space
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

      // Convert to centered coordinates
      const mx = canvasX - canvas.width / 2;
      const my = canvasY - canvas.height / 2;

      // Calculate angle from player to mouse
      const { x, y } = this.position;
      const dx = mx - x;
      const dy = my - y;

      this.rotation.z = Math.atan2(dy, dx);

      // Store mouse position for crosshair
      if (window.gameState) {
         window.gameState.mouseX = e.clientX;
         window.gameState.mouseY = e.clientY;
      }
   }

   #onKeyEvent(e) {
      this.#keyCodeMap[e.keyCode] = e.type === "keydown";

      // Pause on ESC
      if (e.keyCode === 27 && e.type === "keydown") {
         togglePause();
      }
   }

   #isPressed(char) {
      if (typeof char === "number") return this.#keyCodeMap[char] ? 1 : 0;
      return this.#keyCodeMap[char.charCodeAt(0)] ? 1 : 0;
   }
}

/**
 * ============================================
 * GAME LOGIC & SYSTEMS
 * ============================================
 */

let player = null;
let gameController = null;

function setupCanvas() {
   canvas.width = renderConfig.width;
   canvas.height = renderConfig.height;
   c.translate(canvas.width / 2, canvas.height / 2);
   document.body.appendChild(canvas);
}

function spawnAsteroids() {
   const asteroidsCount = gameState.level * 3 + 2;
   gameState.totalAsteroids = asteroidsCount;
   gameState.asteroidsDestroyed = 0;

   for (let i = 0; i < asteroidsCount; i++) {
      const size = 25 + Math.random() * 50 + gameState.level * 5;
      const asteroid = new Asteroid(size);

      // Spawn away from player
      let x, y;
      do {
         x = (Math.random() - 0.5) * (canvas.width - 200);
         y = (Math.random() - 0.5) * (canvas.height - 200);
      } while (Math.sqrt(x * x + y * y) < 200);

      asteroid.translate(x, y, 0);
   }
}

function spawnEnemies() {
   // Only spawn enemies from Level 3 onwards
   if (gameState.level < 3) return;

   // Get enemy types array
   const enemyTypes = ['Scout', 'Fighter', 'Heavy'];

   // Number of enemies increases with level (1 at level 3, 2 at level 5, etc.)
   const enemyCount = Math.floor((gameState.level - 2) / 2);

   for (let i = 0; i < enemyCount; i++) {
      // Choose enemy type based on level (higher levels get tougher enemies)
      let enemyType;
      if (gameState.level < 5) {
         enemyType = 'Scout';
      } else if (gameState.level < 7) {
         enemyType = Math.random() < 0.6 ? 'Scout' : 'Fighter';
      } else {
         const rand = Math.random();
         if (rand < 0.3) enemyType = 'Scout';
         else if (rand < 0.7) enemyType = 'Fighter';
         else enemyType = 'Heavy';
      }

      const enemy = new Enemy(enemyType);

      // Spawn enemies away from player
      let x, y;
      do {
         x = (Math.random() - 0.5) * (canvas.width - 300);
         y = (Math.random() - 0.5) * (canvas.height - 300);
      } while (Math.sqrt(x * x + y * y) < 300);

      enemy.translate(x, y, 0);
   }
}

function startGame() {
   // Reset game state
   gameState.currentScreen = 'playing';
   gameState.score = 0;
   gameState.lives = 3;
   gameState.level = 1;
   gameState.isPaused = false;
   gameState.levelStartTime = performance.now();

   // Clear existing entities
   [...objectBuffer].forEach(obj => obj.destroy());
   [...meshBuffer].forEach(mesh => mesh.destroy());

   // Create game entities
   gameController = new GameManager();
   player = new Player();

   spawnAsteroids();
   spawnEnemies();

   // Update UI
   hideAllScreens();
   document.getElementById('hud').classList.add('active');
   updateHUD();
}

function nextLevel() {
   gameState.level++;

   if (gameState.level > gameState.maxLevel) {
      victory();
      return;
   }

   gameState.isPaused = false;
   gameState.levelStartTime = performance.now();

   // Clear asteroids, pieces, and enemies
   [...objectBuffer].filter(obj =>
      obj instanceof Asteroid || obj instanceof AsteroidPiece || obj instanceof Enemy || obj instanceof EnemyBullet
   ).forEach(obj => obj.destroy());

   spawnAsteroids();
   spawnEnemies();

   hideAllScreens();
   document.getElementById('hud').classList.add('active');
   updateHUD();

   showNotification(`LEVEL ${gameState.level}`);
}

function checkLevelComplete() {
   const remainingAsteroids = objectBuffer.filter(obj => obj instanceof Asteroid).length;

   if (remainingAsteroids === 0) {
      gameState.isPaused = true;
      showLevelComplete();
   }
}

function showLevelComplete() {
   const levelTime = Math.floor((performance.now() - gameState.levelStartTime) / 1000);

   const screen = document.getElementById('level-complete');
   screen.querySelector('.level-complete-title').textContent = `LEVEL ${gameState.level} COMPLETE`;
   screen.querySelector('#level-number-stat').textContent = gameState.level;
   screen.querySelector('#level-score-stat').textContent = gameState.score;
   screen.querySelector('#level-time-stat').textContent = `${levelTime}s`;

   screen.classList.add('active');
}

function gameOver() {
   gameState.currentScreen = 'gameOver';
   gameState.isPaused = true;

   const screen = document.getElementById('game-over');
   screen.querySelector('#final-score').textContent = gameState.score;
   screen.querySelector('#final-level').textContent = gameState.level;
   screen.classList.add('active');
}

function victory() {
   gameState.currentScreen = 'victory';
   showNotification('VICTORY! ALL LEVELS CLEARED!');
   setTimeout(() => {
      returnToMenu();
   }, 3000);
}

function returnToMenu() {
   gameState.currentScreen = 'menu';
   gameState.isPaused = true;

   hideAllScreens();
   document.getElementById('main-menu').classList.remove('hidden');
}

function togglePause() {
   // Only allow pausing during active gameplay
   if (gameState.currentScreen !== 'playing' && !gameState.isPaused) return;

   gameState.isPaused = !gameState.isPaused;

   const pauseMenu = document.getElementById('pause-menu');
   if (gameState.isPaused) {
      pauseMenu.classList.add('active');
      gameState.currentScreen = 'paused';
   } else {
      pauseMenu.classList.remove('active');
      gameState.currentScreen = 'playing';
   }
}

// Make togglePause globally accessible
window.togglePause = togglePause;

function hideAllScreens() {
   document.getElementById('main-menu').classList.add('hidden');
   document.getElementById('customization').classList.remove('active');
   document.getElementById('controls-screen').classList.remove('active');
   document.getElementById('hud').classList.remove('active');
   document.getElementById('level-complete').classList.remove('active');
   document.getElementById('game-over').classList.remove('active');
   document.getElementById('pause-menu').classList.remove('active');

   // Multiplayer screens
   const multiplayerMenu = document.getElementById('multiplayer-menu');
   const roomBrowser = document.getElementById('room-browser');
   const lobbyScreen = document.getElementById('lobby-screen');
   const respawnScreen = document.getElementById('respawn-screen');

   if (multiplayerMenu) multiplayerMenu.classList.remove('active');
   if (roomBrowser) roomBrowser.classList.remove('active');
   if (lobbyScreen) lobbyScreen.classList.remove('active');
   if (respawnScreen) respawnScreen.classList.remove('active');
}

function showNotification(text) {
   const notif = document.getElementById('notification');
   notif.textContent = text;
   notif.classList.add('show');

   setTimeout(() => {
      notif.classList.remove('show');
   }, 2000);
}

function showDamageNumber(damage, worldPosition) {
   // Create damage number element
   const damageEl = document.createElement('div');
   damageEl.className = 'damage-number';
   damageEl.textContent = Math.round(damage);

   // Convert world position to screen position
   const screenX = worldPosition.x + canvas.width / 2;
   const screenY = worldPosition.y + canvas.height / 2;

   damageEl.style.left = screenX + 'px';
   damageEl.style.top = screenY + 'px';
   damageEl.style.position = 'absolute';
   damageEl.style.color = '#ff8800';
   damageEl.style.fontSize = '20px';
   damageEl.style.fontWeight = 'bold';
   damageEl.style.fontFamily = 'Orbitron, monospace';
   damageEl.style.textShadow = '0 0 10px rgba(255, 136, 0, 0.8)';
   damageEl.style.pointerEvents = 'none';
   damageEl.style.zIndex = '1000';
   damageEl.style.animation = 'damageFloat 1s ease-out forwards';

   document.body.appendChild(damageEl);

   setTimeout(() => {
      damageEl.remove();
   }, 1000);
}

/**
 * ============================================
 * UI MANAGEMENT
 * ============================================
 */

function updateHUD() {
   // Update level display with format "current/max"
   const levelValueEl = document.getElementById('level-value');
   if (levelValueEl) {
      levelValueEl.textContent = `${gameState.level}/${gameState.maxLevel}`;
   }

   // Update lives - show actual count as icons
   const livesContainer = document.querySelector('.lives-container');
   if (livesContainer) {
      livesContainer.innerHTML = '';
      for (let i = 0; i < gameState.lives; i++) {
         const lifeIcon = document.createElement('div');
         lifeIcon.className = 'life-icon';
         lifeIcon.textContent = '◆';
         livesContainer.appendChild(lifeIcon);
      }
   }

   // Update progress bar
   const progressFill = document.querySelector('.progress-fill');
   if (progressFill && gameState.totalAsteroids > 0) {
      const progress = (gameState.asteroidsDestroyed / gameState.totalAsteroids) * 100;
      progressFill.style.width = `${progress}%`;
   }
}

function initUI() {
   // Create UI overlay
   const overlay = document.createElement('div');
   overlay.id = 'ui-overlay';
   overlay.innerHTML = `
      <!-- HUD -->
      <div id="hud">
         <div class="hud-top">
            <div class="hud-panel">
               <div class="hud-label">Level</div>
               <div class="hud-value" id="level-value">1</div>
               <div class="level-progress">
                  <div class="progress-bar">
                     <div class="progress-fill" style="width: 0%"></div>
                  </div>
               </div>
            </div>
            <div class="hud-panel">
               <div class="hud-label">Lives</div>
               <div class="lives-container"></div>
            </div>
         </div>
         <!-- Crosshair -->
         <div id="crosshair">
            <div class="crosshair-dot"></div>
            <div class="crosshair-line crosshair-h"></div>
            <div class="crosshair-line crosshair-v"></div>
         </div>
      </div>

      <!-- Main Menu -->
      <div id="main-menu">
         <canvas id="menu-wireframe-bg"></canvas>
         <h1 class="menu-title">NEON VOID</h1>
         <p class="menu-subtitle">3D Space Combat</p>
         <div class="menu-buttons">
            <button class="menu-btn" id="start-btn"><span>SINGLEPLAYER</span></button>
            <button class="menu-btn" id="multiplayer-btn"><span>MULTIPLAYER</span></button>
            <button class="menu-btn" id="customize-btn"><span>CUSTOMIZE SHIP</span></button>
            <button class="menu-btn" id="controls-btn"><span>CONTROLS</span></button>
            <button class="back-btn" id="landing-btn" style="margin-top: 20px;">RETURN TO HOMEPAGE</button>
         </div>
      </div>

      <!-- Multiplayer Menu -->
      <div id="multiplayer-menu">
         <h2 class="custom-title">MULTIPLAYER</h2>
         <div id="connection-indicator" class="disconnected">● Disconnected</div>
         <div class="menu-buttons">
            <button class="menu-btn" onclick="createRoom()"><span>CREATE ROOM</span></button>
            <button class="menu-btn" onclick="joinRoom()"><span>JOIN ROOM</span></button>
            <button class="menu-btn" onclick="showRoomBrowser()"><span>BROWSE ROOMS</span></button>
            <button class="back-btn" onclick="backToMainMenu()">BACK TO MENU</button>
         </div>
      </div>

      <!-- Room Browser -->
      <div id="room-browser">
         <h2 class="custom-title">AVAILABLE ROOMS</h2>
         <div id="room-list" class="room-list"></div>
         <button class="back-btn" onclick="backToMultiplayerMenu()">BACK</button>
      </div>

      <!-- Lobby Screen -->
      <div id="lobby-screen">
         <h2 class="custom-title">LOBBY</h2>
         <div class="lobby-content">
            <div class="lobby-info">
               <div class="room-code-display">
                  <span>Room Code:</span>
                  <span id="lobby-room-code" class="room-code-large">XXXXXX</span>
               </div>
               <div class="lobby-players">
                  <h3>Players</h3>
                  <div id="lobby-players-list"></div>
               </div>
            </div>
            <div class="lobby-actions">
               <button class="menu-btn" id="ready-btn" onclick="toggleReady()"><span>READY</span></button>
               <button class="menu-btn" id="start-game-btn" onclick="startMultiplayerGame()" style="display:none;"><span>START GAME</span></button>
               <button class="back-btn" onclick="leaveRoom()">LEAVE ROOM</button>
            </div>
         </div>
      </div>

      <!-- Respawn Screen -->
      <div id="respawn-screen">
         <h2 class="respawn-title">YOU WERE ELIMINATED</h2>
         <div class="respawn-timer">Respawning in <span id="respawn-countdown">5</span>s</div>
         <button class="menu-btn" onclick="requestRespawn()"><span>RESPAWN NOW</span></button>
      </div>

      <!-- Chat Box (for multiplayer) -->
      <div id="chat-box">
         <div id="chat-messages"></div>
         <div class="chat-input-container">
            <input type="text" id="chat-input" placeholder="Press Enter to chat..." maxlength="100">
         </div>
      </div>

      <!-- Controls Screen -->
      <div id="controls-screen">
         <h2 class="custom-title">Controls & Rules</h2>
         <div class="controls-container">
            <div class="control-item">
               <div class="control-key">W / A / S / D</div>
               <div class="control-desc">Move Ship</div>
            </div>
            <div class="control-item">
               <div class="control-key">Mouse</div>
               <div class="control-desc">Aim Weapon</div>
            </div>
            <div class="control-item">
               <div class="control-key">Left Click</div>
               <div class="control-desc">Fire Weapon</div>
            </div>
            <div class="control-item">
               <div class="control-key">ESC</div>
               <div class="control-desc">Pause Game</div>
            </div>
         </div>
         <div class="game-rules">
            <h3 style="color: #00ffff; margin-bottom: 15px; text-align: center;">Game Rules</h3>
            <ul style="color: rgba(255,255,255,0.8); line-height: 1.8; list-style: none; padding: 0;">
               <li>◆ Destroy all asteroids to complete each level</li>
               <li>◆ 10 levels total - increasing difficulty</li>
               <li>◆ You have 3 lives - lose one when hit</li>
               <li>◆ AI enemies spawn from Level 3 onwards</li>
               <li>◆ Each ship has unique stats (speed, armor, damage)</li>
               <li>◆ Hit points appear when you damage targets</li>
            </ul>
         </div>
         <button class="back-btn" id="controls-back-btn">BACK TO MENU</button>
      </div>

      <!-- Customization -->
      <div id="customization">
         <h2 class="custom-title">Ship Customization</h2>
         <div class="custom-container">
            <div class="ship-preview" id="ship-preview"></div>
            <div class="custom-options">
               <div class="custom-section">
                  <h3>Ship Color</h3>
                  <div class="color-grid" id="color-grid"></div>
               </div>
               <div class="custom-section">
                  <h3>Ship Type</h3>
                  <div class="ship-grid" id="ship-grid"></div>
               </div>
            </div>
         </div>
         <button class="back-btn" id="back-btn">BACK TO MENU</button>
      </div>

      <!-- Level Complete -->
      <div id="level-complete">
         <h2 class="level-complete-title">LEVEL COMPLETE</h2>
         <div class="level-stats">
            <div class="stat-item">
               <div class="stat-label">Level</div>
               <div class="stat-value" id="level-number-stat">1</div>
            </div>
            <div class="stat-item">
               <div class="stat-label">Score</div>
               <div class="stat-value" id="level-score-stat">0</div>
            </div>
            <div class="stat-item">
               <div class="stat-label">Time</div>
               <div class="stat-value" id="level-time-stat">0s</div>
            </div>
         </div>
         <button class="menu-btn" id="next-level-btn"><span>NEXT LEVEL</span></button>
         <button class="back-btn" id="level-menu-btn" style="margin-top: 20px;">MAIN MENU</button>
      </div>

      <!-- Game Over -->
      <div id="game-over">
         <h2 class="game-over-title">MISSION FAILED</h2>
         <div class="level-stats">
            <div class="stat-item">
               <div class="stat-label">Final Score</div>
               <div class="stat-value" id="final-score">0</div>
            </div>
            <div class="stat-item">
               <div class="stat-label">Level Reached</div>
               <div class="stat-value" id="final-level">1</div>
            </div>
         </div>
         <button class="menu-btn" id="restart-btn"><span>RETRY MISSION</span></button>
         <button class="back-btn" id="menu-btn" style="margin-top: 20px;">MAIN MENU</button>
      </div>

      <!-- Pause Menu -->
      <div id="pause-menu">
         <h2 class="pause-title">PAUSED</h2>
         <div class="menu-buttons">
            <button class="menu-btn" id="resume-btn"><span>RESUME</span></button>
            <button class="back-btn" id="quit-btn">QUIT TO MENU</button>
         </div>
      </div>

      <!-- Notification -->
      <div id="notification"></div>
   `;
   document.body.appendChild(overlay);

   // Setup event listeners
   document.getElementById('start-btn').addEventListener('click', startGame);
   document.getElementById('multiplayer-btn').addEventListener('click', showMultiplayerMenu);
   document.getElementById('customize-btn').addEventListener('click', showCustomization);
   document.getElementById('controls-btn').addEventListener('click', showControls);
   document.getElementById('back-btn').addEventListener('click', hideCustomization);
   document.getElementById('controls-back-btn').addEventListener('click', hideControls);
   document.getElementById('next-level-btn').addEventListener('click', nextLevel);
   document.getElementById('restart-btn').addEventListener('click', startGame);
   document.getElementById('menu-btn').addEventListener('click', returnToMenu);
   document.getElementById('resume-btn').addEventListener('click', togglePause);
   document.getElementById('quit-btn').addEventListener('click', returnToMenu);
   document.getElementById('landing-btn').addEventListener('click', () => window.location.href = 'index.html');
   document.getElementById('level-menu-btn').addEventListener('click', returnToMenu);

   // Chat input listener
   const chatInput = document.getElementById('chat-input');
   if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
         if (e.key === 'Enter' && chatInput.value.trim()) {
            sendChatMessage(chatInput.value.trim());
            chatInput.value = '';
         }
      });
   }

   // Setup customization options
   setupCustomization();

   // Initialize wireframe background for menu
   setTimeout(() => {
      const menuCanvas = document.getElementById('menu-wireframe-bg');
      if (menuCanvas && typeof WireframeBackground !== 'undefined') {
         new WireframeBackground(null, 'menu-wireframe-bg');
      }
   }, 100);
}

function showMultiplayerMenu() {
   hideAllScreens();
   document.getElementById('multiplayer-menu').classList.add('active');

   // Auto-connect to server
   if (typeof connectToServer === 'function' && (!multiplayerState || !multiplayerState.connected)) {
      connectToServer();
   }
}

window.backToMainMenu = function() {
   hideAllScreens();
   document.getElementById('main-menu').classList.remove('hidden');
};

window.showRoomBrowser = function() {
   hideAllScreens();
   document.getElementById('room-browser').classList.add('active');

   if (multiplayerState && multiplayerState.socket) {
      multiplayerState.socket.emit('get-rooms');
   }
};

window.backToMultiplayerMenu = function() {
   hideAllScreens();
   document.getElementById('multiplayer-menu').classList.add('active');
};

function showCustomization() {
   hideAllScreens();
   document.getElementById('customization').classList.add('active');
}

function hideCustomization() {
   hideAllScreens();
   document.getElementById('main-menu').classList.remove('hidden');
}

function showControls() {
   hideAllScreens();
   document.getElementById('controls-screen').classList.add('active');
}

function hideControls() {
   hideAllScreens();
   document.getElementById('main-menu').classList.remove('hidden');
}

function setupCustomization() {
   // Setup color options
   const colorGrid = document.getElementById('color-grid');
   SHIP_COLORS.forEach((color, index) => {
      const option = document.createElement('div');
      option.className = 'color-option';
      option.style.backgroundColor = color.value;
      if (index === 1) option.classList.add('selected'); // Default green

      option.addEventListener('click', () => {
         document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
         option.classList.add('selected');
         gameState.playerConfig.color = color.value;
      });

      colorGrid.appendChild(option);
   });

   // Setup ship type options
   const shipGrid = document.getElementById('ship-grid');
   SHIP_TYPES.forEach((type, index) => {
      const option = document.createElement('div');
      option.className = 'ship-option';
      option.textContent = type;
      if (index === 0) option.classList.add('selected'); // Default Interceptor

      option.addEventListener('click', () => {
         document.querySelectorAll('.ship-option').forEach(el => el.classList.remove('selected'));
         option.classList.add('selected');
         gameState.playerConfig.shipType = type;
         gameState.playerConfig.shipIndex = index;
      });

      shipGrid.appendChild(option);
   });
}

/**
 * ============================================
 * MAIN GAME LOOP
 * ============================================
 */

const updateObjects = (dt) => {
   objectBuffer.forEach((object) => {
      object.update?.(dt);
   });
};

let oldTimeStamp = 0;
const render = (timeStamp) => {
   requestAnimationFrame(render);

   const deltaTime = oldTimeStamp !== 0 ? (timeStamp - oldTimeStamp) / 1000 : 0;
   oldTimeStamp = timeStamp;

   if (!gameState.isPaused && gameState.currentScreen === 'playing') {
      clearScreen();
      renderPolygons();
      updateObjects(deltaTime);
      renderBloom();

      // Draw mobile touch controls
      if (typeof drawTouchControls === 'function') {
         drawTouchControls();
      }
   } else {
      clearScreen();
      renderPolygons();
      renderBloom();
   }
};

/**
 * ============================================
 * INITIALIZATION
 * ============================================
 */

function init() {
   setupCanvas();
   initUI();
   requestAnimationFrame(render);
}

// Start the game
init();

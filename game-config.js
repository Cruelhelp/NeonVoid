/**
 * NEON VOID - Game Configuration
 * Centralized configuration for all game systems
 */

// Ship Statistics and Configurations
const SHIP_STATS = {
   'Interceptor': {
      speed: 500,
      armor: 80,
      damage: 100,
      fireRate: 0.12,
      health: 100,
      description: 'Fast and agile, perfect for dodging',
      weaponType: 'laser'
   },
   'Fighter': {
      speed: 400,
      armor: 120,
      damage: 120,
      fireRate: 0.15,
      health: 120,
      description: 'Balanced offense and defense',
      weaponType: 'plasma'
   },
   'Bomber': {
      speed: 300,
      armor: 100,
      damage: 200,
      fireRate: 0.25,
      health: 100,
      description: 'Devastating firepower, slower movement',
      weaponType: 'missile'
   },
   'Cruiser': {
      speed: 350,
      armor: 180,
      damage: 110,
      fireRate: 0.18,
      health: 150,
      description: 'Heavy armor, moderate speed',
      weaponType: 'laser'
   },
   'Stealth': {
      speed: 550,
      armor: 60,
      damage: 90,
      fireRate: 0.10,
      health: 80,
      description: 'Ultra-fast, glass cannon',
      weaponType: 'plasma'
   },
   'Tank': {
      speed: 250,
      armor: 250,
      damage: 130,
      fireRate: 0.20,
      health: 200,
      description: 'Maximum armor, slow but unstoppable',
      weaponType: 'cannon'
   }
};

// Weapon Types
const WEAPON_TYPES = {
   'laser': {
      name: 'Laser',
      color: '#00ffff',
      speed: 1200,
      size: 8,
      damage: 1,
      piercing: false
   },
   'plasma': {
      name: 'Plasma',
      color: '#00ff88',
      speed: 1000,
      size: 12,
      damage: 1.2,
      piercing: false
   },
   'missile': {
      name: 'Missile',
      color: '#ff8800',
      speed: 800,
      size: 15,
      damage: 2,
      piercing: false,
      explosive: true
   },
   'cannon': {
      name: 'Cannon',
      color: '#ff0044',
      speed: 900,
      size: 14,
      damage: 1.5,
      piercing: true
   }
};

// Enemy AI Types
const ENEMY_TYPES = {
   'Scout': {
      speed: 200,
      health: 50,
      damage: 10,
      color: '#ff00ff',
      size: 15,
      fireRate: 2,
      aggression: 0.3
   },
   'Fighter': {
      speed: 150,
      health: 80,
      damage: 15,
      color: '#ff0088',
      size: 18,
      fireRate: 1.5,
      aggression: 0.5
   },
   'Heavy': {
      speed: 100,
      health: 150,
      damage: 25,
      color: '#ff4400',
      size: 25,
      fireRate: 3,
      aggression: 0.7
   }
};

// Level Configuration
const LEVEL_CONFIG = {
   asteroidBaseCount: 3,
   asteroidIncrement: 2,
   enemySpawnLevel: 3, // Enemies start appearing at level 3
   enemyIncrement: 1,
   aggressionMultiplier: 0.1 // Aggression increases by 10% per level
};

export { SHIP_STATS, WEAPON_TYPES, ENEMY_TYPES, LEVEL_CONFIG };

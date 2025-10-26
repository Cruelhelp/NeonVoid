/**
 * NEON VOID - Multiplayer Server
 * Node.js + Socket.io backend for real-time PvP
 */

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
   cors: {
      origin: "*",
      methods: ["GET", "POST"]
   }
});
const path = require('path');

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, 'index.html'));
});

// Game state
const rooms = new Map();
const players = new Map();

class GameRoom {
   constructor(roomId, hostId, hostName) {
      this.id = roomId;
      this.hostId = hostId;
      this.players = new Map();
      this.maxPlayers = 4;
      this.gameState = 'lobby'; // lobby, playing, finished
      this.asteroids = [];
      this.projectiles = [];
      this.startTime = null;
      this.mode = '1v1'; // 1v1, ffa (free-for-all), team

      // Add host
      this.addPlayer(hostId, hostName, true);
   }

   addPlayer(playerId, playerName, isHost = false) {
      if (this.players.size >= this.maxPlayers) {
         return false;
      }

      this.players.set(playerId, {
         id: playerId,
         name: playerName,
         isHost: isHost,
         ready: isHost,
         score: 0,
         kills: 0,
         deaths: 0,
         position: { x: 0, y: 0, z: 0 },
         rotation: { x: 0, y: 0, z: 0 },
         velocity: { x: 0, y: 0, z: 0 },
         health: 100,
         alive: true,
         shipType: 'Interceptor',
         color: '#00ffff',
         lastUpdate: Date.now()
      });

      return true;
   }

   removePlayer(playerId) {
      this.players.delete(playerId);

      // If host left, assign new host
      if (playerId === this.hostId && this.players.size > 0) {
         const newHost = Array.from(this.players.values())[0];
         newHost.isHost = true;
         this.hostId = newHost.id;
      }

      return this.players.size;
   }

   updatePlayer(playerId, data) {
      const player = this.players.get(playerId);
      if (player) {
         Object.assign(player, data);
         player.lastUpdate = Date.now();
      }
   }

   getAllPlayers() {
      return Array.from(this.players.values());
   }

   isReady() {
      return Array.from(this.players.values()).every(p => p.ready) && this.players.size >= 2;
   }

   startGame() {
      this.gameState = 'playing';
      this.startTime = Date.now();

      // Spawn players at different positions
      const positions = [
         { x: -300, y: -300 },
         { x: 300, y: -300 },
         { x: -300, y: 300 },
         { x: 300, y: 300 }
      ];

      let index = 0;
      this.players.forEach(player => {
         player.position = { ...positions[index], z: 0 };
         player.health = 100;
         player.alive = true;
         player.kills = 0;
         player.deaths = 0;
         index++;
      });
   }
}

// Generate unique room code
function generateRoomCode() {
   return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Socket.io events
io.on('connection', (socket) => {
   console.log(`Player connected: ${socket.id}`);

   // Create room
   socket.on('create-room', (data) => {
      const roomCode = generateRoomCode();
      const room = new GameRoom(roomCode, socket.id, data.playerName);
      rooms.set(roomCode, room);

      socket.join(roomCode);
      players.set(socket.id, { roomCode, playerName: data.playerName });

      socket.emit('room-created', {
         roomCode: roomCode,
         playerId: socket.id,
         players: room.getAllPlayers()
      });

      console.log(`Room created: ${roomCode} by ${data.playerName}`);
   });

   // Join room
   socket.on('join-room', (data) => {
      const { roomCode, playerName } = data;
      const room = rooms.get(roomCode);

      if (!room) {
         socket.emit('error', { message: 'Room not found' });
         return;
      }

      if (room.gameState !== 'lobby') {
         socket.emit('error', { message: 'Game already in progress' });
         return;
      }

      if (!room.addPlayer(socket.id, playerName)) {
         socket.emit('error', { message: 'Room is full' });
         return;
      }

      socket.join(roomCode);
      players.set(socket.id, { roomCode, playerName });

      // Notify all players in room
      io.to(roomCode).emit('player-joined', {
         playerId: socket.id,
         playerName: playerName,
         players: room.getAllPlayers()
      });

      socket.emit('room-joined', {
         roomCode: roomCode,
         playerId: socket.id,
         players: room.getAllPlayers()
      });

      console.log(`${playerName} joined room ${roomCode}`);
   });

   // Leave room
   socket.on('leave-room', () => {
      const playerData = players.get(socket.id);
      if (!playerData) return;

      const room = rooms.get(playerData.roomCode);
      if (room) {
         room.removePlayer(socket.id);

         socket.leave(playerData.roomCode);

         if (room.players.size === 0) {
            rooms.delete(playerData.roomCode);
            console.log(`Room ${playerData.roomCode} deleted (empty)`);
         } else {
            io.to(playerData.roomCode).emit('player-left', {
               playerId: socket.id,
               players: room.getAllPlayers()
            });
         }
      }

      players.delete(socket.id);
   });

   // Player ready
   socket.on('player-ready', (data) => {
      const playerData = players.get(socket.id);
      if (!playerData) return;

      const room = rooms.get(playerData.roomCode);
      if (room) {
         const player = room.players.get(socket.id);
         if (player) {
            player.ready = data.ready;
            player.shipType = data.shipType || player.shipType;
            player.color = data.color || player.color;

            io.to(playerData.roomCode).emit('player-ready-update', {
               playerId: socket.id,
               ready: player.ready,
               players: room.getAllPlayers()
            });
         }
      }
   });

   // Start game
   socket.on('start-game', () => {
      const playerData = players.get(socket.id);
      if (!playerData) return;

      const room = rooms.get(playerData.roomCode);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player || !player.isHost) {
         socket.emit('error', { message: 'Only host can start game' });
         return;
      }

      if (!room.isReady()) {
         socket.emit('error', { message: 'Not all players are ready' });
         return;
      }

      room.startGame();
      io.to(playerData.roomCode).emit('game-started', {
         players: room.getAllPlayers(),
         startTime: room.startTime
      });

      console.log(`Game started in room ${playerData.roomCode}`);
   });

   // Player movement update
   socket.on('player-update', (data) => {
      const playerData = players.get(socket.id);
      if (!playerData) return;

      const room = rooms.get(playerData.roomCode);
      if (!room || room.gameState !== 'playing') return;

      room.updatePlayer(socket.id, {
         position: data.position,
         rotation: data.rotation,
         velocity: data.velocity,
         health: data.health,
         alive: data.alive
      });

      // Broadcast to other players in room
      socket.to(playerData.roomCode).emit('player-moved', {
         playerId: socket.id,
         position: data.position,
         rotation: data.rotation,
         velocity: data.velocity,
         health: data.health,
         alive: data.alive
      });
   });

   // Player shot
   socket.on('player-shot', (data) => {
      const playerData = players.get(socket.id);
      if (!playerData) return;

      const room = rooms.get(playerData.roomCode);
      if (!room || room.gameState !== 'playing') return;

      // Broadcast bullet to all players
      socket.to(playerData.roomCode).emit('player-shot', {
         playerId: socket.id,
         bulletId: data.bulletId,
         position: data.position,
         direction: data.direction,
         color: data.color
      });
   });

   // Player hit
   socket.on('player-hit', (data) => {
      const playerData = players.get(socket.id);
      if (!playerData) return;

      const room = rooms.get(playerData.roomCode);
      if (!room || room.gameState !== 'playing') return;

      const hitPlayer = room.players.get(data.targetId);
      const shooter = room.players.get(data.shooterId);

      if (hitPlayer && shooter) {
         hitPlayer.health -= data.damage;

         if (hitPlayer.health <= 0) {
            hitPlayer.alive = false;
            hitPlayer.deaths++;
            shooter.kills++;
            shooter.score += 100;

            io.to(playerData.roomCode).emit('player-killed', {
               victimId: data.targetId,
               killerId: data.shooterId,
               killerName: shooter.name,
               victimName: hitPlayer.name
            });
         } else {
            io.to(playerData.roomCode).emit('player-damaged', {
               playerId: data.targetId,
               health: hitPlayer.health,
               damage: data.damage
            });
         }
      }
   });

   // Respawn
   socket.on('respawn', () => {
      const playerData = players.get(socket.id);
      if (!playerData) return;

      const room = rooms.get(playerData.roomCode);
      if (!room || room.gameState !== 'playing') return;

      const player = room.players.get(socket.id);
      if (player) {
         player.health = 100;
         player.alive = true;

         // Random spawn position
         const angle = Math.random() * Math.PI * 2;
         const distance = 300;
         player.position = {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            z: 0
         };

         io.to(playerData.roomCode).emit('player-respawned', {
            playerId: socket.id,
            position: player.position,
            health: player.health
         });
      }
   });

   // Chat message
   socket.on('chat-message', (data) => {
      const playerData = players.get(socket.id);
      if (!playerData) return;

      io.to(playerData.roomCode).emit('chat-message', {
         playerId: socket.id,
         playerName: playerData.playerName,
         message: data.message,
         timestamp: Date.now()
      });
   });

   // Get room list
   socket.on('get-rooms', () => {
      const roomList = Array.from(rooms.values())
         .filter(room => room.gameState === 'lobby')
         .map(room => ({
            roomCode: room.id,
            playerCount: room.players.size,
            maxPlayers: room.maxPlayers,
            hostName: Array.from(room.players.values()).find(p => p.isHost)?.name
         }));

      socket.emit('room-list', roomList);
   });

   // Disconnect
   socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);

      const playerData = players.get(socket.id);
      if (playerData) {
         const room = rooms.get(playerData.roomCode);
         if (room) {
            const remainingPlayers = room.removePlayer(socket.id);

            if (remainingPlayers === 0) {
               rooms.delete(playerData.roomCode);
               console.log(`Room ${playerData.roomCode} deleted (empty)`);
            } else {
               io.to(playerData.roomCode).emit('player-left', {
                  playerId: socket.id,
                  players: room.getAllPlayers()
               });
            }
         }
      }

      players.delete(socket.id);
   });
});

// Start server
http.listen(PORT, () => {
   console.log('╔════════════════════════════════════════╗');
   console.log('║     NEON VOID - Multiplayer Server   ║');
   console.log('╚════════════════════════════════════════╝');
   console.log(`Server running on port ${PORT}`);
   console.log(`Local: http://localhost:${PORT}`);
   console.log(`Network: http://<your-ip>:${PORT}`);
   console.log('');
   console.log('Press Ctrl+C to stop server');
});

// Cleanup inactive rooms every 5 minutes
setInterval(() => {
   const now = Date.now();
   rooms.forEach((room, roomCode) => {
      if (room.gameState === 'lobby') {
         const allInactive = Array.from(room.players.values())
            .every(player => now - player.lastUpdate > 300000); // 5 minutes

         if (allInactive) {
            rooms.delete(roomCode);
            console.log(`Room ${roomCode} deleted (inactive)`);
         }
      }
   });
}, 300000);

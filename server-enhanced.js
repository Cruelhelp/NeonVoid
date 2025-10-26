/**
 * NEON VOID - Enhanced Multiplayer Server
 * Features: Global Chat, User IDs, Friends, Private Messages
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
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, 'index.html'));
});

// Enhanced game state
const rooms = new Map();
const users = new Map(); // userId -> user data
const onlineUsers = new Map(); // socketId -> userId
const friendRequests = new Map(); // userId -> array of pending requests

// User class with unique ID
class User {
   constructor(username, socketId) {
      this.id = this.generateUserId();
      this.username = username;
      this.socketId = socketId;
      this.friends = new Set();
      this.blocked = new Set();
      this.online = true;
      this.status = 'online'; // online, away, busy, offline
      this.createdAt = Date.now();
      this.lastSeen = Date.now();
      this.stats = {
         kills: 0,
         deaths: 0,
         wins: 0,
         losses: 0,
         gamesPlayed: 0
      };
   }

   generateUserId() {
      return 'USER_' + crypto.randomBytes(8).toString('hex').toUpperCase();
   }

   toPublic() {
      return {
         id: this.id,
         username: this.username,
         online: this.online,
         status: this.status,
         stats: this.stats
      };
   }
}

class GameRoom {
   constructor(roomId, hostId, hostName) {
      this.id = roomId;
      this.hostId = hostId;
      this.players = new Map();
      this.maxPlayers = 4;
      this.gameState = 'lobby';
      this.asteroids = [];
      this.projectiles = [];
      this.startTime = null;
      this.mode = 'ffa';

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

function generateRoomCode() {
   return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Socket.io events
io.on('connection', (socket) => {
   console.log(`Socket connected: ${socket.id}`);

   // User registration with unique ID
   socket.on('register-user', (data) => {
      const { username } = data;

      // Check if username is taken (in memory - will use DB later)
      const existingUser = Array.from(users.values()).find(u => u.username.toLowerCase() === username.toLowerCase());

      if (existingUser) {
         // User exists, update socket
         existingUser.socketId = socket.id;
         existingUser.online = true;
         existingUser.lastSeen = Date.now();
         onlineUsers.set(socket.id, existingUser.id);

         socket.emit('user-registered', {
            userId: existingUser.id,
            username: existingUser.username,
            friends: Array.from(existingUser.friends),
            stats: existingUser.stats
         });
      } else {
         // Create new user
         const user = new User(username, socket.id);
         users.set(user.id, user);
         onlineUsers.set(socket.id, user.id);

         socket.emit('user-registered', {
            userId: user.id,
            username: user.username,
            friends: [],
            stats: user.stats
         });
      }

      // Broadcast online users list
      broadcastOnlineUsers();
   });

   // Global chat
   socket.on('global-chat', (data) => {
      const userId = onlineUsers.get(socket.id);
      const user = users.get(userId);

      if (!user) return;

      const message = {
         userId: user.id,
         username: user.username,
         message: data.message,
         timestamp: Date.now(),
         type: 'global'
      };

      io.emit('global-chat-message', message);
      console.log(`[Global Chat] ${user.username}: ${data.message}`);
   });

   // Private message
   socket.on('private-message', (data) => {
      const senderId = onlineUsers.get(socket.id);
      const sender = users.get(senderId);

      if (!sender) return;

      const recipient = users.get(data.recipientId);
      if (!recipient || !recipient.online) {
         socket.emit('error', { message: 'User is offline or not found' });
         return;
      }

      // Check if blocked
      if (recipient.blocked.has(senderId) || sender.blocked.has(data.recipientId)) {
         socket.emit('error', { message: 'Cannot send message' });
         return;
      }

      const message = {
         senderId: sender.id,
         senderUsername: sender.username,
         recipientId: recipient.id,
         recipientUsername: recipient.username,
         message: data.message,
         timestamp: Date.now(),
         type: 'private'
      };

      // Send to both sender and recipient
      socket.emit('private-message', message);
      io.to(recipient.socketId).emit('private-message', message);

      console.log(`[PM] ${sender.username} → ${recipient.username}: ${data.message}`);
   });

   // Search users
   socket.on('search-user', (data) => {
      const { query } = data;
      const results = Array.from(users.values())
         .filter(u => u.username.toLowerCase().includes(query.toLowerCase()))
         .slice(0, 10)
         .map(u => u.toPublic());

      socket.emit('search-results', results);
   });

   // Send friend request
   socket.on('friend-request', (data) => {
      const senderId = onlineUsers.get(socket.id);
      const sender = users.get(senderId);

      if (!sender) return;

      const recipient = users.get(data.userId);
      if (!recipient) {
         socket.emit('error', { message: 'User not found' });
         return;
      }

      // Check if already friends
      if (sender.friends.has(data.userId)) {
         socket.emit('error', { message: 'Already friends' });
         return;
      }

      // Add to pending requests
      if (!friendRequests.has(data.userId)) {
         friendRequests.set(data.userId, []);
      }

      const requests = friendRequests.get(data.userId);
      if (requests.find(r => r.senderId === senderId)) {
         socket.emit('error', { message: 'Request already sent' });
         return;
      }

      requests.push({
         senderId: senderId,
         senderUsername: sender.username,
         timestamp: Date.now()
      });

      // Notify recipient if online
      if (recipient.online) {
         io.to(recipient.socketId).emit('friend-request-received', {
            senderId: sender.id,
            senderUsername: sender.username,
            timestamp: Date.now()
         });
      }

      socket.emit('friend-request-sent', { username: recipient.username });
   });

   // Accept friend request
   socket.on('accept-friend', (data) => {
      const userId = onlineUsers.get(socket.id);
      const user = users.get(userId);

      if (!user) return;

      const sender = users.get(data.senderId);
      if (!sender) return;

      // Remove from pending
      const requests = friendRequests.get(userId) || [];
      const index = requests.findIndex(r => r.senderId === data.senderId);
      if (index !== -1) {
         requests.splice(index, 1);
      }

      // Add as friends
      user.friends.add(data.senderId);
      sender.friends.add(userId);

      // Notify both users
      socket.emit('friend-added', sender.toPublic());
      if (sender.online) {
         io.to(sender.socketId).emit('friend-added', user.toPublic());
      }
   });

   // Get online users
   socket.on('get-online-users', () => {
      const onlineList = Array.from(users.values())
         .filter(u => u.online)
         .map(u => u.toPublic());

      socket.emit('online-users', onlineList);
   });

   // Get friends list
   socket.on('get-friends', () => {
      const userId = onlineUsers.get(socket.id);
      const user = users.get(userId);

      if (!user) return;

      const friendsList = Array.from(user.friends)
         .map(fId => users.get(fId))
         .filter(f => f)
         .map(f => f.toPublic());

      socket.emit('friends-list', friendsList);
   });

   // Update status
   socket.on('update-status', (data) => {
      const userId = onlineUsers.get(socket.id);
      const user = users.get(userId);

      if (!user) return;

      user.status = data.status;
      broadcastOnlineUsers();
   });

   // === GAME ROOM EVENTS (existing code) ===

   socket.on('create-room', (data) => {
      const roomCode = generateRoomCode();
      const room = new GameRoom(roomCode, socket.id, data.playerName);
      rooms.set(roomCode, room);

      socket.join(roomCode);

      const userId = onlineUsers.get(socket.id);
      if (!userId) {
         players.set(socket.id, { roomCode, playerName: data.playerName });
      } else {
         players.set(socket.id, { roomCode, playerName: data.playerName, userId });
      }

      socket.emit('room-created', {
         roomCode: roomCode,
         playerId: socket.id,
         players: room.getAllPlayers()
      });

      console.log(`Room created: ${roomCode} by ${data.playerName}`);
   });

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

      const userId = onlineUsers.get(socket.id);
      if (!userId) {
         players.set(socket.id, { roomCode, playerName });
      } else {
         players.set(socket.id, { roomCode, playerName, userId });
      }

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

      socket.to(playerData.roomCode).emit('player-moved', {
         playerId: socket.id,
         position: data.position,
         rotation: data.rotation,
         velocity: data.velocity,
         health: data.health,
         alive: data.alive
      });
   });

   socket.on('player-shot', (data) => {
      const playerData = players.get(socket.id);
      if (!playerData) return;

      const room = rooms.get(playerData.roomCode);
      if (!room || room.gameState !== 'playing') return;

      socket.to(playerData.roomCode).emit('player-shot', {
         playerId: socket.id,
         bulletId: data.bulletId,
         position: data.position,
         direction: data.direction,
         color: data.color
      });
   });

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

            // Update user stats
            const shooterUserId = onlineUsers.get(data.shooterId);
            const victimUserId = onlineUsers.get(data.targetId);

            if (shooterUserId) {
               const shooterUser = users.get(shooterUserId);
               if (shooterUser) shooterUser.stats.kills++;
            }

            if (victimUserId) {
               const victimUser = users.get(victimUserId);
               if (victimUser) victimUser.stats.deaths++;
            }

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

   socket.on('respawn', () => {
      const playerData = players.get(socket.id);
      if (!playerData) return;

      const room = rooms.get(playerData.roomCode);
      if (!room || room.gameState !== 'playing') return;

      const player = room.players.get(socket.id);
      if (player) {
         player.health = 100;
         player.alive = true;

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

   socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);

      const userId = onlineUsers.get(socket.id);
      if (userId) {
         const user = users.get(userId);
         if (user) {
            user.online = false;
            user.lastSeen = Date.now();
         }
         onlineUsers.delete(socket.id);
         broadcastOnlineUsers();
      }

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

function broadcastOnlineUsers() {
   const onlineList = Array.from(users.values())
      .filter(u => u.online)
      .map(u => u.toPublic());

   io.emit('online-users', onlineList);
}

// Start server
http.listen(PORT, () => {
   console.log('╔════════════════════════════════════════╗');
   console.log('║  NEON VOID - Enhanced Multiplayer    ║');
   console.log('╚════════════════════════════════════════╝');
   console.log(`Server running on port ${PORT}`);
   console.log(`Local: http://localhost:${PORT}`);
   console.log('');
   console.log('Features:');
   console.log('  ✓ Global Chat');
   console.log('  ✓ Private Messages');
   console.log('  ✓ User IDs & Friends');
   console.log('  ✓ Room System');
   console.log('');
   console.log('Press Ctrl+C to stop server');
});

// Cleanup inactive users every 10 minutes
setInterval(() => {
   const now = Date.now();
   users.forEach((user, userId) => {
      if (!user.online && now - user.lastSeen > 600000) { // 10 minutes
         users.delete(userId);
         friendRequests.delete(userId);
      }
   });

   // Cleanup inactive rooms
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
}, 600000);

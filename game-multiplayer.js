/**
 * NEON VOID - Multiplayer Client
 * Socket.io client integration for PvP gameplay
 */

(function() {
   'use strict';

   console.log('%c🌐 Multiplayer System Loading...', 'color: #00ffff; font-weight: bold;');

   // Multiplayer state
   const multiplayerState = {
      connected: false,
      inRoom: false,
      roomCode: null,
      playerId: null,
      playerName: null,
      isHost: false,
      players: new Map(),
      mode: 'pvp', // pvp or singleplayer
      socket: null
   };

   // Remote players map (for rendering)
   const remotePlayers = new Map();

   // Connect to server
   function connectToServer() {
      // Try to connect to local server first, fallback to production
      const serverUrl = window.location.hostname === 'localhost'
         ? 'http://localhost:3000'
         : window.location.origin;

      multiplayerState.socket = io(serverUrl);

      multiplayerState.socket.on('connect', () => {
         console.log('%c✓ Connected to server', 'color: #00ff88;');
         multiplayerState.connected = true;
         updateConnectionStatus(true);

         // Initialize social system
         if (typeof initSocialSystem === 'function' && multiplayerState.playerName) {
            initSocialSystem(multiplayerState.socket, multiplayerState.playerName);
         }
      });

      multiplayerState.socket.on('disconnect', () => {
         console.log('%c✗ Disconnected from server', 'color: #ff0044;');
         multiplayerState.connected = false;
         updateConnectionStatus(false);
      });

      multiplayerState.socket.on('error', (data) => {
         showNotification(data.message, 'error');
      });

      // Room events
      setupRoomEvents();
      setupGameEvents();
      setupChatEvents();
   }

   function setupRoomEvents() {
      const socket = multiplayerState.socket;

      socket.on('room-created', (data) => {
         multiplayerState.inRoom = true;
         multiplayerState.roomCode = data.roomCode;
         multiplayerState.playerId = data.playerId;
         multiplayerState.isHost = true;

         updatePlayersList(data.players);
         showLobbyScreen(data.roomCode);
         showNotification(`Room created: ${data.roomCode}`);
      });

      socket.on('room-joined', (data) => {
         multiplayerState.inRoom = true;
         multiplayerState.roomCode = data.roomCode;
         multiplayerState.playerId = data.playerId;

         updatePlayersList(data.players);
         showLobbyScreen(data.roomCode);
         showNotification(`Joined room: ${data.roomCode}`);
      });

      socket.on('player-joined', (data) => {
         updatePlayersList(data.players);
         showNotification(`${data.playerName} joined the room`);
      });

      socket.on('player-left', (data) => {
         updatePlayersList(data.players);
         remotePlayers.delete(data.playerId);
      });

      socket.on('player-ready-update', (data) => {
         updatePlayersList(data.players);
      });

      socket.on('room-list', (data) => {
         displayRoomList(data);
      });
   }

   function setupGameEvents() {
      const socket = multiplayerState.socket;

      socket.on('game-started', (data) => {
         updatePlayersList(data.players);
         startMultiplayerGame(data);
      });

      socket.on('player-moved', (data) => {
         updateRemotePlayer(data);
      });

      socket.on('player-shot', (data) => {
         createRemoteBullet(data);
      });

      socket.on('player-damaged', (data) => {
         if (data.playerId === multiplayerState.playerId) {
            // Update local player health
            if (typeof gameState !== 'undefined') {
               gameState.playerHealth = data.health;
               if (typeof updateHealthBar === 'function') {
                  updateHealthBar();
               }
            }
            showDamageNumber(data.damage, player.position);
         }
      });

      socket.on('player-killed', (data) => {
         showNotification(`${data.killerName} eliminated ${data.victimName}!`, 'kill');

         if (data.victimId === multiplayerState.playerId) {
            handlePlayerDeath();
         }

         // Remove dead player from remote players
         if (data.victimId !== multiplayerState.playerId) {
            const remotePlayer = remotePlayers.get(data.victimId);
            if (remotePlayer) {
               remotePlayer.alive = false;
            }
         }
      });

      socket.on('player-respawned', (data) => {
         if (data.playerId === multiplayerState.playerId) {
            respawnLocalPlayer(data.position);
         } else {
            const remotePlayer = remotePlayers.get(data.playerId);
            if (remotePlayer) {
               remotePlayer.alive = true;
               remotePlayer.position = data.position;
               remotePlayer.health = data.health;
            }
         }
      });
   }

   function setupChatEvents() {
      const socket = multiplayerState.socket;

      socket.on('chat-message', (data) => {
         displayChatMessage(data);
      });
   }

   // Create/Join room functions
   window.createRoom = function() {
      if (!multiplayerState.connected) {
         connectToServer();
         setTimeout(() => {
            if (multiplayerState.connected) {
               const playerName = prompt('Enter your name:') || 'Player';
               multiplayerState.playerName = playerName;
               multiplayerState.socket.emit('create-room', { playerName });
            }
         }, 500);
      } else {
         const playerName = prompt('Enter your name:') || 'Player';
         multiplayerState.playerName = playerName;
         multiplayerState.socket.emit('create-room', { playerName });
      }
   };

   window.joinRoom = function() {
      if (!multiplayerState.connected) {
         connectToServer();
         setTimeout(() => {
            if (multiplayerState.connected) {
               proceedToJoinRoom();
            }
         }, 500);
      } else {
         proceedToJoinRoom();
      }
   };

   function proceedToJoinRoom() {
      const roomCode = prompt('Enter room code:');
      if (!roomCode) return;

      const playerName = prompt('Enter your name:') || 'Player';
      multiplayerState.playerName = playerName;
      multiplayerState.socket.emit('join-room', { roomCode: roomCode.toUpperCase(), playerName });
   }

   window.leaveRoom = function() {
      if (multiplayerState.socket && multiplayerState.inRoom) {
         multiplayerState.socket.emit('leave-room');
         multiplayerState.inRoom = false;
         multiplayerState.roomCode = null;
         multiplayerState.isHost = false;
         remotePlayers.clear();
         hideAllScreens();
         document.getElementById('multiplayer-menu').classList.add('active');
      }
   };

   window.toggleReady = function() {
      if (!multiplayerState.socket || !multiplayerState.inRoom) return;

      const readyBtn = document.getElementById('ready-btn');
      const isReady = readyBtn.classList.contains('ready');

      multiplayerState.socket.emit('player-ready', {
         ready: !isReady,
         shipType: gameState.playerConfig.shipType,
         color: gameState.playerConfig.color
      });

      readyBtn.classList.toggle('ready');
      readyBtn.textContent = isReady ? 'READY' : 'NOT READY';
   };

   window.startMultiplayerGame = function(data) {
      if (multiplayerState.isHost && multiplayerState.socket) {
         multiplayerState.socket.emit('start-game');
      } else if (data) {
         // Game started by host
         hideAllScreens();
         document.getElementById('hud').classList.add('active');

         // Initialize multiplayer game
         gameState.currentScreen = 'playing';
         gameState.mode = 'multiplayer';
         gameState.isPaused = false;

         // Create remote players
         data.players.forEach(playerData => {
            if (playerData.id !== multiplayerState.playerId) {
               createRemotePlayer(playerData);
            } else {
               // Set local player position
               if (player) {
                  player.position = playerData.position;
               }
            }
         });

         showNotification('BATTLE STARTED!');
      }
   };

   // Remote player management
   function createRemotePlayer(playerData) {
      const remotePlayer = new RemotePlayer(playerData);
      remotePlayers.set(playerData.id, remotePlayer);
   }

   function updateRemotePlayer(data) {
      let remotePlayer = remotePlayers.get(data.playerId);

      if (!remotePlayer) {
         // Create if doesn't exist
         const playerInfo = multiplayerState.players.get(data.playerId);
         if (playerInfo) {
            remotePlayer = new RemotePlayer(playerInfo);
            remotePlayers.set(data.playerId, remotePlayer);
         }
      }

      if (remotePlayer) {
         remotePlayer.updateState(data);
      }
   }

   function createRemoteBullet(data) {
      const bullet = new Bullet(data.direction, data.color);
      bullet.translate(data.position.x, data.position.y, data.position.z);
      bullet.rotation.z = Math.atan2(data.direction.y, data.direction.x);
      bullet.isRemote = true;
      bullet.ownerId = data.playerId;
   }

   // Remote Player class
   class RemotePlayer extends Entity {
      constructor(playerData) {
         super();

         this.playerId = playerData.id;
         this.playerName = playerData.name;
         this.health = playerData.health || 100;
         this.alive = playerData.alive !== false;
         this.color = playerData.color || '#ff0088';
         this.shipType = playerData.shipType || 'Interceptor';

         // Create ship geometry based on ship type
         let polys = this.createShipGeometry(this.shipType, this.color);
         this.addPolygons(...polys);

         // Set initial position
         this.position = playerData.position || { x: 0, y: 0, z: 0 };
         this.rotation = playerData.rotation || { x: 0, y: 0, z: 0 };

         // Add name label
         this.nameLabel = document.createElement('div');
         this.nameLabel.className = 'player-nametag';
         this.nameLabel.textContent = this.playerName;
         this.nameLabel.style.position = 'absolute';
         this.nameLabel.style.color = this.color;
         this.nameLabel.style.fontSize = '12px';
         this.nameLabel.style.fontFamily = 'Orbitron, monospace';
         this.nameLabel.style.textShadow = `0 0 10px ${this.color}`;
         this.nameLabel.style.pointerEvents = 'none';
         this.nameLabel.style.zIndex = '1000';
         this.nameLabel.style.transform = 'translate(-50%, -150%)';
         document.body.appendChild(this.nameLabel);
      }

      createShipGeometry(shipType, color) {
         // Use same geometry as local player based on ship type
         let polys;
         switch(shipType) {
            case 'Interceptor':
               polys = createPyramidGeometry(20, color);
               break;
            case 'Fighter':
               polys = createPyramidGeometry(22, color);
               break;
            case 'Bomber':
               polys = createPyramidGeometry(25, color);
               break;
            case 'Cruiser':
               polys = createPyramidGeometry(28, color);
               break;
            case 'Stealth':
               polys = createPyramidGeometry(18, color);
               break;
            case 'Tank':
               polys = createPyramidGeometry(30, color);
               break;
            default:
               polys = createPyramidGeometry(20, color);
         }
         return this.applyRotateX(polys, Math.PI);
      }

      applyRotation(polygons, by) {
         const { x, y, z } = by || this.rotation;
         return this.applyRotateZ(this.applyRotateY(this.applyRotateX(polygons, x), y), z);
      }

      updateState(data) {
         if (data.position) this.position = data.position;
         if (data.rotation) this.rotation = data.rotation;
         if (data.health !== undefined) this.health = data.health;
         if (data.alive !== undefined) this.alive = data.alive;
      }

      update(dt) {
         // Update name label position
         if (this.nameLabel && canvas) {
            const screenX = this.position.x + canvas.width / 2;
            const screenY = this.position.y + canvas.height / 2;
            this.nameLabel.style.left = screenX + 'px';
            this.nameLabel.style.top = screenY + 'px';
            this.nameLabel.style.display = this.alive ? 'block' : 'none';
         }
      }

      destroy() {
         if (this.nameLabel) {
            this.nameLabel.remove();
         }
         super.destroy();
      }
   }

   // Send player updates to server
   function sendPlayerUpdate() {
      if (!multiplayerState.socket || !multiplayerState.inRoom || gameState.currentScreen !== 'playing') {
         return;
      }

      if (!player) return;

      multiplayerState.socket.emit('player-update', {
         position: player.position,
         rotation: player.rotation,
         velocity: player.velocity || { x: 0, y: 0, z: 0 },
         health: gameState.playerHealth || 100,
         alive: true
      });
   }

   // Send shot to server
   window.sendShot = function(bulletData) {
      if (!multiplayerState.socket || !multiplayerState.inRoom) return;

      multiplayerState.socket.emit('player-shot', {
         bulletId: Date.now() + Math.random(),
         position: bulletData.position,
         direction: bulletData.direction,
         color: bulletData.color
      });
   };

   // Check hit on remote player
   window.checkRemotePlayerHit = function(bullet) {
      if (!multiplayerState.socket || !multiplayerState.inRoom) return false;

      let hit = false;
      remotePlayers.forEach((remotePlayer, playerId) => {
         if (!remotePlayer.alive) return;

         const distance = v3distance(bullet.position, remotePlayer.position);
         if (distance < 25) {
            // Hit detected
            multiplayerState.socket.emit('player-hit', {
               targetId: playerId,
               shooterId: multiplayerState.playerId,
               damage: 25
            });

            bullet.destroy();
            hit = true;

            // Show damage number
            showDamageNumber(25, remotePlayer.position);
         }
      });

      return hit;
   };

   // Player death handling
   function handlePlayerDeath() {
      showNotification('YOU WERE ELIMINATED!', 'death');

      // Show respawn screen after delay
      setTimeout(() => {
         showRespawnScreen();
      }, 3000);
   }

   function respawnLocalPlayer(position) {
      if (player) {
         player.position = position;
         gameState.playerHealth = 100;
         if (typeof updateHealthBar === 'function') {
            updateHealthBar();
         }
         hideAllScreens();
         document.getElementById('hud').classList.add('active');
         showNotification('RESPAWNED!');
      }
   }

   window.requestRespawn = function() {
      if (multiplayerState.socket && multiplayerState.inRoom) {
         multiplayerState.socket.emit('respawn');
      }
   };

   // Chat functions
   window.sendChatMessage = function(message) {
      if (!multiplayerState.socket || !multiplayerState.inRoom || !message) return;

      multiplayerState.socket.emit('chat-message', { message });
   };

   function displayChatMessage(data) {
      const chatBox = document.getElementById('chat-messages');
      if (!chatBox) return;

      const msgEl = document.createElement('div');
      msgEl.className = 'chat-message';
      msgEl.innerHTML = `<span class="chat-name">${data.playerName}:</span> ${data.message}`;
      chatBox.appendChild(msgEl);

      // Auto-scroll
      chatBox.scrollTop = chatBox.scrollHeight;

      // Remove old messages (keep last 50)
      while (chatBox.children.length > 50) {
         chatBox.removeChild(chatBox.firstChild);
      }
   }

   // UI Helper functions
   function updatePlayersList(players) {
      multiplayerState.players.clear();
      players.forEach(p => multiplayerState.players.set(p.id, p));

      const list = document.getElementById('lobby-players-list');
      if (!list) return;

      list.innerHTML = '';
      players.forEach(p => {
         const playerEl = document.createElement('div');
         playerEl.className = 'lobby-player-item';
         playerEl.innerHTML = `
            <span class="player-name">${p.name} ${p.isHost ? '(Host)' : ''}</span>
            <span class="player-status ${p.ready ? 'ready' : 'not-ready'}">
               ${p.ready ? '✓ Ready' : '✗ Not Ready'}
            </span>
         `;
         list.appendChild(playerEl);
      });
   }

   function showLobbyScreen(roomCode) {
      hideAllScreens();
      document.getElementById('lobby-screen').classList.add('active');
      document.getElementById('lobby-room-code').textContent = roomCode;

      // Show/hide start button based on host status
      const startBtn = document.getElementById('start-game-btn');
      if (startBtn) {
         startBtn.style.display = multiplayerState.isHost ? 'block' : 'none';
      }
   }

   function showRespawnScreen() {
      const respawnScreen = document.getElementById('respawn-screen');
      if (respawnScreen) {
         respawnScreen.classList.add('active');
      }
   }

   function displayRoomList(rooms) {
      const list = document.getElementById('room-list');
      if (!list) return;

      list.innerHTML = '';

      if (rooms.length === 0) {
         list.innerHTML = '<div class="no-rooms">No rooms available. Create one!</div>';
         return;
      }

      rooms.forEach(room => {
         const roomEl = document.createElement('div');
         roomEl.className = 'room-item';
         roomEl.innerHTML = `
            <div class="room-info">
               <div class="room-code">${room.roomCode}</div>
               <div class="room-host">Host: ${room.hostName}</div>
               <div class="room-players">${room.playerCount}/${room.maxPlayers} players</div>
            </div>
            <button class="join-room-btn" onclick="joinRoomByCode('${room.roomCode}')">JOIN</button>
         `;
         list.appendChild(roomEl);
      });
   }

   window.joinRoomByCode = function(roomCode) {
      const playerName = prompt('Enter your name:') || 'Player';
      multiplayerState.playerName = playerName;
      multiplayerState.socket.emit('join-room', { roomCode, playerName });
   };

   function updateConnectionStatus(connected) {
      const indicator = document.getElementById('connection-indicator');
      if (indicator) {
         indicator.className = connected ? 'connected' : 'disconnected';
         indicator.textContent = connected ? '● Connected' : '● Disconnected';
      }
   }

   // Update loop for multiplayer
   let lastUpdateTime = 0;
   const UPDATE_INTERVAL = 50; // Send updates every 50ms (20 times per second)

   function multiplayerUpdate() {
      const now = Date.now();

      if (now - lastUpdateTime > UPDATE_INTERVAL) {
         sendPlayerUpdate();
         lastUpdateTime = now;
      }

      requestAnimationFrame(multiplayerUpdate);
   }

   // Start multiplayer update loop
   multiplayerUpdate();

   // Export multiplayer state
   window.multiplayerState = multiplayerState;
   window.remotePlayers = remotePlayers;
   window.connectToServer = connectToServer;

   console.log('%c✓ Multiplayer System Loaded!', 'color: #00ff88; font-weight: bold;');
})();

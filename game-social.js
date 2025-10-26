/**
 * NEON VOID - Social Features Client
 * Global Chat, Friends, Private Messages, User IDs
 */

(function() {
   'use strict';

   console.log('%c👥 Social System Loading...', 'color: #00ffff; font-weight: bold;');

   // Social state
   const socialState = {
      userId: null,
      username: null,
      friends: [],
      onlineUsers: [],
      pendingRequests: [],
      activeConversations: new Map(), // userId -> messages array
      globalChatHistory: [],
      currentChatView: 'global' // 'global' or userId for PM
   };

   // Initialize social system
   window.initSocialSystem = function(socket, username) {
      if (!socket) return;

      // Register user with unique ID
      socket.emit('register-user', { username });

      // Setup event listeners
      setupSocialEvents(socket);
   };

   function setupSocialEvents(socket) {
      // User registration response
      socket.on('user-registered', (data) => {
         socialState.userId = data.userId;
         socialState.username = data.username;
         socialState.friends = data.friends || [];

         console.log(`✓ Registered as ${data.username} (${data.userId})`);

         // Update UI
         updateUserInfo();

         // Request online users and friends
         socket.emit('get-online-users');
         socket.emit('get-friends');

         // Show global chat
         showGlobalChat();
      });

      // Global chat messages
      socket.on('global-chat-message', (data) => {
         socialState.globalChatHistory.push(data);

         // Keep last 100 messages
         if (socialState.globalChatHistory.length > 100) {
            socialState.globalChatHistory.shift();
         }

         if (socialState.currentChatView === 'global') {
            displayChatMessage(data, 'global-chat-messages');
         }

         // Show notification if chat is hidden
         const chatPanel = document.getElementById('social-panel');
         if (chatPanel && !chatPanel.classList.contains('active')) {
            showChatNotification();
         }
      });

      // Private messages
      socket.on('private-message', (data) => {
         const conversationId = data.senderId === socialState.userId ? data.recipientId : data.senderId;

         if (!socialState.activeConversations.has(conversationId)) {
            socialState.activeConversations.set(conversationId, []);
         }

         socialState.activeConversations.get(conversationId).push(data);

         // If viewing this conversation, display it
         if (socialState.currentChatView === conversationId) {
            displayChatMessage(data, 'pm-chat-messages');
         }

         // Show notification
         showPMNotification(conversationId);
      });

      // Online users list
      socket.on('online-users', (data) => {
         socialState.onlineUsers = data;
         updateOnlineUsersList();
      });

      // Friends list
      socket.on('friends-list', (data) => {
         socialState.friends = data;
         updateFriendsList();
      });

      // Search results
      socket.on('search-results', (data) => {
         displaySearchResults(data);
      });

      // Friend request received
      socket.on('friend-request-received', (data) => {
         socialState.pendingRequests.push(data);
         showFriendRequestNotification(data);
      });

      // Friend request sent
      socket.on('friend-request-sent', (data) => {
         showNotification(`Friend request sent to ${data.username}`);
      });

      // Friend added
      socket.on('friend-added', (data) => {
         socialState.friends.push(data);
         updateFriendsList();
         showNotification(`${data.username} is now your friend!`);
      });
   }

   // UI Functions

   function displayChatMessage(message, containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const msgEl = document.createElement('div');
      msgEl.className = 'chat-msg';

      const isOwnMessage = message.userId === socialState.userId || message.senderId === socialState.userId;
      msgEl.classList.add(isOwnMessage ? 'own-message' : 'other-message');

      const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
         hour: '2-digit',
         minute: '2-digit'
      });

      if (message.type === 'global') {
         msgEl.innerHTML = `
            <div class="msg-header">
               <span class="msg-user" style="color: ${getUserColor(message.userId)}">${message.username}</span>
               <span class="msg-time">${time}</span>
            </div>
            <div class="msg-content">${escapeHtml(message.message)}</div>
         `;
      } else {
         const displayName = isOwnMessage ? 'You' : message.senderUsername;
         msgEl.innerHTML = `
            <div class="msg-header">
               <span class="msg-user">${displayName}</span>
               <span class="msg-time">${time}</span>
            </div>
            <div class="msg-content">${escapeHtml(message.message)}</div>
         `;
      }

      container.appendChild(msgEl);
      container.scrollTop = container.scrollHeight;

      // Remove old messages (keep last 50)
      while (container.children.length > 50) {
         container.removeChild(container.firstChild);
      }
   }

   function updateUserInfo() {
      const userInfoEl = document.getElementById('current-user-info');
      if (userInfoEl) {
         userInfoEl.innerHTML = `
            <div class="user-info-content">
               <div class="user-avatar">${socialState.username.charAt(0).toUpperCase()}</div>
               <div class="user-details">
                  <div class="user-name">${socialState.username}</div>
                  <div class="user-id">ID: ${socialState.userId}</div>
               </div>
            </div>
         `;
      }
   }

   function updateOnlineUsersList() {
      const container = document.getElementById('online-users-list');
      if (!container) return;

      container.innerHTML = '';

      socialState.onlineUsers.forEach(user => {
         if (user.id === socialState.userId) return; // Skip self

         const userEl = document.createElement('div');
         userEl.className = 'online-user-item';
         userEl.innerHTML = `
            <div class="user-avatar small">${user.username.charAt(0).toUpperCase()}</div>
            <div class="user-name-small">${user.username}</div>
            <div class="user-status ${user.status}">${user.status}</div>
            <button class="btn-small" onclick="openPrivateMessage('${user.id}', '${user.username}')">PM</button>
         `;
         container.appendChild(userEl);
      });

      if (socialState.onlineUsers.length <= 1) {
         container.innerHTML = '<div class="empty-state">No other users online</div>';
      }
   }

   function updateFriendsList() {
      const container = document.getElementById('friends-list');
      if (!container) return;

      container.innerHTML = '';

      socialState.friends.forEach(friend => {
         const friendEl = document.createElement('div');
         friendEl.className = 'friend-item';
         friendEl.innerHTML = `
            <div class="user-avatar small ${friend.online ? 'online' : 'offline'}">${friend.username.charAt(0).toUpperCase()}</div>
            <div class="friend-info">
               <div class="friend-name">${friend.username}</div>
               <div class="friend-stats">K/D: ${friend.stats.kills}/${friend.stats.deaths}</div>
            </div>
            <button class="btn-small" onclick="openPrivateMessage('${friend.id}', '${friend.username}')">Chat</button>
         `;
         container.appendChild(friendEl);
      });

      if (socialState.friends.length === 0) {
         container.innerHTML = '<div class="empty-state">No friends yet. Search for users to add!</div>';
      }
   }

   function displaySearchResults(results) {
      const container = document.getElementById('search-results');
      if (!container) return;

      container.innerHTML = '';

      results.forEach(user => {
         if (user.id === socialState.userId) return;

         const isFriend = socialState.friends.find(f => f.id === user.id);

         const userEl = document.createElement('div');
         userEl.className = 'search-result-item';
         userEl.innerHTML = `
            <div class="user-avatar small">${user.username.charAt(0).toUpperCase()}</div>
            <div class="search-user-info">
               <div class="user-name-small">${user.username}</div>
               <div class="user-id-small">${user.id}</div>
            </div>
            ${isFriend ?
               '<span class="friend-badge">Friend</span>' :
               `<button class="btn-small" onclick="sendFriendRequest('${user.id}')">Add Friend</button>`
            }
         `;
         container.appendChild(userEl);
      });

      if (results.length === 0) {
         container.innerHTML = '<div class="empty-state">No users found</div>';
      }
   }

   // Global functions for UI interaction
   window.toggleSocialPanel = function() {
      const panel = document.getElementById('social-panel');
      if (panel) {
         panel.classList.toggle('active');

         if (panel.classList.contains('active')) {
            // Load current view
            if (socialState.currentChatView === 'global') {
               showGlobalChat();
            }
         }
      }
   };

   window.showGlobalChat = function() {
      socialState.currentChatView = 'global';

      const globalTab = document.getElementById('global-chat-tab');
      const pmTab = document.getElementById('pm-chat-tab');
      const friendsTab = document.getElementById('friends-tab');

      if (globalTab) globalTab.classList.add('active');
      if (pmTab) pmTab.classList.remove('active');
      if (friendsTab) friendsTab.classList.remove('active');

      const globalView = document.getElementById('global-chat-view');
      const pmView = document.getElementById('pm-chat-view');
      const friendsView = document.getElementById('friends-view');

      if (globalView) globalView.style.display = 'block';
      if (pmView) pmView.style.display = 'none';
      if (friendsView) friendsView.style.display = 'none';

      // Re-render global chat
      const container = document.getElementById('global-chat-messages');
      if (container) {
         container.innerHTML = '';
         socialState.globalChatHistory.forEach(msg => {
            displayChatMessage(msg, 'global-chat-messages');
         });
      }
   };

   window.showPrivateMessages = function() {
      const globalTab = document.getElementById('global-chat-tab');
      const pmTab = document.getElementById('pm-chat-tab');
      const friendsTab = document.getElementById('friends-tab');

      if (globalTab) globalTab.classList.remove('active');
      if (pmTab) pmTab.classList.add('active');
      if (friendsTab) friendsTab.classList.remove('active');

      const globalView = document.getElementById('global-chat-view');
      const pmView = document.getElementById('pm-chat-view');
      const friendsView = document.getElementById('friends-view');

      if (globalView) globalView.style.display = 'none';
      if (pmView) pmView.style.display = 'block';
      if (friendsView) friendsView.style.display = 'none';
   };

   window.showFriendsView = function() {
      const globalTab = document.getElementById('global-chat-tab');
      const pmTab = document.getElementById('pm-chat-tab');
      const friendsTab = document.getElementById('friends-tab');

      if (globalTab) globalTab.classList.remove('active');
      if (pmTab) pmTab.classList.remove('active');
      if (friendsTab) friendsTab.classList.add('active');

      const globalView = document.getElementById('global-chat-view');
      const pmView = document.getElementById('pm-chat-view');
      const friendsView = document.getElementById('friends-view');

      if (globalView) globalView.style.display = 'none';
      if (pmView) pmView.style.display = 'none';
      if (friendsView) friendsView.style.display = 'block';

      updateFriendsList();
      updateOnlineUsersList();
   };

   window.sendGlobalChat = function() {
      const input = document.getElementById('global-chat-input');
      if (!input || !input.value.trim()) return;

      if (multiplayerState && multiplayerState.socket) {
         multiplayerState.socket.emit('global-chat', {
            message: input.value.trim()
         });
         input.value = '';
      }
   };

   window.openPrivateMessage = function(userId, username) {
      socialState.currentChatView = userId;
      showPrivateMessages();

      // Set PM header
      const pmHeader = document.getElementById('pm-chat-header');
      if (pmHeader) {
         pmHeader.textContent = `Chat with ${username}`;
      }

      // Load conversation
      const container = document.getElementById('pm-chat-messages');
      if (container) {
         container.innerHTML = '';
         const conversation = socialState.activeConversations.get(userId) || [];
         conversation.forEach(msg => {
            displayChatMessage(msg, 'pm-chat-messages');
         });
      }
   };

   window.sendPrivateMessage = function() {
      const input = document.getElementById('pm-chat-input');
      if (!input || !input.value.trim()) return;

      if (socialState.currentChatView === 'global') return;

      if (multiplayerState && multiplayerState.socket) {
         multiplayerState.socket.emit('private-message', {
            recipientId: socialState.currentChatView,
            message: input.value.trim()
         });
         input.value = '';
      }
   };

   window.searchUsers = function() {
      const input = document.getElementById('user-search-input');
      if (!input || !input.value.trim()) return;

      if (multiplayerState && multiplayerState.socket) {
         multiplayerState.socket.emit('search-user', {
            query: input.value.trim()
         });
      }
   };

   window.sendFriendRequest = function(userId) {
      if (multiplayerState && multiplayerState.socket) {
         multiplayerState.socket.emit('friend-request', { userId });
      }
   };

   window.acceptFriendRequest = function(senderId) {
      if (multiplayerState && multiplayerState.socket) {
         multiplayerState.socket.emit('accept-friend', { senderId });
      }
   };

   // Utility functions
   function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
   }

   function getUserColor(userId) {
      const colors = ['#00ffff', '#00ff88', '#ff00ff', '#ffaa00', '#ff0088', '#00aaff', '#88ff00'];
      const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[hash % colors.length];
   }

   function showChatNotification() {
      const socialBtn = document.getElementById('social-toggle-btn');
      if (socialBtn) {
         socialBtn.classList.add('has-notification');
      }
   }

   function showPMNotification(userId) {
      // Add notification badge
      showChatNotification();
   }

   function showFriendRequestNotification(data) {
      showNotification(`Friend request from ${data.senderUsername}`);
      socialState.pendingRequests.push(data);
   }

   // Enter key handlers
   document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
         const globalInput = document.getElementById('global-chat-input');
         const pmInput = document.getElementById('pm-chat-input');

         if (document.activeElement === globalInput) {
            sendGlobalChat();
         } else if (document.activeElement === pmInput) {
            sendPrivateMessage();
         }
      }
   });

   // Export social state
   window.socialState = socialState;

   console.log('%c✓ Social System Loaded!', 'color: #00ff88; font-weight: bold;');
})();

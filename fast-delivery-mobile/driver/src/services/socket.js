import io from 'socket.io-client';
import { SOCKET_URL, ENABLE_DEBUG_LOGS } from '../config';

// Helper για conditional logging
const log = (...args) => {
  if (ENABLE_DEBUG_LOGS || __DEV__) {
    console.log(...args);
  }
};

class SocketService {
  socket = null;
  reconnectAttempts = 0;
  maxReconnectAttempts = 10;
  
  // Store listeners and room data for reconnection
  listeners = new Map();           // Active listeners on socket
  pendingListeners = new Map();    // Listeners waiting for connection
  currentRoom = null;              // Room to rejoin on reconnect

  connect() {
    if (this.socket && this.socket.connected) {
      log('🔌 Socket already connected');
      // Still attach any pending listeners
      this.attachPendingListeners();
      return;
    }

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
    }

    log('🔌 Connecting to socket:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],  // ✅ Both transports for reliability
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      log('🔌 Socket connected, id:', this.socket.id);
      this.reconnectAttempts = 0;
      
      // ✅ Re-join room on connect/reconnect
      if (this.currentRoom) {
        log('🔌 Re-joining room:', this.currentRoom);
        this.socket.emit('join', this.currentRoom);
      }
      
      // ✅ Attach any pending listeners
      this.attachPendingListeners();
    });

    this.socket.on('disconnect', (reason) => {
      log('🔌 Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      log('🔌 Socket error:', error.message);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      log('🔌 Socket reconnected after', attemptNumber, 'attempts');
      // Room rejoin happens in 'connect' event
    });
  }

  joinRoom(data) {
    // ✅ Store room data for reconnection
    this.currentRoom = data;
    
    if (this.socket && this.socket.connected) {
      log('🔌 Joining room:', data);
      this.socket.emit('join', data);
    } else {
      log('🔌 Room stored, will join on connect:', data);
    }
  }

  // Force reconnect
  reconnect() {
    log('🔌 Forcing reconnect...');
    if (this.socket) {
      this.socket.disconnect();
    }
    this.connect();
  }

  // Check if connected
  isConnected() {
    return this.socket && this.socket.connected;
  }

  // ✅ Improved on() with pending listener queue
  on(event, callback) {
    const isReady = this.socket && this.socket.connected;
    
    if (!isReady) {
      // Queue the listener to be attached once connected
      log('🔌 Queuing listener for:', event);
      if (!this.pendingListeners.has(event)) {
        this.pendingListeners.set(event, []);
      }
      this.pendingListeners.get(event).push(callback);
      return;
    }

    // Socket is ready, attach immediately
    this.attachListener(event, callback);
  }

  // Attach a single listener
  attachListener(event, callback) {
    if (!this.socket) return;
    
    // Wrap callback for logging (optional)
    const wrappedCallback = (...args) => {
      log('🔌 Event received:', event);
      callback(...args);
    };

    this.socket.on(event, wrappedCallback);
    
    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push({ original: callback, wrapped: wrappedCallback });
  }

  // Attach all pending listeners
  attachPendingListeners() {
    if (this.pendingListeners.size === 0) return;
    
    log('🔌 Attaching', this.pendingListeners.size, 'pending listener types');
    
    this.pendingListeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.attachListener(event, callback);
      });
    });

    // Clear pending listeners
    this.pendingListeners.clear();
  }

  // ✅ Improved off() with proper cleanup
  off(event, callback) {
    // Remove from pending listeners first
    if (this.pendingListeners.has(event)) {
      if (callback) {
        const pending = this.pendingListeners.get(event);
        const index = pending.indexOf(callback);
        if (index > -1) {
          pending.splice(index, 1);
        }
      } else {
        this.pendingListeners.delete(event);
      }
    }

    if (!this.socket) return;

    if (callback) {
      // Find the wrapped callback
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const entry = callbacks.find(e => e.original === callback);
        if (entry) {
          this.socket.off(event, entry.wrapped);
          const index = callbacks.indexOf(entry);
          if (index > -1) {
            callbacks.splice(index, 1);
          }
        }
      }
    } else {
      // Remove all listeners for this event
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    // ✅ Clear stored data on explicit disconnect
    this.currentRoom = null;
    this.listeners.clear();
    this.pendingListeners.clear();
  }
}

export default new SocketService();

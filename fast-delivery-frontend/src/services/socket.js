import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.pendingListeners = new Map(); // Queue for listeners added before connection
  }

  // Initialize connection
  connect(user) {
    if (this.socket?.connected) {
      return;
    }

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      // Join appropriate rooms based on user role
      if (user) {
        let roomData;
        
        if (user.role === 'admin') {
          roomData = { role: 'admin', userId: user._id };
        } else if (user.role === 'store') {
          roomData = { role: 'store', userId: user._id };
        } else if (user.role === 'driver') {
          roomData = { role: 'driver', userId: user._id };
        } else if (user.role === 'customer') {
          roomData = { role: 'customer', userId: user.phone }; // Join by phone for customers
        }
        
        if (roomData) {
          this.socket.emit('join', roomData);
        }
      }

      // Attach any pending listeners that were added before connection
      this.attachPendingListeners();
    });

    this.socket.on('disconnect', (reason) => {
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
    });

    return this.socket;
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.pendingListeners.clear();
    }
  }

  // Subscribe to event
  on(event, callback) {
    // Check if socket exists AND is connected
    const isReady = this.socket && this.socket.connected;
    
    if (!isReady) {
      // Queue the listener to be attached once connected
      if (!this.pendingListeners.has(event)) {
        this.pendingListeners.set(event, []);
      }
      this.pendingListeners.get(event).push(callback);
      return;
    }

    // Socket is ready, attach immediately
    this.attachListener(event, callback);
    
    // Also check if there are any other pending listeners we should attach now
    if (this.pendingListeners.size > 0) {
      setTimeout(() => this.attachPendingListeners(), 0);
    }
  }

  // Attach a single listener
  attachListener(event, callback) {
    // Wrap callback to add logging
    const wrappedCallback = (...args) => {
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
    
    this.pendingListeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.attachListener(event, callback);
      });
    });

    // Clear pending listeners
    this.pendingListeners.clear();
  }

  // Unsubscribe from event
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

  // Emit event
  emit(event, data) {
    if (!this.socket) {
      console.warn('Socket not connected. Call connect() first.');
      return;
    }

    this.socket.emit(event, data);
  }

  // Join room
  joinRoom(room) {
    if (!this.socket) return;
    this.socket.emit('join', room);
  }

  // Leave room
  leaveRoom(room) {
    if (!this.socket) return;
    this.socket.emit('leave', room);
  }

  // Check connection status
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;

import io from 'socket.io-client';
import { SOCKET_URL } from '../config';

class SocketService {
  socket = null;
  reconnectAttempts = 0;
  maxReconnectAttempts = 10;
  
  // Store listeners and room data for reconnection
  listeners = new Map();
  pendingListeners = new Map();
  currentRoom = null;

  connect() {
    if (this.socket && this.socket.connected) {
      this.attachPendingListeners();
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      if (this.currentRoom) {
        this.socket.emit('join', this.currentRoom);
      }
      this.attachPendingListeners();
    });

    this.socket.on('disconnect', () => {});
    this.socket.on('connect_error', () => { this.reconnectAttempts++; });
    this.socket.on('reconnect', () => {});
  }

  joinRoom(data) {
    this.currentRoom = data;
    if (this.socket && this.socket.connected) {
      this.socket.emit('join', data);
    }
  }

  reconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.connect();
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  on(event, callback) {
    const isReady = this.socket && this.socket.connected;
    
    if (!isReady) {
      if (!this.pendingListeners.has(event)) {
        this.pendingListeners.set(event, []);
      }
      this.pendingListeners.get(event).push(callback);
      return;
    }

    this.attachListener(event, callback);
  }

  attachListener(event, callback) {
    if (!this.socket) return;
    
    // No logging wrapper - direct callback
    this.socket.on(event, callback);
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push({ original: callback, wrapped: callback });
  }

  attachPendingListeners() {
    if (this.pendingListeners.size === 0) return;
    
    this.pendingListeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.attachListener(event, callback);
      });
    });

    this.pendingListeners.clear();
  }

  off(event, callback) {
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
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentRoom = null;
    this.listeners.clear();
    this.pendingListeners.clear();
  }
}

export default new SocketService();

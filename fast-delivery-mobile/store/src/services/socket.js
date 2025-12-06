import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentRoom = null;
    this.listeners = new Map();
  }

  connect(token = null) {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected');
      return;
    }

    const options = {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    };

    if (token) {
      options.auth = { token };
    }

    this.socket = io(SOCKET_URL, options);

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      // Rejoin room if we had one
      if (this.currentRoom) {
        this.socket.emit('join', this.currentRoom);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.log('⚠️ Socket connection error:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentRoom = null;
      this.listeners.clear();
    }
  }

  joinRoom(data) {
    if (!this.socket) {
      console.warn('Socket not connected, cannot join room');
      return;
    }

    this.currentRoom = data;
    this.socket.emit('join', data);
    console.log('📍 Joined room:', data);
  }

  leaveRoom(room) {
    if (!this.socket) return;
    this.socket.emit('leave', room);
  }

  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not connected, cannot add listener');
      return;
    }

    // Store listener reference for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
      this.listeners.get(event)?.delete(callback);
    } else {
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  emit(event, data) {
    if (!this.socket) {
      console.warn('Socket not connected, cannot emit');
      return;
    }
    this.socket.emit(event, data);
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;

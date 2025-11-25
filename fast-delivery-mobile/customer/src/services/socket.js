import io from 'socket.io-client';
import { SOCKET_URL } from '../config';

class SocketService {
  socket = null;

  connect() {
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  joinRoom(data) {
    if (this.socket) {
      // If data is object { role, userId }, construct room name
      // But backend expects specific room names or handles join event logic?
      // Let's assume backend handles 'join' event with { role, userId } payload
      // OR we should join `customer:${phone}` manually?
      // Looking at AuthContext, it sends { role: 'customer', userId: ... }
      // Let's verify backend socket logic.
      this.socket.emit('join', data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new SocketService();

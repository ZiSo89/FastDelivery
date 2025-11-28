import io from 'socket.io-client';
import { SOCKET_URL } from '../config';

class SocketService {
  socket = null;

  connect() {
    if (this.socket && this.socket.connected) {
      console.log('🔌 Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.log('🔌 Socket connection error:', error.message);
    });
  }

  joinRoom(data) {
    if (this.socket) {
      console.log('🔌 Joining room:', data);
      this.socket.emit('join', data);
      
      // Confirm join was successful
      this.socket.once('joined', (room) => {
        console.log('✅ Successfully joined room:', room);
      });
    } else {
      console.log('❌ Cannot join room - socket not connected');
    }
  }

  on(event, callback) {
    if (this.socket) {
      console.log('👂 Listening for event:', event);
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./src/config/database');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const allowedOrigins = [
  'http://localhost:3000',
  'https://fastdeliveryfontend.onrender.com',
  process.env.FRONTEND_URL,
  'http://192.168.31.160:8081',
  'http://192.168.31.160:19000',
  'http://192.168.31.160:19006'
].filter(Boolean);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Make io accessible in routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  // console.log(`✅ New client connected: ${socket.id}`);

  // Join room based on user role and ID
  socket.on('join', (data) => {
    // Handle both formats: string "admin" or object {role, userId}
    let room;
    let roleRoom;
    
    if (typeof data === 'string') {
      // Old format: just room name
      room = data;
      roleRoom = data; // For admin
    } else if (data && data.role && data.userId) {
      // New format: {role, userId}
      room = `${data.role}:${data.userId}`;
      roleRoom = data.role; // Generic role room for admins
    } else {
      // console.log('⚠️ Invalid join data:', data);
      return;
    }
    
    socket.join(room);
    
    // Also join the generic role room (especially for admins)
    if (roleRoom === 'admin') {
      socket.join('admin');
    }
    
    // console.log(`👤 User joined room: ${room}`);
  });

  // Join order room
  socket.on('join_order', (orderId) => {
    socket.join(`order:${orderId}`);
    // console.log(`📦 Joined order room: ${orderId}`);
  });

  // Driver location update - broadcast to order watchers
  socket.on('driver:location_update', (data) => {
    // data = { orderId, driverId, location: { lat, lng }, timestamp }
    if (data && data.orderId) {
      // Broadcast to everyone watching this order (customer, store, admin)
      io.to(`order:${data.orderId}`).emit('driver:location', {
        orderId: data.orderId,
        driverId: data.driverId,
        location: data.location,
        timestamp: data.timestamp || Date.now()
      });
      // console.log(`📍 Driver location update for order ${data.orderId}:`, data.location);
    }
  });

  socket.on('disconnect', () => {
    // console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Fast Delivery API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/v1/auth', require('./src/routes/auth'));
app.use('/api/v1/orders', require('./src/routes/customer'));
app.use('/api/v1/store', require('./src/routes/store'));
app.use('/api/v1/driver', require('./src/routes/driver'));
app.use('/api/v1/admin', require('./src/routes/admin'));

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Εσωτερικό σφάλμα διακομιστή'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

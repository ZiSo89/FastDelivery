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
  process.env.FRONTEND_URL
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible in routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ New client connected: ${socket.id}`);

  // Join room based on user role and ID
  socket.on('join', (data) => {
    // Handle both formats: string "admin" or object {role, userId}
    let room;
    
    if (typeof data === 'string') {
      // Old format: just room name
      room = data;
    } else if (data && data.role && data.userId) {
      // New format: {role, userId}
      room = `${data.role}:${data.userId}`;
    } else {
      console.log('⚠️ Invalid join data:', data);
      return;
    }
    
    socket.join(room);
    console.log(`👤 User joined room: ${room}`);
  });

  // Join order room
  socket.on('join_order', (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`📦 Joined order room: ${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
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

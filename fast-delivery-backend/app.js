const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http'); // Για τη δημιουργία HTTP server
const https = require('https');
const fs = require('fs');
require('dotenv').config()
const PORT = 4000;

const { Server } = require('socket.io'); // Socket.IO

const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const storeRoutes = require('./routes/storeRoutes');

const app = express();

//const server = https.createServer(options, app);
const server = http.createServer(app); // Δημιουργία HTTP server

const io = new Server(server, {
    cors: {
        origin: '*', // Επιτρέπει συνδέσεις από οποιοδήποτε origin
    },
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stores', storeRoutes);


// Database Connection
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('Database connected'))
    .catch(err => console.log(err));

// Socket.IO
io.on('connection', (socket) => {

    // Παράδειγμα: Ακρόαση για νέα παραγγελία
    socket.on('newOrder', (order) => {
        //console.log('Νέα παραγγελία:', order);
        io.emit('orderUpdated', order); // Στέλνει ενημέρωση σε όλους τους clients
    });

    socket.on('disconnect', () => {

    });
});

// Start Server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ MongoDB URI is not set in environment variables');
      console.error('Please create a .env file in the backend directory with MONGODB_URI');
      process.exit(1);
    }

    // Check if connection string has placeholder password
    let connectionString = mongoURI;
    if (mongoURI.includes('<password>') || mongoURI.includes('<PASSWORD>')) {
      const password = process.env.MONGODB_PASSWORD || '';
      if (!password) {
        console.error('❌ MongoDB password placeholder found but MONGODB_PASSWORD is not set');
        console.error('Please set MONGODB_PASSWORD in your .env file or replace <password> in MONGODB_URI');
        process.exit(1);
      }
      connectionString = mongoURI.replace(/<password>|<PASSWORD>/gi, password);
    }
    
    // Connect to MongoDB
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      bufferCommands: false,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    if (error.message.includes('authentication failed')) {
      console.error('   → Check your MongoDB username and password');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('   → Check your MongoDB connection string and network connectivity');
    } else if (error.message.includes('timeout')) {
      console.error('   → MongoDB server is not reachable. Check:');
      console.error('     1. MongoDB Atlas IP whitelist (should include 0.0.0.0/0 for development)');
      console.error('     2. Network connectivity');
      console.error('     3. MongoDB server status');
    }
    process.exit(1);
  }
};

// Connect to MongoDB before starting server
connectDB();

// Socket.io for real-time notifications
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes (will be available after MongoDB connects)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Food Donation API is running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;

// Start server only after MongoDB connection is ready
mongoose.connection.once('open', () => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

module.exports = { app, io };


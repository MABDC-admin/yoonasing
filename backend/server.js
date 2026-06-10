const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// In-memory store for room state (for late joiners)
const roomStates = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    
    // If there's an existing state, send it immediately
    if (roomStates[roomId]) {
      socket.emit('syncState', roomStates[roomId]);
    }
  });

  socket.on('updateState', (data) => {
    const { roomId, queue, currentVideo } = data;
    const newState = { queue, currentVideo };
    
    // Store it
    roomStates[roomId] = newState;
    
    // Broadcast to EVERYONE else in the room (e.g. mobile remotes + TV)
    socket.to(roomId).emit('syncState', newState);
  });

  socket.on('requestSync', (roomId) => {
    if (roomStates[roomId]) {
      socket.emit('syncState', roomStates[roomId]);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Socket.IO Server running on port ${PORT}`);
});

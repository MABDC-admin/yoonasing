const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── YouTube Search Proxy ───────────────────────────────────────
// The API key lives HERE on the server, never in the frontend bundle.
// Rotating the key = restart the backend. No frontend rebuild needed.
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

app.get('/api/youtube/search', async (req, res) => {
  const { q, maxResults = 10 } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query parameter "q"' });
  if (!YOUTUBE_API_KEY) return res.status(500).json({ error: 'YouTube API key not configured on server' });

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&maxResults=${maxResults}&type=video&videoEmbeddable=true&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('YouTube API proxy error:', err);
    res.status(500).json({ error: 'Failed to fetch from YouTube API' });
  }
});
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

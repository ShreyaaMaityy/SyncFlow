require('dotenv').config();
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey) {
    console.log(`API Key Loaded: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
} else {
    console.error("CRITICAL: GEMINI_API_KEY is missing from environment variables.");
}

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const socketHandler = require('./sockets/socketHandler');
const workspaceRoutes = require('./routes/workspace');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/auth', authRoutes);

// Database Setup
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/syncflow';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: "*", // allow all for dev
        methods: ["GET", "POST"]
    }
});

socketHandler(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

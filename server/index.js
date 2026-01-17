require('dotenv').config();
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

// --- 1. CONFIGURATION ---
const PORT = process.env.PORT || 10000; // Use 10000 for Render
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/syncflow';

// Define allowed origins for production and local development
const allowedOrigins = [
    "https://sync-flow-ecru.vercel.app", // Your Vercel frontend URL
    "http://localhost:5173"               // Local development
];

// --- 2. CORS MIDDLEWARE ---
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true // Required for mobile browsers to handle auth sessions
}));

app.use(express.json()); // Essential for parsing login/signup data

// --- 3. ROUTES ---
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/auth', authRoutes);

// --- 4. DATABASE SETUP ---
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// --- 5. SOCKET.IO SETUP ---
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

socketHandler(io);

// --- 6. START SERVER ---
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
        console.log(`🔑 API Key Active: ${apiKey.substring(0, 4)}...`);
    } else {
        console.error("⚠️ CRITICAL: GEMINI_API_KEY is missing!");
    }
});
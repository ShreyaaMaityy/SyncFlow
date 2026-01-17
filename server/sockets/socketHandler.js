const Workspace = require('../models/Workspace');

let users = {}; // Map socket.id -> { workspaceId, userId }

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join_workspace', ({ workspaceId, userId }) => {
            socket.join(workspaceId);
            users[socket.id] = { workspaceId, userId };

            // Notify others in room
            io.to(workspaceId).emit('user_joined', { userId, socketId: socket.id });

            // Send current user list of room
            const roomUsers = Object.values(users).filter(u => u.workspaceId === workspaceId);
            io.to(workspaceId).emit('user_list_update', roomUsers);

            console.log(`User ${userId} joined workspace ${workspaceId}`);
        });

        socket.on('node_change', ({ workspaceId, nodes }) => {
            // Broadcast to everyone else in the room
            socket.to(workspaceId).emit('node_change', nodes);
        });

        // Add edge_change if needed, or bundle with node_change as 'graph_change'
        // But requirement says "node moves". Let's assume nodes+edges sync for full state usually.
        // For real-time drag, we might just send the specific node update or all nodes.
        // ReactFlow nodes change is usually an array of changes or new state. 
        // Let's broadcast the full 'nodes' array for simplicity in this MVP, or the changes.
        // "Real-Time Sync: ... node's XY coordinates are broadcasted"

        socket.on('edges_change', ({ workspaceId, edges }) => {
            socket.to(workspaceId).emit('edges_change', edges);
        });

        socket.on('new-edge', ({ workspaceId, params }) => {
            socket.to(workspaceId).emit('new-edge', params);
        });

        socket.on('edge-deleted', ({ workspaceId, edgeIds }) => {
            socket.to(workspaceId).emit('edge-deleted', edgeIds);
        });

        socket.on('node-deleted', ({ workspaceId, nodeIds }) => {
            socket.to(workspaceId).emit('node-deleted', nodeIds);
        });

        socket.on('chat_message', async (msg) => {
            // Fix workspaceId lookup - try msg first, then user's room
            const workspaceId = msg.workspaceId || (users[socket.id] ? users[socket.id].workspaceId : null);

            if (msg.text.startsWith('@ai')) {
                // AI Command
                const prompt = msg.text.replace('@ai', '').trim();

                // 1. Emit user message first
                if (workspaceId) {
                    io.to(workspaceId).emit('chat_message', msg);
                }

                // 2. Notify processing
                const botMsgId = Date.now();

                if (workspaceId) {
                    io.to(workspaceId).emit('chat_message', {
                        id: botMsgId,
                        userId: 'AI Architect',
                        text: 'Analyzing requirements and generating system design...',
                        timestamp: new Date().toLocaleTimeString()
                    });
                }

                try {
                    const architect = require('../ai/architect');
                    // Use getAIResponse instead of generateArchitecture
                    const aiResult = await architect.getAIResponse(prompt);

                    // 3. Process Response based on intent
                    if (aiResult.type === 'chat') {
                        if (workspaceId) {
                            io.to(workspaceId).emit('chat_message', {
                                id: botMsgId + 1,
                                userId: 'AI Architect',
                                text: aiResult.content, // Just the text response
                                timestamp: new Date().toLocaleTimeString()
                            });
                        }
                    } else if (aiResult.type === 'design') {
                        if (workspaceId) {
                            io.to(workspaceId).emit('chat_message', {
                                id: botMsgId + 1,
                                userId: 'AI Architect',
                                text: 'Design generated! Updating canvas.',
                                timestamp: new Date().toLocaleTimeString()
                            });

                            // 4. Update Canvas - Emit LOAD_WORKSPACE
                            io.to(workspaceId).emit('LOAD_WORKSPACE', aiResult.content);
                        }
                    }


                } catch (err) {
                    console.error("AI Error:", err);
                    let errorMessage = 'Sorry, I failed to generate the design. Please check the server logs (API Key?).';

                    if (err.message === 'Quota exceeded' || err.message.includes('429')) {
                        errorMessage = 'The AI Architect is currently at its free-tier limit. Please try again in a minute.';
                    }

                    if (workspaceId) {
                        io.to(workspaceId).emit('chat_message', {
                            id: botMsgId + 2,
                            userId: 'AI Architect',
                            text: errorMessage,
                            timestamp: new Date().toLocaleTimeString()
                        });
                    }
                }

            } else {
                // Regular Broadcast
                if (workspaceId) {
                    // Send to everyone EXCEPT sender (if they optimistically added it), OR just everyone.
                    // Frontend 'MiniChat' currently adds optimistic local
                    socket.to(workspaceId).emit('chat_message', msg);
                }
            }
        });

        socket.on('disconnect', () => {
            const user = users[socket.id];
            if (user) {
                const { workspaceId, userId } = user;
                delete users[socket.id];
                io.to(workspaceId).emit('user_left', { userId, socketId: socket.id });

                const roomUsers = Object.values(users).filter(u => u.workspaceId === workspaceId);
                io.to(workspaceId).emit('user_list_update', roomUsers);
                console.log(`User ${userId} disconnected from ${workspaceId}`);
            }
        });
    });
};

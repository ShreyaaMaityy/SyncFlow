import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000'; // Environment variable in real app

export const useSocket = (workspaceId, onNodeChange, onUserListUpdate, user, onEdgesChange, onLoadWorkspace) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        socketRef.current = io(SOCKET_URL);

        socketRef.current.on('connect', () => {

            setIsConnected(true);

            // Use real username if available, else random
            const effectiveUserId = user ? user.username : 'user-' + Math.random().toString(36).substr(2, 9);
            setUserId(effectiveUserId);

            socketRef.current.emit('join_workspace', { workspaceId, userId: effectiveUserId });
        });

        socketRef.current.on('node_change', (nodes) => {
            if (onNodeChange) onNodeChange(nodes);
        });

        socketRef.current.on('user_list_update', (users) => {
            if (onUserListUpdate) onUserListUpdate(users);
        });

        socketRef.current.on('edges_change', (edges) => {
            if (onEdgesChange) onEdgesChange(edges);
        });

        socketRef.current.on('LOAD_WORKSPACE', (data) => {
            if (onLoadWorkspace) onLoadWorkspace(data);
        });

        socketRef.current.on('disconnect', () => {

            setIsConnected(false);
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [workspaceId]);

    const emitNodeChange = (nodes) => {
        if (socketRef.current) {
            socketRef.current.emit('node_change', { workspaceId, nodes });
        }
    };

    return { socket: socketRef.current, isConnected, emitNodeChange, userId };
};

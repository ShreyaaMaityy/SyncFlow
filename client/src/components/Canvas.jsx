import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSocket } from '../hooks/useSocket';
import Sidebar from './Sidebar';
import { ClientNode, ServerNode, DatabaseNode } from './CustomNodes';
import MiniChat from './MiniChat';
import toast from 'react-hot-toast';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { NodeInteractionContext } from '../context/NodeInteractionContext';

const nodeTypes = {
    clientNode: ClientNode,
    serverNode: ServerNode,
    databaseNode: DatabaseNode,
};

const defaultEdgeOptions = {
    animated: true,
    className: 'animated-edge',
    type: 'default',
};

const initialNodes = [];

// Safe ID generator
const getId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const Canvas = () => {
    const reactFlowWrapper = useRef(null);
    const { user } = useAuth();
    const { id: paramId } = useParams();
    const navigate = useNavigate();
    // Use paramId if available, otherwise fallback/redirect?
    // Dashboard handles creation, so paramId should essentially always be there.
    // Fallback to 'default-workspace' for safety if accessed directly at /
    const workspaceId = paramId || 'default-workspace';

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [users, setUsers] = useState([]);
    const [cursors, setCursors] = useState({}); // { userId: { x, y } }
    const [workspaceName, setWorkspaceName] = useState('Untitled Workspace');
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    // Socket Integration
    // Pass user.username or ID to identifying yourself
    // useSocket hook handles joining the room based on the workspaceId passed
    const { emitNodeChange, socket, userId } = useSocket(workspaceId, (newNodes) => {
        setNodes((nds) => {
            return newNodes;
        });
    }, (userList) => {
        setUsers(userList);
    }, user, (newEdges) => {
        setEdges(newEdges);
    }, (workspaceData) => {
        // Handle LOAD_WORKSPACE (e.g. from AI)
        if (workspaceData.nodes) setNodes(workspaceData.nodes);
        if (workspaceData.edges) setEdges(workspaceData.edges);

    });

    // Cursor & Socket Events
    useEffect(() => {
        if (!socket) return;
        socket.on('cursor_move', ({ userId, position }) => {
            setCursors(prev => ({ ...prev, [userId]: position }));
        });
        return () => {
            socket.off('cursor_move');
        };
    }, [socket]);

    const handleMouseMove = useCallback((e) => {
        if (!socket) return;
        if (reactFlowInstance) {
            const position = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
            // Should emit cursor move here... logic exists in onMouseMove below
        }
    }, [socket, reactFlowInstance]);

    // Persistence: Load on Mount or Workspace Change
    useEffect(() => {
        const loadWorkspace = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:3000/api/workspaces/${workspaceId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        setNodes(data.nodes || []);
                        setEdges(data.edges || []);
                        setWorkspaceName(data.name || 'Untitled Workspace');
                    }
                } else {
                    // Handle 404 or auth error
                    console.error("Failed to load workspace");
                    if (res.status === 404) {
                        toast.error('Workspace not found');
                        navigate('/dashboard');
                    }
                }
            } catch (err) {
                console.error("Failed to load workspace", err);
            }
        };
        loadWorkspace();
    }, [workspaceId, navigate]); // Re-run when ID changes

    // Update Title logic
    useEffect(() => {
        document.title = workspaceName ? `SyncFlow - ${workspaceName}` : 'SyncFlow';
        return () => {
            document.title = 'SyncFlow';
        };
    }, [workspaceName]);

    const handleTitleRename = async () => {
        setIsEditingTitle(false);
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:3000/api/workspaces/${workspaceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: workspaceName })
            });
            toast.success('Workspace name saved');
        } catch (err) {
            console.error(err);
            toast.error('Failed to save name');
        }
    };

    // Persistence: Auto-Save
    const saveTimeoutRef = useRef(null);
    const saveWorkspace = useCallback((currentNodes, currentEdges) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            // ... existing save logic ... (keep it concise for replace)
            try {
                await fetch(`http://localhost:3000/api/workspaces/${workspaceId}/save`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nodes: currentNodes, edges: currentEdges })
                });

                // toast.success('Workspace saved', { id: 'autosave' }); // Optional: reduce noise
            } catch (err) {
                console.error("Auto-save failed", err);
            }
        }, 2000);
    }, [workspaceId]); // dependency needed

    // Persistence: Trigger auto-save when nodes or edges change
    useEffect(() => {
        // Only save if reactFlowInstance is initialized, otherwise it might save empty state on initial render
        if (reactFlowInstance) {
            saveWorkspace(nodes, edges);
        }
    }, [nodes, edges, saveWorkspace, reactFlowInstance]);

    const onConnect = useCallback((params) => {
        setEdges((eds) => addEdge(params, eds));
        if (socket) {
            socket.emit('new-edge', { workspaceId, params });
        }
    }, [socket, workspaceId]); // Added dependencies

    // Listen for new edges from other users
    useEffect(() => {
        if (!socket) return;
        socket.on('new-edge', (params) => {
            setEdges((eds) => addEdge(params, eds));
        });
        socket.on('edge-deleted', (edgeIds) => {
            setEdges((eds) => eds.filter((edge) => !edgeIds.includes(edge.id)));
        });
        socket.on('node-deleted', (nodeIds) => {
            setNodes((nds) => nds.filter((node) => !nodeIds.includes(node.id)));
        });
        return () => {
            socket.off('new-edge');
            socket.off('edge-deleted');
            socket.off('node-deleted');
        };
    }, [socket]);

    const onEdgesDelete = useCallback((deleted) => {
        if (socket) {
            const edgeIds = deleted.map(d => d.id);
            socket.emit('edge-deleted', { workspaceId, edgeIds });
        }
    }, [socket, workspaceId]);

    const onNodesDelete = useCallback((deleted) => {
        if (socket) {
            const nodeIds = deleted.map(d => d.id);
            socket.emit('node-deleted', { workspaceId, nodeIds });
        }
    }, [socket, workspaceId]);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();



            const type = event.dataTransfer.getData('application/reactflow');



            if (typeof type === 'undefined' || !type) {
                return;
            }

            if (!reactFlowInstance) {
                console.error("ReactFlow instance missing");
                return;
            }

            // projected position
            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: getId(),
                type,
                position,
                data: { label: `${type} node` },
            };



            setNodes((nds) => {
                const newNodes = nds.concat(newNode);
                emitNodeChange(newNodes);
                return newNodes;
            });
        },
        [reactFlowInstance, emitNodeChange],
    );

    // Broadcast changes when local user changes nodes (drag etc)
    // onNodesChange is called by ReactFlow when user interacts.
    // We need to intercept this or use useEffect.
    // BUT onNodesChange is also called when we call setNodes.
    // We need to distinguish local vs remote?
    // Actually, onNodesChange handles the state update.
    // We can add a useEffect on `nodes` to emit?
    // But that would emit also when we receive from socket (infinite loop).
    // Better: Wrap onNodesChange?
    // 
    // Custom onNodesChange to emit
    const handleNodesChange = useCallback(
        (changes) => {
            onNodesChange(changes);
            // We need the *result* of the change to emit the full state?
            // Or we emit the changes? Server handler expects "nodes".
            // Let's rely on the fact that `nodes` state will update, then we check if it was a local user action?
            // ReactFlow doesn't easily distinguish.
            // Common pattern: Emit inside onNodeDragStop or similar for "final" position, 
            // or use `onNodeDrag` for real-time.
        },
        [onNodesChange]
    );

    // To implement real-time while dragging:
    const onNodeDrag = useCallback((event, node) => {
        // Create a new nodes array with this node updated
        // We don't have the full new state here easily without looking at `nodes`.
        // `nodes` in current closure might be stale.
        setNodes(nds => {
            const updated = nds.map(n => n.id === node.id ? node : n);
            emitNodeChange(updated);
            return updated; // We are updating local state twice? ReactFlow does it internally efficiently? 
            // Actually onNodeDrag is just an event. ReactFlow updates internal state via onNodesChange.
        });
    }, [emitNodeChange, setNodes]);

    // Fix: The above approach to onNodeDrag + setNodes might conflict with onNodesChange.
    // Better: Let onNodesChange apply to state. Then use `useEffect` with a ref to track if *we* caused the change?
    // Or just emit in `onNodeDrag` simply broadcasting the node that moved?
    // The Backend expects full list currently: `socket.on('node_change', ({ nodes })`

    // Simplified for MVP:
    // We will emit inside `onNodeDragStop` to avoid too much traffic, or `onNodeDrag` throttled.
    // Let's try `onNodeDrag` but passing the node state.

    // Let's refine `handleNodesChange`.
    // Actually, better to just emit the *new* nodes list.
    // But onNodesChange receives *changes*, not the new list.

    // Let's use `onNodeDrag` event from ReactFlow.
    // It gives us the node being dragged.

    const handleNodeDrag = (evt, node) => {
        // We need to construct the full list of nodes with this node updated.
        // We can use the functional state update to get current nodes, but we can't emit from there easily.
        // Let's just emit the single node change?
        // Backend expects `nodes`.
        // Let's change backend to accept delta? No, keep it simple.

        // Optimization: Debounce or throttle this emit in real app.
        // For now, we emit.
        // But wait, `node` param in onNodeDrag matches the storage?

        setNodes(prevNodes => {
            const newNodes = prevNodes.map(n => n.id === node.id ? node : n);
            emitNodeChange(newNodes);
            saveWorkspace(newNodes, edges); // Trigger auto-save
            return newNodes;
        });
    };

    const updateNodeLabel = useCallback((nodeId, newLabel) => {
        setNodes((nds) => {
            const updatedNodes = nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: { ...node.data, label: newLabel } };
                }
                return node;
            });
            emitNodeChange(updatedNodes);
            return updatedNodes;
        });
    }, [emitNodeChange, setNodes]);

    return (
        <div className="flex h-screen w-screen bg-gray-950">
            <ReactFlowProvider>
                <NodeInteractionContext.Provider value={{ updateNodeLabel }}>
                    <Sidebar />
                    <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
                        <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
                            {/* Invite Button */}
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success('Invite link copied to clipboard!');
                                }}
                                className="bg-purple-600/90 hover:bg-purple-600 text-white px-3 py-1.5 rounded transition shadow-lg text-sm font-medium flex items-center gap-2 backdrop-blur-sm"
                            >
                                <span>🔗</span> Invite
                            </button>

                            {/* Active Users */}
                            <div className="flex -space-x-2 bg-gray-800/80 p-1.5 rounded-full border border-gray-700 backdrop-blur-sm shadow-lg">
                                {Array.from(new Set(users.map(u => u.userId))).map((userId, i) => (
                                    <div
                                        key={userId}
                                        className="w-8 h-8 rounded-full border-2 border-gray-900 flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 text-xs font-bold text-white relative group cursor-help"
                                        title={userId}
                                    >
                                        {userId.charAt(0).toUpperCase()}
                                        <span className="absolute -bottom-8 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                                            {userId} {userId === (user?.username || userId) ? '(You)' : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Current User Avatar (Top Right) */}
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg border border-white/10" title={`Logged in as ${user?.username}`}>
                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        </div>

                        <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
                            <div className="bg-gray-800/90 backdrop-blur p-2 rounded border border-gray-700 shadow-md flex items-center gap-2">
                                <Link to="/dashboard" className="text-gray-400 hover:text-white mr-2" title="Back to Dashboard">←</Link>
                                {isEditingTitle ? (
                                    <input
                                        value={workspaceName}
                                        onChange={(e) => setWorkspaceName(e.target.value)}
                                        onBlur={handleTitleRename}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleTitleRename();
                                        }}
                                        autoFocus
                                        className="bg-black/50 text-white text-sm px-1 rounded outline-none border border-blue-500 w-40"
                                    />
                                ) : (
                                    <h2
                                        onClick={() => setIsEditingTitle(true)}
                                        className="text-white text-sm font-semibold cursor-pointer hover:underline decoration-dashed underline-offset-4"
                                    >
                                        {workspaceName}
                                    </h2>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    // 1. Temporary Style to hide UI
                                    const style = document.createElement('style');
                                    style.innerHTML = `
                                        aside, .react-flow__controls, .react-flow__minimap, .react-flow__panel, button, input {
                                            display: none !important;
                                        }
                                        /* Optional: Ensure background is dark if not set by printer */
                                        @media print {
                                            body {
                                                -webkit-print-color-adjust: exact;
                                                print-color-adjust: exact;
                                                background-color: #030712 !important;
                                            }
                                        }
                                    `;
                                    style.id = 'print-style';
                                    document.head.appendChild(style);

                                    // 2. Print
                                    setTimeout(() => {
                                        window.print();
                                        // 3. Cleanup after print dialog closes (or immediately)
                                        // Note: window.print() is blocking in some browsers, but execution continues here.
                                        // Ideally we wait for focus back, but a simple timeout works for restoring UI visibility.
                                        document.head.removeChild(style);
                                    }, 100);
                                }}
                                className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs border border-gray-700 shadow-lg transition-colors cursor-pointer flex items-center gap-2 w-fit"
                            >
                                <span>📷</span> Export / Print
                            </button>
                        </div>

                        <ReactFlow
                            style={{ width: '100%', height: '100%' }}
                            nodes={nodes}
                            edges={edges}
                            nodeTypes={nodeTypes}
                            defaultEdgeOptions={defaultEdgeOptions}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onInit={setReactFlowInstance}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onNodeDrag={handleNodeDrag}
                            onNodesDelete={onNodesDelete}
                            onEdgesDelete={onEdgesDelete}
                            fitView
                            className="bg-gray-900"
                            colorMode="dark"
                            onMouseMove={(e) => {
                                if (socket && userId && reactFlowInstance) {
                                    // Throttle this in production
                                    const position = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
                                    socket.emit('cursor_move', { workspaceId, userId, position });
                                }
                            }}
                        >
                            <Controls />
                            <MiniMap />
                            <Background gap={12} size={1} />

                            {Object.entries(cursors).map(([uId, pos]) => (
                                <div
                                    key={uId}
                                    style={{
                                        transform: `translate(${pos.x}px, ${pos.y}px)`,
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        pointerEvents: 'none',
                                        zIndex: 1000,
                                    }}
                                    className="flex items-center"
                                >
                                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(255,0,0,0.5)] border border-white/20"></div>
                                    <span className="ml-2 text-[10px] text-white bg-red-500/80 px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                                        {uId}
                                    </span>
                                </div>
                            ))}

                        </ReactFlow>

                        <MiniChat socket={socket} userId={userId || 'anon'} />
                    </div>
                </NodeInteractionContext.Provider>
            </ReactFlowProvider>
        </div>
    );
}; // End Component

export default Canvas;

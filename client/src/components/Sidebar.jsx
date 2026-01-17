import React from 'react';
import { Monitor, Server, Database } from 'lucide-react';

export default function Sidebar() {
    const onDragStart = (event, nodeType, label) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/label', label); // Pass label too
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-4 text-white z-10 glass-panel">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4">
                SyncFlow
            </h2>
            <div className="description text-xs text-gray-400 mb-2">
                Drag nodes to the canvas.
            </div>

            <div className="flex flex-col gap-3">
                <div
                    className="p-3 bg-gray-800/50 backdrop-blur-sm rounded border border-blue-500/30 cursor-grab hover:border-blue-500 hover:bg-gray-800 transition-all flex items-center gap-3"
                    onDragStart={(event) => onDragStart(event, 'clientNode', 'Client')}
                    draggable
                >
                    <Monitor size={18} className="text-blue-400" />
                    <span>Client App</span>
                </div>

                <div
                    className="p-3 bg-gray-800/50 backdrop-blur-sm rounded border border-purple-500/30 cursor-grab hover:border-purple-500 hover:bg-gray-800 transition-all flex items-center gap-3"
                    onDragStart={(event) => onDragStart(event, 'serverNode', 'Server')}
                    draggable
                >
                    <Server size={18} className="text-purple-400" />
                    <span>Server</span>
                </div>

                <div
                    className="p-3 bg-gray-800/50 backdrop-blur-sm rounded border border-green-500/30 cursor-grab hover:border-green-500 hover:bg-gray-800 transition-all flex items-center gap-3"
                    onDragStart={(event) => onDragStart(event, 'databaseNode', 'Database')}
                    draggable
                >
                    <Database size={18} className="text-green-400" />
                    <span>Database</span>
                </div>
            </div>

            <div className="mt-auto text-xs text-gray-500">
                Workspace: <span className="font-mono text-gray-400">default</span>
            </div>
        </aside>
    );
}

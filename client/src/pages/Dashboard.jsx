import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [workspaces, setWorkspaces] = useState([]);
    const [filteredWorkspaces, setFilteredWorkspaces] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [newName, setNewName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                const res = await fetch('http://localhost:3000/api/workspaces', {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    setWorkspaces(data);
                    setFilteredWorkspaces(data);
                } else {
                    toast.error('Failed to load workspaces');
                }
            } catch (err) {
                console.error(err);
                toast.error('Error loading workspaces');
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchWorkspaces();
        }
    }, [user]);

    useEffect(() => {
        setFilteredWorkspaces(
            workspaces.filter(ws =>
                (ws.name || 'Untitled Workspace').toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [searchTerm, workspaces]);

    const handleCreateNew = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/workspaces', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // Cookie
                body: JSON.stringify({})
            });

            if (res.ok) {
                const newWs = await res.json();
                navigate(`/workspace/${newWs.workspaceId}`);
            } else {
                toast.error('Failed to create workspace');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error creating workspace');
        }
    };

    const handleDelete = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this workspace?')) return;

        try {
            const res = await fetch(`http://localhost:3000/api/workspaces/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (res.ok) {
                const updated = workspaces.filter(ws => ws.workspaceId !== id);
                setWorkspaces(updated);
                toast.success('Workspace deleted');
            } else {
                toast.error('Failed to delete workspace');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error deleting workspace');
        }
    };

    const startRename = (e, ws) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingId(ws.workspaceId);
        setNewName(ws.name || 'Untitled Workspace');
    };

    const handleRename = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const res = await fetch(`http://localhost:3000/api/workspaces/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                const updatedWs = await res.json(); // Get updated object with new time
                setWorkspaces(prev => prev.map(ws => ws.workspaceId === id ? updatedWs : ws));
                setEditingId(null);
                toast.success('Workspace renamed');
            } else {
                toast.error('Failed to rename workspace');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error renaming workspace');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <header className="flex justify-between items-center mb-10 border-b border-gray-700 pb-6">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
                        SyncFlow Dashboard
                    </h1>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search workspaces..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-gray-800 text-sm text-white px-4 py-2 rounded-full border border-gray-600 focus:border-purple-500 outline-none w-64"
                        />
                        <span className="absolute right-3 top-2 text-gray-500">🔍</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-lg shadow-lg">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="text-gray-300">Welcome, <span className="font-semibold text-white text-lg">{user?.username}</span></span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-5 py-2 text-sm bg-red-600/80 hover:bg-red-600 rounded-lg transition shadow-md"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main>
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* Create New Card */}
                        <div
                            onClick={handleCreateNew}
                            className="group h-48 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center bg-gray-800/30 hover:bg-gray-800/60 hover:border-purple-500 transition cursor-pointer backdrop-blur-sm"
                        >
                            <div className="w-14 h-14 rounded-full bg-purple-900/40 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-purple-600 transition-all duration-300">
                                <span className="text-3xl text-purple-300 group-hover:text-white font-light">+</span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-300 group-hover:text-white">Create Workspace</h3>
                        </div>

                        {/* Workspace Cards */}
                        {filteredWorkspaces.map((ws) => (
                            <Link to={`/workspace/${ws.workspaceId}`} key={ws._id} className="block group">
                                <div className="h-48 bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-500 hover:shadow-xl hover:shadow-purple-900/10 transition relative overflow-hidden group/card">
                                    <div className="flex flex-col h-full justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                {editingId === ws.workspaceId ? (
                                                    <div className="flex items-center gap-1 w-full" onClick={(e) => e.preventDefault()}>
                                                        <input
                                                            value={newName}
                                                            onChange={(e) => setNewName(e.target.value)}
                                                            className="bg-gray-700 text-white text-md px-1 rounded w-full outline-none border border-blue-500"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleRename(e, ws.workspaceId);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <button onClick={(e) => handleRename(e, ws.workspaceId)} className="text-green-400 text-xs hover:text-green-300">Save</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 pr-2 flex justify-between items-start">
                                                        <h3 className="text-xl font-semibold text-gray-100 mb-1 truncate max-w-[130px]" title={ws.name || 'Untitled'}>
                                                            {ws.name || 'Untitled Workspace'}
                                                        </h3>
                                                        <button
                                                            onClick={(e) => startRename(e, ws)}
                                                            className="text-gray-400 hover:text-white p-1 rounded opacity-0 group-hover/card:opacity-100 transition"
                                                            title="Rename"
                                                        >
                                                            ✏️
                                                        </button>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => handleDelete(e, ws.workspaceId)}
                                                    className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded transition opacity-0 group-hover/card:opacity-100 z-10"
                                                    title="Delete Workspace"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 font-mono mt-1">ID: {ws.workspaceId}</p>
                                        </div>

                                        <div className="mt-4">
                                            <p className="text-gray-400 text-xs mb-3">
                                                Last updated: {new Date(ws.lastUpdated).toLocaleDateString()} {new Date(ws.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <span className="text-purple-400 group-hover:text-purple-300 text-sm font-medium flex items-center gap-1">
                                                Open Canvas <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {!isLoading && workspaces.length === 0 && (
                    <div className="text-center text-gray-500 mt-12">
                        <h3 className="text-2xl font-bold mb-2">Welcome to SyncFlow!</h3>
                        <p>You don't have any workspaces yet. Click the card above to build your first architecture.</p>
                    </div>
                )}
                {!isLoading && workspaces.length > 0 && filteredWorkspaces.length === 0 && (
                    <div className="text-center text-gray-500 mt-12">
                        <p>No workspaces found matching "{searchTerm}"</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;

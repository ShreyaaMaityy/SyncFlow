import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

// Rewriting component to accept socket
const MiniChatComponent = ({ socket, userId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const listening = (msg) => {
            setMessages((prev) => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        };

        socket.on('chat_message', listening);

        return () => {
            socket.off('chat_message', listening);
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!inputText.trim() || !socket) return;

        const msg = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId,
            text: inputText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Optimistic update
        // We add it locally immediately for responsiveness
        // The duplicate check in useEffect ensures we don't add it again when server echoes
        setMessages(prev => [...prev, msg]);
        socket.emit('chat_message', msg);

        setInputText('');
    };

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex flex-col items-end`}>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-full shadow-lg transition-transform hover:scale-110"
                >
                    <MessageSquare size={24} />
                </button>
            )}

            {isOpen && (
                <div className="w-80 h-96 bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="p-3 bg-gray-800/80 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <MessageSquare size={16} className="text-purple-400" /> Workspace Chat
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.userId === userId ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] rounded-lg p-2 text-sm ${msg.userId === userId ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                    {msg.text}
                                </div>
                                <span className="text-[10px] text-gray-500 mt-1">
                                    {msg.userId === userId ? 'You' : msg.userId} • {msg.timestamp}
                                </span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className="p-3 bg-gray-800/50 border-t border-gray-700 flex gap-2">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                        />
                        <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded transition-colors">
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default MiniChatComponent;

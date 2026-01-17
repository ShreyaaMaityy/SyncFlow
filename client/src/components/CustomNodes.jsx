import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Monitor, Server, Database } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNodeInteraction } from '../context/NodeInteractionContext';

const NodeWrapper = ({ id, className, label, icon: Icon, selected }) => {
    const { updateNodeLabel } = useNodeInteraction();
    const [isEditing, setIsEditing] = useState(false);
    const [tempLabel, setTempLabel] = useState(label);
    const inputRef = useRef(null);

    useEffect(() => {
        setTempLabel(label);
    }, [label]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleDoubleClick = (e) => {
        e.stopPropagation(); // prevent ReactFlow from intercepting
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (tempLabel !== label) {
            updateNodeLabel(id, tempLabel);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setIsEditing(false);
            updateNodeLabel(id, tempLabel);
        }
    };

    return (
        <div
            className={twMerge(
                "relative rounded-lg p-4 w-40 flex flex-col items-center gap-2 transition-all duration-300 backdrop-blur-md bg-white/10 dark:bg-black/20 border-2 shadow-xl",
                selected ? "shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105" : "shadow-lg",
                className
            )}
            onDoubleClick={handleDoubleClick}
        >
            <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-3 !h-3" />

            <div className="p-2 rounded-full bg-white/10 border border-white/20">
                <Icon className="w-6 h-6 text-white" />
            </div>

            {isEditing ? (
                <input
                    ref={inputRef}
                    value={tempLabel}
                    onChange={(e) => setTempLabel(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="text-sm font-semibold text-center text-white bg-black/50 px-1 rounded w-full outline-none border border-blue-400/50"
                />
            ) : (
                <div className="text-sm font-semibold text-white/90">{label}</div>
            )}

            <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-3 !h-3" />
        </div>
    );
};

export const ClientNode = memo(({ id, data, selected }) => {
    return (
        <NodeWrapper
            id={id}
            label={data.label || 'Client'}
            icon={Monitor}
            className="border-blue-500/50 hover:border-blue-400"
            selected={selected}
        />
    );
});

export const ServerNode = memo(({ id, data, selected }) => {
    return (
        <NodeWrapper
            id={id}
            label={data.label || 'Server'}
            icon={Server}
            className="border-purple-500/50 hover:border-purple-400"
            selected={selected}
        />
    );
});

export const DatabaseNode = memo(({ id, data, selected }) => {
    return (
        <NodeWrapper
            id={id}
            label={data.label || 'Database'}
            icon={Database}
            className="border-green-500/50 hover:border-green-400"
            selected={selected}
        />
    );
});

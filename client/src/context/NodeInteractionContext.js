import { createContext, useContext } from 'react';

export const NodeInteractionContext = createContext(null);

export const useNodeInteraction = () => {
    const context = useContext(NodeInteractionContext);
    if (!context) {
        throw new Error('useNodeInteraction must be used within a NodeInteractionProvider');
    }
    return context;
};

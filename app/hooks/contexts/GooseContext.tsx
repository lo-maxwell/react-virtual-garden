import { Garden } from '@/models/garden/Garden';
import GoosePen from '@/models/goose/GoosePen';
import React, { createContext, Dispatch, SetStateAction, useContext, useState } from 'react';

// Define your context type
interface GooseContextType {
    goosePen: GoosePen
    // Add any other actions or state you need
}

// Create a context with default values
export const GooseContext = createContext<GooseContextType | undefined>(undefined);

export const useGarden = () => {
    const context = useContext(GooseContext);
    if (!context) {
        throw new Error('useGoose must be used within a GooseProvider');
    }
    return context;
};
import { Inventory } from '@/models/itemStore/inventory/Inventory';
import React, { createContext, Dispatch, SetStateAction, useContext, useState } from 'react';

// Define your context type
interface InventoryContextType {
    inventory: Inventory;
    resetInventory: () => void;
    inventoryForceRefreshKey: number;
    updateInventoryForceRefreshKey: () => void;
    // Add any other actions or state you need
}

// Create a context with default values
export const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
    const context = useContext(InventoryContext);
    if (!context) {
        throw new Error('useInventory must be used within a InventoryProvider');
    }
    return context;
};
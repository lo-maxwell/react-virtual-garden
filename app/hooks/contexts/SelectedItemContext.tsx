import { Tool } from '@/models/items/tools/Tool';
import { InventoryItem } from '@/models/items/inventoryItems/InventoryItem';
import { ItemStore } from '@/models/itemStore/ItemStore';
import User from '@/models/user/User';
import React, { createContext, Dispatch, SetStateAction, useContext, useState } from 'react';

// Define your context type
interface SelectedItemContextType {
    selectedItem: InventoryItem | Tool | null;
    toggleSelectedItem: (item: InventoryItem | Tool | null) => void;
    owner: User | ItemStore | null;
    setOwner: React.Dispatch<React.SetStateAction<ItemStore | User | null>>;
    // Add any other actions or state you need
}

// Create a context with default values
export const SelectedItemContext = createContext<SelectedItemContextType | undefined>(undefined);

export const useSelectedItem = () => {
    const context = useContext(SelectedItemContext);
    if (!context) {
        throw new Error('useSelectedItem must be used within a SelectedItemProvider');
    }
    return context;
};
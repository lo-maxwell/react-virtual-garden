import { InventoryTransactionResponse } from '@/models/itemStore/inventory/InventoryTransactionResponse';
import { Store } from '@/models/itemStore/store/Store';
import React, { createContext, Dispatch, SetStateAction, useContext, useState } from 'react';

// Define your context type
interface StoreContextType {
    store: Store;
    restockStore: () => InventoryTransactionResponse;
    resetStore: () => void;
    updateRestockTimer: () => void;
    // Add any other actions or state you need
}

// Create a context with default values
export const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
};
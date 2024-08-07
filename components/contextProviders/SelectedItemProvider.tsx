'use client'
import { SelectedItemContext } from '@/hooks/contexts/SelectedItemContext';
import { InventoryItem } from '@/models/items/inventoryItems/InventoryItem';
import { ItemStore } from '@/models/itemStore/ItemStore';
import React, { ReactNode, useEffect, useState } from 'react';

// Define props for the provider
interface SelectedItemProviderProps {
    children: ReactNode;
}

export const SelectedItemProvider = ({ children }: SelectedItemProviderProps) => {
  	const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
	const [owner, setOwner] = useState<ItemStore | null>(null);

    function toggleSelectedItem(item: InventoryItem | null) {
        if (item && item === selectedItem) {
            setSelectedItem(null);
        } else {
            setSelectedItem(item);
        }
    }

    return (
        <SelectedItemContext.Provider value={{selectedItem, toggleSelectedItem, owner, setOwner}}>
            {children}
        </SelectedItemContext.Provider>
    );
};
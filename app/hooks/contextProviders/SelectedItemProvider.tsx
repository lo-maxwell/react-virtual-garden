'use client'
import { SelectedItemContext } from '@/app/hooks/contexts/SelectedItemContext';
import { InventoryItem } from '@/models/items/inventoryItems/InventoryItem';
import { Tool } from '@/models/items/tools/Tool';
import { ItemStore } from '@/models/itemStore/ItemStore';
import User from '@/models/user/User';
import { usePathname } from '@/node_modules/next/navigation';
import { useLocation } from '@/node_modules/react-router-dom/dist/index';
import React, { ReactNode, useEffect, useState } from 'react';

// Define props for the provider
interface SelectedItemProviderProps {
    children: ReactNode;
}

export const SelectedItemProvider = ({ children }: SelectedItemProviderProps) => {
  	const [selectedItem, setSelectedItem] = useState<InventoryItem | Tool | null>(null);
	const [owner, setOwner] = useState<ItemStore | User | null>(null);
    const pathname = usePathname(); // Hook to get the current pathname in Next.js

    // Reset selectedItem on route change
    useEffect(() => {
        setSelectedItem(null);
    }, [pathname]); // Runs whenever the pathname changes

    function toggleSelectedItem(item: InventoryItem | Tool | null) {
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
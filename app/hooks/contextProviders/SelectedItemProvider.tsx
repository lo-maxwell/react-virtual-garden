'use client'
import { SelectedItemContext } from '@/app/hooks/contexts/SelectedItemContext';
import { InventoryItem } from '@/models/items/inventoryItems/InventoryItem';
import { Tool } from '@/models/items/tools/Tool';
import { ItemStore } from '@/models/itemStore/ItemStore';
import User from '@/models/user/User';
import { usePathname } from '@/node_modules/next/navigation';
import { useLocation } from '@/node_modules/react-router-dom/dist/index';
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

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

    const toggleSelectedItem = useCallback((item: InventoryItem | Tool | null) => {
        setSelectedItem(prev =>
          item && item === prev ? null : item
        );
      }, []);

    const contextValue = useMemo(() => ({
        selectedItem,
        toggleSelectedItem,
        owner,
        setOwner
    }), [selectedItem, toggleSelectedItem, owner, setOwner]);

    return (
        <SelectedItemContext.Provider value={contextValue}>
            {children}
        </SelectedItemContext.Provider>
    );
};
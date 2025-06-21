'use client'
import { InventoryContext } from '@/app/hooks/contexts/InventoryContext';
import { generateInventoryItem } from '@/models/items/ItemFactory';
import { Inventory } from '@/models/itemStore/inventory/Inventory';
import { InventoryItemList } from '@/models/itemStore/InventoryItemList';
import { loadInventory, saveInventory } from '@/utils/localStorage/inventory';
import React, { ReactNode, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define props for the provider
interface InventoryProviderProps {
    children: ReactNode;
}

export const InventoryProvider = ({ children }: InventoryProviderProps) => {
    const [inventory, setInventory] = useState<Inventory | null>(null);
	const [inventoryForceRefreshKey, setInventoryForceRefreshKey] = useState(0);

	function setupInventory(): Inventory {
		let inv = loadInventory();
		console.log(inv);
		if (!(inv instanceof Inventory)) {
		  console.log('inventory not found, setting up');
		  inv = Inventory.generateDefaultNewInventory();
		  saveInventory(inv);
		}
		return inv;
	  }

	useEffect(() => {
		// Initialize inventory only on client side
		const initialInventory = setupInventory();
		setInventory(initialInventory);
	  }, []);
	

	const resetInventory = () => {
		const newInventory = Inventory.generateDefaultNewInventory();
		setInventory(newInventory);
		saveInventory(newInventory);
		console.log(newInventory.toPlainObject());
	}

	const updateInventoryForceRefreshKey = () => {
		setInventoryForceRefreshKey((inventoryForceRefreshKey) => inventoryForceRefreshKey + 1);
	}

	const reloadInventory = () => {
		const initialInventory = setupInventory();
		setInventory(initialInventory);
	}

    return (
        <InventoryContext.Provider value={{ inventory: inventory!, resetInventory, inventoryForceRefreshKey, updateInventoryForceRefreshKey, reloadInventory }}>
            {children}
        </InventoryContext.Provider>
    );
};
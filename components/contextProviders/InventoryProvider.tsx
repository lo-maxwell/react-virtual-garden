'use client'
import { InventoryContext } from '@/app/hooks/contexts/InventoryContext';
import { generateNewPlaceholderInventoryItem } from '@/models/items/PlaceholderItems';
import { Inventory } from '@/models/itemStore/inventory/Inventory';
import { ItemList } from '@/models/itemStore/ItemList';
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


	function generateDefaultNewInventory(): Inventory {
		const randomUuid = uuidv4();
		return new Inventory(randomUuid, "Test User", 100, new ItemList([
			generateNewPlaceholderInventoryItem('apple seed', 100)]));
	}

	function setupInventory(): Inventory {
		let inv = loadInventory();
		console.log(inv);
		if (!(inv instanceof Inventory)) {
		  console.log('inventory not found, setting up');
		  inv = generateDefaultNewInventory();
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
		const newInventory = generateDefaultNewInventory();
		setInventory(newInventory);
		saveInventory(newInventory);
		console.log(newInventory.toPlainObject());
	}

	const updateInventoryForceRefreshKey = () => {
		setInventoryForceRefreshKey((inventoryForceRefreshKey) => inventoryForceRefreshKey + 1);
	}

    return (
        <InventoryContext.Provider value={{ inventory: inventory!, resetInventory, inventoryForceRefreshKey, updateInventoryForceRefreshKey }}>
            {children}
        </InventoryContext.Provider>
    );
};
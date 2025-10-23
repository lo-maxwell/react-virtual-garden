'use client'
import { InventoryContext } from '@/app/hooks/contexts/InventoryContext';
import { generateInventoryItem } from '@/models/items/ItemFactory';
import { Inventory } from '@/models/itemStore/inventory/Inventory';
import { InventoryItemList } from '@/models/itemStore/InventoryItemList';
import { setGold } from '@/store/slices/inventorySlice';
import { loadInventory, saveInventory } from '@/utils/localStorage/inventory';
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

// Define props for the provider
interface InventoryProviderProps {
    children: ReactNode;
}

export const InventoryProvider = ({ children }: InventoryProviderProps) => {
    const [inventory, setInventory] = useState<Inventory | null>(null);
	const [inventoryForceRefreshKey, setInventoryForceRefreshKey] = useState(0);
	const dispatch = useDispatch();

	const setupInventory = useCallback((): Inventory => {
		let inv = loadInventory();
		if (!(inv instanceof Inventory)) {
		  console.log('inventory not found, setting up');
		  inv = Inventory.generateDefaultNewInventory();
		  saveInventory(inv);
		}
		dispatch(setGold(inv.getGold() ?? 0));
		return inv;
	  }, []);

	useEffect(() => {
		// Initialize inventory only on client side
		const initialInventory = setupInventory();
		setInventory(initialInventory);
	  }, []);
	

	const resetInventory = useCallback(() => {
		const newInventory = Inventory.generateDefaultNewInventory();
		setInventory(newInventory);
		saveInventory(newInventory);
		dispatch(setGold(newInventory.getGold() ?? 0));
		console.log(newInventory.toPlainObject());
	}, []);

	const updateInventoryForceRefreshKey = useCallback(() => {
		setInventoryForceRefreshKey((inventoryForceRefreshKey) => inventoryForceRefreshKey + 1);
	}, []);

	const reloadInventory = useCallback(() => {
		const initialInventory = setupInventory();
		setInventory(initialInventory);
		dispatch(setGold(initialInventory.getGold() ?? 0));
	}, [setupInventory]);

	const contextValue = useMemo(() => ({
		inventory: inventory!,
		resetInventory,
		inventoryForceRefreshKey,
		updateInventoryForceRefreshKey,
		reloadInventory
	  }), [
		inventory,
		inventoryForceRefreshKey,
		resetInventory,
		updateInventoryForceRefreshKey,
		reloadInventory
	  ]);

    return (
        <InventoryContext.Provider value={contextValue}>
            {children}
        </InventoryContext.Provider>
    );
};
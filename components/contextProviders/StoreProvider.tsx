'use client'
import { StoreContext } from '@/hooks/contexts/StoreContext';
import { generateNewPlaceholderInventoryItem } from '@/models/items/PlaceholderItems';
import { InventoryTransactionResponse } from '@/models/itemStore/inventory/InventoryTransactionResponse';
import { ItemList } from '@/models/itemStore/ItemList';
import { Store } from '@/models/itemStore/store/Store';
import { loadStore, saveStore } from '@/utils/localStorage/store';
import React, { ReactNode, useEffect, useRef, useState } from 'react';

// Define props for the provider
interface StoreProviderProps {
    children: ReactNode;
}

export const StoreProvider = ({ children }: StoreProviderProps) => {
    const [store, setStore] = useState<Store | null>(null);

	function generateInitialStore() {
		function generateItems() { 
			return new ItemList([
				generateNewPlaceholderInventoryItem('apple seed', 100),
				generateNewPlaceholderInventoryItem('banana seed', 50),
				generateNewPlaceholderInventoryItem('coconut seed', 25),
				generateNewPlaceholderInventoryItem('yellow onion seed', 25),
				generateNewPlaceholderInventoryItem('garlic seed', 25),
				generateNewPlaceholderInventoryItem('cherry seed', 25),
				generateNewPlaceholderInventoryItem('peach seed', 25),
				generateNewPlaceholderInventoryItem('bench blueprint', 10),
				generateNewPlaceholderInventoryItem('flamingo blueprint', 2),
			]);	
		}
		const storeId = 0;
		const storeName = "Test Store";
		const buyMultiplier = 2;
		const sellMultiplier = 1;
		const upgradeMultiplier = 1;
		const restockTime = Date.now();
		const restockInterval = 300000;
		
		return new Store(storeId, storeName, buyMultiplier, sellMultiplier, upgradeMultiplier, generateItems(), generateItems(), restockTime, restockInterval);
	}

	function setupStore(): Store {
		let store = loadStore();
		console.log(store);
		if (!(store instanceof Store)) {
		  console.log('store not found, setting up');
		  store = generateInitialStore();
		  store.restockStore();
		}
		updateRestockTimer();
		saveStore(store);
		return store;
	  }

	useEffect(() => {
		// Initialize store only on client side
		const initialStore = setupStore();
		setStore(initialStore);
	  }, []);
	

    const restockStore = () => {
		if (store) {
			const response = store.restockStore();
			if (!response.isSuccessful()) return response;
			saveStore(store);
			return response;
		} 
		const response = new InventoryTransactionResponse();
		response.addErrorMessage('Error restocking store: store does not exist');
		return response;
    };

	const restockTimeout = useRef<number | null>(null);
	const updateRestockTimer = () => {
		if (!store) return;
		const currentTime = Date.now();
		if (currentTime > store.getRestockTime() && store.needsRestock()) {
			//Store is waiting for a restock, timer is finished
			const newRestockTime = currentTime + store.getRestockInterval();
			store.setRestockTime(newRestockTime);
			// Set a new timeout to trigger restock after the interval
			const remainingTime = newRestockTime - currentTime;
			restockTimeout.current = window.setTimeout(() => {
				if (store) {
					store.restockStore();
				}
			}, remainingTime);
		} else if (store.needsRestock()) {
			 // Set a timeout for the remaining time until the next restock
			const remainingTime = store.getRestockTime() - currentTime;
			restockTimeout.current = window.setTimeout(() => {
				if (store) {
					store.restockStore();
				}
			}, remainingTime);
		}

	}

	useEffect(() => {
		// Start the timer when the component mounts
		updateRestockTimer();
	
		// Clean up the timer when the component unmounts
		return () => {
		  if (restockTimeout.current) {
			clearTimeout(restockTimeout.current);
		  }
		};
	  }, [updateRestockTimer]);

	const resetStore = () => {
		const newStore = generateInitialStore();
		setStore(newStore);
		saveStore(newStore);
	}

    return (
        <StoreContext.Provider value={{ store: store!, restockStore, resetStore, updateRestockTimer }}>
            {children}
        </StoreContext.Provider>
    );
};
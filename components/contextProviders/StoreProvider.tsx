'use client'
import { StoreContext } from '@/app/hooks/contexts/StoreContext';
import { generateNewPlaceholderInventoryItem } from '@/models/items/PlaceholderItems';
import { InventoryTransactionResponse } from '@/models/itemStore/inventory/InventoryTransactionResponse';
import { ItemList } from '@/models/itemStore/ItemList';
import { stocklistFactory } from '@/models/itemStore/store/StocklistFactory';
import { Store } from '@/models/itemStore/store/Store';
import { storeFactory } from '@/models/itemStore/store/StoreFactory';
import { loadStore, saveStore } from '@/utils/localStorage/store';
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define props for the provider
interface StoreProviderProps {
    children: ReactNode;
}

export const StoreProvider = ({ children }: StoreProviderProps) => {
    const [store, setStore] = useState<Store | null>(null);

	function generateInitialStore() {
		const randomUuid = uuidv4();
		function generateItems() { 
			return stocklistFactory.getStocklistInterfaceById("0")?.items;
		}
		const storeIdentifier = 1;
		const storeInterface = storeFactory.getStoreInterfaceById(storeIdentifier);
		let storeName = "Default Store";
		let buyMultiplier = 2;
		let sellMultiplier = 1;
		let upgradeMultiplier = 1;
		let restockTime = Date.now();
		let restockInterval = 300000;
		if (storeInterface) {
			storeName = storeInterface.name;
			buyMultiplier = storeInterface.buyMultiplier;
			sellMultiplier = storeInterface.sellMultiplier;
			upgradeMultiplier = storeInterface.upgradeMultiplier;
			restockInterval = storeInterface.restockInterval;
		}
		const initialStore = new Store(randomUuid, storeIdentifier, storeName, buyMultiplier, sellMultiplier, upgradeMultiplier, new ItemList(), generateItems(), restockTime, restockInterval);
		initialStore.restockStore();
		return initialStore;
	}

	function setupStore(): Store {
		let store = loadStore();
		console.log(store);
		if (!(store instanceof Store)) {
		  console.log('store not found, setting up');
		  store = generateInitialStore();
		//   store.restockStore();
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
	

    const restockStore = async () => {
		if (store) {
			if (!store.needsRestock()) {
				return "UNNECESSARY";
			}
			try {
				const data = {
				}
				// Making the PATCH request to your API endpoint
				const response = await fetch(`/api/store/${store.getStoreId()}/restock`, {
				  method: 'PATCH',
				  headers: {
					'Content-Type': 'application/json',
				  },
				  body: JSON.stringify(data), // Send the data in the request body
				});
		  
				// Check if the response is successful
				if (!response.ok) {
				  throw new Error('Failed to restock store');
				}
		  
				// Parsing the response data
				const result = await response.json();
				console.log('Successfully restocked store:', result);
				if (result === false) return "NOT TIME";
			  } catch (error) {
				console.error(error);
				return "ERROR";
			  } finally {
			  }
			const response = store.restockStore();
			if (!response.isSuccessful()) return "ERROR";
			saveStore(store);
			//TODO: Add forceRefreshKey?
			return "SUCCESS"
		} 
		return "ERROR";
    };

	const restockTimeout = useRef<number | null>(null);
	const updateRestockTimer = useCallback(() => {
		if (!store) return;
		if (restockTimeout.current) return; //do not interrupt existing timeouts
		const currentTime = Date.now();

		if (currentTime > store.getRestockTime() && store.needsRestock()) {
			//Store is waiting for a restock, timer is finished
			const newRestockTime = currentTime + store.getRestockInterval();
			store.setRestockTime(newRestockTime);
			// Set a new timeout to trigger restock after the interval
			const remainingTime = newRestockTime - currentTime;
			restockTimeout.current = window.setTimeout(async () => {
				const restockResult = await restockStore();
				restockTimeout.current = null;
				if (restockResult === "NOT TIME") {
					updateRestockTimer()
				}
				
			}, remainingTime);
		} else if (store.needsRestock()) {
			 // Set a timeout for the remaining time until the next restock
			const remainingTime = store.getRestockTime() - currentTime;
			restockTimeout.current = window.setTimeout(async () => {
				const restockResult = await restockStore();
				restockTimeout.current = null;
				if (restockResult === "NOT TIME") {
					updateRestockTimer()
				}
			}, remainingTime);
		}
	}, [store]);

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
        <StoreContext.Provider value={{ store: store!, resetStore, updateRestockTimer }}>
            {children}
        </StoreContext.Provider>
    );
};
'use client'
import { StoreContext } from '@/app/hooks/contexts/StoreContext';
import { useUser } from '@/app/hooks/contexts/UserContext';
import { generateNewPlaceholderInventoryItem } from '@/models/items/PlaceholderItems';
import { InventoryTransactionResponse } from '@/models/itemStore/inventory/InventoryTransactionResponse';
import { ItemList } from '@/models/itemStore/ItemList';
import { stocklistFactory } from '@/models/itemStore/store/StocklistFactory';
import { Store } from '@/models/itemStore/store/Store';
import { storeFactory } from '@/models/itemStore/store/StoreFactory';
import User from '@/models/user/User';
import { loadStore, saveStore } from '@/utils/localStorage/store';
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define props for the provider
interface StoreProviderProps {
    children: ReactNode;
}

export const StoreProvider = ({ children }: StoreProviderProps) => {
    const [store, setStore] = useState<Store | null>(null);
	const { user } = useUser();
 
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

	function restockStoreLocal () {
		if (!store) return false;
		if (!store.needsRestock()) return false;
		const response = store.restockStore();
		if (!response.isSuccessful()) return false;
		saveStore(store);
		return true;
	}

	async function restockStoreAPI () {
		if (!store) return false;
		try {
			const data = {
			}
			// Making the PATCH request to your API endpoint
			const response = await fetch(`/api/user/${`TODO: REPLACE VALUE`}/store/${store.getStoreId()}/restock`, {
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
		  }
	}

	async function syncStore (user: User, store: Store) {
	try {
        // Sync store data
        const storeResponse = await fetch(`/api/user/${user.getUserId()}/store/${store.getStoreId()}/get`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (!storeResponse.ok) {
          throw new Error('Failed to fetch store');
        }
        const storeResult = await storeResponse.json();
		saveStore(Store.fromPlainObject(storeResult));
		Object.assign(store, Store.fromPlainObject(storeResult));
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
	}
	
    const restockStore = async () => {
		if (!store) return "ERROR";
		const localResult = restockStoreLocal();
		if (localResult) {
			const apiResult = await restockStoreAPI();
			if (!apiResult) {
				syncStore(user, store);
				return "NOT TIME";
			}
		}
		return "SUCCESS";
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
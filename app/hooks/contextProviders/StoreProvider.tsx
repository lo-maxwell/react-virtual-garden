'use client'
import { useAccount } from '@/app/hooks/contexts/AccountContext';
import { StoreContext } from '@/app/hooks/contexts/StoreContext';
import { useUser } from '@/app/hooks/contexts/UserContext';
import { generateNewPlaceholderInventoryItem } from '@/models/items/PlaceholderItems';
import { InventoryTransactionResponse } from '@/models/itemStore/inventory/InventoryTransactionResponse';
import { ItemList } from '@/models/itemStore/ItemList';
import { stocklistFactory } from '@/models/itemStore/store/StocklistFactory';
import { Store } from '@/models/itemStore/store/Store';
import { storeFactory } from '@/models/itemStore/store/StoreFactory';
import User from '@/models/user/User';
import { makeApiRequest } from '@/utils/api/api';
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
	const { account, guestMode } = useAccount();

	function setupStore(): Store {
		let store = loadStore();
		console.log(store);
		if (!(store instanceof Store)) {
		  console.log('store not found, setting up');
		  store = Store.generateDefaultNewStore();
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
			const data = {}
			const apiRoute = `/api/user/${`TODO: REPLACE VALUE`}/store/${store.getStoreId()}/restock`;
			const result = await makeApiRequest('PATCH', apiRoute, data, true);
			console.log('Successfully restocked store:', result);
			if (result === false) return "NOT TIME";
		  } catch (error) {
			console.error(error);
			return "ERROR";
		  }
	}

	async function syncStore (user: User, store: Store) {
	try {
		const apiRoute = `/api/user/${user.getUserId()}/store/${store.getStoreId()}/get`;
		const result = await makeApiRequest('GET', apiRoute, {}, true);
		saveStore(Store.fromPlainObject(result));
		reloadStore();
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
	}
	
    const restockStore = async () => {
		console.log('restocking store');
		if (!store) return "ERROR";
		const localResult = restockStoreLocal();
		if (localResult) {
			// Terminate early before api call
			if (guestMode) {
				return "SUCCESS";
			}

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
		const newStore = Store.generateDefaultNewStore();
		setStore(newStore);
		saveStore(newStore);
	}

	const reloadStore = () => {
		const initialStore = setupStore();
		setStore(initialStore);
	}

    return (
        <StoreContext.Provider value={{ store: store!, resetStore, updateRestockTimer, reloadStore }}>
            {children}
        </StoreContext.Provider>
    );
};
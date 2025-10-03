'use client'
import { useAccount } from '@/app/hooks/contexts/AccountContext';
import { StoreContext } from '@/app/hooks/contexts/StoreContext';
import { useUser } from '@/app/hooks/contexts/UserContext';
import { ApiErrorCodes } from "@/utils/api/error/apiErrorCodes";
import { InventoryItem } from '@/models/items/inventoryItems/InventoryItem';
import { Store } from '@/models/itemStore/store/Store';
import User from '@/models/user/User';
import { RootState } from '@/store';
import { setItemQuantity } from '@/store/slices/inventoryItemSlice';
import { makeApiRequest } from '@/utils/api/api';
import { loadStore, saveStore } from '@/utils/localStorage/store';
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Define props for the provider
interface StoreProviderProps {
    children: ReactNode;
}

export const StoreProvider = ({ children }: StoreProviderProps) => {
    const [store, setStore] = useState<Store | null>(null);
	const { user } = useUser();
	const { account, guestMode } = useAccount();

	const dispatch = useDispatch();
	const inventoryItems = useSelector((state: RootState) => state.inventoryItems);

	const updateReduxStoreItemsAfterRestock = useCallback(() => {
		if (!store) return;
		const items = store.getAllItems();
		const toUpdate: InventoryItem[] = [];
		items.forEach((item) => {
			const quantity = inventoryItems[item.getInventoryItemId()]?.quantity || -1;
			if (quantity != item.getQuantity()) {
				toUpdate.push(item);
			}
		})

		toUpdate.forEach((item) => {
			dispatch(setItemQuantity({ 
				inventoryItemId: item.getInventoryItemId(), 
				quantity: item.getQuantity()
			}));
		})
	}, [store, inventoryItems]);


	const setupStore = useCallback((): Store => {
		let store = loadStore();
		console.log(store);
		if (!(store instanceof Store)) {
		  console.log('store not found, setting up');
		  store = Store.generateDefaultNewStore();
		//   store.restockStore();
		}
		// updateRestockTimer();
		saveStore(store);
		return store;
	  }, []);

	useEffect(() => {
		// Initialize store only on client side
		const initialStore = setupStore();
		setStore(initialStore);
	  }, []);

	const restockStoreLocal = useCallback(() => {
		if (!store) return "STORE_NOT_FOUND";
		if (!store.needsRestock()) return "NOT_MISSING_STOCK";
		const currentTime = Date.now();
		if (store.getLastRestockTime() + store.getRestockInterval() > currentTime) {
			return "NOT_TIME";
		}
		const response = store.restockStore();

		if (!response.isSuccessful()) {
			// response.printErrorMessages();
			return "FAILED";
		}
		saveStore(store);
		return "SUCCESS";
	}, [store]);

	const restockStoreAPI = useCallback(async (): Promise<true | ApiErrorCodes> => {
		if (!store) return ApiErrorCodes.BAD_REQUEST;
		try {
			const data = {}
			const apiRoute = `/api/user/${user.getUserId()}/store/${store.getStoreId()}/restock`;
			const result = await makeApiRequest('PATCH', apiRoute, data, true);
			console.log('Successfully restocked store:', result);
			if (result.success === false) return result.error?.code || ApiErrorCodes.API_ERROR;
			return true;
		  } catch (error) {
			console.error(error);
			return ApiErrorCodes.NETWORK_ERROR;
		  }
	}, [store]);

	const resetStore = useCallback(() => {
		const newStore = Store.generateDefaultNewStore();
		setStore(newStore);
		saveStore(newStore);
	}, []);

	const reloadStore = useCallback(() => {
		const initialStore = setupStore();
		setStore(initialStore);
	}, []);

	const syncStore = useCallback(async (user: User, store: Store): Promise<boolean> => {
		try {
			const apiRoute = `/api/user/${user.getUserId()}/store/${store.getStoreId()}/get`;
			const result = await makeApiRequest('GET', apiRoute, {}, true);
			if (result.success === false) return false;
			saveStore(Store.fromPlainObject(result.data));
			reloadStore();
			return true;
		} catch (error) {
			console.error(error);
			return false;
		}
	}, [reloadStore]);

    const restockStore = useCallback(async (): Promise<string> => {
		if (!store) return "BAD_REQUEST";
		const localResult = restockStoreLocal();
		if (localResult === "SUCCESS") {
			// Terminate early before api call
			if (guestMode) {
				updateReduxStoreItemsAfterRestock();
				return "SUCCESS";
			}

			const apiResult = await restockStoreAPI();
			if (apiResult !== true) {
				syncStore(user, store);
				return apiResult.toString();
			}
			updateReduxStoreItemsAfterRestock();
			return "SUCCESS";
		}
		return localResult;
    }, [store, guestMode, user, restockStoreLocal, restockStoreAPI, updateReduxStoreItemsAfterRestock, syncStore]);


	const contextValue = useMemo(() => ({
        store: store!,
		resetStore,
		reloadStore,
		restockStore
    }), [store, resetStore, reloadStore, restockStore]);

    return (
        <StoreContext.Provider value={contextValue}>
            {children}
        </StoreContext.Provider>
    );
};
'use client'
import { StoreContext } from '@/hooks/contexts/StoreContext';
import { generateNewPlaceholderInventoryItem } from '@/models/items/PlaceholderItems';
import { InventoryTransactionResponse } from '@/models/itemStore/inventory/InventoryTransactionResponse';
import { ItemList } from '@/models/itemStore/ItemList';
import { Store } from '@/models/itemStore/store/Store';
import { loadStore, saveStore } from '@/utils/localStorage/store';
import React, { ReactNode, useEffect, useState } from 'react';

// Define props for the provider
interface StoreProviderProps {
    children: ReactNode;
}

export const StoreProvider = ({ children }: StoreProviderProps) => {
    const [store, setStore] = useState<Store | null>(null);

	function setupStore(): Store {
		let store = loadStore();
		console.log(store);
		if (!(store instanceof Store)) {
		  console.log('store not found, setting up');
		  store = new Store(0, "Test Store", 2, 1, 1, new ItemList(), new ItemList([
			generateNewPlaceholderInventoryItem('appleSeed', 100),
			generateNewPlaceholderInventoryItem('bananaSeed', 50),
			generateNewPlaceholderInventoryItem('coconutSeed', 25),
			generateNewPlaceholderInventoryItem('benchBlueprint', 10),
		  ]));
		  store.restockStore();
		  saveStore(store);
		}
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

	const resetStore = () => {
		const newStore = new Store(0, "Test Store", 2, 1, 1, new ItemList([
			generateNewPlaceholderInventoryItem('appleSeed', 100),
			generateNewPlaceholderInventoryItem('bananaSeed', 50),
			generateNewPlaceholderInventoryItem('coconutSeed', 25),
			generateNewPlaceholderInventoryItem('benchBlueprint', 10),
		  ]), new ItemList([
			generateNewPlaceholderInventoryItem('appleSeed', 100),
			generateNewPlaceholderInventoryItem('bananaSeed', 50),
			generateNewPlaceholderInventoryItem('coconutSeed', 25),
			generateNewPlaceholderInventoryItem('benchBlueprint', 10),
		  ]));
		setStore(newStore);
		saveStore(newStore);
	}

    return (
        <StoreContext.Provider value={{ store: store!, restockStore, resetStore }}>
            {children}
        </StoreContext.Provider>
    );
};
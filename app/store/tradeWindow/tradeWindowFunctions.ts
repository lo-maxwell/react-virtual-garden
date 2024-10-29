import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { Store } from "@/models/itemStore/store/Store";
import User from "@/models/user/User";
import { saveInventory } from "@/utils/localStorage/inventory";
import { saveStore } from "@/utils/localStorage/store";

export function buyItemLocal (store: Store, selectedItem: InventoryItem, quantity: number, inventory: Inventory) {
	const success = store.buyItemFromStore(inventory, selectedItem, quantity).isSuccessful();
    if (success) {
        saveStore(store);
		saveInventory(inventory);
    }
    return success;
}

export async function buyItemAPI (user: User, store: Store, selectedItem: InventoryItem, quantity: number, inventory: Inventory) {
	try {
		const data = {
			itemIdentifier: selectedItem.itemData.id, 
			purchaseQuantity: quantity, 
			inventoryId: inventory.getInventoryId()
		}
		// Making the PATCH request to your API endpoint
		const response = await fetch(`/api/user/${user.getUserId()}/store/${store.getStoreId()}/buy`, {
		  method: 'PATCH',
		  headers: {
			'Content-Type': 'application/json',
		  },
		  body: JSON.stringify(data), // Send the data in the request body
		});
  
		// Check if the response is successful
		if (!response.ok) {
		  throw new Error('Failed to purchase item');
		}
  
		// Parsing the response data
		const result = await response.json();
		console.log('Successfully purchased item:', result);
		
		return true;
	  } catch (error) {
		console.error(error);
		return false;
	  }
}

export function sellItemLocal (store: Store, selectedItem: InventoryItem, quantity: number, inventory: Inventory) {
	const success = store.sellItemToStore(inventory, selectedItem, quantity).isSuccessful();
    if (success) {
        saveStore(store);
		saveInventory(inventory);
    }
    return success;
}

export async function sellItemAPI (user: User, store: Store, selectedItem: InventoryItem, quantity: number, inventory: Inventory) {
	try {
		const data = {
			itemIdentifier: selectedItem.itemData.id, 
			sellQuantity: quantity, 
			inventoryId: inventory.getInventoryId()
		}
		// Making the PATCH request to your API endpoint
		const response = await fetch(`/api/user/${user.getUserId()}/store/${store.getStoreId()}/sell`, {
		  method: 'PATCH',
		  headers: {
			'Content-Type': 'application/json',
		  },
		  body: JSON.stringify(data), // Send the data in the request body
		});
  
		// Check if the response is successful
		if (!response.ok) {
		  throw new Error('Failed to sell item');
		}
  
		// Parsing the response data
		const result = await response.json();
		console.log('Successfully sold item:', result);
		return true;
	  } catch (error) {
		console.error(error);
		return false;
	  } finally {
	  }
}

export async function syncStoreAndInventory (user: User, store: Store, inventory: Inventory) {
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
		// Sync inventory data
        const inventoryResponse = await fetch(`/api/user/${user.getUserId()}/inventory/${inventory.getInventoryId()}/get`, {
			method: 'GET',
			headers: {
			  'Content-Type': 'application/json',
			}
		});
		if (!inventoryResponse.ok) {
		throw new Error('Failed to fetch inventory');
		}
		const inventoryResult = await inventoryResponse.json();
		saveInventory(Inventory.fromPlainObject(inventoryResult));
		Object.assign(inventory, Inventory.fromPlainObject(inventoryResult));
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
}
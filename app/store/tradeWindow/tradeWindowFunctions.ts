import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { Store } from "@/models/itemStore/store/Store";
import User from "@/models/user/User";
import { makeApiRequest } from "@/utils/api/api";
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
        const apiRoute = `/api/user/${user.getUserId()}/store/${store.getStoreId()}/buy`;
        const result = await makeApiRequest('PATCH', apiRoute, data, true);
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
        const apiRoute = `/api/user/${user.getUserId()}/store/${store.getStoreId()}/sell`;
        const result = await makeApiRequest('PATCH', apiRoute, data, true);
		console.log('Successfully sold item:', result);
		return true;
	  } catch (error) {
		console.error(error);
		return false;
	  } finally {
	  }
}

//TODO: Combine into 1 api call
export async function syncStoreAndInventory (user: User, store: Store, inventory: Inventory) {
	try {
        // Sync store data
        const storeApiRoute = `/api/user/${user.getUserId()}/store/${store.getStoreId()}/get`;
        const storeResult = await makeApiRequest('GET', storeApiRoute, {}, true);
		saveStore(Store.fromPlainObject(storeResult));
		Object.assign(store, Store.fromPlainObject(storeResult));

		// Sync inventory data
        const inventoryApiRoute = `/api/user/${user.getUserId()}/inventory/${inventory.getInventoryId()}/get`;
        const inventoryResult = await makeApiRequest('GET', inventoryApiRoute, {}, true);
		saveInventory(Inventory.fromPlainObject(inventoryResult));
		Object.assign(inventory, Inventory.fromPlainObject(inventoryResult));
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
}
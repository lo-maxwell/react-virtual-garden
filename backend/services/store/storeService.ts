import inventoryItemRepository from "@/backend/repositories/items/inventoryItem/inventoryItemRepository";
import storeItemRepository from "@/backend/repositories/items/inventoryItem/storeItemRepository";
import inventoryRepository from "@/backend/repositories/itemStore/inventory/inventoryRepository";
import storeRepository from "@/backend/repositories/itemStore/store/storeRepository";
import { InventoryItem, InventoryItemEntity } from "@/models/items/inventoryItems/InventoryItem";
import { generateNewPlaceholderInventoryItem } from "@/models/items/PlaceholderItems";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import { getItemClassFromSubtype } from "@/models/items/utility/classMaps";
import { stocklistFactory } from "@/models/itemStore/store/StocklistFactory";
import { Store } from "@/models/itemStore/store/Store";
import { storeFactory } from "@/models/itemStore/store/StoreFactory";
import { stringToBigIntNumber } from "@/models/utility/BigInt";
import { PoolClient } from "pg"
import { transactionWrapper } from "../utility/utility";
import { v4 as uuidv4 } from 'uuid';


export async function restockStore(storeId: string, client?: PoolClient): Promise<boolean> {
	//might want to fudge the timer a bit to allow for clock discrepancies, ie 1 second
	//Can put validation/business logic here
	//We always check based on current time
	const currentTime = Date.now();

	const innerFunction = async (client: PoolClient): Promise<boolean> => {
		// Grab all relevant objects concurrently
		const results = await Promise.allSettled([
			storeRepository.getStoreById(storeId)
		]);

		// Destructure the results for easier access
		const [storeResult] = results;

		// Check for errors in each promise and handle accordingly
		if (storeResult.status === 'rejected' || storeResult.value === null) {
			throw new Error(`Could not find store matching id ${storeId}`);
		}

		// Extract the resolved values
		const storeEntity = storeResult.value;
		
		//validate restock time

		const restockTime = stringToBigIntNumber(storeEntity.last_restock_time_ms);
		if (!restockTime) {
			throw new Error(`Error converting restockTime ${storeEntity.last_restock_time_ms} to number`);
		}

		const storeInterface = storeFactory.getStoreInterfaceById(storeEntity.identifier);
		if (!storeInterface) {
			throw new Error(`Cannot find store details matching identifier ${storeEntity.identifier}`);
		}

		
		const REAL_TIME_FUDGE = 10000; //Allow for 10s discrepancy between restock times

		//Check if restock is valid
		if (!Store.isRestockTime(restockTime - REAL_TIME_FUDGE, storeInterface.restockInterval, currentTime)) {
			// throw new Error(`Not time to restock store yet!`);
			console.warn(`Not time to restock store yet!`);
			return false;
		}

		//restock is OK
		//add all storeItems to store
		const stocklistInterface = stocklistFactory.getStocklistInterfaceById(storeInterface.stocklistId);
		if (!stocklistInterface) {
			throw new Error(`Cannot find stocklist matching id ${storeInterface.stocklistId}`);
		}
		const items = stocklistInterface.items;
		// Array to store all promises
		// Create inventory items
		const storeItemPromises: Promise<void>[] = [];
		items.getAllItems().forEach((item) => {
			const storeItemPromise = storeItemRepository.createOrRestockStoreItem(storeId, item, client)
				.then((storeItemResult) => {
					if (!storeItemResult) {
						throw new Error(`Error restocking store item ${item.itemData.id}`);
					}
				});
			storeItemPromises.push(storeItemPromise);
		});

		// Wait for all inventory item promises to resolve
		await Promise.allSettled(storeItemPromises); // Explicitly return void

		//update lastRestockTime
		await storeRepository.setStoreLastRestockTime(storeId, currentTime, client);
		return true;
	}

	// Call the transactionWrapper with the innerFunction and appropriate arguments
	return transactionWrapper(innerFunction, 'RestockStore', client);
}

/**
 * Attempts to buy an item from the store.
 * @storeId the id of the store to buy from
 * @itemIdentifier the identifier of the item purchased
 * @purchaseQuantity the amount being purchased
 * @inventory the id of the inventory to add the item to
 * @client if null, creates a new client
 * @returns the added inventoryItem, or throws error
 */
export async function buyItem(storeId: string, itemIdentifier: string, purchaseQuantity: number, inventoryId: string, client?: PoolClient): Promise<InventoryItemEntity> {
//TODO: Investigate locking between verification and transaction
//Should be consistent right now but can result in overbuying
	if (purchaseQuantity < 1) {
		throw new Error(`Error buying item: Must purchase at least 1 quantity`);
	}

	const innerFunction = async (client: PoolClient): Promise<InventoryItemEntity> => {
		// Grab all relevant objects concurrently
		const results = await Promise.allSettled([
			storeRepository.getStoreById(storeId),
			inventoryRepository.getInventoryById(inventoryId),
			storeItemRepository.getStoreItemByOwnerId(storeId, itemIdentifier)
		]);

		// Destructure the results for easier access
		const [storeResult, inventoryResult, storeItemResult] = results;

		// Check for errors in each promise and handle accordingly
		if (storeResult.status === 'rejected' || storeResult.value === null) {
			throw new Error(`Could not find store matching id ${storeId}`);
		}
		if (inventoryResult.status === 'rejected' || inventoryResult.value === null) {
			throw new Error(`Could not find inventory matching id ${inventoryId}`);
		}
		if (storeItemResult.status === 'rejected' || storeItemResult.value === null) {
			throw new Error(`Could not find storeItem matching owner ${storeId}, identifier ${itemIdentifier}`);
		}

		// Extract the resolved values
		const storeEntity = storeResult.value;
		const inventoryEntity = inventoryResult.value;
		const storeItemEntity = storeItemResult.value;

		const storeInterface = storeFactory.getStoreInterfaceById(storeEntity.identifier);
		if (!storeInterface) {
			throw new Error(`Cannot find store details matching identifier ${storeEntity.identifier}`);
		}

		const storeItemTemplate = placeholderItemTemplates.getInventoryTemplate(storeItemEntity.identifier);
		if (!storeItemTemplate) {
			throw new Error(`Cannot find storeItem matching identifier ${storeItemEntity.identifier}`);
		}
		
		//validate existence, quantity, gold amounts
		if (storeItemEntity.quantity < purchaseQuantity) {
			throw new Error(`Store lacks quantity for purchase: has ${storeItemEntity.quantity} but needs ${purchaseQuantity}`);
		}

		const totalCost = purchaseQuantity * storeItemTemplate.value * storeInterface.buyMultiplier;
		if (inventoryEntity.gold < totalCost) {
			throw new Error(`Inventory lacks gold for purchase: has ${inventoryEntity.gold} but needs ${totalCost}`);
		}

		const itemClass = getItemClassFromSubtype(storeItemTemplate);
		const newInventoryItem = new itemClass(uuidv4(), storeItemTemplate, purchaseQuantity);
		if (!(newInventoryItem instanceof InventoryItem)) {
			throw new Error(`Error constructing purchased item, found non inventoryItem`);
		}
		await inventoryRepository.updateInventoryGold(inventoryId, -1 * totalCost, client);
		const returnValue = await inventoryItemRepository.addInventoryItem(inventoryId, newInventoryItem, client);
		await storeItemRepository.updateStoreItemQuantity(storeItemEntity.id, -1 * purchaseQuantity, client);

		return returnValue;
	}

	// Call the transactionWrapper with the innerFunction and appropriate arguments
	return transactionWrapper(innerFunction, 'BuyItem', client);
}

/**
 * Attempts to sell an item to the store.
 * @storeId the id of the store to sell to
 * @itemIdentifier the identifier of the item sold
 * @sellQuantity the amount being sold
 * @inventoryId the id of the inventory to sell from
 * @client if null, creates a new client
 * @returns the added inventoryItem, or throws error
 */
export async function sellItem(storeId: string, itemIdentifier: string, sellQuantity: number, inventoryId: string, client?: PoolClient): Promise<InventoryItemEntity> {
	//TODO: Investigate locking between verification and transaction
	//Should be consistent right now but can result in overbuying
	if (sellQuantity < 1) {
		throw new Error(`Error selling item: Must sell at least 1 quantity`);
	}

	const innerFunction = async (client: PoolClient): Promise<InventoryItemEntity> => {
		// Grab all relevant objects concurrently
		const results = await Promise.allSettled([
			storeRepository.getStoreById(storeId),
			inventoryRepository.getInventoryById(inventoryId),
			inventoryItemRepository.getInventoryItemByOwnerId(inventoryId, itemIdentifier)
		]);

		// Destructure the results for easier access
		const [storeResult, inventoryResult, inventoryItemResult] = results;

		// Check for errors in each promise and handle accordingly
		if (storeResult.status === 'rejected' || storeResult.value === null) {
			throw new Error(`Could not find store matching id ${storeId}`);
		}
		if (inventoryResult.status === 'rejected' || inventoryResult.value === null) {
			throw new Error(`Could not find inventory matching id ${inventoryId}`);
		}
		if (inventoryItemResult.status === 'rejected' || inventoryItemResult.value === null) {
			throw new Error(`Could not find inventoryItem matching owner ${storeId}, identifier ${itemIdentifier}`);
		}

		// Extract the resolved values
		const storeEntity = storeResult.value;
		const inventoryEntity = inventoryResult.value;
		const inventoryItemEntity = inventoryItemResult.value;

		const storeInterface = storeFactory.getStoreInterfaceById(storeEntity.identifier);
		if (!storeInterface) {
			throw new Error(`Cannot find store details matching identifier ${storeEntity.identifier}`);
		}

		const inventoryItemTemplate = placeholderItemTemplates.getInventoryTemplate(inventoryItemEntity.identifier);
		if (!inventoryItemTemplate) {
			throw new Error(`Cannot find inventoryItem matching identifier ${inventoryItemEntity.identifier}`);
		}
		
		//validate existence, quantity, gold amounts
		if (inventoryItemEntity.quantity < sellQuantity) {
			throw new Error(`Inventory lacks quantity for sale: has ${inventoryItemEntity.quantity} but needs ${sellQuantity}`);
		}

		const totalCost = sellQuantity * inventoryItemTemplate.value * storeInterface.sellMultiplier;

		const itemClass = getItemClassFromSubtype(inventoryItemTemplate);
		const newInventoryItem = new itemClass(uuidv4(), inventoryItemTemplate, sellQuantity);
		if (!(newInventoryItem instanceof InventoryItem)) {
			throw new Error(`Error constructing sold item, found non inventoryItem`);
		
		}		
		const returnValue = await storeItemRepository.addStoreItem(storeId, newInventoryItem, client);
		await inventoryItemRepository.updateInventoryItemQuantity(inventoryItemEntity.id, -1 * sellQuantity, client);
		await inventoryRepository.updateInventoryGold(inventoryId, totalCost, client);

		return returnValue;
	}

	// Call the transactionWrapper with the innerFunction and appropriate arguments
	return transactionWrapper(innerFunction, 'SellItem', client);
}

/**
 * @returns a store plain object
 */
export async function getStoreFromDatabase(storeId: string, userId: string, client?: PoolClient): Promise<any> {
	const innerFunction = async (client: PoolClient) => {
		//Create store
		const storeResult = await storeRepository.getStoreById(storeId);
		// Check if result is valid
		if (!storeResult) {
			throw new Error(`Could not find the store for id ${storeId}`);
		}
		if (storeResult.owner !== userId) {
			throw new Error(`Invalid owner of store ${storeId}`);
		}
		const storeInstance = await storeRepository.makeStoreObject(storeResult);

		return storeInstance.toPlainObject();
	}
	// Call transactionWrapper with inner function and description
	return transactionWrapper(innerFunction, 'fetchStoreFromDatabase', client);
}
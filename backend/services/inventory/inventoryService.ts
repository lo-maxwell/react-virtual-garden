
import { invokeLambda, parseRows } from "@/backend/lambda/invokeLambda";
import inventoryItemRepository from "@/backend/repositories/items/inventoryItem/inventoryItemRepository";
import inventoryRepository from "@/backend/repositories/itemStore/inventory/inventoryRepository";
import { InventoryItemEntity } from "@/models/items/inventoryItems/InventoryItem";
import { Inventory, InventoryEntity } from "@/models/itemStore/inventory/Inventory";
import { InventoryItemList } from "@/models/itemStore/InventoryItemList";
import assert from "assert";
import { PoolClient } from "pg";
import { transactionWrapper } from "../utility/utility";

/**
 * Inserts a inventory into the database. Does nothing if a inventory with the same id/owner userId already exists.
 * @param inventory
 * @param userId
 * @param client
 */
 export async function createInventoryInDatabase(inventory: Inventory, userId: string, client?: PoolClient): Promise<boolean> {
	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			const inventoryItemList = inventory.getAllItems();

			const payload = {
				"queries": [
					{
						"tableName": "inventories",
						"columnsToWrite": [
							"id", 
							"owner", 
							"gold"
						],
						"values": [
							[
								inventory.getInventoryId(),
								userId,
								inventory.getGold()
							  ]
						],
						"conflictColumns": [
							"id"
						],
						"returnColumns": [
							"id"
						]
					}
				]
			};
			const insert_item_values: any = [];
			inventoryItemList.forEach((item) => {
				const toInsert = [
					item.getInventoryItemId(),
					inventory.getInventoryId(),
					item.itemData.id,
					item.getQuantity()
				]
				insert_item_values.push(toInsert);
			})
			if (insert_item_values.length > 0) {
				const inventoryItemInsertQuery = {
					"tableName": "inventory_items",
					"columnsToWrite": [
						"id", "owner", "identifier", "quantity"
					],
					"values": insert_item_values,
					"conflictColumns": [
						"owner",
						"identifier"
					],
					"returnColumns": [
						"id"
					]
				};
				payload.queries.push(inventoryItemInsertQuery);
			}

			const insertResult = await invokeLambda('garden-insert', payload);
			// Check if result is valid
			if (!insertResult) {
				throw new Error(`Error executing creation of inventory ${inventory.getInventoryId()}`);
			}
			const inventoryResult = parseRows<string[]>(insertResult[0]);
			const inventoryItemResult = insert_item_values.length > 0 ? parseRows<string[]>(insertResult[1]) : [];

			// Check for discrepancies
			if (inventoryResult.length !== 1) {
				console.warn(`Expected 1 inventory to be created, but got ${inventoryResult.length}`);
			}
			if (inventoryItemResult.length !== insert_item_values.length) {
				console.warn(`Expected ${insert_item_values.length} inventory item ids to be returned, but got ${inventoryItemResult.length}`);
			}
			return true;
		} catch (error) {
			console.error('Error creating inventory from Lambda:', error);
			throw error;
		}
	} else {
		// Array to store all promises
		const allPromises: Promise<void>[] = [];
		// Create inventory and inventory items concurrently
		const inventoryResultPromise = inventoryRepository.createInventory(userId, inventory, client)
			.then(async (inventoryResult) => {
				if (!inventoryResult) {
					throw new Error('There was an error creating the inventory');
				}

				// Create inventory items
				const inventoryItemPromises: Promise<void>[] = [];
				const inventoryItems = inventory.getAllItems();
				inventoryItems.forEach((item) => {
					const inventoryItemPromise = inventoryItemRepository.createInventoryItem(inventory.getInventoryId(), item, client)
						.then((inventoryItemResult) => {
							if (!inventoryItemResult) {
								throw new Error(`Error creating inventory item for item ${item.itemData.id}`);
							}
						});
					inventoryItemPromises.push(inventoryItemPromise);
				});

				await Promise.allSettled(inventoryItemPromises);
			})
			.catch((error) => {
				console.error('Error creating inventory or inventory items:', error);
			});

		allPromises.push(inventoryResultPromise);

		// Wait for all promises to resolve
		await Promise.allSettled(allPromises);

		return true;
	}
}


/**
 * Update an inventory in the database, or create a new entry if it does not exist
 * @param inventory
 * @param userId
 * @param client
 */
 export async function upsertInventoryInDatabase(inventory: Inventory, userId: string, client?: PoolClient): Promise<boolean> {
	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			const inventoryItemList = inventory.getAllItems();

			const payload = {
				"queries": [
					{
						"tableName": "inventories",
						"columnsToWrite": [
							"id", 
							"owner", 
							"gold"
						],
						"values": [
							[
								inventory.getInventoryId(),
								userId,
								inventory.getGold()
							  ]
						],
						"conflictColumns": [
							"id"
						],
						"updateQuery": {
							"values": {
								"gold": {
									"excluded": true
								}
							},
							"conditions": {
								"owner": {
									"operator": "=",
									"value": userId
								}
							}
						},
						"returnColumns": [
							"id"
						]
					}
				]
			};
			const insert_item_values: any = [];
			inventoryItemList.forEach((item) => {
				const toInsert = [
					item.getInventoryItemId(),
					inventory.getInventoryId(),
					item.itemData.id,
					item.getQuantity()
				]
				insert_item_values.push(toInsert);
			})
			if (insert_item_values.length > 0) {
				const inventoryItemInsertQuery: any = {
					"tableName": "inventory_items",
					"columnsToWrite": [
						"id", "owner", "identifier", "quantity"
					],
					"values": insert_item_values,
					"conflictColumns": [
						"owner",
						"identifier"
					],
					"updateQuery": {
						"values": {
							"identifier": {
								"excluded": true
							},
							"quantity": {
								"excluded": true
							}
						},
						"conditions": {}
					},
					"returnColumns": [
						"id"
					]
				};
				payload.queries.push(inventoryItemInsertQuery);
			}

			const insertResult = await invokeLambda('garden-insert', payload);
			// Check if result is valid
			if (!insertResult) {
				throw new Error(`Error executing upsert of inventory ${inventory.getInventoryId()}`);
			}
			const inventoryResult = parseRows<string[]>(insertResult[0]);
			const inventoryItemResult = insert_item_values.length > 0 ? parseRows<string[]>(insertResult[1]) : [];

			// Check for discrepancies
			if (inventoryResult.length !== 1) {
				console.warn(`Expected 1 inventory to be upserted, but got ${inventoryResult.length}`);
			}
			if (inventoryItemResult.length !== insert_item_values.length) {
				console.warn(`Expected ${insert_item_values.length} inventory item ids to be returned, but got ${inventoryItemResult.length}`);
			}
			return true;
		} catch (error) {
			console.error('Error upserting inventory from Lambda:', error);
			throw error;
		}
	} else {
		// Array to store all promises
		const allPromises: Promise<void>[] = [];
		// Create inventory and inventory items concurrently
		const inventoryResultPromise = inventoryRepository.createOrUpdateInventory(userId, inventory, client)
			.then(async (inventoryResult) => {
				if (!inventoryResult) {
					throw new Error('There was an error creating the inventory');
				}

				// Create inventory items
				const inventoryItemPromises: Promise<void>[] = [];
				const inventoryItems = inventory.getAllItems();
				inventoryItems.forEach((item) => {
					const inventoryItemPromise = inventoryItemRepository.createOrUpdateInventoryItem(inventory.getInventoryId(), item, client)
						.then((inventoryItemResult) => {
							if (!inventoryItemResult) {
								throw new Error(`Error creating inventory item for item ${item.itemData.id}`);
							}
						});
					inventoryItemPromises.push(inventoryItemPromise);
				});

				await Promise.allSettled(inventoryItemPromises);
			})
			.catch((error) => {
				console.error('Error creating inventory or inventory items:', error);
			});

		allPromises.push(inventoryResultPromise);

		// Wait for all promises to resolve
		await Promise.allSettled(allPromises);

		return true;
	}
}

/**
 * @returns an inventory plain object
 */
export async function getInventoryFromDatabase(inventoryId: string, userId: string, client?: PoolClient): Promise<any> {
	if (process.env.USE_DATABASE === 'LAMBDA') { //TODO: TEST
		try {

			// 'SELECT id, owner, gold FROM inventories WHERE id = $1 AND owner = $2'
			// 'SELECT id, owner, identifier, quantity FROM inventory_items WHERE owner = $1'
			const payload = {
				"queries": [
					{
						"returnColumns": [
							"id",
							"owner",
							"gold"
						],
						"tableName": "inventories",
						"conditions": {
							"id": {
							"operator": "=",
							"value": inventoryId
							},
							"owner": {
								"operator": "=",
								"value": userId
								}
						},
						"limit": 1
					},
					{
						"returnColumns": [
							"id",
							"owner",
							"identifier",
							"quantity"
						],
						"tableName": "inventory_items",
						"conditions": {
							"owner": {
								"operator": "=",
								"value": inventoryId
								}
						},
						"limit": 1000
					}
				]
			  }
			const queryResult = await invokeLambda('garden-select', payload);
			const inventoryResult = queryResult[0];
			let inventoryItemsResult = queryResult[1];
			// Check if result is valid
			if (!inventoryResult) {
				throw new Error(`Could not find inventory for inventory id ${inventoryId}`);
			}
			const inventoryEntityResult = parseRows<InventoryEntity[]>(inventoryResult)[0];
			assert(inventoryRepository.validateInventoryEntity(inventoryEntityResult));

			let inventoryItems: InventoryItemList | null;
			if (!inventoryItemsResult) {
				console.error(`Error parsing inventoryItems for inventory id ${inventoryId}`);
				inventoryItems = null;
			} else {
				inventoryItems = inventoryItemRepository.makeInventoryItemObjectBatch(parseRows<InventoryItemEntity[]>(inventoryItemsResult));
			}
			const inventoryInstance = await inventoryRepository.makeInventoryObject(inventoryEntityResult, inventoryItems);
			return inventoryInstance.toPlainObject();
		} catch (error) {
			console.error('Error fetching inventory from Lambda:', error);
			throw error;
		}
	} else {
		const innerFunction = async (client: PoolClient) => {
			//Create inventory
			const inventoryResult = await inventoryRepository.getInventoryById(inventoryId);
			// Check if result is valid
			if (!inventoryResult) {
				throw new Error(`Could not find the inventory for id ${inventoryId}`);
			}
			if (inventoryResult.owner !== userId) {
				throw new Error(`Invalid owner of inventory ${inventoryId}`);
			}
			const inventoryItemList = await inventoryRepository.getInventoryItems(inventoryResult.id);
			const inventoryInstance = await inventoryRepository.makeInventoryObject(inventoryResult, inventoryItemList);

			return inventoryInstance.toPlainObject();
		}
		// Call transactionWrapper with inner function and description
		return transactionWrapper(innerFunction, 'fetchInventoryFromDatabase', client);
	}
}

/**
 * Fetch the inventory Entity from database. If it cannot be found, throws an error.
 * @param inventoryId - the id of the inventory to fetch
 * @param userId - the id of the owner of the inventory
 * @param client - optional poolclient
 * @returns - Promise<InventoryEntity> of the fetched inventory
 */
export async function getInventoryEntity(inventoryId: string, userId: string, client?: PoolClient): Promise<InventoryEntity> {
	if (process.env.USE_DATABASE === 'LAMBDA') { //TODO: TEST
		try {

			// 'SELECT id, owner, gold FROM inventories WHERE id = $1 AND owner = $2'
			const payload = {
				"queries": [
					{
						"returnColumns": [
							"id",
							"owner",
							"gold"
						],
						"tableName": "inventories",
						"conditions": {
							"id": {
							"operator": "=",
							"value": inventoryId
							},
							"owner": {
								"operator": "=",
								"value": userId
								}
						},
						"limit": 1
					}
				]
			  }
			const queryResult = await invokeLambda('garden-select', payload);
			const inventoryResult = queryResult[0];
			// Check if result is valid
			if (!inventoryResult) {
				throw new Error(`Could not find inventory for inventory id ${inventoryId}`);
			}
			const inventoryEntityResult = parseRows<InventoryEntity[]>(inventoryResult)[0];
			assert(inventoryRepository.validateInventoryEntity(inventoryEntityResult));
			return inventoryEntityResult;

		} catch (error) {
			console.error('Error fetching inventory from Lambda:', error);
			throw error;
		}
	} else {
		const innerFunction = async (client: PoolClient) => {
			//Create inventory
			const inventoryResult = await inventoryRepository.getInventoryById(inventoryId);
			// Check if result is valid
			if (!inventoryResult) {
				throw new Error(`Could not find the inventory for id ${inventoryId}`);
			}
			if (inventoryResult.owner !== userId) {
				throw new Error(`Invalid owner of inventory ${inventoryId}`);
			}
			return inventoryResult;
		}
		// Call transactionWrapper with inner function and description
		return transactionWrapper(innerFunction, 'fetchInventoryFromDatabase', client);
	}
}

export async function updateGold(inventoryId: string, userId: string, goldDelta: number, blockNegativeBalance: boolean = true, client?: PoolClient): Promise<InventoryEntity> {
	if (process.env.USE_DATABASE === 'LAMBDA') { //TODO: TEST
		try {

			const inventoryEntity = await getInventoryEntity(inventoryId, userId, client);
			// Check if result is valid
			if (!inventoryEntity) {
				throw new Error(`Could not find inventory for inventory id ${inventoryId}`);
			}
			assert(inventoryRepository.validateInventoryEntity(inventoryEntity));

			let currentGold = inventoryEntity.gold;
			if (blockNegativeBalance && goldDelta < 0 && currentGold + goldDelta < 0) {
				throw new Error(`Cannot have negative balance`);
			}

			const update_payload = {
				"queries": [
					{
						"tableName": "inventories",
						"values": {
							"gold": {
								"operator": "+",
								"value": goldDelta
							  }
						},
						"returnColumns": [
							"id",
							"owner",
							"gold"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": inventoryId
							},
							"owner": {
								"operator": "=",
								"value": userId
							}
						}
					}
				]
			  }
			const updateQueryResult = await invokeLambda('garden-update', update_payload);
			if (!updateQueryResult) {
				throw new Error(`Could not update inventory ${inventoryId}`);
			}
			const inventoryEntityResult = parseRows<InventoryEntity[]>(updateQueryResult[0])[0];
			assert(inventoryRepository.validateInventoryEntity(inventoryEntityResult));
			return inventoryEntityResult;
		} catch (error) {
			console.error('Error updating gold from Lambda:', error);
			throw error;
		}
	} else {
		const innerFunction = async (client: PoolClient) => {
			//Create inventory
			const inventoryResult = await inventoryRepository.getInventoryById(inventoryId);
			// Check if result is valid
			if (!inventoryResult) {
				throw new Error(`Could not find the inventory for id ${inventoryId}`);
			}
			if (inventoryResult.owner !== userId) {
				throw new Error(`Invalid owner of inventory ${inventoryId}`);
			}
			if (blockNegativeBalance && goldDelta < 0 && inventoryResult.gold + goldDelta < 0) {
				throw new Error(`Cannot have negative balance`);
			}
			const updatedInventoryEntity = await inventoryRepository.updateInventoryGold(inventoryId, goldDelta, client);

			return updatedInventoryEntity;
		}
		// Call transactionWrapper with inner function and description
		return transactionWrapper(innerFunction, 'updateGold', client);
	}
}
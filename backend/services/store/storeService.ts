import inventoryItemRepository from "@/backend/repositories/items/inventoryItem/inventoryItemRepository";
import storeItemRepository from "@/backend/repositories/items/inventoryItem/storeItemRepository";
import inventoryRepository from "@/backend/repositories/itemStore/inventory/inventoryRepository";
import storeRepository from "@/backend/repositories/itemStore/store/storeRepository";
import { InventoryItem, InventoryItemEntity, StoreItemEntity } from "@/models/items/inventoryItems/InventoryItem";
import { generateInventoryItem } from "@/models/items/ItemFactory";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { getItemClassFromSubtype } from "@/models/items/utility/itemClassMaps";
import { stocklistFactory } from "@/models/itemStore/store/StocklistFactory";
import { Store, StoreEntity } from "@/models/itemStore/store/Store";
import { storeFactory } from "@/models/itemStore/store/StoreFactory";
import { stringToBigIntNumber } from "@/models/utility/BigInt";
import { PoolClient } from "pg"
import { transactionWrapper } from "../utility/utility";
import { v4 as uuidv4 } from 'uuid';
import { invokeLambda, parseRows } from "@/backend/lambda/invokeLambda";
import assert from "assert";
import { InventoryItemList } from "@/models/itemStore/InventoryItemList";
import { ItemTemplate } from "@/models/items/templates/models/ItemTemplate";
import { InventoryEntity } from "@/models/itemStore/inventory/Inventory";


/**
 * Inserts a store into the database. Does nothing if a store with the same id/owner userId already exists.
 * @param store
 * @param userId
 * @param client
 */
 export async function createStoreInDatabase(store: Store, userId: string, client?: PoolClient): Promise<boolean> {
	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			const storeItemList = store.getAllItems();

			const payload = {
				"queries": [
					{
						"tableName": "stores",
						"columnsToWrite": [
							"id", "owner", "identifier", "last_restock_time_ms"
						],
						"values": [
							[
								store.getStoreId(),
								userId,
								store.getStoreIdentifier(),
								store.getLastRestockTime()
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
			storeItemList.forEach((item) => {
				const toInsert = [
					item.getInventoryItemId(),
					store.getStoreId(),
					item.itemData.id,
					item.getQuantity()
				]
				insert_item_values.push(toInsert);
			})
			if (insert_item_values.length > 0) {
				const storeItemInsertQuery = {
					"tableName": "store_items",
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
				payload.queries.push(storeItemInsertQuery);
			}

			const insertResult = await invokeLambda('garden-insert', payload);
			// Check if result is valid
			if (!insertResult) {
				throw new Error(`Error executing creation of store ${store.getStoreId()}`);
			}
			const storeResult = parseRows<string[]>(insertResult[0]);
			const storeItemResult = insert_item_values.length > 0 ? parseRows<string[]>(insertResult[1]) : [];

			// Check for discrepancies
			if (storeResult.length !== 1) {
				console.warn(`Expected 1 store to be created, but got ${storeResult.length}`);
			}
			if (storeItemResult.length !== insert_item_values.length) {
				console.warn(`Expected ${insert_item_values.length} store item ids to be returned, but got ${storeItemResult.length}`);
			}
			return true;
		} catch (error) {
			console.error('Error creating store from Lambda:', error);
			throw error;
		}
	} else {
		// Array to store all promises
		const allPromises: Promise<void>[] = [];

		// Create store and store items concurrently
		const storeResultPromise = storeRepository.createStore(userId, store, client)
			.then(async (storeResult) => {
				if (!storeResult) {
					throw new Error('There was an error creating the store');
				}

				// Create store items
				const storeItemPromises: Promise<void>[] = [];
				const storeItems = store.getAllItems();
				storeItems.forEach((item) => {
					const storeItemPromise = storeItemRepository.createStoreItem(store.getStoreId(), item, client)
						.then((storeItemResult) => {
							if (!storeItemResult) {
								throw new Error(`Error creating store item for item ${item.itemData.id}`);
							}
						});
					storeItemPromises.push(storeItemPromise);
				});

				await Promise.allSettled(storeItemPromises);
			})
			.catch((error) => {
				console.error('Error creating store or store items:', error);
			});

		allPromises.push(storeResultPromise);
		// Wait for all promises to resolve
		await Promise.allSettled(allPromises);

		return true;
	}
}


/**
 * Updates a store into the database, or creates a new entry if it does not exist
 * @param store
 * @param userId
 * @param client
 */
 export async function upsertStoreInDatabase(store: Store, userId: string, client?: PoolClient): Promise<boolean> {
	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			const storeItemList = store.getAllItems();

			const payload = {
				"queries": [
					{
						"tableName": "stores",
						"columnsToWrite": [
							"id", "owner", "identifier", "last_restock_time_ms"
						],
						"values": [
							[
								store.getStoreId(),
								userId,
								store.getStoreIdentifier(),
								store.getLastRestockTime()
							  ]
						],
						"conflictColumns": [
							"id"
						],
						"updateQuery": {
							"values": {
								"identifier": store.getStoreIdentifier(),
								"last_restock_time_ms": store.getLastRestockTime()
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
			storeItemList.forEach((item) => {
				const toInsert = [
					item.getInventoryItemId(),
					store.getStoreId(),
					item.itemData.id,
					item.getQuantity()
				]
				insert_item_values.push(toInsert);
			})
			if (insert_item_values.length > 0) {
				const storeItemInsertQuery: any = {
					"tableName": "store_items",
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
				payload.queries.push(storeItemInsertQuery);
			}

			const insertResult = await invokeLambda('garden-insert', payload);
			// Check if result is valid
			if (!insertResult) {
				throw new Error(`Error executing upsert of store ${store.getStoreId()}`);
			}
			const storeResult = parseRows<string[]>(insertResult[0]);
			const storeItemResult = insert_item_values.length > 0 ? parseRows<string[]>(insertResult[1]) : [];

			// Check for discrepancies
			if (storeResult.length !== 1) {
				console.warn(`Expected 1 store to be upserted, but got ${storeResult.length}`);
			}
			if (storeItemResult.length !== insert_item_values.length) {
				console.warn(`Expected ${insert_item_values.length} store item ids to be returned, but got ${storeItemResult.length}`);
			}
			return true;
		} catch (error) {
			console.error('Error upserting store from Lambda:', error);
			throw error;
		}
	} else {
		// Array to store all promises
		const allPromises: Promise<void>[] = [];

		// Create store and store items concurrently
		const storeResultPromise = storeRepository.createOrUpdateStore(userId, store, client)
			.then(async (storeResult) => {
				if (!storeResult) {
					throw new Error('There was an error creating the store');
				}

				// Create store items
				const storeItemPromises: Promise<void>[] = [];
				const storeItems = store.getAllItems();
				storeItems.forEach((item) => {
					const storeItemPromise = storeItemRepository.createOrUpdateStoreItem(store.getStoreId(), item, client)
						.then((storeItemResult) => {
							if (!storeItemResult) {
								throw new Error(`Error creating store item for item ${item.itemData.id}`);
							}
						});
					storeItemPromises.push(storeItemPromise);
				});

				await Promise.allSettled(storeItemPromises);
			})
			.catch((error) => {
				console.error('Error creating store or store items:', error);
			});

		allPromises.push(storeResultPromise);
		// Wait for all promises to resolve
		await Promise.allSettled(allPromises);

		return true;
	}
}

//TODO: Make this validate userId/owner ??
export async function restockStore(storeId: string, userId: string, client?: PoolClient): Promise<boolean> {
	//might want to fudge the timer a bit to allow for clock discrepancies, ie 1 second
	//Can put validation/business logic here
	//We always check based on current time
	const currentTime = Date.now();
	function restockIsValid(storeEntity: StoreEntity): boolean {
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
		return true;
	}

	function getStockList(storeEntity: StoreEntity): InventoryItemList {
		const storeInterface = storeFactory.getStoreInterfaceById(storeEntity.identifier);
		if (!storeInterface) {
			throw new Error(`Cannot find store details matching identifier ${storeEntity.identifier}`);
		}

		const stocklistInterface = stocklistFactory.getStocklistInterfaceById(storeInterface.stocklistId);
		if (!stocklistInterface) {
			throw new Error(`Cannot find stocklist matching id ${storeInterface.stocklistId}`);
		}
		const items = stocklistInterface.items;
		if (items.size() < 1) {
			throw new Error(`Invalid stocklist, no items found`);
		}
		return items;
	}

	//TODO: Check if we can trim this by fetching items in 1 query
	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			//Fetch data
			// 'SELECT id, owner, identifier, last_restock_time_ms FROM stores WHERE id = $1 AND owner = $2
			const fetch_payload = {
				"queries": [
					{
						"returnColumns": [
							"id",
							"owner",
							"identifier",
							"last_restock_time_ms"
						],
						"tableName": "stores",
						"conditions": {
							"id": {
								"operator": "=",
								"value": storeId
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
			const fetchResult = await invokeLambda('garden-select', fetch_payload);
			const storeEntity = parseRows<StoreEntity[]>(fetchResult[0])[0];

			assert(storeRepository.validateStoreEntity(storeEntity));

			// Validate restock time
			if (!restockIsValid(storeEntity)) return false;

			//restock is OK
			const items = getStockList(storeEntity);

			//Get all stocklist items currently in the store to see what needs to be restocked
			const storeItemFetchQueries: Object[] = [];
			items.getAllItems().forEach((item) => {
				const fetchItemPayload = {
					"returnColumns": [
						"id",
						"owner",
						"identifier",
						"quantity"
					],
					"tableName": "store_items",
					"conditions": {
						"owner": {
							"operator": "=",
							"value": storeId
						},
						"identifier": {
							"operator": "=",
							"value": item.itemData.id
						}
					},
					"limit": 1
				}
				storeItemFetchQueries.push(fetchItemPayload);
			});

			const storeItemQueryPayload = {
				"queries": storeItemFetchQueries
			}
			const fetchItemsResult = await invokeLambda('garden-select', storeItemQueryPayload);
			let storeItemMap: Record<string, number> = {}
			fetchItemsResult.forEach((result: any) => {
				const parsedResult = (parseRows<StoreItemEntity[]>(result));
				if (!Array.isArray(parsedResult) || parsedResult.length == 0) {
					return;
				}
				storeItemMap[parsedResult[0].identifier] = parsedResult[0].quantity;
			})

			const insert_queries: Object[] = [];
			const update_queries: Object[] = [];
			items.getAllItems().forEach((item) => {
				if (storeItemMap.hasOwnProperty(item.itemData.id)) {
					//already exists, check if quantity is sufficient
					if (storeItemMap[item.itemData.id] >= item.getQuantity()) {
						return;
					}
					//Set quantity to stocklist quantity
					const updateItemPayload = {
						"tableName": "store_items",
						"values": {
						  "quantity": item.getQuantity()
						},
						"returnColumns": [
						  "id",
						  "owner",
						  "identifier",
						  "quantity"
						],
						"conditions": {
						  "owner": {
							"operator": "=",
							"value": storeId
						  },
						  "identifier": {
							"operator": "=",
							"value": item.itemData.id
						  }
						}
					  }
					update_queries.push(updateItemPayload);
				} else {
					//create new
					const insertItemPayload = {
						"tableName": "store_items",
						"columnsToWrite": [
						  "owner",
						  "identifier",
						  "quantity"
						],
						"values": [
						  [
							storeId,
							item.itemData.id,
							item.getQuantity()
						  ]
						],
						"conflictColumns": [
						  "owner",
						  "identifier"
						],
						"returnColumns": [
						  "id",
						  "owner",
						  "identifier",
						  "quantity"
						]
					  }
					insert_queries.push(insertItemPayload);
				}
			});

			update_queries.push({
				"tableName": "stores",
				"values": {
				  "last_restock_time_ms": currentTime
				},
				"returnColumns": [
				  "id"
				],
				"conditions": {
				  "id": {
					"operator": "=",
					"value": storeId
				  },
				  "owner": {
					"operator": "=",
					"value": userId
				  }
				}
			  })

			//Push changes

			if (insert_queries.length > 0) {
				const insert_payload = {
					"queries": insert_queries
				};
				const insertResult = await invokeLambda('garden-insert', insert_payload);
			}
			
			if (update_queries.length > 0) {
				const update_payload = {
					"queries": update_queries
				};
				const updateResult = await invokeLambda('garden-update', update_payload);
			}
			

			return true;
		} catch (error) {
			console.error('Error restocking store with Lambda:', error);
			throw error;
		}
	} else {
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
			if (!restockIsValid(storeEntity)) return false;

			//restock is OK
			const items = getStockList(storeEntity);

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
export async function buyItem(storeId: string, userId: string, itemIdentifier: string, purchaseQuantity: number, inventoryId: string, client?: PoolClient): Promise<InventoryItemEntity> {
//TODO: Investigate locking between verification and transaction
//Should be consistent right now but can result in overbuying
	if (purchaseQuantity < 1) {
		throw new Error(`Error buying item: Must purchase at least 1 quantity`);
	}

	//Validates store template, item template, quantity, inventory able to purchase item
	//Returns cost of purchase and an item representing the purchased item
	function getCostAndItem(storeEntity: StoreEntity, inventoryEntity: InventoryEntity, storeItemEntity: StoreItemEntity) {
		const storeInterface = storeFactory.getStoreInterfaceById(storeEntity.identifier);
		if (!storeInterface) {
			throw new Error(`Cannot find store details matching identifier ${storeEntity.identifier}`);
		}

		const storeItemTemplate = itemTemplateFactory.getInventoryTemplateById(storeItemEntity.identifier);
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
		return {totalCost: totalCost, newItem: newInventoryItem};
	}

	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			//SELECT
			const fetch_payload = {
				"queries": [
					{
						"returnColumns": [
							"id",
							"owner",
							"identifier",
							"last_restock_time_ms"
						],
						"tableName": "stores",
						"conditions": {
							"id": {
								"operator": "=",
								"value": storeId
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
						"tableName": "store_items",
						"conditions": {
							"owner": {
								"operator": "=",
								"value": storeId
							},
							"identifier": {
								"operator": "=",
								"value": itemIdentifier
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
							},
							"identifier": {
								"operator": "=",
								"value": itemIdentifier
							}
						},
						"limit": 1
					}
				]
			};
			const fetchResult = await invokeLambda('garden-select', fetch_payload);
			const storeEntity = parseRows<StoreEntity[]>(fetchResult[0])[0];
			const inventoryEntity = parseRows<InventoryEntity[]>(fetchResult[1])[0];
			const storeItemEntity = parseRows<StoreItemEntity[]>(fetchResult[2])[0];
			const inventoryItemEntityList = parseRows<InventoryItemEntity[]>(fetchResult[3]);

			assert(storeRepository.validateStoreEntity(storeEntity));
			assert(inventoryRepository.validateInventoryEntity(inventoryEntity));
			assert(storeItemRepository.validateStoreItemEntity(storeItemEntity));

			const inventoryItemEntity = (Array.isArray(inventoryItemEntityList) && inventoryItemEntityList.length > 0) ? inventoryItemEntityList[0] : null;
			if (inventoryItemEntity) assert(inventoryItemRepository.validateInventoryItemEntity(inventoryItemEntity));
			
			const {totalCost, newItem} = getCostAndItem(storeEntity, inventoryEntity, storeItemEntity);
			let returnItem = null;
			//Only if the item does not exist on user inventory yet
			if (!inventoryItemEntity) {
				const insert_payload = {
					"queries": [
						{
							"tableName": "inventory_items",
							"columnsToWrite": [
							  "owner",
							  "identifier",
							  "quantity"
							],
							"values": [
							  [
								inventoryId,
								newItem.itemData.id,
								newItem.getQuantity()
							  ]
							],
							"conflictColumns": [
							  "owner",
							  "identifier"
							],
							"returnColumns": [
							  "id",
							  "owner",
							  "identifier",
							  "quantity"
							]
						  }
					]
				};
				const insertResult = await invokeLambda('garden-insert', insert_payload);
				returnItem = parseRows<InventoryItemEntity[]>(insertResult[0])[0];
			}

			//If the item already exists, as well as updating the store contents and inventory gold
			const update_queries = [];
			update_queries.push({
				"tableName": "store_items",
				"values": {
				  "quantity": {
					"operator": "-",
					"value": purchaseQuantity
				  }
				},
				"returnColumns": [
				  "id"
				],
				"conditions": {
				  "owner": {
					"operator": "=",
					"value": storeId
				  },
				  "identifier": {
					"operator": "=",
					"value": storeItemEntity.identifier
				  }
				}
			  });
			update_queries.push({
				"tableName": "inventories",
				"values": {
					"gold": {
						"operator": "-",
						"value": totalCost
					}
				},
				"returnColumns": [
					"id"
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
			});
			if (inventoryItemEntity) {
				update_queries.push({
					"tableName": "inventory_items",
					"values": {
						"quantity": {
							"operator": "+",
							"value": purchaseQuantity
						  }
					},
					"returnColumns": [
						"id",
						"owner",
						"identifier",
						"quantity"
					],
					"conditions": {
						"owner": {
							"operator": "=",
							"value": inventoryId
						},
						"identifier": {
							"operator": "=",
							"value": inventoryItemEntity.identifier
						}
					}
				});
			}
			const update_payload = {
				"queries": update_queries
			};
			const updateResult = await invokeLambda('garden-update', update_payload);
			if (inventoryItemEntity) {
				returnItem = parseRows<InventoryItemEntity[]>(updateResult[2])[0];
			}
			assert(inventoryItemRepository.validateInventoryItemEntity(returnItem));

			//Return the modified inventoryitem -- make sure to grab the correct one of insert/update with return values
			return returnItem!;
		} catch (error) {
			console.error('Error fetching store from Lambda:', error);
			throw error;
		}
	} else {

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

			const {totalCost, newItem} = getCostAndItem(storeEntity, inventoryEntity, storeItemEntity);

			await inventoryRepository.updateInventoryGold(inventoryId, -1 * totalCost, client);
			const returnValue = await inventoryItemRepository.addInventoryItem(inventoryId, newItem, client);
			await storeItemRepository.updateStoreItemQuantity(storeItemEntity.id, -1 * purchaseQuantity, client);

			return returnValue;
		}

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'BuyItem', client);
	}
}

/**
 * Attempts to sell an item to the store.
 * @storeId the id of the store to sell to
 * @itemIdentifier the identifier of the item sold
 * @sellQuantity the amount being sold
 * @inventoryId the id of the inventory to sell from
 * @client if null, creates a new client
 * @returns the added storeItem, or throws error
 */
export async function sellItem(storeId: string, userId: string, itemIdentifier: string, sellQuantity: number, inventoryId: string, client?: PoolClient): Promise<StoreItemEntity> {
	//TODO: Investigate locking between verification and transaction
	//Should be consistent right now but can result in overbuying
	if (sellQuantity < 1) {
		throw new Error(`Error selling item: Must sell at least 1 quantity`);
	}


	//Validates store template, item template, quantity, inventory able to purchase item
	//Returns cost of purchase and an item representing the purchased item
	function getCostAndItem(storeEntity: StoreEntity, inventoryEntity: InventoryEntity, inventoryItemEntity: InventoryItemEntity) {
		const storeInterface = storeFactory.getStoreInterfaceById(storeEntity.identifier);
		if (!storeInterface) {
			throw new Error(`Cannot find store details matching identifier ${storeEntity.identifier}`);
		}

		const inventoryItemTemplate = itemTemplateFactory.getInventoryTemplateById(inventoryItemEntity.identifier);
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
		return {totalCost: totalCost, newItem: newInventoryItem};
	}

	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			//SELECT
			const fetch_payload = {
				"queries": [
					{
						"returnColumns": [
							"id",
							"owner",
							"identifier",
							"last_restock_time_ms"
						],
						"tableName": "stores",
						"conditions": {
							"id": {
								"operator": "=",
								"value": storeId
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
							},
							"identifier": {
								"operator": "=",
								"value": itemIdentifier
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
						"tableName": "store_items",
						"conditions": {
							"owner": {
								"operator": "=",
								"value": storeId
							},
							"identifier": {
								"operator": "=",
								"value": itemIdentifier
							}
						},
						"limit": 1
					}
				]
			};
			const fetchResult = await invokeLambda('garden-select', fetch_payload);
			const storeEntity = parseRows<StoreEntity[]>(fetchResult[0])[0];
			const inventoryEntity = parseRows<InventoryEntity[]>(fetchResult[1])[0];
			const inventoryItemEntity = parseRows<InventoryItemEntity[]>(fetchResult[2])[0];
			const storeItemEntityList = parseRows<StoreItemEntity[]>(fetchResult[3]);

			assert(storeRepository.validateStoreEntity(storeEntity));
			assert(inventoryRepository.validateInventoryEntity(inventoryEntity));
			assert(storeItemRepository.validateStoreItemEntity(inventoryItemEntity));

			const storeItemEntity = (Array.isArray(storeItemEntityList) && storeItemEntityList.length > 0) ? storeItemEntityList[0] : null;
			if (storeItemEntity) assert(storeItemRepository.validateStoreItemEntity(storeItemEntity));
			
			const {totalCost, newItem} = getCostAndItem(storeEntity, inventoryEntity, inventoryItemEntity);
			let returnItem = null;
			//Only if the item does not exist on store inventory yet
			if (!storeItemEntity) {
				const insert_payload = {
					"queries": [
						{
							"tableName": "store_items",
							"columnsToWrite": [
							  "owner",
							  "identifier",
							  "quantity"
							],
							"values": [
							  [
								storeId,
								newItem.itemData.id,
								newItem.getQuantity()
							  ]
							],
							"conflictColumns": [
							  "owner",
							  "identifier"
							],
							"returnColumns": [
							  "id",
							  "owner",
							  "identifier",
							  "quantity"
							]
						  }
					]
				};
				const insertResult = await invokeLambda('garden-insert', insert_payload);
				returnItem = parseRows<StoreItemEntity[]>(insertResult[0])[0];
			}

			//If the item already exists, as well as updating the store contents and inventory gold
			const update_queries = [];
			update_queries.push({
				"tableName": "inventory_items",
				"values": {
				  "quantity": {
					"operator": "-",
					"value": sellQuantity
				  }
				},
				"returnColumns": [
				  "id"
				],
				"conditions": {
				  "owner": {
					"operator": "=",
					"value": inventoryId
				  },
				  "identifier": {
					"operator": "=",
					"value": inventoryItemEntity.identifier
				  }
				}
			  });
			update_queries.push({
				"tableName": "inventories",
				"values": {
					"gold": {
						"operator": "+",
						"value": totalCost
					}
				},
				"returnColumns": [
					"id"
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
			});
			if (storeItemEntity) {
				update_queries.push({
					"tableName": "store_items",
					"values": {
						"quantity": {
							"operator": "+",
							"value": sellQuantity
						  }
					},
					"returnColumns": [
						"id",
						"owner",
						"identifier",
						"quantity"
					],
					"conditions": {
						"owner": {
							"operator": "=",
							"value": storeId
						},
						"identifier": {
							"operator": "=",
							"value": storeItemEntity.identifier
						}
					}
				});
			}
			const update_payload = {
				"queries": update_queries
			};
			const updateResult = await invokeLambda('garden-update', update_payload);
			if (storeItemEntity) {
				returnItem = parseRows<StoreItemEntity[]>(updateResult[2])[0];
			}
			assert(storeItemRepository.validateStoreItemEntity(returnItem));

			//Return the modified inventoryitem -- make sure to grab the correct one of insert/update with return values
			return returnItem!;
		} catch (error) {
			console.error('Error fetching store from Lambda:', error);
			throw error;
		}
	} else {

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

			const {totalCost, newItem} = getCostAndItem(storeEntity, inventoryEntity, inventoryItemEntity);

			const returnValue = await storeItemRepository.addStoreItem(storeId, newItem, client);
			await inventoryItemRepository.updateInventoryItemQuantity(inventoryItemEntity.id, -1 * sellQuantity, client);
			await inventoryRepository.updateInventoryGold(inventoryId, totalCost, client);

			return returnValue;
		}

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'SellItem', client);
	}
}

/**
 * @returns a store plain object
 */
export async function getStoreFromDatabase(storeId: string, userId: string, client?: PoolClient): Promise<any> {
	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {

			// 'SELECT id, owner, identifier, last_restock_time_ms FROM stores WHERE id = $1 AND owner = $2'
			// 'SELECT id, owner, identifier, quantity FROM store_items WHERE owner = $1'
			const payload = {
				"queries": [
					{
						"returnColumns": [
							"id",
							"owner",
							"identifier",
							"last_restock_time_ms"
						],
						"tableName": "stores",
						"conditions": {
							"id": {
							"operator": "=",
							"value": storeId
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
						"tableName": "store_items",
						"conditions": {
							"owner": {
								"operator": "=",
								"value": storeId
								}
						},
						"limit": 1000
					}
				]
			  }
			const queryResult = await invokeLambda('garden-select', payload);
			const storeResult = queryResult[0];
			let storeItemsResult = queryResult[1];
			// Check if result is valid
			if (!storeResult) {
				throw new Error(`Could not find store for store id ${storeId}`);
			}
			const storeEntityResult = parseRows<StoreEntity[]>(storeResult)[0];
			assert(storeRepository.validateStoreEntity(storeEntityResult));

			let storeItems: InventoryItemList | null;
			if (!storeItemsResult) {
				console.error(`Error parsing storeItems for store id ${storeId}`);
				storeItems = null;
			} else {
				storeItems = storeItemRepository.makeStoreItemObjectBatch(parseRows<StoreItemEntity[]>(storeItemsResult));
			}
			const storeInstance = await storeRepository.makeStoreObject(storeEntityResult, storeItems);
			return storeInstance.toPlainObject();
		} catch (error) {
			console.error('Error fetching store from Lambda:', error);
			throw error;
		}
	} else {
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
			const storeItemList = await storeRepository.getStoreItems(storeResult.id);
			const storeInstance = await storeRepository.makeStoreObject(storeResult, storeItemList);

			return storeInstance.toPlainObject();
		}
		// Call transactionWrapper with inner function and description
		return transactionWrapper(innerFunction, 'fetchStoreFromDatabase', client);
	}
}
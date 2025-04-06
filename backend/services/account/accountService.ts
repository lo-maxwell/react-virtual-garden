import { pool } from "@/backend/connection/db";
import { invokeLambda, parseRows } from "@/backend/lambda/invokeLambda";
import gardenRepository from "@/backend/repositories/garden/gardenRepository";
import plotRepository from "@/backend/repositories/garden/plot/plotRepository";
import inventoryItemRepository from "@/backend/repositories/items/inventoryItem/inventoryItemRepository";
import storeItemRepository from "@/backend/repositories/items/inventoryItem/storeItemRepository";
import placedItemRepository from "@/backend/repositories/items/placedItem/placedItemRepository";
import inventoryRepository from "@/backend/repositories/itemStore/inventory/inventoryRepository";
import storeRepository from "@/backend/repositories/itemStore/store/storeRepository";
import levelRepository from "@/backend/repositories/level/levelRepository";
import actionHistoryRepository from "@/backend/repositories/user/actionHistoryRepository";
import itemHistoryRepository from "@/backend/repositories/user/itemHistoryRepository";
import userRepository from "@/backend/repositories/user/userRepository";
import { Garden, GardenEntity } from "@/models/garden/Garden";
import { Inventory, InventoryEntity } from "@/models/itemStore/inventory/Inventory";
import { Store, StoreEntity } from "@/models/itemStore/store/Store";
import User from "@/models/user/User";
import { PoolClient } from "pg";
import { createGardenInDatabase, getGardenFromDatabase } from "../garden/gardenService";
import { createInventoryInDatabase, getInventoryFromDatabase } from "../inventory/inventoryService";
import { createStoreInDatabase, getStoreFromDatabase } from "../store/storeService";
import { createUserInDatabase, getUserFromDatabase } from "../user/userService";
import { transactionWrapper } from "../utility/utility";

//Does not need lambda specific
/**
 * Calls createAccountInDatabase with the default user, store, inventory, garden objects.
 * @returns the result of createAccountInDatabase
 */
 export async function createDefaultAccountInDatabase(firebaseUid: string, client?: PoolClient): Promise<string | null> {
	const defaultUser = User.generateNewUserWithId(firebaseUid);
	const defaultGarden = Garden.generateDefaultNewGarden();
	const defaultInventory = Inventory.generateDefaultNewInventory();
	const defaultStore = Store.generateDefaultNewStore();
	const createResult = await createAccountInDatabase(firebaseUid, defaultUser, defaultInventory, defaultStore, defaultGarden, client);
	if (!createResult) {
		throw new Error(`There was an error initializing default objects`);
	}
	return defaultUser.getUserId();
}

/**
 * Begins a transaction if there is not already one. Creates a new row in the users, levels, itemstores, inventoryItems (if there are existing items), garden, plots tables.
 * If the object already exists in the database (with the corresponding id), does nothing.
 * TODO: Might not even work to begin with since we use firebaseUid instead of userId now
 * On error, rolls back.
 * @userId the firebase uid
 * @user the User to add
 * @inventory the User's inventory
 * @store the store associated with the User
 * @garden the garden associated with the User
 * @client the pool client that this is nested within, or null if it should create its own transaction.
 * @returns true if success, throws error on failure
 */
 export async function createAccountInDatabase(userId: string, user: User, inventory: Inventory, store: Store, garden: Garden, client?: PoolClient): Promise<boolean | null> {
	// The function passed into the transaction wrapper
	const userResult = await createUserInDatabase(user, userId, client);
	const gardenResult = await createGardenInDatabase(garden, userId, client);
	const inventoryResult = await createInventoryInDatabase(inventory, userId, client);
	const storeResult = await createStoreInDatabase(store, userId, client);

	return userResult && gardenResult && inventoryResult && storeResult;
}

//TODO: Use insert ON CONFLICT to createOrUpdate
/**
 * Begins a transaction if there is not already one. Updates the users, levels, itemstores, inventoryItems (if there are existing items), garden, plots tables.
 * If the object does not already exist with a suitable id, does nothing.
 * On error, rolls back.
 * @userId the firebase uid
 * @user the User to update
 * @inventory the User's inventory
 * @store the store associated with the User
 * @garden the garden associated with the User
 * @client the pool client that this is nested within, or null if it should create its own transaction.
 * @returns true if success, throws error on failure
 */
 export async function saveAccountToDatabase(userId: string, user: User, inventory: Inventory, store: Store, garden: Garden, client?: PoolClient): Promise<boolean | null> {
	//TODO: Make this atomic
	//Right now create and save are 2 different things, so we can create but not save
	// await createAccountInDatabase(userId, user, inventory, store, garden, client);

	const innerFunction = async (client: PoolClient) => {
		
		// //Create user
		const userResult = await userRepository.createOrUpdateUser(user, client);
		// Check if result is valid
		if (!userResult) {
			throw new Error('There was an error updating the user');
		}
		
		//Create level (relies on user)
		const levelResult = await levelRepository.createOrUpdateLevelSystem(user.getUserId(), 'user', user.getLevelSystem(), client);
		// Check if result is valid
		if (!levelResult) {
			throw new Error('There was an error updating the level system');
		}

		//Create garden
		const gardenResult = await gardenRepository.createOrUpdateGarden(user.getUserId(), garden, client);
		// Check if result is valid
		if (!gardenResult) {
			throw new Error('There was an error updating the garden');
		}

		// Array to store all promises
		const allPromises: Promise<void>[] = [];

		// Save action histories
		const actionHistoryPromises: Promise<void>[] = user.getActionHistory().getAllHistories().map(async (elem) => {
			const result = await actionHistoryRepository.createOrUpdateActionHistory(elem, user.getUserId(), client);
			if (!result) {
				throw new Error(`Error saving action history for user ${user.getUserId()}`);
			}
		});
		allPromises.push(...actionHistoryPromises);

		// Save item histories
		const itemHistoryPromises: Promise<void>[] = user.getItemHistory().getAllHistories().map(async (elem) => {
			const result = await itemHistoryRepository.createOrUpdateItemHistory(elem, user.getUserId(), client);
			if (!result) {
				throw new Error(`Error saving item history for user ${user.getUserId()}`);
			}
		});
		allPromises.push(...itemHistoryPromises);

		// Create plots and placed items concurrently
		for (let i = 0; i < garden.getAllPlots().length; i++) {
			for (let j = 0; j < garden.getAllPlots()[0].length; j++) {
				const plot = (garden.getAllPlots())[i][j].clone();
				if (!plot) {
					throw new Error(`Could not find plot at row ${i}, col ${j}`);
				}

				// Chain plot creation with placed item creation
				const plotAndPlacedItemPromise = plotRepository
					.createOrUpdatePlot(gardenResult.id, i, j, plot, client)
					.then((plotResult) => {
						if (!plotResult) {
							throw new Error(`Error updating plot at row ${i}, col ${j}`);
						}

						// Immediately create placed item after the plot is created
						const item = plot.getItem();
						if (!item) {
							return; // No item to place, so skip
						}

						// Explicitly return void, since we no longer need this
						return placedItemRepository.createOrUpdatePlacedItem(plotResult.id, item, client).then(() => {});
					})
					.catch((error) => {
						console.error(`Error processing plot or placed item at row ${i}, col ${j}:`, error);
					});

				allPromises.push(plotAndPlacedItemPromise);
			}
		}

		// Create inventory and inventory items concurrently
		const inventoryResultPromise = inventoryRepository.createOrUpdateInventory(userResult.id, inventory, client)
			.then(async (inventoryResult) => {
				if (!inventoryResult) {
					throw new Error('There was an error updating the inventory');
				}

				// Create inventory items
				const inventoryItemPromises: Promise<void>[] = [];
				const inventoryItems = inventory.getAllItems();
				inventoryItems.forEach((item) => {
					const inventoryItemPromise = inventoryItemRepository.createOrUpdateInventoryItem(inventory.getInventoryId(), item, client)
						.then((inventoryItemResult) => {
							if (!inventoryItemResult) {
								throw new Error(`Error updating inventory item for item ${item.itemData.id}`);
							}
						});
					inventoryItemPromises.push(inventoryItemPromise);
				});

				// Wait for all inventory item promises to resolve
				await Promise.allSettled(inventoryItemPromises); // Explicitly return void
			})
			.catch((error) => {
				console.error('Error updating inventory or inventory items:', error);
			});

		allPromises.push(inventoryResultPromise);

		// Create store and store items concurrently
		const storeResultPromise = storeRepository.createOrUpdateStore(userResult.id, store, client)
			.then(async (storeResult) => {
				if (!storeResult) {
					throw new Error('There was an error updating the store');
				}

				// Create store items
				const storeItemPromises: Promise<void>[] = [];
				const storeItems = store.getAllItems();
				storeItems.forEach((item) => {
					const storeItemPromise = storeItemRepository.createOrUpdateStoreItem(store.getStoreId(), item, client)
						.then((storeItemResult) => {
							if (!storeItemResult) {
								throw new Error(`Error updating store item for item ${item.itemData.id}`);
							}
						});
					storeItemPromises.push(storeItemPromise);
				});

				// Wait for all store item promises to resolve
				await Promise.allSettled(storeItemPromises); // Explicitly return void
			})
			.catch((error) => {
				console.error('Error updating store or store items:', error);
			});

		allPromises.push(storeResultPromise);

		// Wait for all promises to resolve
		await Promise.allSettled(allPromises);
		console.log('finished saving account to database');
		return true;
	}

	// Call transactionWrapper with inner function and description
	return transactionWrapper(innerFunction, 'updateAccountInDatabase', client);
}

export interface AccountObjects {
	plainUserObject: any,
	plainGardenObject: any,
	plainInventoryObject: any,
	plainStoreObject: any
}

//TODO: Fetches a random one of garden, store, inventory. if users can ever have multiple instances of these, this code will break
/**
 * Begins a transaction if there is not already one. Fetches the user, garden, inventory, store from the database and returns them as a json object.
 * On error, rolls back.
 * @userId the user id to fetch from the database
 * @client the pool client that this is nested within, or null if it should create its own transaction.
 * @returns AccountObjects object containing user, garden, inventory, store in plainObject format, or throws error
 */
 export async function getAccountFromDatabase(userId: string, client?: PoolClient): Promise<AccountObjects> {
	let gardenId;
	let inventoryId;
	let storeId;
	if (process.env.USE_DATABASE === 'LAMBDA') {
		const fetch_payload = {
			"queries": [
				{
					"returnColumns": [
						"id",
						"owner",
						"rows",
						"columns"
					],
					"tableName": "gardens",
					"conditions": {
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
						"last_restock_time_ms"
					],
					"tableName": "stores",
					"conditions": {
						"owner": {
							"operator": "=",
							"value": userId
							}
					},
					"limit": 1
				}
			]
		}
		const queryResult = await invokeLambda('garden-select', fetch_payload);
		const gardenEntity = parseRows<GardenEntity[]>(queryResult[0])[0];
		const inventoryEntity = parseRows<InventoryEntity[]>(queryResult[1])[0];
		const storeEntity = parseRows<StoreEntity[]>(queryResult[2])[0];
		gardenId = gardenEntity ? gardenEntity.id : "Error";
		inventoryId = inventoryEntity ? inventoryEntity.id : "Error";
		storeId = storeEntity ? storeEntity.id : "Error";
	} else {
		const gardenEntity = await gardenRepository.getGardenByOwnerId(userId);
		const inventoryEntity = await inventoryRepository.getInventoryByOwnerId(userId);
		const storeEntity = await storeRepository.getStoreByOwnerId(userId);
		gardenId = gardenEntity ? gardenEntity.id : "Error";
		inventoryId = inventoryEntity ? inventoryEntity.id : "Error";
		storeId = storeEntity ? storeEntity.id : "Error";
	}
	const userPlainObject = await getUserFromDatabase(userId, client);
	const gardenPlainObject = await getGardenFromDatabase(gardenId, userId, client);
	const inventoryPlainObject = await getInventoryFromDatabase(inventoryId, userId, client);
	const storePlainObject = await getStoreFromDatabase(storeId, userId, client);
	const returnObject = {
		plainUserObject: userPlainObject,
		plainGardenObject: gardenPlainObject,
		plainInventoryObject: inventoryPlainObject,
		plainStoreObject: storePlainObject
	}

	return returnObject;

	// const innerFunction = async (client: PoolClient) => {
	// 	//Create user
	// 	const userResult = await userRepository.getUserEntityById(userId);
	// 	// Check if result is valid
	// 	if (!userResult) {
	// 		throw new Error(`Could not find the user for id ${userId}`);
	// 	}
	// 	const levelSystem = await levelRepository.getLevelSystemByOwnerId(userResult.id, "user");
	// 	let levelSystemInstance;
	// 	if (!levelSystem) {
	// 		levelSystemInstance = User.generateDefaultLevelSystem();
	// 	} else {
	// 		levelSystemInstance = levelRepository.makeLevelSystemObject(levelSystem);
	// 	}
	// 	const actionHistoryEntities = await actionHistoryRepository.getActionHistoriesByUserId(userResult.id);
	// 	const actionHistories = actionHistoryEntities.map((actionHistoryEntity) => actionHistoryRepository.makeActionHistoryObject(actionHistoryEntity));
	// 	const actionHistoryList = actionHistoryRepository.makeActionHistoryListObject(actionHistories);
	// 	const itemHistoryEntities = await itemHistoryRepository.getItemHistoriesByUserId(userResult.id);
	// 	const itemHistories = itemHistoryEntities.map((itemHistoryEntity) => itemHistoryRepository.makeItemHistoryObject(itemHistoryEntity));
	// 	const itemHistoryList = itemHistoryRepository.makeItemHistoryListObject(itemHistories);
	// 	const userInstance = userRepository.makeUserObject(userResult, levelSystemInstance, actionHistoryList, itemHistoryList);
		
	// 	//Create garden
	// 	const gardenResult = await gardenRepository.getGardenByOwnerId(userId);
	// 	// Check if result is valid
	// 	if (!gardenResult) {
	// 		throw new Error(`Could not find the garden for userId ${userId}`);
	// 	}
	// 	const plots = await gardenRepository.getPlots(gardenResult.id);
	// 	const gardenInstance = gardenRepository.makeGardenObject(gardenResult, plots);

	// 	//Create inventory
	// 	const inventoryResult = await inventoryRepository.getInventoryByOwnerId(userId);
	// 	// Check if result is valid
	// 	if (!inventoryResult) {
	// 		throw new Error(`Could not find the inventory for userId ${userId}`);
	// 	}
	// 	const inventoryItemList = await inventoryRepository.getInventoryItems(inventoryResult.id);
	// 	const inventoryInstance = await inventoryRepository.makeInventoryObject(inventoryResult, inventoryItemList);

	// 	//Create store
	// 	const storeResult = await storeRepository.getStoreByOwnerId(userId);
	// 	// Check if result is valid
	// 	if (!storeResult) {
	// 		throw new Error(`Could not find the store for userId ${userId}`);
	// 	}
	// 	const storeItemList = await storeRepository.getStoreItems(storeResult.id);
	// 	const storeInstance = await storeRepository.makeStoreObject(storeResult, storeItemList);
	// 	const returnObject = {
	// 		plainUserObject: userInstance.toPlainObject(),
	// 		plainGardenObject: gardenInstance.toPlainObject(),
	// 		plainInventoryObject: inventoryInstance.toPlainObject(),
	// 		plainStoreObject: storeInstance.toPlainObject()
	// 	}

	// 	return returnObject;
	// }
	// // Call transactionWrapper with inner function and description
	// return transactionWrapper(innerFunction, 'fetchAccountFromDatabase', client);
}


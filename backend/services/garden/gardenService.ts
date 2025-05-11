import { pool } from "@/backend/connection/db";
import gardenRepository from "@/backend/repositories/garden/gardenRepository";
import levelRepository from "@/backend/repositories/level/levelRepository";
import { Garden, GardenEntity } from "@/models/garden/Garden";
import { PoolClient } from "pg";
import { transactionWrapper } from "../utility/utility";
import plotRepository from "@/backend/repositories/garden/plot/plotRepository";
import inventoryItemRepository from "@/backend/repositories/items/inventoryItem/inventoryItemRepository";
import placedItemRepository from "@/backend/repositories/items/placedItem/placedItemRepository";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { PlacedItem, PlacedItemDetailsEntity, PlacedItemEntity } from "@/models/items/placedItems/PlacedItem";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import { PlantTemplate } from "@/models/items/templates/models/PlantTemplate";
import { SeedTemplate } from "@/models/items/templates/models/SeedTemplate";
import actionHistoryRepository from "@/backend/repositories/user/actionHistoryRepository";
import itemHistoryRepository from "@/backend/repositories/user/itemHistoryRepository";
import userRepository from "@/backend/repositories/user/userRepository";
import { Plot, PlotEntity } from "@/models/garden/Plot";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { actionHistoryFactory } from "@/models/user/history/actionHistory/ActionHistoryFactory";
import ItemHistory, { ItemHistoryEntity } from "@/models/user/history/itemHistory/ItemHistory";
import { stringToBigIntNumber } from "@/models/utility/BigInt";
import { HarvestedItemTemplate } from "@/models/items/templates/models/HarvestedItemTemplate";
import { v4 as uuidv4 } from 'uuid';
import { PlacedItemTemplate } from "@/models/items/templates/models/PlacedItemTemplate";
import { invokeLambda, parseRows } from "@/backend/lambda/invokeLambda";
import assert from "assert";
import LevelSystem, { LevelSystemEntity } from "@/models/level/LevelSystem";
import { InventoryItemEntity } from "@/models/items/inventoryItems/InventoryItem";
import { InventoryEntity } from "@/models/itemStore/inventory/Inventory";
import inventoryRepository from "@/backend/repositories/itemStore/inventory/inventoryRepository";
import { ActionHistoryEntity } from "@/models/user/history/actionHistory/ActionHistory";
import { DecorationTemplate } from "@/models/items/templates/models/DecorationTemplate";
import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { BlueprintTemplate } from "@/models/items/templates/models/BlueprintTemplate";
import { generateNewPlaceholderInventoryItem } from "@/models/items/PlaceholderItems";

//TODO: Users can initiate race conditions by fudging the client side and running multiple add/removes, allowing for invalid row/column counts

/**
 * Inserts a garden into the database. Does nothing if a garden with the same owner/userId already exists.
 * @param garden
 * @param userId
 * @param client
 */
export async function createGardenInDatabase(garden: Garden, userId: string, client?: PoolClient): Promise<boolean> {
	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			const flatPlotList = garden.getAllPlots().flat(); // Flattening the 2D array to a 1D array
			const flatPlacedItemMap: Record<string, PlacedItem> = flatPlotList.reduce((acc: any, plot) => {
				const placedItem = plot.getItem(); // Assuming getPlacedItem() returns a PlacedItem
				if (placedItem) {
					acc[plot.getPlotId()] = placedItem; // Map plot.id to the corresponding placed item
				}
				return acc;
			}, {});

			const payload = {
				"queries": [
					{
						"tableName": "gardens",
						"columnsToWrite": [
							"id", 
							"owner", 
							"rows", 
							"columns"
						],
						"values": [
							[
								garden.getGardenId(),
								userId,
								garden.getRows(),
								garden.getCols()
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
			const insert_plot_values: any = [];
			flatPlotList.forEach((plot) => {
				const position = garden.getPlotPosition(plot);
				if (!position) {
					console.warn(`Plot not found in garden`);
					return;
				}
				const toInsert = [
					plot.getPlotId(),
					garden.getGardenId(),
					position[0],
					position[1],
					plot.getPlantTime(),
					plot.getUsesRemaining(),
					plot.getRandomSeed()
				]
				insert_plot_values.push(toInsert);
			})
			if (insert_plot_values.length > 0) {
				const plotInsertQuery = {
					"tableName": "plots",
					"columnsToWrite": [
						"id", "owner", "row_index", "col_index", "plant_time", "uses_remaining", "random_seed"
					],
					"values": insert_plot_values,
					"conflictColumns": [
						"owner",
						"row_index",
						"col_index"
					],
					"returnColumns": [
						"id"
					]
				};
				payload.queries.push(plotInsertQuery);
			}
			const insert_placed_item_values: any = [];
			Object.entries(flatPlacedItemMap).forEach(([key, placedItem]) => {
				const toInsert = [
					placedItem.getPlacedItemId(),
					key,
					placedItem.itemData.id,
					placedItem.getStatus()
				]
				insert_placed_item_values.push(toInsert);
			})
			if (insert_placed_item_values.length > 0) {
				const placedItemInsertQuery = {
					"tableName": "placed_items",
					"columnsToWrite": [
						"id", "owner", "identifier", "status"
					],
					"values": insert_placed_item_values,
					"conflictColumns": [
						"owner"
					],
					"returnColumns": [
						"id"
					]
				};
				payload.queries.push(placedItemInsertQuery);
			}

			const insertResult = await invokeLambda('garden-insert', payload);
			// Check if result is valid
			if (!insertResult) {
				throw new Error(`Error executing creation of garden ${garden.getGardenId()}`);
			}
			const gardenResult = parseRows<string[]>(insertResult[0]);
			const plotResult = insert_plot_values.length > 0 ? parseRows<string[]>(insertResult[1]) : [];
			const placedItemResult = insert_placed_item_values.length > 0 ? parseRows<string[]>(insertResult[insertResult.length - 1]) : [];

			// Check for discrepancies
			if (gardenResult.length !== 1) {
				console.warn(`Expected 1 garden to be created, but got ${gardenResult.length}`);
			}
			if (plotResult.length !== insert_plot_values.length) {
				console.warn(`Expected ${insert_plot_values.length} plot IDs to be returned, but got ${plotResult.length}`);
			}
			if (placedItemResult.length !== insert_placed_item_values.length) {
				console.warn(`Expected ${insert_placed_item_values.length} placed item IDs to be returned, but got ${placedItemResult.length}`);
			}
			return true;
		} catch (error) {
			console.error('Error creating garden from Lambda:', error);
			throw error;
		}
	} else {
		//Create garden
		const gardenResult = await gardenRepository.createGarden(userId, garden, client);
		if (!gardenResult) {
			throw new Error('There was an error creating the garden');
		}

		const allPromises: Promise<void>[] = [];

		// Create plots and placed items concurrently
		for (let i = 0; i < garden.getAllPlots().length; i++) {
			for (let j = 0; j < garden.getAllPlots()[0].length; j++) {
				const plot = (garden.getAllPlots())[i][j].clone();
				if (!plot) {
					throw new Error(`Could not find plot at row ${i}, col ${j}`);
				}

				// Chain plot creation with placed item creation
				const plotAndPlacedItemPromise = plotRepository
					.createPlot(gardenResult.id, i, j, plot, client)
					.then((plotResult) => {
						if (!plotResult) {
							throw new Error(`Error creating plot at row ${i}, col ${j}`);
						}

						// Immediately create placed item after the plot is created
						const item = plot.getItem();
						if (!item) {
							return; // No item to place, so skip
						}

						return placedItemRepository.createPlacedItem(plotResult.id, item, client).then(() => {});
					})
					.catch((error) => {
						console.error(`Error processing plot or placed item at row ${i}, col ${j}:`, error);
					});

				allPromises.push(plotAndPlacedItemPromise);
			}
		}

		await Promise.allSettled(allPromises);
		return true;
	}
}


/**
 * Updates a garden in the database, or creates a new entry if it does not exist.
 * @param garden
 * @param userId
 * @param client
 */
 export async function upsertGardenInDatabase(garden: Garden, userId: string, client?: PoolClient): Promise<boolean> {
	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			const flatPlotList = garden.getAllPlots().flat(); // Flattening the 2D array to a 1D array
			const flatPlacedItemMap: Record<string, PlacedItem> = flatPlotList.reduce((acc: any, plot) => {
				const placedItem = plot.getItem(); // Assuming getPlacedItem() returns a PlacedItem
				if (placedItem) {
					acc[plot.getPlotId()] = placedItem; // Map plot.id to the corresponding placed item
				}
				return acc;
			}, {});

			const payload = {
				"queries": [
					{
						"tableName": "gardens",
						"columnsToWrite": [
							"id", 
							"owner", 
							"rows", 
							"columns"
						],
						"values": [
							[
								garden.getGardenId(),
								userId,
								garden.getRows(),
								garden.getCols()
							  ]
						],
						"conflictColumns": [
							"id"
						],
						"updateQuery": {
							"values": {
								"rows": {
									"excluded": true
								},
								"columns": {
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
			const insert_plot_values: any = [];
			flatPlotList.forEach((plot) => {
				const position = garden.getPlotPosition(plot);
				if (!position) {
					console.warn(`Plot not found in garden`);
					return;
				}
				const toInsert = [
					plot.getPlotId(),
					garden.getGardenId(),
					position[0],
					position[1],
					plot.getPlantTime(),
					plot.getUsesRemaining(),
					plot.getRandomSeed()
				]
				insert_plot_values.push(toInsert);
			})
			if (insert_plot_values.length > 0) {
				const plotInsertQuery: any = {
					"tableName": "plots",
					"columnsToWrite": [
						"id", "owner", "row_index", "col_index", "plant_time", "uses_remaining", "random_seed"
					],
					"values": insert_plot_values,
					"conflictColumns": [
						"owner",
						"row_index",
						"col_index"
					],
					"updateQuery": {
						"values": {
							"row_index": {
								"excluded": true
							},
							"col_index": {
								"excluded": true
							},
							"plant_time": {
								"excluded": true
							},
							"uses_remaining": {
								"excluded": true
							},
							"random_seed": {
								"excluded": true
							}
						},
						"conditions": {
							"owner": {
								"operator": "=",
								"value": garden.getGardenId()
							}
						}
					},
					"returnColumns": [
						"id"
					]
				};
				payload.queries.push(plotInsertQuery);
			}
			const insert_placed_item_values: any = [];
			Object.entries(flatPlacedItemMap).forEach(([key, placedItem]) => {
				const toInsert = [
					placedItem.getPlacedItemId(),
					key,
					placedItem.itemData.id,
					placedItem.getStatus()
				]
				insert_placed_item_values.push(toInsert);
			})
			if (insert_placed_item_values.length > 0) {
				const placedItemInsertQuery: any = {
					"tableName": "placed_items",
					"columnsToWrite": [
						"id", "owner", "identifier", "status"
					],
					"values": insert_placed_item_values,
					"conflictColumns": [
						"owner"
					],
					"updateQuery": {
						"values": {
							"identifier": {
								"excluded": true
							},
							"status": {
								"excluded": true
							}
						},
						"conditions": {
						}
					},
					"returnColumns": [
						"id"
					]
				};
				payload.queries.push(placedItemInsertQuery);
			}

			const insertResult = await invokeLambda('garden-insert', payload);
			// Check if result is valid
			if (!insertResult) {
				throw new Error(`Error executing upsert of garden ${garden.getGardenId()}`);
			}
			const gardenResult = parseRows<string[]>(insertResult[0]);
			const plotResult = insert_plot_values.length > 0 ? parseRows<string[]>(insertResult[1]) : [];
			const placedItemResult = insert_placed_item_values.length > 0 ? parseRows<string[]>(insertResult[insertResult.length - 1]) : [];

			// Check for discrepancies
			if (gardenResult.length !== 1) {
				console.warn(`Expected 1 garden to be upserted, but got ${gardenResult.length}`);
			}
			if (plotResult.length !== insert_plot_values.length) {
				console.warn(`Expected ${insert_plot_values.length} plot IDs to be returned, but got ${plotResult.length}`);
			}
			if (placedItemResult.length !== insert_placed_item_values.length) {
				console.warn(`Expected ${insert_placed_item_values.length} placed item IDs to be returned, but got ${placedItemResult.length}`);
			}
			return true;
		} catch (error) {
			console.error('Error upserting garden from Lambda:', error);
			throw error;
		}
	} else {
		//Create garden
		const gardenResult = await gardenRepository.createOrUpdateGarden(userId, garden, client);
		if (!gardenResult) {
			throw new Error('There was an error upserting the garden');
		}

		const allPromises: Promise<void>[] = [];

		// Create plots and placed items concurrently
		for (let i = 0; i < garden.getAllPlots().length; i++) {
			for (let j = 0; j < garden.getAllPlots()[0].length; j++) {
				const plot = (garden.getAllPlots())[i][j].clone();
				if (!plot) {
					throw new Error(`Could not find plot at row ${i}, col ${j}`);
				}

				// Chain plot creation with placed item creation
				const plotAndPlacedItemPromise = plotRepository
					.createPlot(gardenResult.id, i, j, plot, client)
					.then((plotResult) => {
						if (!plotResult) {
							throw new Error(`Error upserting plot at row ${i}, col ${j}`);
						}

						// Immediately create placed item after the plot is created
						const item = plot.getItem();
						if (!item) {
							return; // No item to place, so skip
						}

						return placedItemRepository.createOrUpdatePlacedItem(plotResult.id, item, client).then(() => {});
					})
					.catch((error) => {
						console.error(`Error processing plot or placed item at row ${i}, col ${j}:`, error);
					});

				allPromises.push(plotAndPlacedItemPromise);
			}
		}

		await Promise.allSettled(allPromises);
		return true;
	}
}

/**
 * Attempts to add a row (expand the column size) of the garden
 * @userId the id of the owner of the garden, used for checking level
 * @gardenId the id of the garden
 * @client if null, creates a new client
 * @returns an object containing the modified level system, plot, and inventoryItem on success (or throws error)
 */
export async function addGardenRow(userId: string, gardenId: string, client?: PoolClient): Promise<boolean> {

	function validateCanModifyGarden(gardenEntity: GardenEntity, levelEntity: LevelSystemEntity): boolean {
		const level = LevelSystem.getLevelForTotalExp(levelEntity.total_xp, levelEntity.growth_rate);
		if (!Garden.canAddRow(gardenEntity.rows, level)) {
			throw new Error(`Cannot add row to garden`);
		}
		return true;
	}

	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {

			// 'SELECT id, owner, rows, columns FROM gardens WHERE id = $1 AND owner = $2'
			// 'SELECT id, level, current_xp, growth_rate FROM levels WHERE owner_uid = $1 AND owner_type = user'
			// May need modification if we expand/shrink based on garden level instead of owner level
			const fetch_payload = {
				"queries": [
					{
						"tableName": "gardens",
						"returnColumns": [
							"id",
							"owner",
							"rows",
							"columns"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gardenId
							},
							"owner": {
								"operator": "=",
								"value": userId
							}
						},
						"limit": 1
					},
					{
						"tableName": "levels",
						"returnColumns": [
							"id",
							"total_xp",
							"growth_rate"
						],
						"conditions": {
							"owner_uid": {
								"operator": "=",
								"value": userId
							},
							"owner_type": {
								"operator": "=",
								"value": "user"
							}
						},
						"limit": 1
					}
				]
			  }
			const fetchQueryResult = await invokeLambda('garden-select', fetch_payload);
			if (!fetchQueryResult) {
				throw new Error(`Failed to return value from lambda`);
			}
			const gardenEntity = parseRows<GardenEntity[]>(fetchQueryResult[0])[0];
			assert(gardenRepository.validateGardenEntity(gardenEntity));
			const levelSystemEntity = parseRows<LevelSystemEntity[]>(fetchQueryResult[1])[0];
			assert(levelRepository.validateLevelSystemEntity(levelSystemEntity));

			//Check that we can add rows
			assert(validateCanModifyGarden(gardenEntity, levelSystemEntity));

			// 'UPDATE gardens SET rows = rows + 1 WHERE id = $1 AND owner = $2'
			const update_payload = {
				"queries": [
					{
						"tableName": "gardens",
						"values": {
							"rows": {
								"operator": "+",
								"value": 1
							  }
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gardenId
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
				throw new Error(`Failed to update from lambda`);
			}
			return true;
		} catch (error) {
			console.error('Error adding garden row from Lambda:', error);
			throw error;
		}
	} else {

		// Define the inner function that handles the core logic inside the transaction
		const innerFunction = async (client: PoolClient): Promise<boolean> => {
			// Grab all relevant objects concurrently
			const results = await Promise.allSettled([
				gardenRepository.getGardenById(gardenId),
				levelRepository.getLevelSystemByOwnerId(userId, 'user')
			]);

			// Destructure the results for easier access
			const [gardenResult, levelSystemResult] = results;

			// Check for errors in each promise and handle accordingly
			if (gardenResult.status === 'rejected' || gardenResult.value === null) {
				throw new Error(`Could not find garden matching id ${gardenId}`);
			}
			if (gardenResult.value.owner !== userId) {
				throw new Error(`Garden ${gardenId} is not owned by user ${userId}`);
			}
			if (levelSystemResult.status === 'rejected' || levelSystemResult.value === null) {
				throw new Error(`Could not find levelsystem matching user ${userId}`);
			}

			// Extract the resolved values
			const gardenEntity = gardenResult.value;
			const levelSystemEntity = levelSystemResult.value;

			//Check that we can add rows
			assert(validateCanModifyGarden(gardenEntity, levelSystemEntity));
			
			// Update the garden size
			await gardenRepository.updateGardenSize(gardenId, 1, 0, client);

			return true;
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'addGardenRow', client);
	}
}


/**
 * Attempts to remove a row (shrink the column size) of the garden
 * @userId the id of the owner of the garden, used for checking level
 * @gardenId the id of the garden
 * @client if null, creates a new client
 * @returns an object containing the modified level system, plot, and inventoryItem on success (or throws error)
 */
export async function removeGardenRow(userId: string, gardenId: string, client?: PoolClient): Promise<boolean> {
	
	function validateCanModifyGarden(gardenEntity: GardenEntity): boolean {
		if (!Garden.canRemoveRow(gardenEntity.rows)) {
			throw new Error(`Cannot add row to garden`);
		}
		return true;
	}

	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			//Doesn't need level fetch for removing

			// 'SELECT id, owner, rows, columns FROM gardens WHERE id = $1 AND owner = $2'
			// May need modification if we expand/shrink based on garden level instead of owner level
			const fetch_payload = {
				"queries": [
					{
						"tableName": "gardens",
						"returnColumns": [
							"id",
							"owner",
							"rows",
							"columns"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gardenId
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
			const fetchQueryResult = await invokeLambda('garden-select', fetch_payload);
			if (!fetchQueryResult) {
				throw new Error(`Failed to return value from lambda`);
			}
			const gardenEntity = parseRows<GardenEntity[]>(fetchQueryResult[0])[0];
			assert(gardenRepository.validateGardenEntity(gardenEntity));

			//Check that we can add rows
			assert(validateCanModifyGarden(gardenEntity));

			// 'UPDATE gardens SET rows = rows - 1 WHERE id = $1 AND owner = $2'
			const update_payload = {
				"queries": [
					{
						"tableName": "gardens",
						"values": {
							"rows": {
								"operator": "-",
								"value": 1
							  }
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gardenId
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
				throw new Error(`Failed to update from lambda`);
			}
			return true;
		} catch (error) {
			console.error('Error removing garden row from Lambda:', error);
			throw error;
		}
	} else {
		// Define the inner function that handles the core logic inside the transaction
		const innerFunction = async (client: PoolClient): Promise<boolean> => {
			// Grab all relevant objects concurrently
			const results = await Promise.allSettled([
				gardenRepository.getGardenById(gardenId)
			]);

			// Destructure the results for easier access
			const [gardenResult] = results;

			// Check for errors in each promise and handle accordingly
			if (gardenResult.status === 'rejected' || gardenResult.value === null) {
				throw new Error(`Could not find garden matching id ${gardenId}`);
			}
			if (gardenResult.value.owner !== userId) {
				throw new Error(`Garden ${gardenId} is not owned by user ${userId}`);
			}

			// Extract the resolved values
			const gardenEntity = gardenResult.value;

			// Business logic to check if a row can be removed
			if (!Garden.canRemoveRow(gardenEntity.rows)) {
				throw new Error(`Cannot remove row from garden`);
			}
			
			// Update the garden size
			await gardenRepository.updateGardenSize(gardenId, -1, 0, client);

			return true;
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'RemoveGardenRow', client);
	}
}

/**
 * Attempts to add a column (expand the row size) of the garden
 * @userId the id of the owner of the garden, used for checking level
 * @gardenId the id of the garden
 * @client if null, creates a new client
 * @returns an object containing the modified level system, plot, and inventoryItem on success (or throws error)
 */
export async function addGardenColumn(userId: string, gardenId: string, client?: PoolClient): Promise<boolean> {

	function validateCanModifyGarden(gardenEntity: GardenEntity, levelEntity: LevelSystemEntity): boolean {
		const level = LevelSystem.getLevelForTotalExp(levelEntity.total_xp, levelEntity.growth_rate);
		if (!Garden.canAddColumn(gardenEntity.columns, level)) {
			throw new Error(`Cannot add column to garden`);
		}
		return true;
	}

	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {

			// 'SELECT id, owner, rows, columns FROM gardens WHERE id = $1 AND owner = $2'
			// 'SELECT id, level, current_xp, growth_rate FROM levels WHERE owner_uid = $1 AND owner_type = user'
			// May need modification if we expand/shrink based on garden level instead of owner level
			const fetch_payload = {
				"queries": [
					{
						"tableName": "gardens",
						"returnColumns": [
							"id",
							"owner",
							"rows",
							"columns"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gardenId
							},
							"owner": {
								"operator": "=",
								"value": userId
							}
						},
						"limit": 1
					},
					{
						"tableName": "levels",
						"returnColumns": [
							"id",
							"total_xp",
							"growth_rate"
						],
						"conditions": {
							"owner_uid": {
								"operator": "=",
								"value": userId
							},
							"owner_type": {
								"operator": "=",
								"value": "user"
							}
						},
						"limit": 1
					}
				]
			  }
			const fetchQueryResult = await invokeLambda('garden-select', fetch_payload);
			if (!fetchQueryResult) {
				throw new Error(`Failed to return value from lambda`);
			}
			const gardenEntity = parseRows<GardenEntity[]>(fetchQueryResult[0])[0];
			assert(gardenRepository.validateGardenEntity(gardenEntity));
			const levelSystemEntity = parseRows<LevelSystemEntity[]>(fetchQueryResult[1])[0];
			assert(levelRepository.validateLevelSystemEntity(levelSystemEntity));

			//Check that we can add rows
			assert(validateCanModifyGarden(gardenEntity, levelSystemEntity));

			// 'UPDATE gardens SET columns = columns + 1 WHERE id = $1 AND owner = $2'
			const update_payload = {
				"queries": [
					{
						"tableName": "gardens",
						"values": {
							"columns": {
								"operator": "+",
								"value": 1
							  }
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gardenId
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
				throw new Error(`Failed to update from lambda`);
			}
			return true;
		} catch (error) {
			console.error('Error adding garden row from Lambda:', error);
			throw error;
		}
	} else {
		// Define the inner function that handles the core logic inside the transaction
		const innerFunction = async (client: PoolClient): Promise<boolean> => {
			// Grab all relevant objects concurrently
			const results = await Promise.allSettled([
				gardenRepository.getGardenById(gardenId),
				levelRepository.getLevelSystemByOwnerId(userId, 'user')
			]);

			// Destructure the results for easier access
			const [gardenResult, levelSystemResult] = results;

			// Check for errors in each promise and handle accordingly
			if (gardenResult.status === 'rejected' || gardenResult.value === null) {
				throw new Error(`Could not find garden matching id ${gardenId}`);
			}
			if (gardenResult.value.owner !== userId) {
				throw new Error(`Garden ${gardenId} is not owned by user ${userId}`);
			}
			if (levelSystemResult.status === 'rejected' || levelSystemResult.value === null) {
				throw new Error(`Could not find levelsystem matching user ${userId}`);
			}

			// Extract the resolved values
			const gardenEntity = gardenResult.value;
			const levelSystemEntity = levelSystemResult.value;

			// Business logic to check if a column can be added
			assert(validateCanModifyGarden(gardenEntity, levelSystemEntity));
			
			// Update the garden size
			await gardenRepository.updateGardenSize(gardenId, 0, 1, client);

			return true;
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'addGardenColumn', client);
	}
}

/**
 * Attempts to remove a column (shrink the row size) of the garden
 * @userId the id of the owner of the garden, used for checking level
 * @gardenId the id of the garden
 * @client if null, creates a new client
 * @returns an object containing the modified level system, plot, and inventoryItem on success (or throws error)
 */
export async function removeGardenColumn(userId: string, gardenId: string, client?: PoolClient): Promise<boolean> {
	function validateCanModifyGarden(gardenEntity: GardenEntity): boolean {
		if (!Garden.canRemoveColumn(gardenEntity.columns)) {
			throw new Error(`Cannot add row to garden`);
		}
		return true;
	}

	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			//Doesn't need level fetch for removing

			// 'SELECT id, owner, rows, columns FROM gardens WHERE id = $1 AND owner = $2'
			// May need modification if we expand/shrink based on garden level instead of owner level
			const fetch_payload = {
				"queries": [
					{
						"tableName": "gardens",
						"returnColumns": [
							"id",
							"owner",
							"rows",
							"columns"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gardenId
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
			const fetchQueryResult = await invokeLambda('garden-select', fetch_payload);
			if (!fetchQueryResult) {
				throw new Error(`Failed to return value from lambda`);
			}
			const gardenEntity = parseRows<GardenEntity[]>(fetchQueryResult[0])[0];
			assert(gardenRepository.validateGardenEntity(gardenEntity));

			//Check that we can add rows
			assert(validateCanModifyGarden(gardenEntity));

			// 'UPDATE gardens SET columns = columns - 1 WHERE id = $1 AND owner = $2'
			const update_payload = {
				"queries": [
					{
						"tableName": "gardens",
						"values": {
							"columns": {
								"operator": "-",
								"value": 1
							  }
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gardenId
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
				throw new Error(`Failed to update from lambda`);
			}
			return true;
		} catch (error) {
			console.error('Error removing garden row from Lambda:', error);
			throw error;
		}
	} else {
		// Define the inner function that handles the core logic inside the transaction
		const innerFunction = async (client: PoolClient): Promise<boolean> => {
			// Grab all relevant objects concurrently
			const results = await Promise.allSettled([
				gardenRepository.getGardenById(gardenId)
			]);

			// Destructure the results for easier access
			const [gardenResult] = results;

			// Check for errors in each promise and handle accordingly
			if (gardenResult.status === 'rejected' || gardenResult.value === null) {
				throw new Error(`Could not find garden matching id ${gardenId}`);
			}
			if (gardenResult.value.owner !== userId) {
				throw new Error(`Garden ${gardenId} is not owned by user ${userId}`);
			}

			// Extract the resolved values
			const gardenEntity = gardenResult.value;

			// Business logic to check if a column can be removed
			if (!Garden.canRemoveColumn(gardenEntity.columns)) {
				throw new Error(`Cannot remove column from garden`);
			}
			
			// Update the garden size
			await gardenRepository.updateGardenSize(gardenId, 0, -1, client);

			return true;
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'RemoveGardenColumn', client);
	}
}

export async function getGardenSize(userId: string, gardenId: string, client?: PoolClient) {

	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {

			// 'SELECT id, owner, rows, columns FROM gardens WHERE id = $1 AND owner = $2'
			const payload = {
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
							"id": {
							"operator": "=",
							"value": gardenId
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
			const gardenEntity = parseRows<GardenEntity[]>(queryResult[0])[0];
			assert(gardenRepository.validateGardenEntity(gardenEntity));
			return {rows: gardenEntity.rows, columns: gardenEntity.columns};
		} catch (error) {
			console.error('Error fetching garden size from Lambda:', error);
			throw error;
		}
	} else {
		// Define the inner function that handles the core logic inside the transaction
		const innerFunction = async (client: PoolClient): Promise<{rows: number, columns: number}> => {
			// Grab all relevant objects concurrently
			const gardenEntity = await gardenRepository.getGardenById(gardenId);
			if (!gardenEntity) throw new Error(`Cannot find garden matching id ${gardenId}`);
			return {rows: gardenEntity.rows, columns: gardenEntity.columns};
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'GetGardenSize', client);
	}
}


export async function plantAll(plotIds: string[], inventoryId: string, inventoryItemIdentifier: string, gardenId: string, userId: string, client?: PoolClient): Promise<boolean> {
	const currentTime = Date.now();
	if (plotIds.length === 0) {
		return false;
	}

	/** Runs once per plot */
	function validatePlotData(plotEntity: PlotEntity, placedItemEntity: PlacedItemEntity, gardenEntity: GardenEntity): boolean {
		if (placedItemEntity.owner !== plotEntity.id) {
			console.warn(`Placed item ${placedItemEntity.id} is not owned by plot ${plotEntity.id}`);
			return false;
		}
 
		if (plotEntity.owner !== gardenEntity.id) {
			console.warn(`Plot ${plotEntity.id} is not owned by garden ${gardenEntity.id}`);
			return false;
		}

		if (plotEntity.row_index >= gardenEntity.rows || plotEntity.col_index >= gardenEntity.columns) {
			console.warn(`Plot ${plotEntity.id} is not within bounds of garden ${gardenId}`);
			return false;
		}

		//make sure current plot contains ground
		const currentPlotItemTemplate = placeholderItemTemplates.getPlacedTemplate(placedItemEntity.identifier);
		if (!currentPlotItemTemplate || currentPlotItemTemplate.subtype !== ItemSubtypes.GROUND.name) {
			console.warn(`Could not find valid ground matching identifier ${placedItemEntity.identifier}`);
			return false;
		}

		return true;
	}

	/** Runs once per function */
	function validatePlantItemData(inventoryItemEntity: InventoryItemEntity, inventoryEntity: InventoryEntity, gardenEntity: GardenEntity): PlantTemplate {
		const seedItemTemplate = placeholderItemTemplates.getInventoryTemplate(inventoryItemEntity.identifier);
		if (!seedItemTemplate || seedItemTemplate.subtype !== ItemSubtypes.SEED.name) {
			throw new Error(`Could not find valid seed matching identifier ${inventoryItemEntity.identifier}`);
		}

		const plantItemTemplate = placeholderItemTemplates.getPlacedTemplate((seedItemTemplate as SeedTemplate).transformId) as PlantTemplate;
		if (!plantItemTemplate || plantItemTemplate.subtype !== ItemSubtypes.PLANT.name) {
			throw new Error(`Could not find valid plant matching identifier ${(seedItemTemplate as SeedTemplate).transformId}`);
		}

		//Check if placement is valid
		//make sure inventory contains item
		if (inventoryItemEntity.owner !== inventoryEntity.id) {
			throw new Error(`Inventory item ${inventoryItemEntity.id} is not owned by owner ${inventoryEntity.id}`);
		}

		if (inventoryEntity.owner !== userId) {
			throw new Error(`Inventory ${inventoryEntity.id} is not owned by user ${userId}`);
		}

		if (inventoryItemEntity.quantity < 1) {
			throw new Error(`Inventory item lacks required quantity`);
		}

		if (gardenEntity.owner !== userId) {
			throw new Error(`Garden ${gardenEntity.id} is not owned by user ${userId}`);
		}

		assert('baseExp' in plantItemTemplate && 'growTime' in plantItemTemplate && 'repeatedGrowTime' in plantItemTemplate && 'numHarvests' in plantItemTemplate && 'transformShinyIds' in plantItemTemplate)

		return plantItemTemplate;
	}
	
	//Get all plots that need to be planted, from plotIds
	//Get all placedItems attached to plots
	//Validate plots/placedItem owners -> garden
	//Get inventory item, check quantity > # of plots to plant
	//If not enough quantity, throw out some plots
	//Update all remaining plots/placedItems with the planted item
	//Update inventory

	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {

			// 'SELECT id, owner, rows, columns FROM gardens WHERE id = $1 and owner = $2'
			const fetch_payload = {
				"queries": [
					{
						"tableName": "gardens",
						"returnColumns": [
							"id", 
							"owner", 
							"rows", 
							"columns"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gardenId
							},
							"owner": {
								"operator": "=",
								"value": userId
							}
						},
						"limit": 1
					},
					{
						"tableName": "plots",
						"returnColumns": [
							"id", 
							"owner", 
							"row_index", 
							"col_index", 
							"plant_time", 
							"uses_remaining", 
							"random_seed"
						],
						"conditions": {
							"id": {
								"operator": "IN",
								"value": plotIds
							},
							"owner": {
								"operator": "=",
								"value": gardenId
							}
						},
						"limit": Garden.getMaximumRows() * Garden.getMaximumCols()
					},
					{
						"tableName": "inventories",
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
						},
						"limit": 1
					},
					{
						"tableName": "inventory_items",
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
								"value": inventoryItemIdentifier
							}
						},
						"limit": 1
					},
					{
						"tableName": "placed_items",
						"returnColumns": [
							"id", 
							"owner", 
							"identifier",
							"status"
						],
						"conditions": {
							"owner": {
								"operator": "IN",
								"value": plotIds
							}
						},
						"limit": Garden.getMaximumRows() * Garden.getMaximumCols()
					}
				]
			  }

			const fetchQueryResult = await invokeLambda('garden-select', fetch_payload);
			if (!fetchQueryResult) {
				throw new Error(`Failed to return value from lambda`);
			}
			const gardenEntity = parseRows<GardenEntity[]>(fetchQueryResult[0])[0];
			assert(gardenRepository.validateGardenEntity(gardenEntity));
			const plotEntityList = parseRows<PlotEntity[]>(fetchQueryResult[1]);
			assert(Array.isArray(plotEntityList));
			const inventoryEntity = parseRows<InventoryEntity[]>(fetchQueryResult[2])[0];
			assert(inventoryRepository.validateInventoryEntity(inventoryEntity));
			const inventoryItemEntity = parseRows<InventoryItemEntity[]>(fetchQueryResult[3])[0];
			assert(inventoryItemRepository.validateInventoryItemEntity(inventoryItemEntity));
			const placedItemEntityList = parseRows<PlacedItemEntity[]>(fetchQueryResult[4]);
			assert(Array.isArray(placedItemEntityList));

			//Validate the plant item and one off things
			const plantItemTemplate = validatePlantItemData(inventoryItemEntity, inventoryEntity, gardenEntity);

			const placedItemsMap: Record<string, PlacedItemEntity> = {}
			placedItemEntityList.forEach((elem, index) => {
				placedItemsMap[elem.owner] = elem;
			})

			//Generate list of valid plots
			const validatedPlotEntityList: PlotEntity[] = [];
			plotEntityList.forEach((elem) => {
				if (validatePlotData(elem, placedItemsMap[elem.id], gardenEntity)) {
					validatedPlotEntityList.push(elem);
				}
			})

			//Randomly remove plots until number of plots to plant in is less than quantity
			while (validatedPlotEntityList.length > inventoryItemEntity.quantity && validatedPlotEntityList.length > 0) {
				const plotEntityToRemove = validatedPlotEntityList.pop();
				if (!plotEntityToRemove) {
					throw new Error(`Critical error: invalid plot popped from list while planting`);
				}
				console.warn(`Not enough quantity to plant all, removed plot ${plotEntityToRemove.id}`)
			}

			if (validatedPlotEntityList.length == 0) {
				throw new Error(`Critical error: no valid plots to plant in`);
			}

			const validatedPlotIds: string[] = [];
			validatedPlotEntityList.forEach((elem) => {
				validatedPlotIds.push(elem.id);
			})

			const validatedPlacedItemIds: string[] = [];
			placedItemEntityList.forEach((elem) => {
				if (validatedPlotIds.includes(elem.owner)) {
					validatedPlacedItemIds.push(elem.id);
				}
			})

			const update_payload = {
				"queries": [
					{
						"tableName": "plots",
						"values": {
							"plant_time": currentTime,
							"uses_remaining": plantItemTemplate.numHarvests
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"id": {
								"operator": "IN",
								"value": validatedPlotIds
							},
							"owner": {
								"operator": "=",
								"value": gardenId
							}
						}
					},
					{
						"tableName": "placed_items",
						"values": {
							"identifier": plantItemTemplate.id,
							"status": ""
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"id": {
								"operator": "IN",
								"value": validatedPlacedItemIds
							},
							"owner": {
								"operator": "IN",
								"value": validatedPlotIds
							}
						}
					},
					{
						"tableName": "inventory_items",
						"values": {
							"quantity": {
								"operator": "-",
								"value": validatedPlotIds.length
							}
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": inventoryItemEntity.id
							},
							"owner": {
								"operator": "=",
								"value": inventoryEntity.id
							},
							"identifier": {
								"operator": "=",
								"value": inventoryItemEntity.identifier
							}
						}
					}
				]
			  }
			const updateQueryResult = await invokeLambda('garden-update', update_payload);
			if (!updateQueryResult) {
				throw new Error(`Failed to update from lambda`);
			}
			return true;
		} catch (error) {
			console.error('Error planting seed from Lambda:', error);
			throw error;
		}
	} else {

		const innerFunction = async (client: PoolClient): Promise<boolean> => {
			let nonCriticalError = false;
			// Batch fetch all plots and placedItems
			const plotEntities = await plotRepository.getPlotsByIds(plotIds);
			const placedItemEntities = await placedItemRepository.getPlacedItemsByPlotIds(plotIds);
			const gardenEntity = await gardenRepository.getGardenById(gardenId);
			if (!gardenEntity || gardenEntity.owner !== userId) {
				throw new Error(`Garden ${gardenId} is not owned by user`);
			}
			
			// make mapping
			// validate each plot, throwing out plots that do not match
			const finalPlotIds: string[] = [];
			const placedItemMap = new Map<string, PlacedItemEntity>();
			for (const placedItem of placedItemEntities) {
				if (!plotIds.includes(placedItem.owner)) {
					console.warn(`${placedItem} not found in plot ids, skipping`);
					nonCriticalError = true;
					continue;
				}
				const itemData = placeholderItemTemplates.getPlacedTemplate(placedItem.identifier);
				if (!itemData || itemData.subtype !== ItemSubtypes.GROUND.name) {
					console.warn(`${placedItem.identifier} is not a valid target for planting, skipping`);
					nonCriticalError = true;
					continue;
				}

				// Find the corresponding plot entity by matching the owner
				const plotEntity = plotEntities.find(plot => plot.id === placedItem.owner);
				if (plotEntity) {
					if (plotEntity.owner !== gardenId) {
						console.warn(`${plotEntity.id} is not owned by the target garden, skipping`);
						nonCriticalError = true;
						continue;
					}
					finalPlotIds.push(plotEntity.id); // Garden only the ID of the valid plot entity
				} else {
					console.warn(`No plot found for owner ${placedItem.owner}, skipping`);
					nonCriticalError = true;
					continue;
				}
				placedItemMap.set(placedItem.owner, placedItem);
			}
			
			// validate inventory quantity, throwing out random plots until we reach the minimum
			// (but plotIds should already have been vetted by the ui, 
			// ensuring that locally we only need x number of seeds which is determined by inventory
			// so this shouldn't be too bad)
			const inventoryItemResult = await inventoryItemRepository.getInventoryItemByOwnerId(inventoryId, inventoryItemIdentifier);
			if (!inventoryItemResult || inventoryItemResult.quantity <= 0) {
				throw new Error(`Could not find inventory item ${inventoryItemIdentifier} in inventory`);
			}
			const quantity = inventoryItemResult.quantity;
			while (finalPlotIds.length > quantity && finalPlotIds.length > 0) {
				const removedId = finalPlotIds.pop();
				console.warn(`Missing quantity in inventory, removed plot ID ${removedId} from planting list`);
				nonCriticalError = true;
			}

			const seedItemTemplate = placeholderItemTemplates.getInventoryTemplate(inventoryItemResult.identifier);
			if (!seedItemTemplate || seedItemTemplate.subtype !== ItemSubtypes.SEED.name) {
				throw new Error(`Could not find valid seed matching identifier ${inventoryItemResult.identifier}`);
			}

			const plantItemTemplate = placeholderItemTemplates.getPlacedTemplate((seedItemTemplate as SeedTemplate).transformId);
			if (!plantItemTemplate || plantItemTemplate.subtype !== ItemSubtypes.PLANT.name) {
				throw new Error(`Could not find valid plant matching identifier ${(seedItemTemplate as SeedTemplate).transformId}`);
			}

			// perform database updates on all plots that still match
			const updatePlotResult = await plotRepository.setMultiplePlotDetails(finalPlotIds, currentTime, (plantItemTemplate as PlantTemplate).numHarvests, client);
			const updatePlacedItemResult = await placedItemRepository.replacePlacedItemsByPlotIds(finalPlotIds, plantItemTemplate.id, '', client);
			if (updatePlotResult.updatedPlots.length <= 0 || updatePlacedItemResult.updatedItems.length <= 0) {
				throw new Error(`Did not update any plots or placed items`);
			}
			if (updatePlotResult.erroredPlots.length > 0 || updatePlacedItemResult.erroredPlotIds.length > 0) {
				console.warn(`Error while updating plot with ids ${updatePlotResult.erroredPlots.join(', ')}`);
				console.warn(`Error while updating placed items with plot ids ${updatePlacedItemResult.erroredPlotIds.join(', ')}`);
				nonCriticalError = true;
			}
			if (updatePlotResult.updatedPlots.length != updatePlacedItemResult.updatedItems.length) {
				throw new Error(`Discrepancy between updating plots and placed items: updated ${updatePlotResult.updatedPlots.length} plots and ${updatePlacedItemResult.updatedItems.length} placed items`);
			}

			const numPlanted = updatePlotResult.updatedPlots.length;
			// Remove quantity of seed corresponding to number planted
			const updateInventoryItemResult = await inventoryItemRepository.updateInventoryItemQuantity(inventoryItemResult.id, numPlanted * -1, client);
			if (nonCriticalError) return false;
			return true;
		} 

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'PlantAll', client);
	}
}

//TODO: Does not check level before harvesting
//TODO: Ensure randomseed is updated (per plot) -> hard to do this in 1 query
/**
 * Harvests a maximum of 1 item per plot at a time
 * @param plotIds 
 * @param inventoryId 
 * @param levelSystemId 
 * @param userId 
 * @param numHarvests
 * @param replacementItem 
 * @param instantHarvestKey 
 * @param client 
 * @returns 
 */
export async function harvestAll(plotIds: string[], inventoryId: string, levelSystemId: string, gardenId: string, numHarvests: number, userId: string, replacementItem?: PlacedItemDetailsEntity, instantHarvestKey?: string, client?: PoolClient): Promise<boolean> {
	//Can put validation/business logic here
	//We always check based on current time
	const currentTime = Date.now();

	if (numHarvests <= 0) {
		throw new Error(`Invalid number of harvests: ${numHarvests}`);
	}

	/** Runs once per plot */
	function validatePlotData(plotEntity: PlotEntity, placedItemEntity: PlacedItemEntity, gardenEntity: GardenEntity): boolean {

		//make sure current plot contains plant
		const plantItemTemplate = placeholderItemTemplates.getPlacedTemplate(placedItemEntity.identifier) as PlantTemplate;
		if (!plantItemTemplate || plantItemTemplate.subtype !== ItemSubtypes.PLANT.name) {
			console.warn(`${placedItemEntity.identifier} is not a valid target for harvesting`);
			return false;
		}
		assert('baseExp' in plantItemTemplate && 'growTime' in plantItemTemplate && 'repeatedGrowTime' in plantItemTemplate && 'numHarvests' in plantItemTemplate && 'transformShinyIds' in plantItemTemplate)

		if (placedItemEntity.owner !== plotEntity.id) {
			console.warn(`Placed item ${placedItemEntity.id} is not owned by plot ${plotEntity.id}`);
			return false;
		}

		if (plotEntity.owner !== gardenEntity.id) {
			console.warn(`Plot ${plotEntity.id} is not owned by garden ${gardenEntity.id}`);
			return false;
		}

		if (gardenEntity.owner !== userId) {
			console.warn(`Garden ${gardenEntity.id} is not owned by user ${userId}`);
			return false;
		}

		if (plotEntity.row_index >= gardenEntity.rows || plotEntity.col_index >= gardenEntity.columns) {
			console.warn(`Plot ${plotEntity.id} is not within bounds of garden ${gardenId}`);
			return false;
		}

		const shinyTier = Plot.checkShinyHarvest(plantItemTemplate as PlantTemplate, plotEntity.random_seed, Plot.baseShinyChance);
		let harvestedItemTemplate;
		if (shinyTier === 'Regular') {
			harvestedItemTemplate = placeholderItemTemplates.getInventoryTemplate(plantItemTemplate.transformId);
		} else {
			harvestedItemTemplate = placeholderItemTemplates.getInventoryTemplate((plantItemTemplate as PlantTemplate).transformShinyIds[shinyTier].id);
		}

		if (!harvestedItemTemplate || harvestedItemTemplate.subtype !== ItemSubtypes.HARVESTED.name) {
			console.warn(`Could not find valid harvestedItem matching identifier ${plantItemTemplate.transformId}`);
			return false;
		}

		const plantTime = stringToBigIntNumber(plotEntity.plant_time);
		if (!plantTime) {
			console.warn(`Error converting plantTime ${plotEntity.plant_time} to number`);
			return false;
		}
		
		const instantGrow = process.env.INSTANT_HARVEST_KEY === instantHarvestKey && process.env.INSTANT_HARVEST_KEY !== undefined;
		const REAL_TIME_FUDGE = 2500; //Allow for 2.5s discrepancy between harvest times

		//Check if harvest is valid
		if (!instantGrow && !Plot.canHarvest(plantItemTemplate, plantTime - REAL_TIME_FUDGE, plotEntity.uses_remaining, currentTime)) {
			console.warn(`Cannot harvest plant at this time`);
			return false;
		}

		return true;
	}

	/** Runs once per function */
	function validateStaticData(inventoryEntity: InventoryEntity, gardenEntity: GardenEntity): boolean {
		if (inventoryEntity.owner !== userId) {
			throw new Error(`Inventory ${inventoryEntity.id} is not owned by user ${userId}`);
		}

		if (gardenEntity.owner !== userId) {
			throw new Error(`Garden ${gardenEntity.id} is not owned by user ${userId}`);
		}
		return true;
	}

	function validateInventoryItem(inventoryItemEntity: InventoryItemEntity, inventoryEntity: InventoryEntity): boolean {
		if (inventoryItemEntity.owner !== inventoryEntity.id) {
			throw new Error(`Inventory ${inventoryItemEntity.id} is not owned by inventory ${inventoryItemEntity.id}`);
		}

		//Disabled in case we want to allow harvesting seeds/decorations
		// const currentInventoryItemTemplate = placeholderItemTemplates.getInventoryTemplate(inventoryItemEntity.identifier);
		// if (!currentInventoryItemTemplate || currentInventoryItemTemplate.subtype !== ItemSubtypes.HARVESTED.name) {
		// 	console.warn(`${inventoryItemEntity.identifier} is not a valid target to add harvested items to`);
		// 	return false;
		// }

		return true;
	}

	function validatePlantItemData(placedItemEntity: PlacedItemEntity): {plantItemTemplate: PlantTemplate, harvestedItemTemplate: HarvestedItemTemplate} | null {
		const plantItemTemplate = placeholderItemTemplates.getPlacedTemplate(placedItemEntity.identifier) as PlantTemplate;
		if (!plantItemTemplate || plantItemTemplate.subtype !== ItemSubtypes.PLANT.name) {
			console.warn(`Could not find valid plant matching identifier ${placedItemEntity.identifier}`);
			return null;
		}

		const harvestedItemTemplate = placeholderItemTemplates.getInventoryTemplate((plantItemTemplate as PlantTemplate).transformId) as HarvestedItemTemplate;
		if (!harvestedItemTemplate || harvestedItemTemplate.subtype !== ItemSubtypes.HARVESTED.name) {
			console.warn(`Could not find valid harvestedItem matching identifier ${(plantItemTemplate as PlantTemplate).transformId}`);
			return null;
		}

		if(!('baseExp' in plantItemTemplate && 'growTime' in plantItemTemplate && 'repeatedGrowTime' in plantItemTemplate && 'numHarvests' in plantItemTemplate && 'transformShinyIds' in plantItemTemplate)) {
			console.warn(`Could not find valid plant matching identifier ${placedItemEntity.identifier}`);
			return null;
		}

		return {plantItemTemplate: plantItemTemplate, harvestedItemTemplate: harvestedItemTemplate};
	}

	//Get all plots that need to be harvested, from plotIds
	//Get all placedItems attached to plots
	//Get all harvestedItems that result from placedItems growing, then get all inventoryItems matching harvestedItems
	//Validate plots/placedItem/inventoryItem owners -> garden
	//Make list of all plots that need replacing (numRemaining <= numHarvest) and all that don't
	//For all plots that need replacing: set new item to replacement item, and update numRemaining/currentTime
	//For all plots that do not need replacing: reduce quantity
	//Make map of all harvested items, and the quantity harvested for each (from the plots)
	//For all harvested items, make action/itemhistories
	//Update all harvested items and histories
	//Update level with xp gained = each harvestedItem baseExp * quantity

	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			

			// 'SELECT id, owner, rows, columns FROM gardens WHERE id = $1 and owner = $2'
			const fetch_payload = {
				"queries": [
					{
						"tableName": "gardens",
						"returnColumns": [
							"id", 
							"owner", 
							"rows", 
							"columns"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gardenId
							},
							"owner": {
								"operator": "=",
								"value": userId
							}
						},
						"limit": 1
					},
					{
						"tableName": "plots",
						"returnColumns": [
							"id", 
							"owner", 
							"row_index", 
							"col_index", 
							"plant_time", 
							"uses_remaining", 
							"random_seed"
						],
						"conditions": {
							"id": {
								"operator": "IN",
								"value": plotIds
							},
							"owner": {
								"operator": "=",
								"value": gardenId
							}
						},
						"limit": Garden.getMaximumRows() * Garden.getMaximumCols()
					},
					{
						"tableName": "inventories",
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
						},
						"limit": 1
					},
					{
						"tableName": "placed_items",
						"returnColumns": [
							"id", 
							"owner", 
							"identifier",
							"status"
						],
						"conditions": {
							"owner": {
								"operator": "IN",
								"value": plotIds
							}
						},
						"limit": Garden.getMaximumRows() * Garden.getMaximumCols()
					}
				]
			  }

			const fetchQueryResult = await invokeLambda('garden-select', fetch_payload);
			if (!fetchQueryResult) {
				throw new Error(`Failed to return value from lambda`);
			}
			const gardenEntity = parseRows<GardenEntity[]>(fetchQueryResult[0])[0];
			assert(gardenRepository.validateGardenEntity(gardenEntity));
			const plotEntityList = parseRows<PlotEntity[]>(fetchQueryResult[1]);
			assert(Array.isArray(plotEntityList));
			const inventoryEntity = parseRows<InventoryEntity[]>(fetchQueryResult[2])[0];
			assert(inventoryRepository.validateInventoryEntity(inventoryEntity));
			const placedItemEntityList = parseRows<PlacedItemEntity[]>(fetchQueryResult[3]);
			assert(Array.isArray(placedItemEntityList));

			//Validate the plant item and one off things
			assert(validateStaticData(inventoryEntity, gardenEntity));

			//Map of plotId -> placedItem
			const placedItemsMap: Record<string, PlacedItemEntity> = {}
			placedItemEntityList.forEach((elem, index) => {
				placedItemsMap[elem.owner] = elem;
			})

			//Generate list of valid plots
			const validatedPlotEntityList: PlotEntity[] = [];
			plotEntityList.forEach((elem) => {
				if (validatePlotData(elem, placedItemsMap[elem.id], gardenEntity)) {
					validatedPlotEntityList.push(elem);
				}
			})
			
			const plotIdsToReplace: string[] = [];
			const plotIdsToKeep: string[] = [];
			//Map of harvestedItemIdentifier -> quantity harvested
			const harvestedItemQuantityMap: Record<string, number> = {};
			//List of ids of harvested items in user inventory
			const harvestedItemIdentifierList: string[] = [];

			//Map of harvestedItemIdentifier -> baseExp of the plant
			const expMap: Record<string, number> = {};
			//For every plot, update how many quantity harvested for that item
			validatedPlotEntityList.forEach((elem) => {
				const placedItemEntity = placedItemsMap[elem.id];
				const validateResult = validatePlantItemData(placedItemEntity);
				if (!validateResult) return;
				const {plantItemTemplate, harvestedItemTemplate} = validateResult;
				if (!harvestedItemIdentifierList.includes(harvestedItemTemplate.id)) {
					harvestedItemIdentifierList.push(harvestedItemTemplate.id);
				}
				if (!(harvestedItemTemplate.id in expMap)) expMap[harvestedItemTemplate.id] = plantItemTemplate.baseExp;

				if (elem.uses_remaining > numHarvests) {
					harvestedItemQuantityMap[harvestedItemTemplate.id] = (harvestedItemQuantityMap[harvestedItemTemplate.id] || 0) + numHarvests;
					plotIdsToKeep.push(elem.id);
				} else {
					harvestedItemQuantityMap[harvestedItemTemplate.id] = (harvestedItemQuantityMap[harvestedItemTemplate.id] || 0) + elem.uses_remaining;
					plotIdsToReplace.push(elem.id);
				}
			})

			//Get histories to update
			// <Identifier, quantity>
			const actionHistories: Record<string, number> = {};
			const itemHistories: Record<string, number> = {};
			
			const harvestAllHistory = actionHistoryFactory.createHistoryIdentifier(ItemSubtypes.PLANT.name, 'all', 'harvested');
			if (!harvestAllHistory) throw new Error(`Could not create action history from identifier category all`);
			actionHistories[harvestAllHistory] = 0;
			for (const [key, value] of Object.entries(harvestedItemQuantityMap)) {
				const harvestedItemTemplate = placeholderItemTemplates.getInventoryTemplate(key) as HarvestedItemTemplate;
				if (!harvestedItemTemplate || harvestedItemTemplate.subtype !== ItemSubtypes.HARVESTED.name) {
					console.warn(`Could not find valid harvestedItem matching identifier ${key}`);
					continue;
				}

				const harvestCategoryHistory = actionHistoryFactory.createHistoryIdentifier(ItemSubtypes.PLANT.name, harvestedItemTemplate.category, 'harvested');
				if (!harvestCategoryHistory) {
					console.warn(`Could not create action history from identifier category ${harvestedItemTemplate.category}`);
					continue;
				}

				actionHistories[harvestAllHistory] += value;
				actionHistories[harvestCategoryHistory] = (actionHistories[harvestCategoryHistory] || 0) + value;
				itemHistories[key] = (itemHistories[key] || 0) + value;
			  }
			const actionHistoryIdentifierList = Object.keys(actionHistories); // Array of keys from actionHistories
			const itemHistoryIdentifierList = Object.keys(itemHistories); // Array of keys from itemHistories			  
			

			const harvestedItemPayload = {
				"queries": [
					{
						"tableName": "inventory_items",
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
								"operator": "IN",
								"value": harvestedItemIdentifierList
							}
						},
						"limit": harvestedItemIdentifierList.length
					},
					{
						"tableName": "action_histories",
						"returnColumns": [
							"id", 
							"owner", 
							"identifier",
							"quantity"
						],
						"conditions": {
							"owner": {
								"operator": "=",
								"value": userId
							},
							"identifier": {
								"operator": "IN",
								"value": actionHistoryIdentifierList
							}
						},
						"limit": actionHistoryIdentifierList.length
					},
					{
						"tableName": "item_histories",
						"returnColumns": [
							"id", 
							"owner", 
							"identifier",
							"quantity"
						],
						"conditions": {
							"owner": {
								"operator": "=",
								"value": userId
							},
							"identifier": {
								"operator": "IN",
								"value": itemHistoryIdentifierList
							}
						},
						"limit": itemHistoryIdentifierList.length
					}
				]
			}
			const fetchHarvestedItemQueryResult = await invokeLambda('garden-select', harvestedItemPayload);
			if (!fetchHarvestedItemQueryResult) {
				throw new Error(`Failed to return value from lambda fetch harvest`);
			}

			//This can be empty if none of the harvested items exist in the inventory yet
			const harvestedItemEntityList = parseRows<InventoryItemEntity[]>(fetchHarvestedItemQueryResult[0]);
			assert(Array.isArray(harvestedItemEntityList));
			const existingHarvestedItemIdentifierList: string[] = [];
			harvestedItemEntityList.forEach((elem) => {
				if (validateInventoryItem(elem, inventoryEntity)) {
					existingHarvestedItemIdentifierList.push(elem.identifier);
				}
				return;
			});
			const existingActionHistories = parseRows<ActionHistoryEntity[]>(fetchHarvestedItemQueryResult[1]);
			assert(Array.isArray(existingActionHistories));
			const existingItemHistories = parseRows<ItemHistoryEntity[]>(fetchHarvestedItemQueryResult[2]);
			assert(Array.isArray(existingItemHistories));
			const existingActionHistoryIdentifierList: string[] = [];
			existingActionHistories.forEach((elem) => {
				existingActionHistoryIdentifierList.push(elem.identifier);
			});
			const existingItemHistoryIdentifierList: string[] = [];
			existingItemHistories.forEach((elem) => {
				existingItemHistoryIdentifierList.push(elem.identifier);
			});

			let totalExp = 0;

			//Filter harvestedItemIdentifiers between existing in inventory and not
			const harvestedItemIdentifiersToInsert: string[] = [];
			const harvestedItemIdentifiersToUpdate: string[] = [];
			harvestedItemIdentifierList.forEach((elem) => {
				totalExp += harvestedItemQuantityMap[elem] * expMap[elem];
				if (existingHarvestedItemIdentifierList.includes(elem)) {
					harvestedItemIdentifiersToUpdate.push(elem);
				} else {
					harvestedItemIdentifiersToInsert.push(elem);
				}
			})

			//Creates harvestedItems in inventory as necessary
			const insert_payload: any = {
				"queries": []
			}
			if (harvestedItemIdentifiersToInsert.length > 0) {
				const insert_values: any = [];
				harvestedItemIdentifiersToInsert.forEach((elem) => {
					const toInsert = [inventoryId, elem, harvestedItemQuantityMap[elem]];
					insert_values.push(toInsert);
				})
				if (insert_values.length > 0) {
					const harvestedItemQuery = {
						"tableName": "inventory_items",
						"columnsToWrite": [
							"owner",
							"identifier",
							"quantity"
						],
						"values": insert_values,
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
					};
					insert_payload.queries.push(harvestedItemQuery);
				}
			}
			if (actionHistoryIdentifierList.length > existingActionHistoryIdentifierList.length) {
				const insert_values: any = [];
				actionHistoryIdentifierList.forEach((elem) => {
					//Already exists, skip
					if (existingActionHistoryIdentifierList.includes(elem)) return;

					const toInsert = [userId, elem, actionHistories[elem]];
					insert_values.push(toInsert);
				})
				if (insert_values.length > 0) {
					const actionHistoryQuery = {
						"tableName": "action_histories",
						"columnsToWrite": [
							"owner",
							"identifier",
							"quantity"
						],
						"values": insert_values,
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
					insert_payload.queries.push(actionHistoryQuery);
				}
			}
			if (itemHistoryIdentifierList.length > existingItemHistoryIdentifierList.length) {
				const insert_values: any = [];
				itemHistoryIdentifierList.forEach((elem) => {
					//Already exists, skip
					if (existingItemHistoryIdentifierList.includes(elem)) return;

					const toInsert = [userId, elem, itemHistories[elem]];
					insert_values.push(toInsert);
				})
				if (insert_values.length > 0) {
					const itemHistoryQuery = {
						"tableName": "item_histories",
						"columnsToWrite": [
							"owner",
							"identifier",
							"quantity"
						],
						"values": insert_values,
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
					insert_payload.queries.push(itemHistoryQuery);
				}
			}
			
			if (insert_payload.queries.length > 0) {
				const insertQueryResult = await invokeLambda('garden-insert', insert_payload);
				if (!insertQueryResult) {
					throw new Error(`Failed to insert from lambda`);
				}
			}
			

			if (!replacementItem) {
				replacementItem = {
					identifier: '0-00-00-00-00', //hardcoded ground id
					status: '',
					usesRemaining: 0
				}
			}

			//TODO: Does not update random seed properly
			const update_payload: any = {
				"queries": [
					{
						"tableName": "plots",
						"values": {
							"plant_time": currentTime,
							"uses_remaining": {
								"operator": "-",
								"value": numHarvests
							}
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"id": {
								"operator": "IN",
								"value": plotIdsToKeep
							},
							"owner": {
								"operator": "=",
								"value": gardenId
							}
						}
					},
					{
						"tableName": "plots",
						"values": {
							"plant_time": currentTime,
							"uses_remaining": {
								"operator": "=",
								"value": replacementItem.usesRemaining
							}
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"id": {
								"operator": "IN",
								"value": plotIdsToReplace
							},
							"owner": {
								"operator": "=",
								"value": gardenId
							}
						}
					},
					{
						"tableName": "placed_items",
						"values": {
							"identifier": replacementItem.identifier,
							"status": ""
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"owner": {
								"operator": "IN",
								"value": plotIdsToReplace
							}
						}
					},
					{
						"tableName": "levels",
						"values": {
							"total_xp": {
								"operator": "+",
								"value": totalExp
							}
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"owner_uid": {
								"operator": "=",
								"value": userId
							},
							"owner_type": {
								"operator": "=",
								"value": "user"
							}
						}
					}
				]
			  }
			harvestedItemIdentifiersToUpdate.forEach((elem) => {
				const toUpdateQuery = {
					"tableName": "inventory_items",
					"values": {
						"quantity": {
							"operator": "+",
							"value": harvestedItemQuantityMap[elem]
						}
					},
					"returnColumns": [
						"id"
					],
					"conditions": {
						"owner": {
							"operator": "=",
							"value": inventoryEntity.id
						},
						"identifier": {
							"operator": "=",
							"value": elem
						}
					}
				}
				update_payload.queries.push(toUpdateQuery);
			})
			existingActionHistories.forEach((elem) => {
				const toUpdateQuery = {
					"tableName": "action_histories",
					"values": {
						"quantity": {
							"operator": "+",
							"value": actionHistories[elem.identifier]
						}
					},
					"returnColumns": [
						"id"
					],
					"conditions": {
						"id": {
							"operator": "=",
							"value": elem.id
						},
						"owner": {
							"operator": "=",
							"value": userId
						},
						"identifier": {
							"operator": "=",
							"value": elem.identifier
						}
					}
				}
				update_payload.queries.push(toUpdateQuery);
			})
			existingItemHistories.forEach((elem) => {
				const toUpdateQuery = {
					"tableName": "item_histories",
					"values": {
						"quantity": {
							"operator": "+",
							"value": itemHistories[elem.identifier]
						}
					},
					"returnColumns": [
						"id"
					],
					"conditions": {
						"id": {
							"operator": "=",
							"value": elem.id
						},
						"owner": {
							"operator": "=",
							"value": userId
						},
						"identifier": {
							"operator": "=",
							"value": elem.identifier
						}
					}
				}
				update_payload.queries.push(toUpdateQuery);
			})
			
			const updateQueryResult = await invokeLambda('garden-update', update_payload);
			if (!updateQueryResult) {
				throw new Error(`Failed to update from lambda`);
			}
			return true;
		} catch (error) {
			console.error('Error harvesting all from Lambda:', error);
			throw error;
		}
	} else {
			const innerFunction = async (client: PoolClient): Promise<boolean> => {
			// Batch fetch all plots and placedItems
			const plotEntities = await plotRepository.getPlotsByIds(plotIds);
			const placedItemEntities = await placedItemRepository.getPlacedItemsByPlotIds(plotIds);
			const gardenEntity = await gardenRepository.getGardenById(gardenId);
			if (!gardenEntity || gardenEntity.owner !== userId) {
				throw new Error(`Garden ${gardenId} is not owned by user`);
			}

			// make mapping
			// validate each plot, throwing out plots that do not match
			const replacePlotIds: string[] = [];
			const keepPlotIds: string[] = [];
			const placedItemMap = new Map<string, PlacedItemEntity>();
			let totalExp = 0;
			const harvestItemMap = new Map<string, number>();
			const plotItemMap = new Map<string, PlacedItemTemplate>();
			const plotRandomSeedMap = new Map<string, number>();
			let nonCriticalError = false;
			for (const placedItem of placedItemEntities) {
				if (!plotIds.includes(placedItem.owner)) {
					console.warn(`${placedItem} not found in plot ids, skipping`);
					nonCriticalError = true;
					continue;
				}
				const itemData = placeholderItemTemplates.getPlacedTemplate(placedItem.identifier);
				if (!itemData || itemData.subtype !== ItemSubtypes.PLANT.name) {
					console.warn(`${placedItem.identifier} is not a valid target for harvesting, skipping`);
					nonCriticalError = true;
					continue;
				}

				// Find the corresponding plot entity by matching the owner
				const plotEntity = plotEntities.find(plot => plot.id === placedItem.owner);
				if (plotEntity) {
					if (plotEntity.owner !== gardenId) {
						console.warn(`${plotEntity.id} is not owned by the target garden, skipping`);
						nonCriticalError = true;
						continue;
					}
					const plotItemTemplate = placeholderItemTemplates.getPlacedTemplate(placedItem.identifier);
					if (!plotItemTemplate || plotItemTemplate.subtype !== ItemSubtypes.PLANT.name) {
						console.warn(`Could not find valid plant matching identifier ${placedItem.identifier}, skipping`);
						nonCriticalError = true;
						continue;
					}
					const shinyTier = Plot.checkShinyHarvest(plotItemTemplate as PlantTemplate, plotEntity.random_seed, Plot.baseShinyChance);
					let harvestedItemTemplate;
					if (shinyTier === 'Regular') {
						harvestedItemTemplate = placeholderItemTemplates.getInventoryTemplate(plotItemTemplate.transformId);
					} else {
						harvestedItemTemplate = placeholderItemTemplates.getInventoryTemplate((plotItemTemplate as PlantTemplate).transformShinyIds[shinyTier].id);
					}

					// const harvestedItemTemplate = placeholderItemTemplates.getInventoryTemplate(plotItemTemplate.transformId);
					if (!harvestedItemTemplate || harvestedItemTemplate.subtype !== ItemSubtypes.HARVESTED.name) {
						console.warn(`Could not find valid harvestedItem matching identifier ${plotItemTemplate.transformId}, skipping`);
						nonCriticalError = true;
						continue;
					}

					const plantTime = stringToBigIntNumber(plotEntity.plant_time);
					if (!plantTime) {
						console.warn(`Error converting plantTime ${plotEntity.plant_time} to number, skipping`);
						nonCriticalError = true;
						continue;
					}
					
					const instantGrow = process.env.INSTANT_HARVEST_KEY === instantHarvestKey && process.env.INSTANT_HARVEST_KEY !== undefined;
					const REAL_TIME_FUDGE = 2500; //Allow for 2.5s discrepancy between harvest times

					//Check if harvest is valid
					if (!instantGrow && !Plot.canHarvest(plotItemTemplate, plantTime - REAL_TIME_FUDGE, plotEntity.uses_remaining, currentTime)) {
						console.warn(`Cannot harvest plant at plot id ${plotEntity.id} at this time, skipping`);
						nonCriticalError = true;
						continue;
					}
					// garden plot id
					if (plotEntity.uses_remaining > 1) {
						keepPlotIds.push(plotEntity.id);
					} else {
						replacePlotIds.push(plotEntity.id);
					}
					//Hardcoded 2 iterations of seed generation for harvesting
					let newSeed = plotEntity.random_seed;
					for (let i = 0; i < 2; i++) {
						newSeed = Plot.getNextRandomSeed(newSeed);
					}
					plotRandomSeedMap.set(plotEntity.id, newSeed);
					//keep track of harvested item quantities
					harvestItemMap.set(harvestedItemTemplate.id, (harvestItemMap.get(harvestedItemTemplate.id) || 0) + 1);
					plotItemMap.set(harvestedItemTemplate.id, plotItemTemplate);
					totalExp += (plotItemTemplate as PlantTemplate).baseExp;
				} else {
					console.warn(`No plot found for owner ${placedItem.owner}, skipping`);
					nonCriticalError = true;
					continue;
				}
				placedItemMap.set(placedItem.owner, placedItem);
			}

			if (!replacementItem) {
				replacementItem = {
					identifier: '0-00-00-00-00', //hardcoded ground id
					status: '',
					usesRemaining: 0
				}
			}

			if (replacePlotIds.length > 0) {
				const replaceResults = await plotRepository.setMultiplePlotDetails(replacePlotIds, currentTime, replacementItem.usesRemaining, client);

				if (replaceResults.erroredPlots.length > 0) {
					console.warn(`Error while updating plot details in ids ${replaceResults.erroredPlots}`);
					nonCriticalError = true;
				}

				const replacePlacedItemResults = await placedItemRepository.replacePlacedItemsByPlotIds(replacePlotIds, replacementItem.identifier, replacementItem.status, client);
				if (replacePlacedItemResults.erroredPlotIds.length > 0) {
					console.warn(`Error while updating placedItems in ids ${replaceResults.erroredPlots}`);
					nonCriticalError = true;
				}
			}

			if (keepPlotIds.length > 0) {
				const keepResults = await plotRepository.setMultiplePlotPlantTime(keepPlotIds, currentTime, client);
				
				await plotRepository.updateMultiplePlotUsesRemaining(keepPlotIds, -1, client);
			}

			await plotRepository.updateMultiplePlotSeed(plotRandomSeedMap, client);

			//levelsystem gains xp
			await levelRepository.gainExp(levelSystemId, totalExp, client);

			//inventory items are added
			let totalItemsAdded = 0;

			// Iterate over each entry in the harvestItemMap in sequence
			// Running this synchronously to avoid race conditions with creating multiple of the same history; 
			// could be optimized by creating histories first and iterating through those
			for (const [harvestedItemId, quantity] of Array.from(harvestItemMap.entries())) {
				const harvestedItemTemplate = placeholderItemTemplates.getInventoryTemplate(harvestedItemId);

				if (!harvestedItemTemplate || harvestedItemTemplate.subtype !== ItemSubtypes.HARVESTED.name) {
					console.warn(`Could not find valid harvestedItem matching identifier ${harvestedItemId}, skipping`);
					nonCriticalError = true;
					continue; // Skip to the next iteration
				}

				const harvestedItem = new HarvestedItem(uuidv4(), harvestedItemTemplate, quantity);

				// Add inventory item synchronously
				const result = await inventoryItemRepository.addInventoryItem(inventoryId, harvestedItem, client);
				if (!result) {
					console.warn(`Could not add harvested item ${harvestedItem.getInventoryItemId()} to inventory`);
					nonCriticalError = true;
				} else {
					totalItemsAdded += quantity;
				}

				// TODO: Add histories
				const plotItemTemplate = plotItemMap.get(harvestedItemId);
				if (!plotItemTemplate) {
					console.warn(`Could not find plot item for id ${harvestedItemId}`);
					nonCriticalError = true;
					continue;
				}

				const itemHistory = new ItemHistory(uuidv4(), harvestedItemTemplate, quantity);

				const actionCategoryHistory = actionHistoryFactory.createActionHistoryByIdentifiers(plotItemTemplate.subtype, plotItemTemplate.category, 'harvested', 1);
				if (!actionCategoryHistory) {
					console.warn(`Error generating actionHistory for id ${harvestedItemId}`);
					nonCriticalError = true;
					continue;
				}

				// Add item history and action history synchronously
				const addItemHistoryResult = await itemHistoryRepository.addItemHistory(userId, itemHistory, client);
				if (!addItemHistoryResult) {
					console.warn(`Could not add item history for ${harvestedItemId}`);
				}

				const addActionHistoryResult = await actionHistoryRepository.addActionHistory(userId, actionCategoryHistory, client);
				if (!addActionHistoryResult) {
					console.warn(`Could not add action history for ${harvestedItemId}`);
				}
			}


			//histories are updated
			const harvestAllHistory = actionHistoryFactory.createActionHistoryByIdentifiers(ItemSubtypes.PLANT.name, 'all', 'harvested', totalItemsAdded);
			if (!harvestAllHistory) throw new Error(`Could not create action history from identifier category all`);
			
			await actionHistoryRepository.addActionHistory(userId, harvestAllHistory, client);	
			
			if (nonCriticalError) return false;

			return true;
		} 

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'HarvestAll', client);
	}
}

//TODO: Implement and Test
/**
 * Picks up all decorations from plots
 * @param plotIds 
 * @param inventoryId 
 * @param gardenId
 * @param userId 
 * @param replacementItem 
 * @param client 
 * @returns 
 */
 export async function pickupAll(plotIds: string[], inventoryId: string, gardenId: string, userId: string, replacementItem?: PlacedItemDetailsEntity, client?: PoolClient): Promise<boolean> {
	//Can put validation/business logic here
	//We always check based on current time
	const currentTime = Date.now();

	/** Runs once per plot */
	function validatePlotData(plotEntity: PlotEntity, placedItemEntity: PlacedItemEntity, gardenEntity: GardenEntity): boolean {

		//make sure current plot contains plant

		const plantItemTemplate = placeholderItemTemplates.getPlacedTemplate(placedItemEntity.identifier) as DecorationTemplate;
		if (!plantItemTemplate || plantItemTemplate.subtype !== ItemSubtypes.DECORATION.name) {
			console.warn(`${placedItemEntity.identifier} is not a valid target for picking up`);
			return false;
		}

		if (placedItemEntity.owner !== plotEntity.id) {
			console.warn(`Placed item ${placedItemEntity.id} is not owned by plot ${plotEntity.id}`);
			return false;
		}

		if (plotEntity.owner !== gardenEntity.id) {
			console.warn(`Plot ${plotEntity.id} is not owned by garden ${gardenEntity.id}`);
			return false;
		}

		if (gardenEntity.owner !== userId) {
			console.warn(`Garden ${gardenEntity.id} is not owned by user ${userId}`);
			return false;
		}

		if (plotEntity.row_index >= gardenEntity.rows || plotEntity.col_index >= gardenEntity.columns) {
			console.warn(`Plot ${plotEntity.id} is not within bounds of garden ${gardenId}`);
			return false;
		}

		return true;
	}

	/** Runs once per function */
	function validateStaticData(inventoryEntity: InventoryEntity, gardenEntity: GardenEntity): boolean {
		if (inventoryEntity.owner !== userId) {
			throw new Error(`Inventory ${inventoryEntity.id} is not owned by user ${userId}`);
		}

		if (gardenEntity.owner !== userId) {
			throw new Error(`Garden ${gardenEntity.id} is not owned by user ${userId}`);
		}
		return true;
	}

	function validateInventoryItem(inventoryItemEntity: InventoryItemEntity, inventoryEntity: InventoryEntity): boolean {
		if (inventoryItemEntity.owner !== inventoryEntity.id) {
			throw new Error(`Inventory ${inventoryItemEntity.id} is not owned by inventory ${inventoryItemEntity.id}`);
		}

		//Disabled in case we want to allow harvesting seeds/decorations
		// const currentInventoryItemTemplate = placeholderItemTemplates.getInventoryTemplate(inventoryItemEntity.identifier);
		// if (!currentInventoryItemTemplate || currentInventoryItemTemplate.subtype !== ItemSubtypes.HARVESTED.name) {
		// 	console.warn(`${inventoryItemEntity.identifier} is not a valid target to add harvested items to`);
		// 	return false;
		// }

		return true;
	}

	function validateDecorationItemData(placedItemEntity: PlacedItemEntity): {decorationItemTemplate: DecorationTemplate, blueprintItemTemplate: BlueprintTemplate} | null {
		const decorationItemTemplate = placeholderItemTemplates.getPlacedTemplate(placedItemEntity.identifier);
		if (!decorationItemTemplate || decorationItemTemplate.subtype !== ItemSubtypes.DECORATION.name) {
			console.warn(`Could not find valid decoration matching identifier ${placedItemEntity.identifier}`);
			return null;
		}

		const blueprintItemTemplate = placeholderItemTemplates.getInventoryTemplate((decorationItemTemplate as DecorationTemplate).transformId) as BlueprintTemplate;
		if (!blueprintItemTemplate || blueprintItemTemplate.subtype !== ItemSubtypes.BLUEPRINT.name) {
			console.warn(`Could not find valid harvestedItem matching identifier ${(decorationItemTemplate as DecorationTemplate).transformId}`);
			return null;
		}

		if(!('transformId' in decorationItemTemplate)) {
			console.warn(`Could not find valid decoration matching identifier ${placedItemEntity.identifier}`);
			return null;
		}

		return {decorationItemTemplate: decorationItemTemplate, blueprintItemTemplate: blueprintItemTemplate};
	}

	//Get all plots that need to be harvested, from plotIds
	//Get all placedItems attached to plots
	//Get all harvestedItems that result from placedItems growing, then get all inventoryItems matching harvestedItems
	//Validate plots/placedItem/inventoryItem owners -> garden
	//Make list of all plots that need replacing (numRemaining <= numHarvest) and all that don't
	//For all plots that need replacing: set new item to replacement item, and update numRemaining/currentTime
	//For all plots that do not need replacing: reduce quantity
	//Make map of all harvested items, and the quantity harvested for each (from the plots)
	//For all harvested items, make action/itemhistories
	//Update all harvested items and histories
	//Update level with xp gained = each harvestedItem baseExp * quantity

	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			// 'SELECT id, owner, rows, columns FROM gardens WHERE id = $1 and owner = $2'
			const fetch_payload = {
				"queries": [
					{
						"tableName": "gardens",
						"returnColumns": [
							"id", 
							"owner", 
							"rows", 
							"columns"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gardenId
							},
							"owner": {
								"operator": "=",
								"value": userId
							}
						},
						"limit": 1
					},
					{
						"tableName": "plots",
						"returnColumns": [
							"id", 
							"owner", 
							"row_index", 
							"col_index", 
							"plant_time", 
							"uses_remaining", 
							"random_seed"
						],
						"conditions": {
							"id": {
								"operator": "IN",
								"value": plotIds
							},
							"owner": {
								"operator": "=",
								"value": gardenId
							}
						},
						"limit": Garden.getMaximumRows() * Garden.getMaximumCols()
					},
					{
						"tableName": "inventories",
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
						},
						"limit": 1
					},
					{
						"tableName": "placed_items",
						"returnColumns": [
							"id", 
							"owner", 
							"identifier",
							"status"
						],
						"conditions": {
							"owner": {
								"operator": "IN",
								"value": plotIds
							}
						},
						"limit": Garden.getMaximumRows() * Garden.getMaximumCols()
					}
				]
			  }

			const fetchQueryResult = await invokeLambda('garden-select', fetch_payload);
			if (!fetchQueryResult) {
				throw new Error(`Failed to return value from lambda`);
			}
			const gardenEntity = parseRows<GardenEntity[]>(fetchQueryResult[0])[0];
			assert(gardenRepository.validateGardenEntity(gardenEntity));
			const plotEntityList = parseRows<PlotEntity[]>(fetchQueryResult[1]);
			assert(Array.isArray(plotEntityList));
			const inventoryEntity = parseRows<InventoryEntity[]>(fetchQueryResult[2])[0];
			assert(inventoryRepository.validateInventoryEntity(inventoryEntity));
			const placedItemEntityList = parseRows<PlacedItemEntity[]>(fetchQueryResult[3]);
			assert(Array.isArray(placedItemEntityList));

			//Validate the plant item and one off things
			assert(validateStaticData(inventoryEntity, gardenEntity));

			//Map of plotId -> placedItem
			const placedItemsMap: Record<string, PlacedItemEntity> = {}
			placedItemEntityList.forEach((elem, index) => {
				placedItemsMap[elem.owner] = elem;
			})

			//Generate list of valid plots
			const validatedPlotEntityList: PlotEntity[] = [];
			plotEntityList.forEach((elem) => {
				if (validatePlotData(elem, placedItemsMap[elem.id], gardenEntity)) {
					validatedPlotEntityList.push(elem);
				}
			})
			
			const plotIdsToReplace: string[] = [];
			const blueprintIdentifierList: string[] = [];
			const blueprintQuantityMap: Record<string, number> = {};

			//For every plot, update how many quantity harvested for that item
			validatedPlotEntityList.forEach((elem) => {
				const placedItemEntity = placedItemsMap[elem.id];
				const validateResult = validateDecorationItemData(placedItemEntity);
				if (!validateResult) return;
				const {decorationItemTemplate, blueprintItemTemplate} = validateResult;
				if (!blueprintIdentifierList.includes(blueprintItemTemplate.id)) {
					blueprintIdentifierList.push(blueprintItemTemplate.id);
				}
				blueprintQuantityMap[blueprintItemTemplate.id] = (blueprintQuantityMap[blueprintItemTemplate.id] || 0) + 1;
				plotIdsToReplace.push(elem.id);
			})

			const blueprintItemPayload = {
				"queries": [
					{
						"tableName": "inventory_items",
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
								"operator": "IN",
								"value": blueprintIdentifierList
							}
						},
						"limit": blueprintIdentifierList.length
					}
				]
			}
			const fetchBlueprintItemQueryResult = await invokeLambda('garden-select', blueprintItemPayload);
			if (!fetchBlueprintItemQueryResult) {
				throw new Error(`Failed to return value from lambda fetch harvest`);
			}

			//This can be empty if none of the blueprint items exist in the inventory yet
			const blueprintItemEntityList = parseRows<InventoryItemEntity[]>(fetchBlueprintItemQueryResult[0]);
			assert(Array.isArray(blueprintItemEntityList));
			const existingBlueprintItemIdentifierList: string[] = [];
			blueprintItemEntityList.forEach((elem) => {
				if (validateInventoryItem(elem, inventoryEntity)) {
					existingBlueprintItemIdentifierList.push(elem.identifier);
				}
				return;
			});

			//Filter harvestedItemIdentifiers between existing in inventory and not
			const blueprintItemIdentifiersToInsert: string[] = [];
			const blueprintItemIdentifiersToUpdate: string[] = [];
			blueprintIdentifierList.forEach((elem) => {
				if (existingBlueprintItemIdentifierList.includes(elem)) {
					blueprintItemIdentifiersToUpdate.push(elem);
				} else {
					blueprintItemIdentifiersToInsert.push(elem);
				}
			})

			//Creates blueprintItems in inventory as necessary
			const insert_payload: any = {
				"queries": []
			}
			if (blueprintItemIdentifiersToInsert.length > 0) {
				const insert_values: any = [];
				blueprintItemIdentifiersToInsert.forEach((elem) => {
					const toInsert = [inventoryId, elem, blueprintQuantityMap[elem]];
					insert_values.push(toInsert);
				})
				if (insert_values.length > 0) {
					const harvestedItemQuery = {
						"tableName": "inventory_items",
						"columnsToWrite": [
							"owner",
							"identifier",
							"quantity"
						],
						"values": insert_values,
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
					};
					insert_payload.queries.push(harvestedItemQuery);
				}
			}
			
			if (insert_payload.queries.length > 0) {
				const insertQueryResult = await invokeLambda('garden-insert', insert_payload);
				if (!insertQueryResult) {
					throw new Error(`Failed to insert from lambda`);
				}
			}
			

			if (!replacementItem) {
				replacementItem = {
					identifier: '0-00-00-00-00', //hardcoded ground id
					status: '',
					usesRemaining: 0
				}
			}
			const update_payload: any = {
				"queries": [
					{
						"tableName": "plots",
						"values": {
							"plant_time": currentTime,
							"uses_remaining": replacementItem.usesRemaining
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"id": {
								"operator": "IN",
								"value": plotIdsToReplace
							},
							"owner": {
								"operator": "=",
								"value": gardenId
							}
						}
					},
					{
						"tableName": "placed_items",
						"values": {
							"identifier": replacementItem.identifier,
							"status": ""
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"owner": {
								"operator": "IN",
								"value": plotIdsToReplace
							}
						}
					}
				]
			  }
			blueprintItemIdentifiersToUpdate.forEach((elem) => {
				const toUpdateQuery = {
					"tableName": "inventory_items",
					"values": {
						"quantity": {
							"operator": "+",
							"value": blueprintQuantityMap[elem]
						}
					},
					"returnColumns": [
						"id"
					],
					"conditions": {
						"owner": {
							"operator": "=",
							"value": inventoryEntity.id
						},
						"identifier": {
							"operator": "=",
							"value": elem
						}
					}
				}
				update_payload.queries.push(toUpdateQuery);
			})
			const updateQueryResult = await invokeLambda('garden-update', update_payload);
			if (!updateQueryResult) {
				throw new Error(`Failed to update from lambda`);
			}
			return true;
		} catch (error) {
			console.error('Error picking up all decorations from Lambda:', error);
			throw error;
		}
	} else {
			const innerFunction = async (client: PoolClient): Promise<boolean> => {
			// Batch fetch all plots and placedItems
			const plotEntities = await plotRepository.getPlotsByIds(plotIds);
			const placedItemEntities = await placedItemRepository.getPlacedItemsByPlotIds(plotIds);
			const gardenEntity = await gardenRepository.getGardenById(gardenId);
			if (!gardenEntity || gardenEntity.owner !== userId) {
				throw new Error(`Garden ${gardenId} is not owned by user`);
			}

			// make mapping
			// validate each plot, throwing out plots that do not match
			const replacePlotIds: string[] = [];
			const placedItemMap = new Map<string, PlacedItemEntity>();
			const blueprintItemMap = new Map<string, number>();
			const plotItemMap = new Map<string, PlacedItemTemplate>();
			let nonCriticalError = false;
			for (const placedItem of placedItemEntities) {
				if (!plotIds.includes(placedItem.owner)) {
					console.warn(`${placedItem} not found in plot ids, skipping`);
					nonCriticalError = true;
					continue;
				}
				const itemData = placeholderItemTemplates.getPlacedTemplate(placedItem.identifier);
				if (!itemData || itemData.subtype !== ItemSubtypes.DECORATION.name) {
					console.warn(`${placedItem.identifier} is not a valid target for picking up, skipping`);
					nonCriticalError = true;
					continue;
				}

				// Find the corresponding plot entity by matching the owner
				const plotEntity = plotEntities.find(plot => plot.id === placedItem.owner);
				if (plotEntity) {
					if (plotEntity.owner !== gardenId) {
						console.warn(`${plotEntity.id} is not owned by the target garden, skipping`);
						nonCriticalError = true;
						continue;
					}
					const plotItemTemplate = placeholderItemTemplates.getPlacedTemplate(placedItem.identifier);
					if (!plotItemTemplate || plotItemTemplate.subtype !== ItemSubtypes.DECORATION.name) {
						console.warn(`Could not find valid decoration matching identifier ${placedItem.identifier}, skipping`);
						nonCriticalError = true;
						continue;
					}
					let blueprintItemTemplate = placeholderItemTemplates.getInventoryTemplate(plotItemTemplate.transformId);

					if (!blueprintItemTemplate || blueprintItemTemplate.subtype !== ItemSubtypes.BLUEPRINT.name) {
						console.warn(`Could not find valid blueprintItem matching identifier ${plotItemTemplate.transformId}, skipping`);
						nonCriticalError = true;
						continue;
					}

					//keep track of harvested item quantities
					blueprintItemMap.set(blueprintItemTemplate.id, (blueprintItemMap.get(blueprintItemTemplate.id) || 0) + 1);
					plotItemMap.set(blueprintItemTemplate.id, plotItemTemplate);
					replacePlotIds.push(plotEntity.id);
				} else {
					console.warn(`No plot found for owner ${placedItem.owner}, skipping`);
					nonCriticalError = true;
					continue;
				}
				placedItemMap.set(placedItem.owner, placedItem);
			}

			if (!replacementItem) {
				replacementItem = {
					identifier: '0-00-00-00-00', //hardcoded ground id
					status: '',
					usesRemaining: 0
				}
			}

			if (replacePlotIds.length > 0) {
				const replaceResults = await plotRepository.setMultiplePlotDetails(replacePlotIds, currentTime, replacementItem.usesRemaining, client);

				if (replaceResults.erroredPlots.length > 0) {
					console.warn(`Error while updating plot details in ids ${replaceResults.erroredPlots}`);
					nonCriticalError = true;
				}

				const replacePlacedItemResults = await placedItemRepository.replacePlacedItemsByPlotIds(replacePlotIds, replacementItem.identifier, replacementItem.status, client);
				if (replacePlacedItemResults.erroredPlotIds.length > 0) {
					console.warn(`Error while updating placedItems in ids ${replaceResults.erroredPlots}`);
					nonCriticalError = true;
				}
			}

			const updateInventoryPromises: Promise<any>[] = [];

			blueprintItemMap.forEach((value, key) => {
				const itemTemplate = placeholderItemTemplates.getInventoryTemplate(key);
				if (!itemTemplate) {
					console.warn(`Error while updating inventoryItems with id ${key}`);
					nonCriticalError = true;
					return;
				}
				const item = generateNewPlaceholderInventoryItem(itemTemplate.name, value);
				
				// Create a promise and push it to the array
				const updateInventoryItemPromise = inventoryItemRepository.addInventoryItem(inventoryId, item, client)
					.then(updateInventoryItemResult => {
						if (!updateInventoryItemResult) {
							console.warn(`Error while updating inventoryItems with id ${key}`);
							nonCriticalError = true;
						}
					});

				updateInventoryPromises.push(updateInventoryItemPromise);
			});

			// Await all promises at the end
			await Promise.all(updateInventoryPromises);

			if (nonCriticalError) return false;

			return true;
		} 

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'HarvestAll', client);
	}
}



/**
 * @returns a garden plain object
 */
export async function getGardenFromDatabase(gardenId: string, userId: string, client?: PoolClient): Promise<any> {

	//Get garden entity -> verify id
	//Get all plots tied to owner = gardenId
	//Get all placedItems tied to owner = any of plotId
	//Build map of plotId->placedItemObject
	//Build map of coords -> plotEntity + placedItemObject
	//Fill in garden instance with plots

	function validateGardenData(gardenEntity: any): boolean {
		assert(gardenRepository.validateGardenEntity(gardenEntity));

		if (gardenEntity.owner !== userId) {
			throw new Error(`Invalid owner of garden ${gardenId}`);
		}
		return true;
	}

	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {

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
							"id": {
								"operator": "=",
								"value": gardenId
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
							"row_index", 
							"col_index", 
							"plant_time", 
							"uses_remaining", 
							"random_seed"
						],
						"tableName": "plots",
						"conditions": {
							"owner": {
								"operator": "=",
								"value": gardenId
								}
						},
						"limit": Garden.getMaximumRows() * Garden.getMaximumCols()
					}
				]
			  }
			const queryResult = await invokeLambda('garden-select', fetch_payload);
			const gardenEntity = parseRows<GardenEntity[]>(queryResult[0])[0];
			const plotEntityList = parseRows<PlotEntity[]>(queryResult[1]);
			assert(validateGardenData(gardenEntity));
			const plotIds: string[] = [];
			plotEntityList.forEach((elem, index) => {
				plotIds.push(elem.id);
			})
			const fetchPlacedItemsPayload = {
				"queries": [
					{
						"returnColumns": [
							"id",
							"owner",
							"identifier",
							"status"
						],
						"tableName": "placed_items",
						"conditions": {
							"owner": {
								"operator": "IN",
								"value": plotIds
								}
						},
						"limit": Garden.getMaximumRows() * Garden.getMaximumCols()
					}
				]
			}

			const placedItemsQueryResult = await invokeLambda('garden-select', fetchPlacedItemsPayload);
			const placedItemsEntityList = parseRows<PlacedItemEntity[]>(placedItemsQueryResult[0]);
			const placedItemsMap: Record<string, PlacedItem> = {}
			placedItemsEntityList.forEach((elem, index) => {
				placedItemsMap[elem.owner] = placedItemRepository.makePlacedItemObject(elem);
			})

			const plots: Plot[][] = Garden.generateEmptyPlots(Garden.getMaximumRows(), Garden.getMaximumCols());
			plotEntityList.forEach((plotEntity, index) => {
				const plot = plotRepository.makePlotObject(plotEntity, placedItemsMap[plotEntity.id]);
				const row = plotEntity.row_index;
				const col = plotEntity.col_index;
				plots[row][col] = plot;
			})

			const gardenInstance = gardenRepository.makeGardenObject(gardenEntity, plots);
			return gardenInstance.toPlainObject();
		} catch (error) {
			console.error('Error fetching garden from Lambda:', error);
			throw error;
		}
	} else {
		const innerFunction = async (client: PoolClient) => {
			//Create garden
			const gardenResult = await gardenRepository.getGardenById(gardenId);
			// Check if result is valid
			if (!gardenResult) {
				throw new Error(`Could not find the garden for id ${gardenId}`);
			}
			assert(validateGardenData(gardenResult));
			
			const plots = await gardenRepository.getPlots(gardenResult.id);
			const gardenInstance = gardenRepository.makeGardenObject(gardenResult, plots);

			return gardenInstance.toPlainObject();
		}
		// Call transactionWrapper with inner function and description
		return transactionWrapper(innerFunction, 'fetchGardenFromDatabase', client);
	}
}
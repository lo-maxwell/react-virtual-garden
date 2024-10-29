import { pool } from "@/backend/connection/db";
import gardenRepository from "@/backend/repositories/garden/gardenRepository";
import levelRepository from "@/backend/repositories/level/levelRepository";
import { Garden } from "@/models/garden/Garden";
import { PoolClient } from "pg";
import { transactionWrapper } from "../utility/utility";
import plotRepository from "@/backend/repositories/garden/plot/plotRepository";
import inventoryItemRepository from "@/backend/repositories/items/inventoryItem/inventoryItemRepository";
import placedItemRepository from "@/backend/repositories/items/placedItem/placedItemRepository";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { PlacedItemDetailsEntity, PlacedItemEntity } from "@/models/items/placedItems/PlacedItem";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import { PlantTemplate } from "@/models/items/templates/models/PlantTemplate";
import { SeedTemplate } from "@/models/items/templates/models/SeedTemplate";
import actionHistoryRepository from "@/backend/repositories/user/actionHistoryRepository";
import itemHistoryRepository from "@/backend/repositories/user/itemHistoryRepository";
import userRepository from "@/backend/repositories/user/userRepository";
import { Plot } from "@/models/garden/Plot";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { actionHistoryFactory } from "@/models/user/history/actionHistory/ActionHistoryFactory";
import ItemHistory from "@/models/user/history/itemHistory/ItemHistory";
import { stringToBigIntNumber } from "@/models/utility/BigInt";
import { HarvestedItemTemplate } from "@/models/items/templates/models/HarvestedItemTemplate";
import { v4 as uuidv4 } from 'uuid';
import { PlacedItemTemplate } from "@/models/items/templates/models/PlacedItemTemplate";

/**
 * Attempts to add a row (expand the column size) of the garden
 * @userId the id of the owner of the garden, used for checking level
 * @gardenId the id of the garden
 * @client if null, creates a new client
 * @returns an object containing the modified level system, plot, and inventoryItem on success (or throws error)
 */
export async function addGardenRow(userId: string, gardenId: string, client?: PoolClient): Promise<boolean> {
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

		// Business logic to check if a row can be added
		if (!Garden.canAddRow(gardenEntity.rows, levelSystemEntity.level)) {
			throw new Error(`Cannot add row to garden`);
		}
		
		// Update the garden size
		await gardenRepository.updateGardenSize(gardenId, 1, 0, client);

		return true;
	};

	// Call the transactionWrapper with the innerFunction and appropriate arguments
	return transactionWrapper(innerFunction, 'addGardenRow', client);
}


/**
 * Attempts to remove a row (shrink the column size) of the garden
 * @userId the id of the owner of the garden, used for checking level
 * @gardenId the id of the garden
 * @client if null, creates a new client
 * @returns an object containing the modified level system, plot, and inventoryItem on success (or throws error)
 */
export async function removeGardenRow(userId: string, gardenId: string, client?: PoolClient): Promise<boolean> {
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

/**
 * Attempts to add a column (expand the row size) of the garden
 * @userId the id of the owner of the garden, used for checking level
 * @gardenId the id of the garden
 * @client if null, creates a new client
 * @returns an object containing the modified level system, plot, and inventoryItem on success (or throws error)
 */
export async function addGardenColumn(userId: string, gardenId: string, client?: PoolClient): Promise<boolean> {
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
		if (!Garden.canAddColumn(gardenEntity.columns, levelSystemEntity.level)) {
			throw new Error(`Cannot add column to garden`);
		}
		
		// Update the garden size
		await gardenRepository.updateGardenSize(gardenId, 0, 1, client);

		return true;
	};

	// Call the transactionWrapper with the innerFunction and appropriate arguments
	return transactionWrapper(innerFunction, 'addGardenColumn', client);
}

/**
 * Attempts to remove a column (shrink the row size) of the garden
 * @userId the id of the owner of the garden, used for checking level
 * @gardenId the id of the garden
 * @client if null, creates a new client
 * @returns an object containing the modified level system, plot, and inventoryItem on success (or throws error)
 */
export async function removeGardenColumn(userId: string, gardenId: string, client?: PoolClient): Promise<boolean> {
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

export async function getGardenSize(userId: string, gardenId: string, client?: PoolClient) {
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


export async function plantAll(plotIds: string[], inventoryId: string, inventoryItemIdentifier: string, userId: string, client?: PoolClient): Promise<boolean> {
	const currentTime = Date.now();
	if (plotIds.length === 0) {
		return false;
	}

	const innerFunction = async (client: PoolClient): Promise<boolean> => {
		let nonCriticalError = false;
		// Batch fetch all plots and placedItems
		const plotEntities = await plotRepository.getPlotsByIds(plotIds);
		const placedItemEntities = await placedItemRepository.getPlacedItemsByPlotIds(plotIds);
		
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

/**
 * Harvests a maximum of 1 item per plot at a time
 * @param plotIds 
 * @param inventoryId 
 * @param levelSystemId 
 * @param userId 
 * @param replacementItem 
 * @param instantHarvestKey 
 * @param client 
 * @returns 
 */
export async function harvestAll(plotIds: string[], inventoryId: string, levelSystemId: string, userId: string, replacementItem?: PlacedItemDetailsEntity, instantHarvestKey?: string, client?: PoolClient): Promise<boolean> {
	//Can put validation/business logic here
	//We always check based on current time
	const currentTime = Date.now();

	const innerFunction = async (client: PoolClient): Promise<boolean> => {
		// Batch fetch all plots and placedItems
		const plotEntities = await plotRepository.getPlotsByIds(plotIds);
		const placedItemEntities = await placedItemRepository.getPlacedItemsByPlotIds(plotIds);

		// make mapping
		// validate each plot, throwing out plots that do not match
		const replacePlotIds: string[] = [];
		const keepPlotIds: string[] = [];
		const placedItemMap = new Map<string, PlacedItemEntity>();
		let totalExp = 0;
		const harvestItemMap = new Map<string, number>();
		const plotItemMap = new Map<string, PlacedItemTemplate>();
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
				const plotItemTemplate = placeholderItemTemplates.getPlacedTemplate(placedItem.identifier);
				if (!plotItemTemplate || plotItemTemplate.subtype !== ItemSubtypes.PLANT.name) {
					console.warn(`Could not find valid plant matching identifier ${placedItem.identifier}, skipping`);
					nonCriticalError = true;
					continue;
				}

				const harvestedItemTemplate = placeholderItemTemplates.getInventoryTemplate(plotItemTemplate.transformId);
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
				const REAL_TIME_FUDGE = 2000; //Allow for 1s discrepancy between harvest times

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

		//levelsystem gains xp
		await levelRepository.gainExp(levelSystemId, totalExp, client);

		//inventory items are added
		let totalItemsAdded = 0;
		const promises: Promise<void>[] = []; // Array to hold promises

		harvestItemMap.forEach((quantity, harvestedItemId) => {
			const harvestedItemTemplate = placeholderItemTemplates.getInventoryTemplate(harvestedItemId);
			if (!harvestedItemTemplate || harvestedItemTemplate.subtype !== ItemSubtypes.HARVESTED.name) {
				console.warn(`Could not find valid harvestedItem matching identifier ${harvestedItemId}, skipping`);
				nonCriticalError = true;
				return; // Skip to the next iteration
			}

			const harvestedItem = new HarvestedItem(uuidv4(), harvestedItemTemplate, quantity);
			
			// Create a promise for adding the inventory item
			const addInventoryPromise = inventoryItemRepository.addInventoryItem(inventoryId, harvestedItem, client)
				.then(result => {
					if (!result) {
						console.warn(`Could not add harvested item ${harvestedItem.getInventoryItemId()} to inventory`);
						nonCriticalError = true;
					} else {
						totalItemsAdded += quantity;
					}
				});

			promises.push(addInventoryPromise); // Add the promise to the array

			// TODO: Add histories
			const plotItemTemplate = plotItemMap.get(harvestedItemId);
			if (!plotItemTemplate) {
				console.warn(`Could not find plot item for id ${harvestedItemId}`);
				nonCriticalError = true;
				return;
			}
			
			const itemHistory = new ItemHistory(uuidv4(), plotItemTemplate, quantity);
			
			const actionCategoryHistory = actionHistoryFactory.createActionHistoryByIdentifiers(plotItemTemplate.subtype, plotItemTemplate.category, 'harvested', 1);
			if (!actionCategoryHistory) {
				console.warn(`Error generating actionHistory for id ${harvestedItemId}`);
				nonCriticalError = true;
				return;
			}

			// Create promises for adding item history and action history
			const addItemHistoryPromise = itemHistoryRepository.addItemHistory(userId, itemHistory, client)
				.then((result) => {
					if (!result) {
						console.log(`Could not add item history for ${harvestedItemId}`);
					}
				});

			const addActionHistoryPromise = actionHistoryRepository.addActionHistory(userId, actionCategoryHistory, client)
				.then((result) => {
					if (!result) {
						console.log(`Could not add action history for ${harvestedItemId}`);
					}
				});

			// Push the promises to the array
			promises.push(addItemHistoryPromise);
			promises.push(addActionHistoryPromise);
		});

		// Wait for all promises to resolve
		await Promise.all(promises);

		//histories are updated
		const harvestAllHistory = actionHistoryFactory.createActionHistoryByIdentifiers(ItemSubtypes.PLANT.name, 'all', 'harvested', totalItemsAdded);
		if (!harvestAllHistory) throw new Error(`Could not create action history from identifier category all`);
		
		await actionHistoryRepository.addActionHistory(userId, harvestAllHistory, client);	
		
		if (nonCriticalError) return false;

		return true;
	} 

	// Call the transactionWrapper with the innerFunction and appropriate arguments
	return transactionWrapper(innerFunction, 'HarvestPlant', client);
}



/**
 * @returns a garden plain object
 */
export async function getGardenFromDatabase(gardenId: string, userId: string, client?: PoolClient): Promise<any> {
	const innerFunction = async (client: PoolClient) => {
		//Create garden
		const gardenResult = await gardenRepository.getGardenById(gardenId);
		// Check if result is valid
		if (!gardenResult) {
			throw new Error(`Could not find the garden for id ${gardenId}`);
		}
		if (gardenResult.owner !== userId) {
			throw new Error(`Invalid owner of garden ${gardenId}`);
		}
		const gardenInstance = await gardenRepository.makeGardenObject(gardenResult);

		return gardenInstance.toPlainObject();
	}
	// Call transactionWrapper with inner function and description
	return transactionWrapper(innerFunction, 'fetchGardenFromDatabase', client);
}
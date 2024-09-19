import { pool } from "@/backend/connection/db";
import plotRepository from "@/backend/repositories/garden/plot/plotRepository";
import inventoryItemRepository from "@/backend/repositories/items/inventoryItem/inventoryItemRepository";
import placedItemRepository from "@/backend/repositories/items/placedItem/placedItemRepository";
import inventoryRepository from "@/backend/repositories/itemStore/inventory/inventoryRepository";
import levelRepository from "@/backend/repositories/level/levelRepository";
import { Plot, PlotEntity } from "@/models/garden/Plot";
import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { InventoryItemEntity } from "@/models/items/inventoryItems/InventoryItem";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { PlacedItem, PlacedItemDetailsEntity, PlacedItemEntity } from "@/models/items/placedItems/PlacedItem";
import { generateNewPlaceholderInventoryItem } from "@/models/items/PlaceholderItems";
import { itemTemplateInterfaceRepository } from "@/models/items/templates/interfaces/ItemTemplateRepository";
import { BlueprintTemplate } from "@/models/items/templates/models/BlueprintTemplate";
import { ItemTemplateRepository } from "@/models/items/templates/models/ItemTemplateRepository";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import { PlantTemplate } from "@/models/items/templates/models/PlantTemplate";
import { SeedTemplate } from "@/models/items/templates/models/SeedTemplate";
import { getItemClassFromSubtype } from "@/models/items/utility/classMaps";
import { stringToBigIntNumber } from "@/models/utility/BigInt";
import { PoolClient } from "pg";
import { v4 as uuidv4 } from 'uuid';
import { transactionWrapper } from "../../utility/utility";

/**
 * Attempts to plant a seed, removing the respective seed item from the inventory.
 * @plotId the plot to add the item to
 * @inventoryId the inventory to remove the seed from
 * @inventoryItemId the seed item
 * @client if null, creates a new client
 * @returns an object containing the modified level system, plot, and inventoryItem on success (or throws error)
 */
export async function plantSeed(plotId: string, inventoryId: string, inventoryItemId: string, client?: PoolClient): Promise<boolean> {
	//Can put validation/business logic here
	//We always check based on current time
	const currentTime = Date.now();

	const innerFunction = async (client: PoolClient): Promise<boolean> => {

		// Grab all relevant objects concurrently
		const results = await Promise.allSettled([
			plotRepository.getPlotById(plotId),
			inventoryRepository.getInventoryById(inventoryId),
			placedItemRepository.getPlacedItemByPlotId(plotId),
			inventoryItemRepository.getInventoryItemById(inventoryItemId)
		]);

		// Destructure the results for easier access
		const [plotResult, inventoryResult, placedItemResult, inventoryItemResult] = results;

		// Check for errors in each promise and handle accordingly
		if (plotResult.status === 'rejected' || plotResult.value === null) {
			throw new Error(`Could not find plot matching id ${plotId}`);
		}
		if (inventoryResult.status === 'rejected' || inventoryResult.value === null) {
			throw new Error(`Could not find inventory matching id ${inventoryId}`);
		}
		if (placedItemResult.status === 'rejected' || placedItemResult.value === null) {
			throw new Error(`Could not find placedItem matching plot id ${plotId}`);
		}
		if (inventoryItemResult.status === 'rejected' || inventoryItemResult.value === null) {
			throw new Error(`Could not find inventoryItem matching id ${inventoryItemId}`);
		}

		// Extract the resolved values
		const plotEntity = plotResult.value;
		const inventoryEntity = inventoryResult.value;
		const inventoryItemEntity = inventoryItemResult.value;
		const placedItemEntity = placedItemResult.value;
		const seedItemTemplate = placeholderItemTemplates.getInventoryTemplate(inventoryItemEntity.identifier);
		if (!seedItemTemplate || seedItemTemplate.subtype !== ItemSubtypes.SEED.name) {
			throw new Error(`Could not find valid seed matching identifier ${inventoryItemEntity.identifier}`);
		}

		const plantItemTemplate = placeholderItemTemplates.getPlacedTemplate((seedItemTemplate as SeedTemplate).transformId);
		if (!plantItemTemplate || plantItemTemplate.subtype !== ItemSubtypes.PLANT.name) {
			throw new Error(`Could not find valid plant matching identifier ${(seedItemTemplate as SeedTemplate).transformId}`);
		}

		//Check if placement is valid
		//make sure inventory contains item
		if (inventoryItemEntity.owner !== inventoryEntity.id) {
			throw new Error(`Inventory item ${inventoryItemEntity.id} is not owned by owner ${inventoryEntity.id}`);
		}
		if (inventoryItemEntity.quantity < 1) {
			throw new Error(`Inventory item lacks required quantity`);
		}
		//make sure current plot contains ground
		const currentPlotItemTemplate = placeholderItemTemplates.getPlacedTemplate(placedItemEntity.identifier);
		if (!currentPlotItemTemplate || currentPlotItemTemplate.subtype !== ItemSubtypes.GROUND.name) {
			throw new Error(`Could not find valid ground matching identifier ${placedItemEntity.identifier}`);
		}

		//placement is OK

		//remove 1 quantity of the blueprint from inventory
		await inventoryItemRepository.updateInventoryItemQuantity(inventoryItemEntity.id, -1, client);

		//plot details are updated
		
		await plotRepository.setPlotDetails(plotId, currentTime, (plantItemTemplate as PlantTemplate).numHarvests, client);
		await placedItemRepository.replacePlacedItemByPlotId(plotId, plantItemTemplate.id, '', client);

		return true;
	} 

	// Call the transactionWrapper with the innerFunction and appropriate arguments
	return transactionWrapper(innerFunction, 'PlantSeed', client);
}

/**
 * Attempts to place a decoration, removing the respective blueprint item from the inventory.
 * @plotId the plot to add the item to
 * @inventoryId the inventory to remove the blueprint from
 * @inventoryItemId the blueprint item
 * @client if null, creates a new client
 * @returns an object containing the modified level system, plot, and inventoryItem on success (or throws error)
 */
export async function placeDecoration(plotId: string, inventoryId: string, inventoryItemId: string, client?: PoolClient): Promise<boolean> {
	//Can put validation/business logic here
	//We always check based on current time
	const currentTime = Date.now();

	const shouldReleaseClient = !client;
	if (!client) {
		client = await pool.connect();
	}
	try {
		if (shouldReleaseClient) {
			await client.query('BEGIN'); // Start the transaction
		}

		// Grab all relevant objects concurrently
		const results = await Promise.allSettled([
			plotRepository.getPlotById(plotId),
			inventoryRepository.getInventoryById(inventoryId),
			placedItemRepository.getPlacedItemByPlotId(plotId),
			inventoryItemRepository.getInventoryItemById(inventoryItemId)
		]);

		// Destructure the results for easier access
		const [plotResult, inventoryResult, placedItemResult, inventoryItemResult] = results;

		// Check for errors in each promise and handle accordingly
		if (plotResult.status === 'rejected' || plotResult.value === null) {
			throw new Error(`Could not find plot matching id ${plotId}`);
		}
		if (inventoryResult.status === 'rejected' || inventoryResult.value === null) {
			throw new Error(`Could not find inventory matching id ${inventoryId}`);
		}
		if (placedItemResult.status === 'rejected' || placedItemResult.value === null) {
			throw new Error(`Could not find placedItem matching plot id ${plotId}`);
		}
		if (inventoryItemResult.status === 'rejected' || inventoryItemResult.value === null) {
			throw new Error(`Could not find inventoryItem matching id ${inventoryItemId}`);
		}

		// Extract the resolved values
		const plotEntity = plotResult.value;
		const inventoryEntity = inventoryResult.value;
		const inventoryItemEntity = inventoryItemResult.value;
		const placedItemEntity = placedItemResult.value;
		const blueprintItemTemplate = placeholderItemTemplates.getInventoryTemplate(inventoryItemEntity.identifier);
		if (!blueprintItemTemplate || blueprintItemTemplate.subtype !== ItemSubtypes.BLUEPRINT.name) {
			throw new Error(`Could not find valid blueprint matching identifier ${inventoryItemEntity.identifier}`);
		}

		const decorationItemTemplate = placeholderItemTemplates.getPlacedTemplate((blueprintItemTemplate as BlueprintTemplate).transformId);
		if (!decorationItemTemplate || decorationItemTemplate.subtype !== ItemSubtypes.DECORATION.name) {
			throw new Error(`Could not find valid decoration matching identifier ${(blueprintItemTemplate as BlueprintTemplate).transformId}`);
		}

		//Check if placement is valid
		//make sure inventory contains item
		if (inventoryItemEntity.owner !== inventoryEntity.id) {
			throw new Error(`Inventory item ${inventoryItemEntity.id} is not owned by owner ${inventoryEntity.id}`);
		}
		if (inventoryItemEntity.quantity < 1) {
			throw new Error(`Inventory item lacks required quantity`);
		}
		//make sure current plot contains ground
		const currentPlotItemTemplate = placeholderItemTemplates.getPlacedTemplate(placedItemEntity.identifier);
		if (!currentPlotItemTemplate || currentPlotItemTemplate.subtype !== ItemSubtypes.GROUND.name) {
			throw new Error(`Could not find valid ground matching identifier ${placedItemEntity.identifier}`);
		}

		//placement is OK

		//remove 1 quantity of the blueprint from inventory
		await inventoryItemRepository.updateInventoryItemQuantity(inventoryItemEntity.id, -1, client);

		//plot details are updated
		//Decorations always have 0 uses remaining, until we change something
		await plotRepository.setPlotDetails(plotId, currentTime, 0, client);
		await placedItemRepository.replacePlacedItemByPlotId(plotId, decorationItemTemplate.id, '', client);

		if (shouldReleaseClient) {
			await client.query('COMMIT'); // Rollback the transaction on error
		}
		return true;
	} catch (error) {
		if (shouldReleaseClient) {
			await client.query('ROLLBACK'); // Rollback the transaction on error
		}
		console.error('Error placing decoration:', error);
		throw error; // Rethrow the error for higher-level handling
	} finally {
		if (shouldReleaseClient) {
			client.release(); // Release the client back to the pool
		}
	}
}

interface harvestPlotObjects {
	plainLevelSystemObject: any,
	plainPlotObject: any,
	plainInventoryItemObject: any
}

/**
 * Attempts to harvest a plot, removing the item from it and adding it to the inventory.
 * TODO: In most cases users can only harvest 1 item at a time, need additional validation to ensure that users don't spoof numHarvests
 * Gains xp on success.
 * @plotId the plot to remove the item from
 * @inventoryId the inventory to add the harvested item to
 * @numHarvests the number of harvests to attempt
 * @replacementItem a placedItemDetailsEntity to replace the plot if its usesRemaining drop to 0, defaults to ground
 * @instantHarvestKey if matches the key in the environment, ignores harvest timers
 * @client if null, creates a new client
 * @returns an object containing the harvested item on success (or throws error)
 */
export async function harvestPlot(plotId: string, inventoryId: string, levelSystemId: string, numHarvests: number, replacementItem?: PlacedItemDetailsEntity, instantHarvestKey?: string, client?: PoolClient): Promise<InventoryItemEntity> {
	//Can put validation/business logic here
	//We always check based on current time
	const currentTime = Date.now();
	if (numHarvests <= 0) {
		throw new Error(`Invalid number of harvests`);
	}

	const innerFunction = async (client: PoolClient): Promise<InventoryItemEntity> => {
		// Grab all relevant objects concurrently
		const results = await Promise.allSettled([
			plotRepository.getPlotById(plotId),
			inventoryRepository.getInventoryById(inventoryId),
			levelRepository.getLevelSystemById(levelSystemId),
			placedItemRepository.getPlacedItemByPlotId(plotId)
		]);

		// Destructure the results for easier access
		const [plotResult, inventoryResult, levelSystemResult, placedItemResult] = results;

		// Check for errors in each promise and handle accordingly
		if (plotResult.status === 'rejected' || plotResult.value === null) {
			throw new Error(`Could not find plot matching id ${plotId}`);
		}
		if (inventoryResult.status === 'rejected' || inventoryResult.value === null) {
			throw new Error(`Could not find inventory matching id ${inventoryId}`);
		}
		if (levelSystemResult.status === 'rejected' || levelSystemResult.value === null) {
			throw new Error(`Could not find levelsystem matching id ${levelSystemId}`);
		}
		if (placedItemResult.status === 'rejected' || placedItemResult.value === null) {
			throw new Error(`Could not find placedItem matching plot id ${plotId}`);
		}

		// Extract the resolved values
		const plotEntity = plotResult.value;
		const inventoryEntity = inventoryResult.value;
		const levelSystemEntity = levelSystemResult.value;
		const placedItemEntity = placedItemResult.value;
		const plotItemTemplate = placeholderItemTemplates.getPlacedTemplate(placedItemEntity.identifier);
		if (!plotItemTemplate || plotItemTemplate.subtype !== ItemSubtypes.PLANT.name) {
			throw new Error(`Could not find valid plant matching identifier ${placedItemEntity.identifier}`);
		}

		const harvestedItemTemplate = placeholderItemTemplates.getInventoryTemplate(plotItemTemplate.transformId);
		if (!harvestedItemTemplate || harvestedItemTemplate.subtype !== ItemSubtypes.HARVESTED.name) {
			throw new Error(`Could not find valid harvestedItem matching identifier ${plotItemTemplate.transformId}`);
		}

		const plantTime = stringToBigIntNumber(plotEntity.plant_time);
		if (!plantTime) {
			throw new Error(`Error converting plantTime ${plotEntity.plant_time} to number`);
		}
		
		const instantGrow = process.env.INSTANT_HARVEST_KEY === instantHarvestKey && process.env.INSTANT_HARVEST_KEY !== undefined;
		const REAL_TIME_FUDGE = 1000; //Allow for 1s discrepancy between harvest times

		//Check if harvest is valid
		if (!instantGrow && !Plot.canHarvest(plotItemTemplate, plantTime - REAL_TIME_FUDGE, plotEntity.uses_remaining, currentTime)) {
			throw new Error(`Cannot harvest plant at this time`);
		}

		//harvest is OK

		if (!replacementItem) {
			replacementItem = {
				identifier: '0-00-00-00-00', //hardcoded ground id
				status: '',
				usesRemaining: 0
			}
		}

		//plot details are updated
		const possibleHarvests = Math.min(numHarvests, plotEntity.uses_remaining);
		if (plotEntity.uses_remaining - possibleHarvests <= 0) {
			//replace item
			await plotRepository.setPlotDetails(plotId, currentTime, 0, client);
			await placedItemRepository.replacePlacedItemByPlotId(plotId, replacementItem.identifier, replacementItem.status, client);
		} else {
			await plotRepository.setPlotDetails(plotId, currentTime, plotEntity.uses_remaining - possibleHarvests, client);
		}

		//levelsystem gains xp
		await levelRepository.gainExp(levelSystemId, (plotItemTemplate as PlantTemplate).baseExp, client);

		//inventory item is added
		//TODO: Fix inefficiency
		//We recreate the item first because we don't have a function that directly takes in the itemEntity

		const harvestedItem = new HarvestedItem(uuidv4(), harvestedItemTemplate, possibleHarvests);
		const result = await inventoryItemRepository.addInventoryItem(inventoryId, harvestedItem, client);
		if (!result) {
			throw new Error(`Could not add harvested item ${harvestedItem.getInventoryItemId()} to inventory`);
		}
		return result;
	} 

	// Call the transactionWrapper with the innerFunction and appropriate arguments
	return transactionWrapper(innerFunction, 'HarvestPlant', client);
}


/**
 * Attempts to pickup a decoration, removing the item from it and adding it to the inventory.
 * @plotId the plot to remove the item from
 * @inventoryId the inventory to add the blueprint item to
 * @replacementItem a placedItemDetailsEntity to replace the plot, defaults to ground
 * @client if null, creates a new client
 * @returns an object containing the modified plot and inventoryItem on success (or throws error)
 */
export async function pickupDecoration(plotId: string, inventoryId: string, replacementItem?: PlacedItemDetailsEntity, client?: PoolClient): Promise<boolean> {
	//Can put validation/business logic here
	//We always check based on current time
	const currentTime = Date.now();

	const shouldReleaseClient = !client;
	if (!client) {
		client = await pool.connect();
	}
	try {
		if (shouldReleaseClient) {
			await client.query('BEGIN'); // Start the transaction
		}

		// Grab all relevant objects concurrently
		const results = await Promise.allSettled([
			plotRepository.getPlotById(plotId),
			placedItemRepository.getPlacedItemByPlotId(plotId),
			inventoryRepository.getInventoryById(inventoryId)
		]);

		// Destructure the results for easier access
		const [plotResult, placedItemResult, inventoryResult] = results;

		// Check for errors in each promise and handle accordingly
		if (plotResult.status === 'rejected' || plotResult.value === null) {
			throw new Error(`Could not find plot matching id ${plotId}`);
		}
		if (inventoryResult.status === 'rejected' || inventoryResult.value === null) {
			throw new Error(`Could not find inventory matching id ${inventoryId}`);
		}
		if (placedItemResult.status === 'rejected' || placedItemResult.value === null) {
			throw new Error(`Could not find placedItem matching plot id ${plotId}`);
		}

		// Extract the resolved values
		const plotEntity = plotResult.value;
		const inventoryEntity = inventoryResult.value;
		const placedItemEntity = placedItemResult.value;
		const plotItemTemplate = placeholderItemTemplates.getPlacedTemplate(placedItemEntity.identifier);
		if (!plotItemTemplate || plotItemTemplate.subtype !== ItemSubtypes.DECORATION.name) {
			throw new Error(`Could not find valid decoration matching identifier ${placedItemEntity.identifier}`);
		}

		let blueprintItemTemplate = placeholderItemTemplates.getInventoryTemplate(plotItemTemplate.transformId);
		if (!blueprintItemTemplate || blueprintItemTemplate.subtype !== ItemSubtypes.BLUEPRINT.name) {
			throw new Error(`Could not find valid blueprint matching identifier ${plotItemTemplate.transformId}`);
		}

		//Check if harvest is valid
		//currently no validation implemented, can always remove decorations

		//pickup is OK

		if (!replacementItem) {
			replacementItem = {
				identifier: '0-00-00-00-00', //hardcoded ground id
				status: '',
				usesRemaining: 0
			}
		}

		//plot details are updated
		await plotRepository.setPlotDetails(plotId, currentTime, replacementItem.usesRemaining, client);
		await placedItemRepository.replacePlacedItemByPlotId(plotId, replacementItem.identifier, replacementItem.status, client);

		//inventory item is added
		//TODO: Fix inefficiency
		//We recreate the item first because we don't have a function that directly takes in the itemEntity
		
		const blueprintItem = new Blueprint(uuidv4(), blueprintItemTemplate as BlueprintTemplate, 1);
		await inventoryItemRepository.addInventoryItem(inventoryId, blueprintItem, client);

		if (shouldReleaseClient) {
			await client.query('COMMIT'); // Rollback the transaction on error
		}
		return true;
	} catch (error) {
		if (shouldReleaseClient) {
			await client.query('ROLLBACK'); // Rollback the transaction on error
		}
		console.error('Error harvesting plant:', error);
		throw error; // Rethrow the error for higher-level handling
	} finally {
		if (shouldReleaseClient) {
			client.release(); // Release the client back to the pool
		}
	}
}


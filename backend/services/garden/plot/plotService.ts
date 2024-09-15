import { pool } from "@/backend/connection/db";
import plotRepository from "@/backend/repositories/garden/plot/plotRepository";
import inventoryItemRepository from "@/backend/repositories/items/inventoryItem/inventoryItemRepository";
import placedItemRepository from "@/backend/repositories/items/placedItem/placedItemRepository";
import inventoryRepository from "@/backend/repositories/itemStore/inventory/inventoryRepository";
import levelRepository from "@/backend/repositories/level/levelRepository";
import { Plot, PlotEntity } from "@/models/garden/Plot";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { PlacedItem, PlacedItemDetailsEntity, PlacedItemEntity } from "@/models/items/placedItems/PlacedItem";
import { generateNewPlaceholderInventoryItem } from "@/models/items/PlaceholderItems";
import { itemTemplateInterfaceRepository } from "@/models/items/templates/interfaces/ItemTemplateRepository";
import { ItemTemplateRepository } from "@/models/items/templates/models/ItemTemplateRepository";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import { PlantTemplate } from "@/models/items/templates/models/PlantTemplate";
import { getItemClassFromSubtype } from "@/models/items/utility/classMaps";
import { stringToBigIntNumber } from "@/models/utility/BigInt";
import { PoolClient } from "pg";
import { v4 as uuidv4 } from 'uuid';

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
 * @returns an object containing the modified level system, plot, and inventoryItem on success (or throws error)
 */
export async function harvestPlot(plotId: string, inventoryId: string, levelSystemId: string, numHarvests: number, replacementItem?: PlacedItemDetailsEntity, client?: PoolClient): Promise<boolean> {
	//Can put validation/business logic here
	//We always check based on current time
	const currentTime = Date.now();
	if (numHarvests <= 0) {
		throw new Error(`Invalid number of harvests`);
	}

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
			throw new Error(`Could not find placedItem matching identifier ${placedItemEntity.identifier}`);
		}

		const harvestedItemTemplate = placeholderItemTemplates.getInventoryTemplate(plotItemTemplate.transformId);
		if (!harvestedItemTemplate) {
			throw new Error(`Could not find inventoryItem matching identifier ${plotItemTemplate.transformId}`);
		}

		const plantTime = stringToBigIntNumber(plotEntity.plant_time);
		if (!plantTime) {
			throw new Error(`Error converting plantTime ${plotEntity.plant_time} to number`);
		}
		

		//Check if harvest is valid
		if (!Plot.canHarvest(plotItemTemplate, plantTime, plotEntity.uses_remaining, currentTime)) {
			throw new Error(`Cannot harvest plant at this time`);
		}

		//harvest is OK

		if (!replacementItem) {
			replacementItem = {
				identifier: '0-00-00-00-00', //hardcoded ground id
				status: ''
			}
		}

		//plot details are updated
		const possibleHarvests = Math.min(numHarvests, plotEntity.uses_remaining);
		await plotRepository.setPlotPlantTime(plotId, currentTime, client);
		await plotRepository.updatePlotUsesRemaining(plotId, possibleHarvests * -1, client);

		//placedItem is updated
		await placedItemRepository.replacePlacedItemByPlotId(plotId, replacementItem.identifier, replacementItem.status, client);

		//levelsystem gains xp
		await levelRepository.gainExp(levelSystemId, (plotItemTemplate as PlantTemplate).baseExp, client);

		//inventory item is added
		//TODO: Fix inefficiency
		//We recreate the item first because we don't have a function that directly takes in the itemEntity
		
		const harvestedItem = new HarvestedItem(uuidv4(), harvestedItemTemplate, possibleHarvests);
		await inventoryItemRepository.addInventoryItem(inventoryId, harvestedItem, client);

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
